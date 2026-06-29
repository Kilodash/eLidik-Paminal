import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'
import type { Berkas, Pengaduan } from '@/types'

export async function getBerkasList(page = 1, limit = 20) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data, count, error } = await supabase
    .from('berkas')
    .select('*, unit:organizations(nama), operator:personel(nama_lengkap)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error
  return { data: data || [], total: count || 0, page, limit }
}

export async function getBerkasById(id: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data, error } = await supabase
    .from('berkas')
    .select(`
      *,
      unit:organizations(nama),
      operator:personel(nama_lengkap),
      pengaduan:pengaduan(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) throw error
  return data
}

export async function createBerkas(data: {
  unit_id: string
  judul: string
  pengaduan_ids: string[]
  operator_id: string
}) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  // Generate nomor berkas
  const tahun = new Date().getFullYear()
  const { data: reg } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', tenantId)
    .eq('document_type_kode', 'BERKAS')
    .eq('tahun', tahun)
    .is('bulan', null)
    .maybeSingle()

  const nextNum = (reg?.nomor_terakhir || 0) + 1
  const kodePolda = await getTenantKode(tenantId)
  const nomor = `BERKAS/${kodePolda}/${tahun}/${String(nextNum).padStart(3, '0')}`

  await supabase.from('document_registers').upsert({
    tenant_id: tenantId,
    document_type_kode: 'BERKAS',
    tahun,
    bulan: null,
    nomor_terakhir: nextNum,
  }, { onConflict: 'tenant_id,document_type_kode,tahun,bulan' })

  // Insert berkas
  const { data: inserted, error } = await supabase
    .from('berkas')
    .insert({
      tenant_id: tenantId,
      unit_id: data.unit_id,
      nomor_berkas: nomor,
      judul: data.judul,
      tahun,
      status: 'open',
      tahap: 'registrasi',
      operator_id: data.operator_id,
    })
    .select()
    .single()

  if (error) throw error

  // Link pengaduan to berkas
  if (data.pengaduan_ids.length) {
    await supabase
      .from('pengaduan')
      .update({ berkas_id: inserted.id })
      .in('id', data.pengaduan_ids)
      .eq('tenant_id', tenantId)
  }

  // Create tindak lanjut
  await supabase.from('tindak_lanjut').insert({
    tenant_id: tenantId,
    berkas_id: inserted.id,
    deskripsi: 'Berkas dibuat — menunggu tindak lanjut',
    status_tl: 'open',
    created_by: data.operator_id,
  })

  return inserted
}

export async function updateBerkas(id: string, data: Partial<Berkas>) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: updated, error } = await supabase
    .from('berkas')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function getBerkasNotes(berkasId: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('berkas_notes')
    .select('*, user:personel(nama_lengkap)')
    .eq('berkas_id', berkasId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  return data || []
}

export async function addBerkasNote(berkasId: string, userId: string, content: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data, error } = await supabase
    .from('berkas_notes')
    .insert({ tenant_id: tenantId, berkas_id: berkasId, user_id: userId, content })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTindakLanjut(berkasId: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('tindak_lanjut')
    .select('*')
    .eq('berkas_id', berkasId)
    .eq('tenant_id', tenantId)
    .single()

  return data
}

export async function updateTindakLanjut(berkasId: string, data: { deskripsi?: string; status_tl?: string; tgl_selesai?: string }) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: updated, error } = await supabase
    .from('tindak_lanjut')
    .update(data)
    .eq('berkas_id', berkasId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function getAvailablePengaduan(unitId?: string): Promise<Pengaduan[]> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  let query = supabase
    .from('pengaduan')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('berkas_id', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (unitId) query = query.eq('unit_id', unitId)

  const { data } = await query
  return (data || []) as Pengaduan[]
}

async function getTenantKode(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('kode').eq('id', tenantId).single()
  return data?.kode || 'UNKNOWN'
}
