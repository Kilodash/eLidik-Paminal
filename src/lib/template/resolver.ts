import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'

export async function resolveDocumentVariables(pengaduanId: string, documentTypeKode: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()
  
  const variables: Record<string, string> = {}
  
  // Ambil variabel dari database jika diperlukan
  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)

  if (tenantVars) {
    for (const v of tenantVars) {
      variables[v.key] = v.value || ''
    }
  }
  
  return { variables }
}
