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

  let docTypeData = { kode: documentTypeKode, nama: documentTypeKode }
  try {
    const { data } = await supabase
      .from('document_types')
      .select('id, kode, nama')
      .eq('tenant_id', tenantId)
      .eq('kode', documentTypeKode)
      .single()
    if (data) docTypeData = { kode: data.kode, nama: data.nama }
  } catch {
    // fallback
  }

  let template: EffectiveTemplate | null = null
  try {
    template = await getEffectiveTemplate(documentTypeKode)
  } catch (err) {
    console.error('[getTemplateAction] getEffectiveTemplate error:', err)
  }

  let variableDefs: VariableDef[] = []
  try {
    variableDefs = await getVariableDefsWithFallback(documentTypeKode)
  } catch (err) {
    console.error('[getTemplateAction] getVariableDefs error:', err)
  }

  let masterTemplate = null
  try {
    masterTemplate = await getMasterTemplate(documentTypeKode)
  } catch (err) {
    console.error('[getTemplateAction] getMasterTemplate error:', err)
  }

  let docTypeExists = false
  try {
    const { data } = await supabase
      .from('document_types')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('kode', documentTypeKode)
      .single()
    docTypeExists = !!data
  } catch {
    docTypeExists = false
  }

  let tenantTemplateRaw: any = null
  try {
    const { data: docType } = await supabase
      .from('document_types')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('kode', documentTypeKode)
      .single()
    if (docType) {
      const { data: tpl } = await supabase
        .from('templates')
        .select('id, content')
        .eq('document_type_id', docType.id)
        .maybeSingle()
      tenantTemplateRaw = tpl
    }
  } catch {
    tenantTemplateRaw = null
  }

  let masterTemplateRaw: any = null
  try {
    const { data: mt } = await supabase
      .from('master_templates')
      .select('id, document_type_kode, content')
      .eq('document_type_kode', documentTypeKode)
      .maybeSingle()
    masterTemplateRaw = mt
  } catch {
    masterTemplateRaw = null
  }

  return {
    template: (template?.content || template?.template_docx_path) ? template : null,
    docType: docTypeData,
    variableDefs,
    masterTemplate,
    source: template?.source || 'master',
    debug: {
      hasTenantTemplate: template !== null && template.source === 'tenant',
      hasMasterTemplate: masterTemplate !== null && !!masterTemplate.content,
      masterContentLength: masterTemplate?.content?.length || 0,
      effectiveContentLength: template?.content?.length || 0,
      queriedKode: documentTypeKode,
      docTypeExists,
      tenantTemplateContentLen: tenantTemplateRaw?.content?.length || 0,
      tenantTemplateId: tenantTemplateRaw?.id || null,
      masterTemplateRawId: masterTemplateRaw?.id || null,
      masterTemplateRawKode: masterTemplateRaw?.document_type_kode || null,
      masterTemplateRawContentLen: masterTemplateRaw?.content?.length || 0,
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
