import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'
import type { MasterTemplate, EffectiveTemplate, DocType, VariableDef } from './types'

export async function getEffectiveTemplate(kode: string): Promise<EffectiveTemplate> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id, kode')
    .eq('tenant_id', tenantId)
    .eq('kode', kode)
    .single()

  if (!docType) {
    throw new Error(`Jenis dokumen "${kode}" tidak ditemukan untuk tenant ini`)
  }

  const { data: tenantTemplate } = await supabase
    .from('templates')
    .select('*')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  if (tenantTemplate?.content || tenantTemplate?.template_docx_path) {
    return {
      content: tenantTemplate.content || '',
      header_html: tenantTemplate.header_html || '',
      footer_html: tenantTemplate.footer_html || '',
      template_docx_path: tenantTemplate.template_docx_path || null,
      source: 'tenant',
    }
  }

  const { data: master } = await supabase
    .from('master_templates')
    .select('*')
    .eq('document_type_kode', kode)
    .maybeSingle()

  if (!master?.content && !master?.template_docx_path) {
    return {
      content: '',
      header_html: '',
      footer_html: '',
      template_docx_path: null,
      source: 'master',
    }
  }

  return {
    content: master.content,
    header_html: master.header_html || '',
    footer_html: master.footer_html || '',
    template_docx_path: master.template_docx_path || null,
    source: 'master',
  }
}

export async function getEffectiveTemplateDocxPath(kode: string): Promise<string | null> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('kode', kode)
    .single()

  if (!docType) return null

  const { data: tenantTemplate } = await supabase
    .from('templates')
    .select('template_docx_path')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  if (tenantTemplate?.template_docx_path) {
    return tenantTemplate.template_docx_path
  }

  const { data: master } = await supabase
    .from('master_templates')
    .select('template_docx_path')
    .eq('document_type_kode', kode)
    .maybeSingle()

  return master?.template_docx_path || null
}

export async function getMasterTemplate(kode: string): Promise<MasterTemplate | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('master_templates')
    .select('*')
    .eq('document_type_kode', kode)
    .maybeSingle()

  return data as MasterTemplate | null
}

export async function saveMasterTemplate(
  kode: string,
  data: { content?: string; header_html?: string; footer_html?: string; template_docx_path?: string | null },
  userId?: string,
) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('master_templates')
    .select('id')
    .eq('document_type_kode', kode)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('master_templates')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('master_templates')
      .insert({
        document_type_kode: kode,
        ...data,
        created_by: userId || null,
      })

    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function saveTenantTemplate(
  kode: string,
  data: { content?: string; header_html?: string; footer_html?: string },
) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('kode', kode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const { data: existing } = await supabase
    .from('templates')
    .select('id')
    .eq('document_type_id', docType.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('templates')
      .update(data)
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('templates')
      .insert({
        tenant_id: tenantId,
        document_type_id: docType.id,
        ...data,
      })

    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function resetTenantTemplate(kode: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('kode', kode)
    .single()

  if (!docType) return { error: 'Jenis dokumen tidak ditemukan' }

  const { error } = await supabase
    .from('templates')
    .update({ content: null, header_html: null, footer_html: null })
    .eq('document_type_id', docType.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getDocumentTypes(): Promise<DocType[]> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('document_types')
    .select('id, kode, nama, tahap, format_nomor')
    .eq('tenant_id', tenantId)
    .order('kode')

  return (data || []) as DocType[]
}

export async function getVariableDefs(documentTypeKode: string): Promise<VariableDef[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('template_variables')
    .select('*')
    .eq('document_type_kode', documentTypeKode)
    .order('display_order')

  return (data || []) as VariableDef[]
}

export async function getGenericVariableDefs(): Promise<VariableDef[]> {
  return getVariableDefs('GENERIC')
}

export async function getVariableDefsWithFallback(documentTypeKode: string): Promise<VariableDef[]> {
  const specific = await getVariableDefs(documentTypeKode)
  if (specific.length > 0) return specific

  return getGenericVariableDefs()
}

export async function getMasterDocxDownloadUrl(path: string): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase.storage
    .from('templates')
    .createSignedUrl(path, 300)

  return data?.signedUrl || null
}
