export type VariableSource = 'tenant' | 'pengaduan' | 'system' | 'user_input' | 'metadata'
export type InputType = 'text' | 'textarea' | 'date' | 'select' | 'list' | 'checkbox_group' | 'auto'

export interface ValidationConfig {
  min_length?: number
  max_length?: number
  pattern?: string
  message?: string
}

export interface VariableDef {
  id?: string
  document_type_kode: string
  variable_key: string
  variable_label: string
  source: VariableSource
  input_type: InputType
  display_order: number
  display_group: string
  required: boolean
  list_config?: ListConfig | null
  validation?: ValidationConfig | null
  description?: string | null
}

export interface ListConfig {
  item_key_prefix?: string
  max_items?: number
  options?: string[]
}

export interface MasterTemplate {
  id: string
  document_type_kode: string
  content: string | null
  header_html: string | null
  footer_html: string | null
  template_docx_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TenantTemplate {
  id: string
  tenant_id: string
  document_type_id: string
  document_type_kode?: string
  content: string | null
  header_html: string | null
  footer_html: string | null
  template_docx_path: string | null
  output_format: string
  overrides_master: boolean
}

export interface EffectiveTemplate {
  content: string
  header_html: string
  footer_html: string
  template_docx_path: string | null
  source: 'master' | 'tenant'
}

export interface DocType {
  id: string
  kode: string
  nama: string
  tahap?: string | null
  format_nomor?: string | null
  is_active?: boolean
}
