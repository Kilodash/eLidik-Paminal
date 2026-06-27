'use server'

import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'
import { getEffectiveTemplate, getDocumentTypes, getVariableDefsWithFallback, saveTenantTemplate, getMasterTemplate, resetTenantTemplate, saveMasterTemplate, getMasterDocxDownloadUrl } from '@/lib/template/queries'
import { resolveDocumentVariables } from '@/lib/template/resolver'
import { renderTemplateHtml } from '@/lib/template/renderer'
import type { EffectiveTemplate, VariableDef } from '@/lib/template/types'

export async function getDocumentTypesAction() {
  const data = await getDocumentTypes()
  return { data }
}

export async function getUukFormDataAction(pengaduanId?: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)

  const vars: Record<string, string> = {}
  for (const v of (tenantVars || [])) {
    vars[v.key] = v.value || ''
  }

  const { data: units } = await supabase
    .from('organizations')
    .select('id, kode, nama')
    .eq('tenant_id', tenantId)
    .eq('tipe', 'unit')
    .order('nama')

  let pengaduanData: Record<string, string> = {}
  if (pengaduanId) {
    const { data: pengaduan } = await supabase
      .from('pengaduan')
      .select('nomor_register, kronologi, satker_dilaporkan, unit:organizations(nama)')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()

    if (pengaduan) {
      pengaduanData = {
        perihal: pengaduan.kronologi?.substring(0, 100) || '',
        satker: pengaduan.satker_dilaporkan || '',
        unit_nama: (pengaduan.unit as { nama?: string })?.nama || '',
        nomor_register: pengaduan.nomor_register || '',
      }
    }
  }

  const now = new Date()
  const { data: register } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', tenantId)
    .eq('document_type_kode', 'UNSUR-KETERANGAN')
    .eq('tahun', now.getFullYear())
    .eq('bulan', now.getMonth() + 1)
    .maybeSingle()

  const nextNomor = (register?.nomor_terakhir || 0) + 1
  const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][now.getMonth()]
  const nomorUUK = `R/UUK-${nextNomor}/${bulanRomawi}/HUK.12.10./${now.getFullYear()}/Paminal`

  return {
    tenantVars: vars,
    units: units || [],
    pengaduanData,
    nomorUUK,
  }
}

/**
 * Ambil nilai default untuk form generik:
 * - tenantVars: seluruh variabel tenant (key/value) untuk prefill (mis. kop, pejabat).
 * - pengaduanData: data dasar dari pengaduan (jika ada) untuk prefill perihal/satker/unit/nomor.
 * - nextNomor: nomor urut register berikutnya untuk jenis dokumen ini (bulan berjalan).
 */
export async function getGenericFormDefaultsAction(
  documentTypeKode: string,
  pengaduanId?: string,
) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)

  const vars: Record<string, string> = {}
  for (const v of tenantVars || []) {
    vars[v.key] = v.value || ''
  }

  let pengaduanData: Record<string, string> = {}
  if (pengaduanId) {
    const { data: pengaduan } = await supabase
      .from('pengaduan')
      .select('nomor_register, kronologi, satker_dilaporkan, unit:organizations(nama)')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (pengaduan) {
      pengaduanData = {
        perihal: pengaduan.kronologi?.substring(0, 100) || '',
        satker: pengaduan.satker_dilaporkan || '',
        unit_nama: (pengaduan.unit as { nama?: string })?.nama || '',
        nomor_register: pengaduan.nomor_register || '',
      }
    }
  }

  const now = new Date()
  const { data: register } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', tenantId)
    .eq('document_type_kode', documentTypeKode)
    .eq('tahun', now.getFullYear())
    .eq('bulan', now.getMonth() + 1)
    .maybeSingle()

  const nextNomor = (register?.nomor_terakhir || 0) + 1

  return { tenantVars: vars, pengaduanData, nextNomor }
}

