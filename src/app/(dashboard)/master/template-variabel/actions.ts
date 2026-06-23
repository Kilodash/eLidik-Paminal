'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { VariableDef } from '@/lib/template/types'

export async function getTemplateVariablesAction(documentTypeKode: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('template_variables')
    .select('*')
    .eq('document_type_kode', documentTypeKode)
    .order('display_order')

  return (data || []) as VariableDef[]
}

export async function getDistinctDocTypeKodesAction() {
  const supabase = await createClient()

  // Dari template_variables yang sudah ada.
  const { data: tplData } = await supabase
    .from('template_variables')
    .select('document_type_kode')
    .order('document_type_kode')

  const tvKodes = (tplData || []).map((r) => r.document_type_kode).filter(Boolean)

  // Dari document_types (semua tenant, agar admin lihat semua jenis dokumen).
  const { data: dtData } = await supabase
    .from('document_types')
    .select('kode')
    .order('kode')

  const dtKodes = (dtData || []).map((r) => r.kode).filter(Boolean)

  const all = [...new Set([...tvKodes, ...dtKodes])].sort()
  return all
}

export async function addTemplateVariableAction(formData: FormData) {
  const supabase = await createClient()

  const document_type_kode = formData.get('document_type_kode') as string
  const variable_key = (formData.get('variable_key') as string).trim()
  const variable_label = (formData.get('variable_label') as string).trim()
  const input_type = formData.get('input_type') as string
  const display_group = (formData.get('display_group') as string).trim() || 'Umum'
  const display_order = parseInt(formData.get('display_order') as string) || 0
  const required = formData.get('required') === 'on'
  const source = formData.get('source') as string
  const description = (formData.get('description') as string).trim() || null

  if (!document_type_kode || !variable_key) {
    return { error: 'document_type_kode dan variable_key wajib diisi' }
  }

  let list_config: any = null
  if (input_type === 'select' || input_type === 'checkbox_group' || input_type === 'list') {
    const optionsRaw = (formData.get('list_options') as string).trim()
    const maxItems = parseInt(formData.get('list_max_items') as string) || null
    if (optionsRaw) {
      list_config = {
        options: optionsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      }
      if (maxItems) list_config.max_items = maxItems
    }
  }

  let validation: any = null
  const minLen = parseInt(formData.get('val_min_length') as string) || null
  const maxLen = parseInt(formData.get('val_max_length') as string) || null
  const pattern = (formData.get('val_pattern') as string).trim() || null
  const valMessage = (formData.get('val_message') as string).trim() || null
  if (minLen || maxLen || pattern || valMessage) {
    validation = {}
    if (minLen) validation.min_length = minLen
    if (maxLen) validation.max_length = maxLen
    if (pattern) validation.pattern = pattern
    if (valMessage) validation.message = valMessage
  }

  const { error } = await supabase.from('template_variables').insert({
    document_type_kode,
    variable_key,
    variable_label,
    input_type,
    display_group,
    display_order,
    required,
    source,
    description,
    list_config,
    validation,
  })

  if (error) return { error: error.message }

  revalidatePath('/master/template-variabel')
  return { success: true }
}

export async function updateTemplateVariableAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const variable_label = (formData.get('variable_label') as string).trim()
  const input_type = formData.get('input_type') as string
  const display_group = (formData.get('display_group') as string).trim() || 'Umum'
  const display_order = parseInt(formData.get('display_order') as string) || 0
  const required = formData.get('required') === 'on'
  const source = formData.get('source') as string
  const description = (formData.get('description') as string).trim() || null

  let list_config: any = null
  if (input_type === 'select' || input_type === 'checkbox_group' || input_type === 'list') {
    const optionsRaw = (formData.get('list_options') as string).trim()
    const maxItems = parseInt(formData.get('list_max_items') as string) || null
    if (optionsRaw) {
      list_config = {
        options: optionsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      }
      if (maxItems) list_config.max_items = maxItems
    }
  }

  let validation: any = null
  const minLen = parseInt(formData.get('val_min_length') as string) || null
  const maxLen = parseInt(formData.get('val_max_length') as string) || null
  const pattern = (formData.get('val_pattern') as string).trim() || null
  const valMessage = (formData.get('val_message') as string).trim() || null
  if (minLen || maxLen || pattern || valMessage) {
    validation = {}
    if (minLen) validation.min_length = minLen
    if (maxLen) validation.max_length = maxLen
    if (pattern) validation.pattern = pattern
    if (valMessage) validation.message = valMessage
  }

  const { error } = await supabase.from('template_variables').update({
    variable_label,
    input_type,
    display_group,
    display_order,
    required,
    source,
    description,
    list_config,
    validation,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/master/template-variabel')
  return { success: true }
}

export async function deleteTemplateVariableAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('template_variables').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/master/template-variabel')
  return { success: true }
}
