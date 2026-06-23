'use server'

import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'
import {
  renderDocxFromTemplatePath,
  uploadTemplateToStorage,
  loadTemplateFromStorage,
  invalidateTemplateCache,
  repairTemplateXml,
} from '@/lib/docx/renderer'
import { buildDocxData } from '@/lib/docx/data-mapper'
import { generateStempelXml } from '@/lib/docx/stempel'
import { revalidatePath } from 'next/cache'
import { getEffectiveTemplateDocxPath, getEffectiveTemplate } from '@/lib/template/queries'

export async function getDocxTemplateAction(documentTypeKode: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id, kode, nama')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const template = await getEffectiveTemplate(documentTypeKode)

  let downloadUrl: string | null = null
  if (template.template_docx_path) {
    const { data } = await supabase.storage
      .from('templates')
      .createSignedUrl(template.template_docx_path, 300)

    downloadUrl = data?.signedUrl ?? null
  }

  return {
    docType,
    template: {
      template_docx_path: template.template_docx_path,
      downloadUrl,
      source: template.source,
    },
  }
}

export async function uploadDocxTemplateAction(
  documentTypeKode: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'File tidak ditemukan' }

  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const storagePath = `${tenantId}/${documentTypeKode}.docx`

  const uploadResult = await uploadTemplateToStorage(storagePath, buffer)
  if ('error' in uploadResult) {
    return { error: uploadResult.error }
  }

  const { data: existing } = await supabase
    .from('templates')
    .select('id')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('templates')
      .update({
        template_docx_path: storagePath,
        output_format: 'docx',
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('templates')
      .insert({
        tenant_id: tenantId,
        document_type_id: docType.id,
        content: '',
        template_docx_path: storagePath,
        output_format: 'docx',
      })
  }

  invalidateTemplateCache(storagePath)
  revalidatePath(`/dokumen/${documentTypeKode}`)
  return { success: true, path: storagePath }
}

export async function removeDocxTemplateAction(documentTypeKode: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const storagePath = `${tenantId}/${documentTypeKode}.docx`

  await supabase.storage.from('templates').remove([storagePath])

  await supabase
    .from('templates')
    .update({ template_docx_path: null })
    .eq('document_type_id', docType.id)

  invalidateTemplateCache(storagePath)
  revalidatePath(`/dokumen/${documentTypeKode}`)
  return { success: true }
}

