import { createClient } from '@/lib/supabase/server'
import type { TenantRole } from '@/types'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return user
}

export async function getPersonel() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) {
    console.log('[getPersonel] No user from getUser()')
    return null
  }

  const { data, error } = await supabase
    .from('personel')
    .select('*, tenant:tenants(*), organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    console.log('[getPersonel] User found but no personel record. User ID:', user.id, 'Error:', error?.message || JSON.stringify(error))
  }

  return data
}

export async function getTenantId(): Promise<string | null> {
  const personel = await getPersonel()
  return personel?.tenant_id ?? null
}

export async function requireRole(...roles: TenantRole[]) {
  const personel = await getPersonel()
  if (!personel || !roles.includes(personel.role as TenantRole)) {
    return null
  }
  return personel
}

export async function requireTenant(): Promise<string> {
  const tenantId = await getTenantId()
  if (!tenantId) throw new Error('Tenant not found')
  return tenantId
}
