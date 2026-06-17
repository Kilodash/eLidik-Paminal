'use server'

import { createClient } from '@supabase/supabase-js'
import { requireTenant } from '@/lib/auth'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getRegisterSuratListAction({
  page = 1,
  limit = 10,
  search = '',
  docType = ''
}: {
  page?: number
  limit?: number
  search?: string
  docType?: string
}) {
  const tenantId = await requireTenant()
  const supabase = getServiceClient()

  try {
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    if (docType) {
      query = query.eq('tahap', docType)
    }

    query = query.order('created_at', { ascending: false })

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return { success: false, error: error.message, data: [], total: 0, page, limit, totalPages: 0 }
    }

    const docs = data || []
    const pengaduanIds = [...new Set(docs.map((d: any) => d.pengaduan_id).filter(Boolean))] as string[]
    const berkasIds = [...new Set(docs.map((d: any) => d.berkas_id).filter(Boolean))] as string[]

    const pengaduanMap: Record<string, any> = {}
    const berkasMap: Record<string, any> = {}
    let pengaduanErr: string | null = null
    let berkasErr: string | null = null

    if (pengaduanIds.length > 0) {
      const { data: pengaduans, error: pErr } = await supabase
        .from('pengaduan')
        .select('id, pelapor_nama, kronologi, tgl_pengaduan, jenis, satker_dilaporkan, unit_id, pengaduan_terlapor(terlapor(nama, pangkat, jabatan))')
        .in('id', pengaduanIds)
      pengaduanErr = pErr?.message || null
      for (const p of (pengaduans || [])) pengaduanMap[p.id] = p
    }

    if (berkasIds.length > 0) {
      const { data: berkasList, error: bErr } = await supabase
        .from('berkas')
        .select('id, judul, nomor_berkas')
        .in('id', berkasIds)
      berkasErr = bErr?.message || null
      for (const b of (berkasList || [])) berkasMap[b.id] = b
    }

    const enriched = docs.map((doc: any) => ({
      ...doc,
      pengaduan: doc.pengaduan_id ? pengaduanMap[doc.pengaduan_id] || null : null,
      berkas: doc.berkas_id ? berkasMap[doc.berkas_id] || null : null,
    }))

    return { 
      success: true, 
      data: enriched, 
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
      _debug: {
        tenantId: tenantId.slice(0, 8),
        docsCount: docs.length,
        pengaduanIds,
        pengaduanFound: Object.keys(pengaduanMap).length,
        pengaduanErr,
        sampleDoc: docs[0] || null,
        samplePengaduan: docs[0]?.pengaduan_id ? pengaduanMap[docs[0].pengaduan_id] : null,
        berkasIds: berkasIds.length,
        berkasFound: Object.keys(berkasMap).length,
        berkasErr,
        serviceKeyOk: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message, data: [], total: 0, page, limit, totalPages: 0 }
  }
}

export async function getDocumentTypesAction() {
  const supabase = getServiceClient()
  const tenantId = await requireTenant()

  const { data, error } = await supabase
    .from('document_types')
    .select('kode, nama')
    .eq('tenant_id', tenantId)
    .order('kode')

  if (error) return { error: error.message }
  return { data: data || [] }
}