export async function renderDocxAction(pengaduanId: string, documentTypeKode: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id, kode, nama')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const docxPath = await getEffectiveTemplateDocxPath(documentTypeKode)

  if (!docxPath) {
    return { error: 'Template DOCX untuk jenis dokumen ini belum tersedia.' }
  }

  const data = await buildDocxData(pengaduanId, documentTypeKode)

  const stempelBase64 = (data as Record<string, unknown>)['stempel_img_base64'] as string || ''

  let stempelXml = ''
  if (stempelBase64 && stempelBase64.length > 100) {
    stempelXml = generateStempelXml(stempelBase64)
  }

  const result = await renderDocxFromTemplatePath(docxPath, data, {
    stempelXml,
  })

  if (result.error) return { error: result.error }

  const fileName = `${documentTypeKode}_${new Date().toISOString().split('T')[0]}.docx`
  const outputPath = `${tenantId}/output/${pengaduanId}/${fileName}`

  const uploadResult = await uploadTemplateToStorage(
    outputPath,
    result.buffer!,
  )

  if ('error' in uploadResult) {
    return { error: 'Dokumen berhasil dibuat tetapi gagal disimpan: ' + uploadResult.error }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  await supabase.from('documents').insert({
    tenant_id: tenantId,
    template_id: template?.id || null,
    pengaduan_id: pengaduanId,
    tahap: documentTypeKode,
    nomor_surat: (data as Record<string, unknown>).nomor_surat as string || `DOCX/${documentTypeKode}`,
    tgl_dokumen: new Date().toISOString().split('T')[0],
    file_pdf: outputPath,
    status: 'draft',
    created_by: user?.id ?? null,
    content_rendered: '',
  })

  let downloadUrl: string | null = null
  if ('path' in uploadResult) {
    const { data: signed } = await supabase.storage
      .from('templates')
      .createSignedUrl(outputPath, 3600)

    downloadUrl = signed?.signedUrl ?? null
  }

  return { success: true, downloadUrl, fileName }
}

/**
 * Muat draft editan manual terakhir (jika ada) untuk pengaduan+jenis dokumen.
 * Mengembalikan base64 DOCX hasil editan manual, atau base64=null bila belum ada draft.
 */
export async function getDraftDocxAction(documentTypeKode: string, pengaduanId?: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  let query = supabase
    .from('documents')
    .select('file_pdf')
    .eq('tenant_id', tenantId)
    .eq('tahap', documentTypeKode)
    .eq('status', 'draft')

  query = pengaduanId
    ? query.eq('pengaduan_id', pengaduanId)
    : query.is('pengaduan_id', null)

  const { data: draft } = await query.maybeSingle()

  if (!draft?.file_pdf) {
    return { base64: null, error: null }
  }

  const buffer = await loadTemplateFromStorage(draft.file_pdf)
  if (!buffer) {
    return { base64: null, error: null }
  }

  return { base64: buffer.toString('base64'), error: null }
}

export async function getDocxBufferAction(documentTypeKode: string) {
  const docxPath = await getEffectiveTemplateDocxPath(documentTypeKode)
  console.log('[getDocxBufferAction] kode=%s docxPath=%s', documentTypeKode, docxPath)

  if (!docxPath) {
    return { error: 'Template DOCX tidak tersedia (path kosong)', base64: null }
  }

  const buffer = await loadTemplateFromStorage(docxPath)

  if (!buffer) {
    console.error('[getDocxBufferAction] gagal download dari storage path=%s', docxPath)
    return { error: `Gagal memuat template DOCX dari storage (${docxPath})`, base64: null }
  }

  console.log('[getDocxBufferAction] OK bytes=%d', buffer.length)
  const base64 = buffer.toString('base64')
  return { base64, error: null }
}

/**
 * Baca placeholder {{...}} dari template DOCX yang sedang aktif.
 * Gunanya: debug ketidakcocokan antara key form dengan placeholder template.
 */
export async function getTemplatePlaceholdersAction(documentTypeKode: string) {
  const docxPath = await getEffectiveTemplateDocxPath(documentTypeKode)
  if (!docxPath) {
    return { error: 'Template path tidak ditemukan', placeholders: [], path: '' }
  }

  const buffer = await loadTemplateFromStorage(docxPath)
  if (!buffer) {
    return { error: 'Gagal mengunduh template dari storage', placeholders: [], path: docxPath }
  }

  const PizZip = (await import('pizzip')).default
  const zip = new PizZip(buffer)

  const placeholders: string[] = []
  const candidates = ['word/document.xml']
  for (const name of Object.keys(zip.files)) {
    if (/^word\/(header|footer)\d*\.xml$/.test(name)) candidates.push(name)
  }

  for (const name of candidates) {
    const file = zip.file(name)
    if (!file) continue
    let xml = file.asText()
    // Terapkan repair dulu: gabungkan placeholder yg terpecah antar-run XML
    // agar regex bisa menemukan {{...}} utuh.
    if (xml.indexOf('{{') !== -1) {
      xml = repairTemplateXml(xml)
    }
    const found = [...xml.matchAll(/\{\{([^{}]+)\}\}/g)].map(m => m[1].trim())
    placeholders.push(...found)
  }

  return {
    error: null,
    placeholders: [...new Set(placeholders)].sort(),
    path: docxPath,
  }
}

export async function generateDocxAction(documentTypeKode: string, variables: Record<string, string>) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id, kode, nama')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const docxPath = await getEffectiveTemplateDocxPath(documentTypeKode)
  if (!docxPath) {
    return { error: 'Template DOCX untuk jenis dokumen ini belum tersedia.' }
  }

  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)

  const data: Record<string, unknown> = {}
  for (const v of tenantVars || []) {
    data[v.key] = v.value || ''
  }
  for (const [k, v] of Object.entries(variables)) {
    data[k] = v
  }

  const result = await renderDocxFromTemplatePath(docxPath, data)
  if (result.error) return { error: result.error }

  const now = new Date()
  const tanggal = now.toISOString().split('T')[0]
  const fileName = `${documentTypeKode}_${tanggal}.docx`

  const { data: register } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', tenantId)
    .eq('document_type_kode', documentTypeKode)
    .eq('tahun', now.getFullYear())
    .eq('bulan', now.getMonth() + 1)
    .maybeSingle()

  const nextNomor = (register?.nomor_terakhir || 0) + 1
  await supabase
    .from('document_registers')
    .upsert({
      tenant_id: tenantId,
      document_type_kode: documentTypeKode,
      tahun: now.getFullYear(),
      bulan: now.getMonth() + 1,
      nomor_terakhir: nextNomor,
    })

  const nomorSurat = (data as Record<string, unknown>).nomor_surat as string ||
    (data as Record<string, unknown>).nomor_UUK as string ||
    `AUTO/${documentTypeKode}/${nextNomor}`

  const outputPath = `${tenantId}/output/${tanggal}/${fileName}`

  const uploadResult = await uploadTemplateToStorage(outputPath, result.buffer!)
  if ('error' in uploadResult) {
    return { error: 'Gagal menyimpan dokumen: ' + uploadResult.error }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  await supabase.from('documents').insert({
    tenant_id: tenantId,
    template_id: template?.id || null,
    tahap: documentTypeKode,
    nomor_surat: nomorSurat,
    tgl_dokumen: tanggal,
    file_pdf: outputPath,
    status: 'draft',
    created_by: user?.id ?? null,
    content_rendered: '',
  })

  let downloadUrl: string | null = null
  if ('path' in uploadResult) {
    const { data: signed } = await supabase.storage
      .from('templates')
      .createSignedUrl(outputPath, 3600)

    downloadUrl = signed?.signedUrl ?? null
  }

  return { success: true, downloadUrl, fileName }
}

