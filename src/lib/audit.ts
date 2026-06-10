import { createClient } from '@/lib/supabase/server'
import { getTenantId, getUser } from '@/lib/auth'

export async function logAction(
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  metadata?: Record<string, unknown>
) {
  const tenantId = await getTenantId()
  const user = await getUser()
  if (!tenantId) return

  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    new_values: metadata || null,
  })
}
