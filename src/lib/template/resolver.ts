import { createClient } from '@/lib/supabase/server'
import { getVariableDefsWithFallback } from '@/lib/template/queries'
import { buildDocxData } from '@/lib/docx/data-mapper'
import type { VariableDef } from '@/lib/template/types'

let bulanRomawiMemo: string[] | null = null
function bulanRomawi(bulan: number): string {
  if (!bulanRomawiMemo) {
    bulanRomawiMemo = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  }
  return bulanRomawiMemo[bulan - 1] || String(bulan)
}

interface ResolveResult {
  variables: Record<string, string>
}

export async function resolveDocumentVariables(
  pengaduanId: string,
  documentTypeKode: string,
): Promise<ResolveResult> {
  const supabase = await createClient()
  const { data: pengaduan } = await supabase
    .from('pengaduan')
    .select('id, tenant_id')
    .eq('id', pengaduanId)
    .single()

  if (!pengaduan) return { variables: {} }

  const tenantId = pengaduan.tenant_id

  const variableDefs: VariableDef[] = await getVariableDefsWithFallback(documentTypeKode)

  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)

  let pengaduanData: Record<string, string> = {}
  try {
    pengaduanData = await buildDocxData(pengaduanId, documentTypeKode)
  } catch (err) {
    console.error('[resolver] buildDocxData failed:', err)
  }

  const now = new Date()
  const systemDefaults: Record<string, string> = {
    tgl_sekarang: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    jam_sekarang: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    tahun: String(now.getFullYear()),
    bulan_romawi: bulanRomawi(now.getMonth() + 1),
  }

  const resolved: Record<string, string> = {}

  for (const def of variableDefs) {
    let value = ''

    switch (def.source) {
      case 'tenant': {
        const tv = tenantVars?.find((v: { key: string; value: string | null }) => v.key === def.variable_key)
        value = tv?.value || ''
        break
      }
      case 'pengaduan': {
        value = pengaduanData[def.variable_key] || ''
        break
      }
      case 'system': {
        value = systemDefaults[def.variable_key] || ''
        break
      }
      case 'metadata': {
        value = systemDefaults[def.variable_key] || ''
        break
      }
      default: {
        value = ''
      }
    }

    resolved[def.variable_key] = value
  }

  // Also include ALL pengaduan data and tenant vars as fallback for
  // variables not explicitly defined in template_variables.
  for (const [k, v] of Object.entries(pengaduanData)) {
    if (!(k in resolved)) resolved[k] = v
  }
  for (const tv of tenantVars || []) {
    if (!(tv.key in resolved)) resolved[tv.key] = tv.value || ''
  }

  return { variables: resolved }
}