export async function renderDocxPreviewAction(documentTypeKode: string, variables: Record<string, string>) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const docxPath = await getEffectiveTemplateDocxPath(documentTypeKode)
  if (!docxPath) {
    return { error: 'Template DOCX tidak tersedia', base64: null }
  }

  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)

  const data: Record<string, unknown> = {}
  for (const v of tenantVars || []) {
    data[v.key] = v.value || ''
  }
  for (const [k, v] of Object.entries(variables)) {
    data[k] = v
  }
  const result = await renderDocxFromTemplatePath(docxPath, data, { useCache: true })
  if (result.error) {
    return { error: result.error, base64: null }
  }
  const base64 = result.buffer!.toString('base64')
  return { base64, error: null }
}

export async function saveDocxAsTemplateAction(documentTypeKode: string, base64Buffer: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const buffer = Buffer.from(base64Buffer, 'base64')
  const storagePath = `${tenantId}/${documentTypeKode}.docx`

  const uploadResult = await uploadTemplateToStorage(storagePath, buffer)
  if ('error' in uploadResult) {
    return { error: 'Gagal menyimpan template: ' + uploadResult.error }
  }

  const { data: existing } = await supabase
    .from('templates')
    .select('id')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('templates')
      .update({
        template_docx_path: storagePath,
        output_format: 'docx',
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('templates')
      .insert({
        tenant_id: tenantId,
        document_type_id: docType.id,
        content: '',
        template_docx_path: storagePath,
        output_format: 'docx',
      })
  }

  invalidateTemplateCache(storagePath)
  revalidatePath('/dokumen')
  revalidatePath(`/dokumen/${documentTypeKode}`)
  return { success: true, path: storagePath }
}

/**
 * Simpan editan manual pratinjau sebagai DRAFT dokumen.
 * Idempotent per (tenant, pengaduan, jenis dokumen): jika draft sudah ada,
 * file di storage ditimpa & baris documents di-update — bukan menambah baris baru.
 * Tidak menambah nomor register (penomoran final dilakukan saat Generate/Finalisasi).
 */
export async function saveEditedDocxAction(
  documentTypeKode: string,
  variables: Record<string, string>,
  base64Buffer: string,
  pengaduanId?: string,
) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id, kode, nama')
    .eq('tenant_id', tenantId)
    .eq('kode', documentTypeKode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const buffer = Buffer.from(base64Buffer, 'base64')

  const now = new Date()
  const tanggal = now.toISOString().split('T')[0]

  // Path draft stabil per pengaduan+jenis agar editan menimpa file yang sama.
  const scope = pengaduanId ? pengaduanId : 'tanpa-pengaduan'
  const fileName = `${documentTypeKode}_draft.docx`
  const outputPath = `${tenantId}/draft/${scope}/${fileName}`

  const uploadResult = await uploadTemplateToStorage(outputPath, buffer)
  if ('error' in uploadResult) {
    return { error: 'Gagal menyimpan dokumen: ' + uploadResult.error }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  const nomorSurat = variables.nomor_surat || variables.nomor_UUK || `DRAFT/${documentTypeKode}`

  // Cari draft existing untuk pengaduan+jenis ini.
  let existingQuery = supabase
    .from('documents')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('tahap', documentTypeKode)
    .eq('status', 'draft')

  existingQuery = pengaduanId
    ? existingQuery.eq('pengaduan_id', pengaduanId)
    : existingQuery.is('pengaduan_id', null)

  const { data: existingDraft } = await existingQuery.maybeSingle()

  if (existingDraft) {
    await supabase
      .from('documents')
      .update({
        template_id: template?.id || null,
        nomor_surat: nomorSurat,
        tgl_dokumen: tanggal,
        file_pdf: outputPath,
      })
      .eq('id', existingDraft.id)
  } else {
    await supabase.from('documents').insert({
      tenant_id: tenantId,
      template_id: template?.id || null,
      pengaduan_id: pengaduanId || null,
      tahap: documentTypeKode,
      nomor_surat: nomorSurat,
      tgl_dokumen: tanggal,
      file_pdf: outputPath,
      status: 'draft',
      created_by: user?.id ?? null,
      content_rendered: '',
    })
  }

  return { success: true, path: outputPath }
}
