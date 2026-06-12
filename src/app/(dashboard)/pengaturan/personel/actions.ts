'use server'

import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'

export async function deletePersonelAction(id: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()
  
  const { error } = await supabase
    .from('personel')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    if (error.code === '23503') {
      throw new Error('Personel tidak dapat dihapus karena masih terkait dengan data lain (Pengaduan/Berkas/Dokumen)')
    }
    throw new Error(error.message)
  }
}
