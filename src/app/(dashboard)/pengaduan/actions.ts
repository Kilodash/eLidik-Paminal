'use server'

import { createPengaduan, updatePengaduan, deletePengaduan, mergePengaduanToBerkas, splitPengaduanFromBerkas } from '@/lib/data/pengaduan'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'

export async function savePengaduan(formData: FormData) {
  try {
    const editId = formData.get('editId') as string | null

    const jenisValue = (formData.get('jenis') as string) || '--'
    if (jenisValue === '--') {
      return { error: 'Jenis Dumas wajib dipilih / diubah dari default (--)' }
    }

    const dataPayload = {
      jenis: jenisValue,
      tgl_pengaduan: formData.get('tgl_pengaduan') as string,
      pelapor_nama: (formData.get('pelapor_nama') as string) || null,
      terlapor_nama: (formData.get('terlapor_nama') as string) || undefined,
      satker_dilaporkan: (formData.get('satker_dilaporkan') as string) || null,
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
    
    // 1. Simpan form ke tabel perdamaian
    const { error: damaiError } = await supabase.from('perdamaian').insert({
      tenant_id: tenantId,
      pengaduan_id: pengaduanId,
      tgl_perdamaian: formData.get('tgl_perdamaian') as string,
      pihak_hadir: formData.get('pihak_hadir') as string,
      kronologi: formData.get('kronologi') as string,
      tahap_saat_damai: formData.get('tahap_saat_damai') as string,
    })
    if (damaiError) throw damaiError

    // 2. Update status pengaduan jadi perdamaian
    const { error: updateError } = await supabase
      .from('pengaduan')
      .update({ status: 'perdamaian' })
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
    if (updateError) throw updateError

    // 3. Auto-generate dokumen terpilih di database
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    const { data: pengaduanData } = await supabase
      .from('pengaduan')
      .select('berkas_id')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()
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
  const documentsToGenerate = []

  if (tahapSaatDamai === 'Perdamaian Sebelum Penyelidikan') {
    if (tindakLanjutDocs.ba_pemeriksaan_tambahan) {
      documentsToGenerate.push({ kode: 'BA-BAP-TAMBAHAN', nama: 'Berita Acara Pemeriksaan Tambahan 2 pihak', tahap: 'Pengumpulan' })
    }
    if (tindakLanjutDocs.nd_saran_penghentian) {
      documentsToGenerate.push({ kode: 'ND-SARAN-HENTI', nama: 'Nota Dinas Saran Penghentian Penanganan Dumas', tahap: 'Penutupan' })
    }
  } else {
    // Setelah Penyelidikan
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

  for (const doc of documentsToGenerate) {
    // Check if duplicate document already exists to prevent duplicates
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('pengaduan_id', pengaduanId)
      .eq('tahap', doc.tahap)
      .ilike('content_rendered', `%${doc.nama}%`)
      .limit(1)

    if (existing && existing.length > 0) {
      continue
    }

    // Get or create document type record to match the system's schema
    let docTypeId = null
    const { data: docType } = await supabase
      .from('document_types')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('kode', doc.kode)
      .limit(1)
      .single()

    if (docType) {
      docTypeId = docType.id
    } else {
      const { data: newType } = await supabase
        .from('document_types')
        .insert({
          tenant_id: tenantId,
          kode: doc.kode,
          nama: doc.nama,
          tahap: doc.tahap,
          is_active: true
        })
        .select('id')
        .limit(1)
        .single()
      if (newType) {
        docTypeId = newType.id
      }
    }

    // Try to find a template for this document type
    let templateId = null
    if (docTypeId) {
      const { data: template } = await supabase
        .from('templates')
        .select('id')
        .eq('document_type_id', docTypeId)
        .limit(1)
        .single()
      if (template) {
        templateId = template.id
      }
    }

    // Format default placeholder content
    const year = new Date().getFullYear()
    const nomorSurat = `AUTO/${doc.kode}/${year}`
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="text-align: center;">${doc.nama.toUpperCase()}</h2>
        <p style="text-align: center;">Nomor: ${nomorSurat}</p>
        <hr/>
        <p>Dokumen ini telah digenerate secara otomatis melalui mekanisme perdamaian dumas.</p>
        <p>Tanggal Dokumen: ${new Date().toLocaleDateString('id-ID')}</p>
      </div>
    `

    await supabase.from('documents').insert({
      tenant_id: tenantId,
      template_id: templateId,
      pengaduan_id: pengaduanId,
      berkas_id: berkasId,
      tahap: doc.tahap,
      nomor_surat: nomorSurat,
      tgl_dokumen: new Date().toISOString().split('T')[0],
      content_rendered: htmlContent,
      status: 'draft',
      created_by: userId
    })
  }
}

// Action to generate a single document and associate it with a complaint/berkas
export async function generateSingleDocumentAction(pengaduanId: string, docKode: string, docNama: string) {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    // Get user info
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Get berkas_id from pengaduan
    const { data: pengaduanData } = await supabase
      .from('pengaduan')
      .select('berkas_id')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()
    const berkasId = pengaduanData?.berkas_id || null

    // Check if duplicate document already exists to prevent duplicates
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('pengaduan_id', pengaduanId)
      .ilike('content_rendered', `%${docNama}%`)
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: true, message: `Dokumen ${docNama} sudah pernah dibuat.` }
    }

    // Get or create document type record
    let docTypeId = null
    const { data: docType } = await supabase
      .from('document_types')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('kode', docKode)
      .limit(1)
      .single()

    if (docType) {
      docTypeId = docType.id
    } else {
      const { data: newType } = await supabase
        .from('document_types')
        .insert({
          tenant_id: tenantId,
          kode: docKode,
          nama: docNama,
          tahap: 'Perdamaian',
          is_active: true
        })
        .select('id')
        .limit(1)
        .single()
      if (newType) {
        docTypeId = newType.id
      }
    }

    // Try to find a template for this document type
    let templateId = null
    if (docTypeId) {
      const { data: template } = await supabase
        .from('templates')
        .select('id')
        .eq('document_type_id', docTypeId)
        .limit(1)
        .single()
      if (template) {
        templateId = template.id
      }
    }

    // Format default placeholder content
    const year = new Date().getFullYear()
    const nomorSurat = `AUTO/${docKode}/${year}`
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="text-align: center;">${docNama.toUpperCase()}</h2>
        <p style="text-align: center;">Nomor: ${nomorSurat}</p>
        <hr/>
        <p>Dokumen ini telah digenerate secara otomatis melalui mekanisme perdamaian dumas.</p>
        <p>Tanggal Dokumen: ${new Date().toLocaleDateString('id-ID')}</p>
      </div>
    `

    const { error: insertError } = await supabase.from('documents').insert({
      tenant_id: tenantId,
      template_id: templateId,
      pengaduan_id: pengaduanId,
      berkas_id: berkasId,
      tahap: 'Perdamaian',
      nomor_surat: nomorSurat,
      tgl_dokumen: new Date().toISOString().split('T')[0],
      content_rendered: htmlContent,
      status: 'draft',
      created_by: userId
    })

    if (insertError) throw insertError

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

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    const { data: currentPengaduan } = await supabase
      .from('pengaduan')
      .select('status, unit_id')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()

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



