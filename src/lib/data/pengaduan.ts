import { createClient } from '@/lib/supabase/server'
import type { Pengaduan, BerkasCompleteness, SearchFilters } from '@/types'
import { requireTenant } from '@/lib/auth'

export async function getPengaduanList(filters: SearchFilters = {}) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const page = filters.page || 1
  const limit = filters.limit || 20

  let query = supabase
    .from('pengaduan')
    .select('*, klasifikasi(nama), unit:organizations(nama), pengaduan_terlapor(terlapor(nama, pangkat, nrp, jabatan, kesatuan)), berkas:berkas(id, nomor_berkas)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .range((page - 1) * limit, page * limit - 1)

  if (filters.query) {
    query = query.textSearch('search_vector', filters.query, { config: 'indonesian' })
  }
  if (filters.status?.length) {
    query = query.in('status', filters.status)
  } else {
    query = query.neq('status', 'dibatalkan')
  }
  if (filters.unitId) {
    query = query.eq('unit_id', filters.unitId)
  }
  if (filters.klasifikasiId) {
    query = query.eq('klasifikasi_id', filters.klasifikasiId)
  }
  if (filters.jenis) {
    query = query.eq('jenis', filters.jenis)
  }
  if (filters.tglFrom) query = query.gte('tgl_pengaduan', filters.tglFrom)
  if (filters.tglTo) query = query.lte('tgl_pengaduan', filters.tglTo)
  if (filters.atensi) query = query.eq('atensi', true)

  // Sort
  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder === 'asc'
  query = query.order(sortBy, { ascending: sortOrder })

  const { data, count, error } = await query
  if (error) throw error

  return { data: (data || []) as Pengaduan[], total: count || 0, page, limit }
}

