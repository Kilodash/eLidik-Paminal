import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'
import type { Klasifikasi, Organization, WilayahSatker, JenisPengaduan } from '@/types'

export async function getJenisPengaduanList(): Promise<JenisPengaduan[]> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('jenis_pengaduan')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nama')

  return (data || []) as JenisPengaduan[]
}

export async function getKlasifikasiList(): Promise<Klasifikasi[]> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('klasifikasi')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nama')

  return (data || []) as Klasifikasi[]
}

export async function getUnitList(): Promise<Organization[]> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('tipe', 'unit')
    .order('nama')

  return (data || []) as Organization[]
}

export async function getWilayahSatkerList(): Promise<WilayahSatker[]> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data } = await supabase
    .from('wilayah_satker')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nama')

  return (data || []) as WilayahSatker[]
}

