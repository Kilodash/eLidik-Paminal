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
export async function generateSingleDocumentAction(pengaduanId: string, docKode: string, docNama: string, subKategori?: string, metadata?: string) {
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

    const tahap = subKategori || 'Perdamaian'

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
          tahap,
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
        ${metadata ? `<p>Metadata: ${metadata}</p>` : ''}
        <hr/>
        <p>Dokumen ini telah digenerate secara otomatis melalui mekanisme ${tahap.toLowerCase()} dumas.</p>
        <p>Tanggal Dokumen: ${new Date().toLocaleDateString('id-ID')}</p>
      </div>
    `

    const { error: insertError } = await supabase.from('documents').insert({
      tenant_id: tenantId,
      template_id: templateId,
      pengaduan_id: pengaduanId,
      berkas_id: berkasId,
      tahap,
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

export async function updatePengaduanStatusAction(pengaduanId: string, newStatus: string, catatan: string) {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    const { data: current } = await supabase
      .from('pengaduan')
      .select('status')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()

    const { error: updateError } = await supabase
      .from('pengaduan')
      .update({ status: newStatus })
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)

    if (updateError) throw updateError

    if (userId) {
      await supabase.from('status_history').insert({
        tenant_id: tenantId,
        ref_type: 'pengaduan',
        ref_id: pengaduanId,
        status_lama: current?.status || 'diterima',
        status_baru: newStatus,
        catatan,
        user_id: userId,
        aksi: 'tinjut_hasil'
      })
    }

    revalidatePath('/pengaduan')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating pengaduan status:', error)
    return { success: false, error: error.message || 'Gagal mengupdate status' }
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
    return { success: false, error: error.message || 'Gagal menyimpan distribusi' }
  }
}


export async function checkUnsavedPropamDataAction() {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const url = "https://gajamada-propam.polri.go.id/api/v1/apps/data/management/get-all"
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      "Origin": "https://gajamada-propam.polri.go.id",
      "Referer": "https://gajamada-propam.polri.go.id/",
      // Cookie hardcoded sementara untuk testing. Nanti pindahkan ke .env
      "Cookie": "token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYTA3NjExYjE3ZjA2M2Y4YjU0NjBmMmVhYTVjN2RlZGEiLCJvcmdhbml6YXRpb25faWQiOiIiLCJwZXJtaXNzaW9uX2lkIjoiMmRkMmM4ZjZkZjdlZjdiMDllYzQ1NzRiNjliNjg1OTEiLCJtdWx0aUxvZ2luIjp0cnVlLCJleHBpcmUiOjE3ODI1MDgwMjYuNDUzODY4NCwidHlwZSI6ImFjY2VzcyJ9.q1olEk30rmoe8681UP7HyyZl0aP47CjFmAHLD0TmjLA; refresh_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYTA3NjExYjE3ZjA2M2Y4YjU0NjBmMmVhYTVjN2RlZGEiLCJvcmdhbml6YXRpb25faWQiOiIiLCJwZXJtaXNzaW9uX2lkIjoiMmRkMmM4ZjZkZjdlZjdiMDllYzQ1NzRiNjliNjg1OTEiLCJtdWx0aUxvZ2luIjp0cnVlLCJleHBpcmUiOjE3ODMwNjk2MjYuNDUzOTc3MywidHlwZSI6InJlZnJlc2gifQ.BOJSdGtDsJVF3UJrD0ffnsPohIhx3If1ck46Co1MCbE"
    }
    // Fetch halaman pertama untuk dapat info total halaman
    const firstPayload = {
      "connectionId": "245b8fd7c4a763019d5172fad5ec0086",
      "database": "divpropam",
      "filters": [],
      "metaData": {
        "widgetId": "8533ca87b75e04b1f39d19d98dabc0ef",
        "menuId": "ce64015a07578d9195a0e589de1108c8"
      },
      "order": "desc",
      "orderBy": "created_date",
      "page": 1,
      "size": 1000,
      "table": "gold.report"
    }

    const firstResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(firstPayload)
    })

    if (!firstResponse.ok) {
      throw new Error(`Gagal fetch GAJAMADA: ${firstResponse.statusText}`)
    }

    const firstResult = await firstResponse.json()
    const firstPageItems = firstResult.data || firstResult.detail?.data || []
    const pagination = (firstResult.metaData || firstResult.detail?.metaData || {}).pagination || {}
    const totalPages = pagination.totalPages || 1

    // Filter hasil halaman pertama
    const allFilteredItems: any[] = firstPageItems.filter((item: any) => {
      const disposisi = (item.disposisi_case_position || '').toUpperCase()
      return disposisi.includes('KASUBBID PAMINAL') && (disposisi.includes('JABAR') || disposisi.includes('JAWA BARAT'))
    })

    // Fetch sisa halaman secara paralel
    if (totalPages > 1) {
      const remainingPages = []
      for (let p = 2; p <= Math.min(totalPages, 30); p++) {
        remainingPages.push(
          fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ ...firstPayload, page: p })
          }).then(r => r.json())
        )
      }

      const results = await Promise.all(remainingPages)

      for (const result of results) {
        const items = result.data || result.detail?.data || []
        if (!items || items.length === 0) continue

        for (const item of items) {
          const disposisi = (item.disposisi_case_position || '').toUpperCase()
          if (disposisi.includes('KASUBBID PAMINAL') && (disposisi.includes('JABAR') || disposisi.includes('JAWA BARAT'))) {
            allFilteredItems.push(item)
          }
        }
      }
    }

    // Deduplikasi by ID
    const seenIds = new Set<string>()
    const uniqueItems: any[] = []
    for (const item of allFilteredItems) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        uniqueItems.push(item)
      }
    }

    const itemsWithStatus: any[] = []

    for (const item of uniqueItems) {
      const { data: existing } = await supabase
        .from('pengaduan')
        .select('id')
        .eq('tenant_id', tenantId)
        .neq('status', 'dibatalkan')
        .ilike('kronologi', `%${(item.summary || item.content || '').substring(0, 50)}%`)
        .limit(1)

      itemsWithStatus.push({
        ...item,
        alreadySaved: !!(existing && existing.length > 0)
      })
    }

    return { success: true, data: itemsWithStatus }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error checking GAJAMADA data:', error)
    return { error: error.message || 'Gagal mengecek data GAJAMADA' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveSinglePropamDataAction(item: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const statusMap: Record<string, string> = {
      'Laporan Diterima Kasubbid Paminal': 'diterima',
      'Laporan Masuk': 'proses',
      'Terbukti': 'terbukti',
      'Tidak Terbukti': 'tidak_terbukti',
      'Laporan Selesai Restorative Justice': 'perdamaian',
    }

    const statusLabel = item.status_label || ''
    const mappedStatus = statusMap[statusLabel] || 'diterima'

    const dataPayload = {
      jenis: "Pengaduan Cepat Propam",
      tgl_pengaduan: new Date(item.created_date).toISOString().split('T')[0],
      tgl_surat: new Date(item.created_date).toISOString().split('T')[0],
      nomor_surat: item.id || '',
      pelapor_nama: item.pengirim || "Hamba Allah",
      terlapor_nama: item.prepetrator_name || "Tidak Diketahui",
      satker_dilaporkan: item.disposisi_polda || "POLDA JAWA BARAT",
      keterangan: '',
      kronologi: item.summary || '',
      status: mappedStatus,
      atensi: true,
      created_by: userId,
    }

    await createPengaduan(dataPayload)
    revalidatePath('/pengaduan')

    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error saving data GAJAMADA:', error)
    return { error: error.message || 'Gagal menyimpan data pengaduan GAJAMADA' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bulkSavePropamDataAction(items: any[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const statusMap: Record<string, string> = {
      'Laporan Diterima Kasubbid Paminal': 'diterima',
      'Laporan Masuk': 'proses',
      'Terbukti': 'terbukti',
      'Tidak Terbukti': 'tidak_terbukti',
      'Laporan Selesai Restorative Justice': 'perdamaian',
    }

    let imported = 0
    let skipped = 0

    for (const item of items) {
      const statusLabel = item.status_label || ''
      const mappedStatus = statusMap[statusLabel] || 'diterima'

      const dataPayload = {
        jenis: "Pengaduan Cepat Propam",
        tgl_pengaduan: new Date(item.created_date).toISOString().split('T')[0],
        tgl_surat: new Date(item.created_date).toISOString().split('T')[0],
        nomor_surat: item.id || '',
        pelapor_nama: item.pengirim || "Hamba Allah",
        terlapor_nama: item.prepetrator_name || "Tidak Diketahui",
        satker_dilaporkan: item.disposisi_polda || "POLDA JAWA BARAT",
        keterangan: '',
        kronologi: item.summary || '',
        status: mappedStatus,
        atensi: true,
        created_by: userId,
      }

      try {
        await createPengaduan(dataPayload)
        imported++
      } catch (e) {
        console.error('Error importing item:', item.id, e)
        skipped++
      }
    }

    revalidatePath('/pengaduan')

    return { success: true, imported, skipped }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error bulk saving GAJAMADA data:', error)
    return { error: error.message || 'Gagal menyimpan data pengaduan GAJAMADA' }
  }
}
