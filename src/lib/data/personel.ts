import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/auth'

export interface Personel {
  id: string
  tenant_id: string
  organization_id: string | null
  role: 'oversight' | 'admin_subbid' | 'operator_unit' | null
  nip: string | null
  nama_lengkap: string | null
  pangkat: string | null
  jabatan: string | null
  kesatuan: string | null
  tim: string | null
  created_at: string
  org?: { nama: string } | null
}

export interface PersonelListFilters {
  page?: number
  limit?: number
  query?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Default ranks priority map (highest to lowest)
const PANGKAT_PRIORITY: Record<string, number> = {
  'KOMBES POL.': 1, 'KOMBES POL': 1, 'KOMBES': 1,
  'AKBP': 2,
  'KOMPOL': 3,
  'AKP': 4,
  'IPTU': 5,
  'IPDA': 6,
  'AIPTU': 7,
  'AIPDA': 8,
  'BRIPKA': 9,
  'BRIGADIR': 10,
  'BRIPTU': 11,
  'BRIPDA': 12,
  'PENGATUR': 13,
}

function getPangkatPriority(pangkat: string | null): number {
  if (!pangkat) return 99
  const p = pangkat.toUpperCase().trim()
  return PANGKAT_PRIORITY[p] || (p.includes('KOMBES') ? 1 : 99)
}

function getJabatanPriority(jabatan: string | null): number {
  if (!jabatan) return 99
  const j = jabatan.toLowerCase()
  if (j.includes('kabid')) return 1
  if (j.includes('kasubbid')) return 2
  if (j.includes('kaur')) return 3
  if (j.includes('kanit')) return 4
  if (j.includes('pamin')) return 5
  return 6
}

function getBirthYear(nip: string | null): number {
  if (!nip) return 9999
  const match = nip.trim().match(/^(\d{2})/)
  if (!match) return 9999
  const val = parseInt(match[1], 10)
  return val >= 30 ? 1900 + val : 2000 + val
}

export async function getPersonelList(filters: PersonelListFilters = {}) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const page = filters.page || 1
  const limit = filters.limit || 20
  const search = filters.query ? filters.query.toLowerCase().trim() : ''
  const sortBy = filters.sortBy || 'default'
  const sortOrder = filters.sortOrder || 'asc'

  // Fetch with optional server-side text search (reduces transferred rows significantly)
  let query = supabase
    .from('personel')
    .select(`
      *,
      organizations (nama)
    `)
    .eq('tenant_id', tenantId)

  if (search) {
    const like = `%${search}%`
    query = query.or(`nama_lengkap.ilike.${like},nip.ilike.${like},pangkat.ilike.${like},jabatan.ilike.${like},kesatuan.ilike.${like},tim.ilike.${like}`)
  }

  const { data, error } = await query

  if (error) throw error

  const list = (data || []).map((p: any) => ({
    ...p,
    org: p.organizations
  })) as Personel[]

  // 1. Sorting (complex rules: jabatan priority, pangkat, birth year, alpha)
  list.sort((a, b) => {
    let comparison = 0

    if (sortBy === 'default') {
      // a. Jabatan priority
      const ja = getJabatanPriority(a.jabatan)
      const jb = getJabatanPriority(b.jabatan)
      if (ja !== jb) {
        comparison = ja - jb
      } else {
        // b. Pangkat priority
        const pa = getPangkatPriority(a.pangkat)
        const pb = getPangkatPriority(b.pangkat)
        if (pa !== pb) {
          comparison = pa - pb
        } else {
          // c. YOB (nrp birth year: older first)
          const ya = getBirthYear(a.nip)
          const yb = getBirthYear(b.nip)
          if (ya !== yb) {
            comparison = ya - yb
          } else {
            // d. Alphabet
            comparison = (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '')
          }
        }
      }
    } else if (sortBy === 'nama') {
      comparison = (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '')
    } else if (sortBy === 'pangkat') {
      comparison = getPangkatPriority(a.pangkat) - getPangkatPriority(b.pangkat)
    } else if (sortBy === 'nip') {
      comparison = (a.nip || '').localeCompare(b.nip || '')
    } else if (sortBy === 'jabatan') {
      comparison = (a.jabatan || '').localeCompare(b.jabatan || '')
    } else {
      // Fallback
      comparison = (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '')
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 2. Paginate
  const total = list.length
  const paginatedData = list.slice((page - 1) * limit, page * limit)

  return {
    data: paginatedData,
    total,
    page,
    limit,
  }
}

export async function getPersonelById(id: string): Promise<Personel> {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data, error } = await supabase
    .from('personel')
    .select('*, org:organizations(nama)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) throw error
  return data as Personel
}

export async function createPersonel(data: Partial<Personel>) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: inserted, error } = await supabase
    .from('personel')
    .insert({
      ...data,
      tenant_id: tenantId,
    })
    .select()
    .single()

  if (error) throw error
  return inserted
}

export async function updatePersonel(id: string, data: Partial<Personel>) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { data: updated, error } = await supabase
    .from('personel')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function deletePersonel(id: string) {
  const supabase = await createClient()
  const tenantId = await requireTenant()

  const { error } = await supabase
    .from('personel')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
  return true
}
