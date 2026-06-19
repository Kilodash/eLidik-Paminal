'use server'

import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'
import {
  renderDocxFromTemplatePath,
  uploadTemplateToStorage,
  loadTemplateFromStorage,
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
    return { error: 'Dokumen berhasil dibuat tetapi gagal disimpan: ' + uploadResult.error, buffer: result.buffer }
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

  return { success: true, downloadUrl, fileName, buffer: result.buffer }
}

export async function getDocxBufferAction(documentTypeKode: string) {
  const docxPath = await getEffectiveTemplateDocxPath(documentTypeKode)

  if (!docxPath) {
    return { error: 'Template DOCX tidak tersedia', base64: null }
  }

  const buffer = await loadTemplateFromStorage(docxPath)

  if (!buffer) {
    return { error: 'Gagal memuat template DOCX', base64: null }
  }

  const base64 = buffer.toString('base64')
  return { base64, error: null }
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
    return { error: 'Gagal menyimpan dokumen: ' + uploadResult.error, buffer: result.buffer }
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

  return { success: true, downloadUrl, fileName, buffer: result.buffer }
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
  const result = await renderDocxFromTemplatePath(docxPath, data)
  if (result.error) {
    return { error: result.error, base64: null }
  }
  const base64 = result.buffer!.toString('base64')
  return { base64, error: null }
}
