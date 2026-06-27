'use server'

import { createPengaduan, updatePengaduan, deletePengaduan, mergePengaduanToBerkas, splitPengaduanFromBerkas } from '@/lib/data/pengaduan'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTenant, requireRole } from '@/lib/auth'
import { syncGajamadaIntake } from '@/lib/gajamada/sync'
import { enrichGajamadaPengaduan, enrichSinglePengaduan } from '@/lib/gajamada/enrich'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export async function savePengaduan(formData: FormData) {
  try {
    const editId = formData.get('editId') as string | null

    const jenisValue = (formData.get('jenis') as string) || '--'
    if (jenisValue === '--') {
      return { error: 'Jenis Dumas wajib dipilih / diubah dari default (--)' }
    }

    // Resolve klasifikasi_nama → klasifikasi_id (UUID)
    let klasifikasiId: string | null = null
    const klasifikasiNama = (formData.get('klasifikasi_nama') as string) || null
    if (klasifikasiNama) {
      const supabase = await createClient()
      const tenantId = await requireTenant()
      const { data: kat } = await supabase
        .from('klasifikasi')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('nama', klasifikasiNama)
        .maybeSingle()
      klasifikasiId = kat?.id || null
    }

    const dataPayload = {
      jenis: jenisValue,
      tgl_pengaduan: formData.get('tgl_pengaduan') as string,
      pelapor_nama: (formData.get('pelapor_nama') as string) || null,
      terlapor_nama: (formData.get('terlapor_nama') as string) || undefined,
      satker_dilaporkan: (formData.get('satker_dilaporkan') as string) || null,
      klasifikasi_id: klasifikasiId,
      tgl_surat: (formData.get('tgl_surat') as string) || null,
      nomor_surat: (formData.get('nomor_surat') as string) || null,
      keterangan: (formData.get('keterangan') as string) || null,
      kronologi: (formData.get('kronologi') as string) || null,
      atensi: formData.get('atensi') === 'true',
      created_by: formData.get('created_by') as string,
    }

    if (editId) {
      await updatePengaduan(editId, dataPayload)
    } else {
      await createPengaduan(dataPayload)
    }

    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error saving pengaduan:', error)
    return { error: error.message || 'Terjadi kesalahan saat menyimpan data' }
  }
}

export async function deletePengaduanAction(id: string, alasan: string, userId: string) {
  try {
    await deletePengaduan(id, alasan, userId)
    revalidatePath('/pengaduan')
    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error deleting pengaduan:', error)
    return { error: error.message || 'Terjadi kesalahan saat menghapus data' }
  }
}

export async function mergePengaduanAction(berkasId: string, pengaduanId: string) {
  try {
    await mergePengaduanToBerkas(berkasId, pengaduanId)
    revalidatePath('/pengaduan')
    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error merging pengaduan:', error)
    return { error: error.message || 'Terjadi kesalahan saat menggabungkan data' }
  }
}

export async function splitPengaduanAction(pengaduanId: string) {
  try {
    await splitPengaduanFromBerkas(pengaduanId)
    revalidatePath('/pengaduan')
    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error splitting pengaduan:', error)
    return { error: error.message || 'Terjadi kesalahan saat memisahkan data' }
  }
}