export async function getPengaduanById(id: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data, error } = await supabase
    .from('pengaduan')
    .select(`
      *,
      klasifikasi(nama),
      unit:organizations(nama),
      berkas:berkas(nomor_berkas, status, tahap),
      pengaduan_terlapor(terlapor(*))
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) throw error
  return data as Pengaduan & { berkas: unknown; pengaduan_terlapor: { terlapor: unknown }[] }
}

export async function createPengaduan(data: Partial<Pengaduan> & { terlapor_nama?: string }) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  // Generate register number
  const tahun = new Date(data.tgl_pengaduan || new Date()).getFullYear()
  const bulan = new Date(data.tgl_pengaduan || new Date()).getMonth() + 1
  const isLI = data.jenis?.toUpperCase() === 'LAPORAN_INFORMASI' || data.jenis?.toUpperCase() === 'LAPORAN INFORMASI'
  const prefix = isLI ? 'LI' : 'REG'

  const { data: reg } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', tenantId)
    .eq('document_type_kode', prefix)
    .eq('tahun', tahun)
    .eq('bulan', bulan)
    .maybeSingle()

  const nextNum = (reg?.nomor_terakhir || 0) + 1
  const kodePolda = await getTenantKode(tenantId)
  const nomor = `${prefix}/${kodePolda}/${tahun}/${String(bulan).padStart(2, '0')}/${String(nextNum).padStart(3, '0')}`

  // Upsert register
  await supabase.from('document_registers').upsert({
    tenant_id: tenantId,
    document_type_kode: prefix,
    tahun,
    bulan,
    nomor_terakhir: nextNum,
  }, { onConflict: 'tenant_id,document_type_kode,tahun,bulan' })

  // Extract terlapor_nama
  const { terlapor_nama, ...pengaduanData } = data

  const { data: inserted, error } = await supabase
    .from('pengaduan')
    .insert({ ...pengaduanData, tenant_id: tenantId, nomor_register: nomor })
    .select()
    .single()

  if (error) throw error

  // If terlapor_nama is provided, insert to terlapor and link to this pengaduan
  if (terlapor_nama) {
    const { data: terlaporData, error: terlaporError } = await supabase
      .from('terlapor')
      .insert({
        tenant_id: tenantId,
        nama: terlapor_nama,
        status_identitas: 'diketahui'
      })
      .select()
      .single()

    if (terlaporError) throw terlaporError

    if (terlaporData) {
      const { error: relInsertError } = await supabase.from('pengaduan_terlapor').insert({
        pengaduan_id: inserted.id,
        terlapor_id: terlaporData.id
      })
      if (relInsertError) throw relInsertError
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    user_id: data.created_by,
    action: 'INSERT',
    entity_type: 'pengaduan',
    entity_id: inserted.id,
    summary: 'Pengaduan baru: ' + nomor,
    new_values: inserted as unknown as Record<string, unknown>,
  })

  return inserted
}

export async function updatePengaduan(id: string, data: Partial<Pengaduan & { terlapor_nama?: string }>) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { terlapor_nama, ...pengaduanData } = data

  const { data: updated, error } = await supabase
    .from('pengaduan')
    .update(pengaduanData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error

  if (terlapor_nama !== undefined) {
    // Cari relasi terlapor yang ada
    const { data: existingRelation } = await supabase
      .from('pengaduan_terlapor')
      .select('terlapor_id, terlapor!inner(id, nama)')
      .eq('pengaduan_id', id)
      .maybeSingle()

    if (existingRelation) {
      // Update nama terlapor
      const { error: terlaporUpdateError } = await supabase
        .from('terlapor')
        .update({ nama: terlapor_nama })
        .eq('id', existingRelation.terlapor_id)
        .eq('tenant_id', tenantId)
      if (terlaporUpdateError) throw terlaporUpdateError
    } else if (terlapor_nama) {
      // Buat baru jika belum ada dan ada input
      const { data: newTerlapor, error: terlaporCreateError } = await supabase
        .from('terlapor')
        .insert({
          tenant_id: tenantId,
          nama: terlapor_nama,
          status_identitas: 'diketahui'
        })
        .select()
        .single()
      
      if (terlaporCreateError) throw terlaporCreateError
      
      if (newTerlapor) {
        const { error: relInsertError } = await supabase.from('pengaduan_terlapor').insert({
          pengaduan_id: id,
          terlapor_id: newTerlapor.id
        })
        if (relInsertError) throw relInsertError
      }
    }
  }

  return updated
}

export async function deletePengaduan(id: string, alasan: string, userId: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: current } = await supabase
    .from('pengaduan')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  const statusLama = current?.status || 'diterima'

  const { data, error } = await supabase
    .from('pengaduan')
    .update({ status: 'dibatalkan' })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('status_history').insert({
    tenant_id: tenantId,
    ref_type: 'pengaduan',
    ref_id: id,
    status_lama: statusLama,
    status_baru: 'dibatalkan',
    catatan: alasan,
    user_id: userId
  })

  return data
}

export async function mergePengaduanToBerkas(berkasId: string, pengaduanId: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: berkas } = await supabase
    .from('berkas')
    .select('nomor_berkas')
    .eq('id', berkasId)
    .eq('tenant_id', tenantId)
    .single()

  if (!berkas) throw new Error('Berkas tidak ditemukan')

  const { data, error } = await supabase
    .from('pengaduan')
    .update({ berkas_id: berkasId })
    .eq('id', pengaduanId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    action: 'UPDATE',
    entity_type: 'pengaduan',
    entity_id: pengaduanId,
    summary: `Pengaduan digabungkan ke berkas ${berkas.nomor_berkas}`,
    new_values: { berkas_id: berkasId }
  })

  return data
}

export async function splitPengaduanFromBerkas(pengaduanId: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: prev } = await supabase
    .from('pengaduan')
    .select('berkas_id, berkas:berkas(nomor_berkas)')
    .eq('id', pengaduanId)
    .eq('tenant_id', tenantId)
    .single()

  if (!prev || !prev.berkas_id) throw new Error('Pengaduan tidak terhubung ke berkas mana pun')

  const { data, error } = await supabase
    .from('pengaduan')
    .update({ berkas_id: null })
    .eq('id', pengaduanId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error

  const nomorBerkas = (prev.berkas as unknown as Array<{ nomor_berkas: string }>)?.[0]?.nomor_berkas || 'unknown'
  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    action: 'UPDATE',
    entity_type: 'pengaduan',
    entity_id: pengaduanId,
    summary: `Pengaduan dipisahkan dari berkas ${nomorBerkas}`,
    new_values: { berkas_id: null }
  })

  return data
}

async function getTenantKode(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('kode').eq('id', tenantId).single()
  return data?.kode || 'UNKNOWN'
}

// ============================================
// DASHBOARD HELPERS
// ============================================

export async function getDashboardStats(unitId?: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  let query = supabase.from('pengaduan').select('status, id', { count: 'exact' }).eq('tenant_id', tenantId)
  if (unitId) query = query.eq('unit_id', unitId)

  const { data, count, error } = await query
  if (error) throw error

  const prosesStatuses = ['registrasi', 'verifikasi', 'disposisi', 'lidik_berjalan', 'gelar']
  const selesaiStatuses = ['closed', 'terbukti', 'tidak_terbukti']

  return {
    total: count || 0,
    proses: data?.filter(d => prosesStatuses.includes(d.status)).length || 0,
    selesai: data?.filter(d => selesaiStatuses.includes(d.status)).length || 0,
    terbukti: data?.filter(d => d.status === 'terbukti').length || 0,
    tidak_terbukti: data?.filter(d => d.status === 'tidak_terbukti').length || 0,
    perdamaian: data?.filter(d => d.status === 'perdamaian').length || 0,
  }
}

export async function getAnevJenis(unitId?: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  let query = supabase.from('pengaduan').select('klasifikasi_id, status, klasifikasi!inner(nama)').eq('tenant_id', tenantId)
  if (unitId) query = query.eq('unit_id', unitId)

  const { data } = await query
  if (!data) return []

  const grouped: Record<string, { nama: string; jumlah: number; proses: number; selesai: number; terbukti: number; tidak_terbukti: number }> = {}

  for (const row of data) {
    const k = (row.klasifikasi as unknown as { nama: string }).nama || 'Tanpa Klasifikasi'
    if (!grouped[k]) grouped[k] = { nama: k, jumlah: 0, proses: 0, selesai: 0, terbukti: 0, tidak_terbukti: 0 }
    grouped[k].jumlah++
    if (['registrasi', 'verifikasi', 'disposisi', 'lidik_berjalan', 'gelar'].includes(row.status)) grouped[k].proses++
    if (['closed', 'terbukti', 'tidak_terbukti'].includes(row.status)) grouped[k].selesai++
    if (row.status === 'terbukti') grouped[k].terbukti++
    if (row.status === 'tidak_terbukti') grouped[k].tidak_terbukti++
  }

  return Object.values(grouped).map(g => ({
    ...g,
    persen_selesai: g.jumlah > 0 ? Math.round((g.selesai / g.jumlah) * 100) : 0,
  }))
}

export async function getAnevUnit(): Promise<Array<{
  unit: string;
  unit_id: string;
  jumlah: number;
  proses: number;
  diterima: number;
  pulbaket: number;
  gelar: number;
  selesai: number;
  terbukti: number;
  tidak_terbukti: number;
}>> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, nama')
    .eq('tenant_id', tenantId)
    .eq('tipe', 'unit')
    .order('nama')

  if (orgsError) throw orgsError

  const { data: dumas, error: dumasError } = await supabase
    .from('pengaduan')
    .select('unit_id, status')
    .eq('tenant_id', tenantId)

  if (dumasError) throw dumasError

  const grouped: Record<string, {
    unit: string;
    unit_id: string;
    jumlah: number;
    proses: number;
    diterima: number;
    pulbaket: number;
    gelar: number;
    selesai: number;
    terbukti: number;
    tidak_terbukti: number;
  }> = {}

  for (const org of (orgs || [])) {
    grouped[org.id] = {
      unit: org.nama,
      unit_id: org.id,
      jumlah: 0,
      proses: 0,
      diterima: 0,
      pulbaket: 0,
      gelar: 0,
      selesai: 0,
      terbukti: 0,
      tidak_terbukti: 0
    }
  }

  for (const row of (dumas || [])) {
    const uid = row.unit_id
    if (!uid || !grouped[uid]) continue

    grouped[uid].jumlah++

    // Proses Statuses
    if (['diterima', 'registrasi', 'verifikasi', 'disposisi'].includes(row.status)) {
      grouped[uid].diterima++
      grouped[uid].proses++
    } else if (['lidik_berjalan', 'lidik_selesai'].includes(row.status)) {
      grouped[uid].pulbaket++
      grouped[uid].proses++
    } else if (row.status === 'gelar') {
      grouped[uid].gelar++
      grouped[uid].proses++
    }

    // Selesai Statuses
    if (['closed', 'terbukti', 'tidak_terbukti', 'perdamaian'].includes(row.status)) {
      grouped[uid].selesai++
      if (row.status === 'terbukti') grouped[uid].terbukti++
      if (row.status === 'tidak_terbukti') grouped[uid].tidak_terbukti++
    }
  }

  return Object.values(grouped)
}