export async function getTemplateAction(documentTypeKode: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const [docTypeResult, effectiveTemplate, variableDefs, masterTemplate, masterTemplateRaw] = await Promise.allSettled([
    supabase
      .from('document_types')
      .select('id, kode, nama')
      .eq('tenant_id', tenantId)
      .eq('kode', documentTypeKode)
      .single(),
    getEffectiveTemplate(documentTypeKode),
    getVariableDefsWithFallback(documentTypeKode),
    getMasterTemplate(documentTypeKode),
    supabase
      .from('master_templates')
      .select('id, document_type_kode, content')
      .eq('document_type_kode', documentTypeKode)
      .maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let docTypeData: any = { kode: documentTypeKode, nama: documentTypeKode }
  let docTypeExists = false
  let docTypeId: string | null = null

  if (docTypeResult.status === 'fulfilled' && docTypeResult.value.data) {
    docTypeData = { kode: docTypeResult.value.data.kode, nama: docTypeResult.value.data.nama }
    docTypeExists = true
    docTypeId = docTypeResult.value.data.id
  }

  const template: EffectiveTemplate | null = effectiveTemplate.status === 'fulfilled' ? effectiveTemplate.value : null
  const variableDefsResult: VariableDef[] = variableDefs.status === 'fulfilled' ? variableDefs.value : []
  const masterTemplateResult = masterTemplate.status === 'fulfilled' ? masterTemplate.value : null

  if (effectiveTemplate.status === 'rejected') console.error('[getTemplateAction] getEffectiveTemplate error:', effectiveTemplate.reason)
  if (variableDefs.status === 'rejected') console.error('[getTemplateAction] getVariableDefs error:', variableDefs.reason)
  if (masterTemplate.status === 'rejected') console.error('[getTemplateAction] getMasterTemplate error:', masterTemplate.reason)

  // tenantTemplateRaw depends on docTypeId from first query
  let tenantTemplateRaw: any = null
  if (docTypeId) {
    try {
      const { data: tpl } = await supabase
        .from('templates')
        .select('id, content')
        .eq('document_type_id', docTypeId)
        .maybeSingle()
      tenantTemplateRaw = tpl
    } catch {
      // fallback
    }
  }

  const masterRaw = masterTemplateRaw.status === 'fulfilled' ? masterTemplateRaw.value.data : null

  return {
    template: (template?.content || template?.template_docx_path) ? template : null,
    docType: docTypeData,
    variableDefs: variableDefsResult,
    masterTemplate: masterTemplateResult,
    source: template?.source || 'master',
    debug: {
      hasTenantTemplate: template !== null && template.source === 'tenant',
      hasMasterTemplate: masterTemplateResult !== null && !!masterTemplateResult.content,
      masterContentLength: masterTemplateResult?.content?.length || 0,
      effectiveContentLength: template?.content?.length || 0,
      queriedKode: documentTypeKode,
      docTypeExists,
      tenantTemplateContentLen: tenantTemplateRaw?.content?.length || 0,
      tenantTemplateId: tenantTemplateRaw?.id || null,
      masterTemplateRawId: masterRaw?.id || null,
      masterTemplateRawKode: masterRaw?.document_type_kode || null,
      masterTemplateRawContentLen: masterRaw?.content?.length || 0,
    },
  }
}

export async function saveTemplateAction(
  documentTypeKode: string,
  content: string,
  headerHtml: string,
  footerHtml: string,
) {
  return saveTenantTemplate(documentTypeKode, {
    content,
    header_html: headerHtml,
    footer_html: footerHtml,
  })
}

export async function renderDocumentAction(pengaduanId: string, documentTypeKode: string) {
  const template = await getEffectiveTemplate(documentTypeKode)

  if (!template.content) {
    return { error: 'Template untuk jenis dokumen ini belum tersedia. Silakan isi template di Editor Dokumen terlebih dahulu.' }
  }

  const { variables } = await resolveDocumentVariables(pengaduanId, documentTypeKode)

  let html = template.content
  html = template.header_html ? template.header_html + html : html
  html = template.footer_html ? html + template.footer_html : html

  html = renderTemplateHtml(html, variables)

  return { html }
}

export async function getMasterTemplateAction(kode: string) {
  return getMasterTemplate(kode)
}

export async function resetTenantTemplateAction(kode: string) {
  return resetTenantTemplate(kode)
}

export async function getMasterDocxDownloadUrlAction(path: string) {
  return getMasterDocxDownloadUrl(path)
}

export async function convertDocxToHtmlAction(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'File tidak ditemukan' }

  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const conv = await mammoth.default?.convertToHtml?.({ buffer }) ?? await mammoth.convertToHtml({ buffer })
    return { html: conv.value || '' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal konversi DOCX'
    return { error: message }
  }
}

export async function saveMasterTemplateAction(
  kode: string,
  data: { content?: string; header_html?: string; footer_html?: string; template_docx_path?: string | null },
) {
  return saveMasterTemplate(kode, data)
}

// =============== Stempel / Signet Actions ===============

export async function uploadStempelAction(formData: FormData) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'File tidak ditemukan' }

  if (!file.type.startsWith('image/')) {
    return { error: 'File harus berupa gambar (PNG, JPG)' }
  }

  const storagePath = `${tenantId}/stempel.png`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from('templates')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) return { error: 'Gagal mengunggah stempel: ' + error.message }

  return { success: true, path: storagePath }
}

export async function getStempelUrlAction() {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const storagePath = `${tenantId}/stempel.png`

  const { data } = await supabase.storage
    .from('templates')
    .createSignedUrl(storagePath, 3600)

  return { url: data?.signedUrl || null }
}

export async function removeStempelAction() {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const storagePath = `${tenantId}/stempel.png`

  const { error } = await supabase.storage
    .from('templates')
    .remove([storagePath])

  if (error) return { error: 'Gagal menghapus stempel: ' + error.message }

  return { success: true }
}