export async function getActiveBerkasListAction() {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    const { data, error } = await supabase
      .from('berkas')
      .select('id, nomor_berkas, judul')
      .eq('tenant_id', tenantId)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return { data: data || [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching active berkas:', error)
    return { error: error.message || 'Gagal memuat berkas aktif' }
  }
}

export async function checkDuplicatePengaduanAction(pelaporNama: string, terlaporNama: string) {
  try {
    if (!pelaporNama && !terlaporNama) return { duplicates: [] }
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    // Check using exact match or ilike for simple check, since pg_trgm might need setup
    let query = supabase
      .from('pengaduan')
      .select(`
        id,
        nomor_register,
        pelapor_nama,
        pengaduan_terlapor!inner(
          terlapor!inner(nama)
        )
      `)
      .eq('tenant_id', tenantId)

    if (pelaporNama && terlaporNama) {
      query = query.or(`pelapor_nama.ilike.%${pelaporNama}%,pengaduan_terlapor.terlapor.nama.ilike.%${terlaporNama}%`)
    } else if (pelaporNama) {
      query = query.ilike('pelapor_nama', `%${pelaporNama}%`)
    } else if (terlaporNama) {
      query = query.ilike('pengaduan_terlapor.terlapor.nama', `%${terlaporNama}%`)
    }

    const { data, error } = await query.limit(5)
      
    if (error) throw error
    return { duplicates: data || [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error checking duplicate:', error)
    return { error: error.message }
  }
}

export async function submitPerdamaianAction(pengaduanId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    // 1. Simpan form ke tabel perdamaian + update status + ambil user & berkas (parallel)
    const [
      { error: damaiError },
      { error: updateError },
      { data: { user } },
      { data: pengaduanData },
    ] = await Promise.all([
      supabase.from('perdamaian').insert({
        tenant_id: tenantId,
        pengaduan_id: pengaduanId,
        tgl_perdamaian: formData.get('tgl_perdamaian') as string,
        pihak_hadir: formData.get('pihak_hadir') as string,
        kronologi: formData.get('kronologi') as string,
        tahap_saat_damai: formData.get('tahap_saat_damai') as string,
      }),
      supabase
        .from('pengaduan')
        .update({ status: 'perdamaian' })
        .eq('id', pengaduanId)
        .eq('tenant_id', tenantId),
      supabase.auth.getUser(),
      supabase
        .from('pengaduan')
        .select('berkas_id')
        .eq('id', pengaduanId)
        .eq('tenant_id', tenantId)
        .single(),
    ])

    if (damaiError) throw damaiError
    if (updateError) throw updateError

    const userId = user?.id || null
    const berkasId = pengaduanData?.berkas_id || null

    const docTindakLanjutRaw = formData.get('tindak_lanjut_docs') as string | null
    const tindakLanjutDocs = docTindakLanjutRaw ? JSON.parse(docTindakLanjutRaw) : {}

    await autoGeneratePerdamaianDocuments(
      supabase,
      tenantId,
      userId,
      pengaduanId,
      berkasId,
      formData.get('tahap_saat_damai') as string,
      tindakLanjutDocs
    )

    revalidatePath('/pengaduan')
    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error submitting perdamaian:', error)
    return { error: error.message || 'Gagal mengajukan perdamaian' }
  }
}

// Shared helper: batch generate multiple documents at once (avoids N+1 loop)
async function batchGenerateDocuments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  userId: string | null,
  pengaduanId: string,
  berkasId: string | null,
  docs: { kode: string; nama: string; tahap: string }[],
) {
  if (docs.length === 0) return

  const kodes = docs.map(d => d.kode)

  const { data: existingDocTypes } = await supabase
    .from('document_types')
    .select('id, kode')
    .eq('tenant_id', tenantId)
    .in('kode', kodes)

  const docTypeMap = new Map<string, string>()
  for (const dt of (existingDocTypes || [])) {
    docTypeMap.set(dt.kode, dt.id)
  }

  const missingDocs = docs.filter(d => !docTypeMap.has(d.kode))
  if (missingDocs.length > 0) {
    const { data: newTypes } = await supabase
      .from('document_types')
      .insert(missingDocs.map(d => ({ tenant_id: tenantId, kode: d.kode, nama: d.nama, tahap: d.tahap, is_active: true })))
      .select('id, kode')
    for (const nt of (newTypes || [])) {
      docTypeMap.set(nt.kode, nt.id)
    }
  }

  const docTypeIds = docs.map(d => docTypeMap.get(d.kode)).filter(Boolean) as string[]
  const templateMap = new Map<string, string>()
  if (docTypeIds.length > 0) {
    const { data: templates } = await supabase
      .from('templates')
      .select('id, document_type_id')
      .in('document_type_id', docTypeIds)
    for (const t of (templates || [])) {
      templateMap.set(t.document_type_id, t.id)
    }
  }

  const { data: existingDocs } = await supabase
    .from('documents')
    .select('content_rendered')
    .eq('pengaduan_id', pengaduanId)

  const existingKodes = new Set<string>()
  for (const ed of (existingDocs || [])) {
    for (const doc of docs) {
      if ((ed.content_rendered || '').includes(doc.nama)) {
        existingKodes.add(doc.kode)
        break
      }
    }
  }

  const year = new Date().getFullYear()
  const tglNow = new Date().toISOString().split('T')[0]
  const insertRows = docs
    .filter(d => !existingKodes.has(d.kode))
    .map(d => {
      const docTypeId = docTypeMap.get(d.kode) || null
      const templateId = docTypeId ? templateMap.get(docTypeId) || null : null
      return {
        tenant_id: tenantId,
        template_id: templateId,
        pengaduan_id: pengaduanId,
        berkas_id: berkasId,
        tahap: d.tahap,
        nomor_surat: `AUTO/${d.kode}/${year}`,
        tgl_dokumen: tglNow,
        content_rendered: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="text-align: center;">${d.nama.toUpperCase()}</h2><p style="text-align: center;">Nomor: AUTO/${d.kode}/${year}</p><hr/><p>Dokumen ini telah digenerate secara otomatis melalui mekanisme perdamaian dumas.</p><p>Tanggal Dokumen: ${new Date().toLocaleDateString('id-ID')}</p></div>`,
        status: 'draft',
        created_by: userId,
      }
    })

  if (insertRows.length > 0) {
    await supabase.from('documents').insert(insertRows)
  }
}

// Helper function to auto generate selected documents as draft
async function autoGeneratePerdamaianDocuments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  userId: string | null,
  pengaduanId: string,
  berkasId: string | null,
  tahapSaatDamai: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tindakLanjutDocs: any
) {
  const documentsToGenerate: { kode: string; nama: string; tahap: string }[] = []

  if (tahapSaatDamai === 'Perdamaian Sebelum Penyelidikan') {
    if (tindakLanjutDocs.ba_pemeriksaan_tambahan) {
      documentsToGenerate.push({ kode: 'BA-BAP-TAMBAHAN', nama: 'Berita Acara Pemeriksaan Tambahan 2 pihak', tahap: 'Pengumpulan' })
    }
    if (tindakLanjutDocs.nd_saran_penghentian) {
      documentsToGenerate.push({ kode: 'ND-SARAN-HENTI', nama: 'Nota Dinas Saran Penghentian Penanganan Dumas', tahap: 'Penutupan' })
    }
  } else {
    if (tindakLanjutDocs.nd_gelar) {
      documentsToGenerate.push({ kode: 'ND-GELAR', nama: 'permohonan gelar perkara/penyelidikan', tahap: 'Gelar' })
    }
    if (tindakLanjutDocs.lhp_gelar) {
      documentsToGenerate.push({ kode: 'LHP-GELAR', nama: 'rekomendasi gelar perkara/penyelidikan', tahap: 'Gelar' })
    }
    if (tindakLanjutDocs.sprin_henti) {
      documentsToGenerate.push({ kode: 'SPRIN-HENTI', nama: 'Surat Perintah Penghentian Penyelidikan', tahap: 'Pasca Gelar' })
    }
    if (tindakLanjutDocs.nd_ankum) {
      documentsToGenerate.push({ kode: 'ND-ANKUM', nama: 'Surat Pemberitahuan kepada Ankum', tahap: 'Pasca Gelar' })
    }
  }

  await batchGenerateDocuments(supabase, tenantId, userId, pengaduanId, berkasId, documentsToGenerate)
}

// Action to generate a single document and associate it with a complaint/berkas
export async function generateSingleDocumentAction(pengaduanId: string, docKode: string, docNama: string) {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    const { data: pengaduanData } = await supabase
      .from('pengaduan')
      .select('berkas_id')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()
    const berkasId = pengaduanData?.berkas_id || null

    await batchGenerateDocuments(supabase, tenantId, userId, pengaduanId, berkasId, [
      { kode: docKode, nama: docNama, tahap: 'Perdamaian' },
    ])

    revalidatePath('/pengaduan')
    return { success: true, message: `Dokumen "${docNama}" berhasil dibuat otomatis sebagai draf di database!` }
  } catch (error: any) {
    console.error('Error generating document:', error)
    return { error: error.message || 'Gagal membuat dokumen' }
  }
}

export async function updateDistribusiAction(pengaduanId: string, unitId: string, catatan: string, disposisiKabid?: string[], disposisiKasubbid?: string[], disposisiTambahan?: string) {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()

    const [{ data: { user } }, { data: currentPengaduan }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('pengaduan')
        .select('status, unit_id')
        .eq('id', pengaduanId)
        .eq('tenant_id', tenantId)
        .single(),
    ])

    const userId = user?.id

    const { error: updateError } = await supabase
      .from('pengaduan')
      .update({ unit_id: unitId, disposisi_kabid: disposisiKabid || [], disposisi_kasubbid: disposisiKasubbid || [], disposisi_tambahan: disposisiTambahan || '' })
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)

    if (updateError) throw updateError

    if (userId) {
      await supabase.from('status_history').insert({
        tenant_id: tenantId,
        ref_type: 'pengaduan',
        ref_id: pengaduanId,
        status_lama: currentPengaduan?.status || 'diterima',
        status_baru: currentPengaduan?.status || 'diterima',
        catatan: `Didistribusikan ke unit baru. ${catatan}`,
        user_id: userId,
        aksi: 'distribusi'
      })
    }

    revalidatePath('/pengaduan')
    return { success: true }
  } catch (error: any) {
    console.error('Error in distribusi:', error)
    return { error: error.message || 'Gagal menyimpan distribusi' }
  }
}


export async function syncGajamadaIntakeAction() {
  try {
    const personel = await requireRole('admin_subbid', 'oversight')
    if (!personel) return { error: 'Akses ditolak' }

    const tenantId = await requireTenant()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdBy = (personel as any).id as string

    const result = await syncGajamadaIntake({ tenantId, createdBy })

    if (!result.success) return { error: result.error }

    revalidatePath('/pengaduan')
    return { success: true, count: result.count, skipped: result.skipped }
  } catch (error: unknown) {
    console.error('Error syncing Gajamada intake:', error)
    return { error: getErrorMessage(error) || 'Gagal sinkron Gajamada' }
  }
}

export async function enrichGajamadaAction(maxItems?: number, orderBy?: string, orderDir?: string) {
  try {
    await requireRole('admin_subbid', 'oversight')
    const tenantId = await requireTenant()

    const result = await enrichGajamadaPengaduan({ tenantId, maxItems, orderBy, orderDir })

    if (!result.success) return { error: result.error }

    revalidatePath('/pengaduan')
    return { success: true, processed: result.processed, errors: result.errors, remaining: result.remaining }
  } catch (error: unknown) {
    console.error('Error enriching Gajamada:', error)
    return { error: getErrorMessage(error) || 'Gagal enrichment AI' }
  }
}

export async function resetGajamadaAIAction(pengaduanId: string) {
  try {
    await requireRole('admin_subbid', 'oversight')
    const tenantId = await requireTenant()
    const supabase = await createClient()

    const { error } = await supabase
      .from('pengaduan')
      .update({ ai_processed: false })
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    revalidatePath('/pengaduan')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error resetting AI:', error)
    return { error: getErrorMessage(error) || 'Gagal reset AI' }
  }
}

export async function getGajamadaProgressAction() {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()

    const [{ count: total }, { count: processed }] = await Promise.all([
      supabase
        .from('pengaduan')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .not('gajamada_id', 'is', null),
      supabase
        .from('pengaduan')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .not('gajamada_id', 'is', null)
        .eq('ai_processed', true),
    ])

    return { total: total || 0, processed: processed || 0 }
  } catch (error: unknown) {
    console.error('Error getting Gajamada progress:', error)
    return { total: 0, processed: 0 }
  }
}

export async function enrichSinglePengaduanAction(pengaduanId: string) {
  try {
    await requireRole('admin_subbid', 'oversight')
    const tenantId = await requireTenant()

    const result = await enrichSinglePengaduan({ tenantId, pengaduanId })

    if (!result.success) return { error: result.error }

    revalidatePath('/pengaduan')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error enriching single pengaduan:', error)
    return { error: getErrorMessage(error) || 'Gagal enrichment AI' }
  }
}



