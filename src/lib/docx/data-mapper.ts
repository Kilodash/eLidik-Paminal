import { createClient } from '@/lib/supabase/server'
import { loadTemplateFromStorage } from '@/lib/docx/renderer'

interface PengaduanRow {
  id: string
  tenant_id: string
  unit_id: string | null
  berkas_id: string | null
  nomor_register: string | null
  jenis: string | null
  tgl_pengaduan: string | null
  pelapor_nama: string | null
  pelapor_kontak: string | null
  satker_dilaporkan: string | null
  klasifikasi_id: string | null
  kronologi: string | null
  atensi: boolean
  status: string | null
  wujud_perbuatan_id: string | null
  disposisi_kabid: string[] | null
  disposisi_kasubbid: string[] | null
  disposisi_tambahan: string | null
  created_by: string | null
  created_at: string | null
  unit_nama?: string | null
  unit_kode?: string | null
  klasifikasi_nama?: string | null
  wujud_perbuatan_nama?: string | null
  created_by_nama?: string | null
  created_by_pangkat?: string | null
  terlapor_list?: string
}

function formatDate(d: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return ''
  return arr.map((item, i) => `${i + 1}. ${item}`).join('\n')
}

let bulanRomawiMemo: string[] | null = null
function bulanRomawi(bulan: number): string {
  if (!bulanRomawiMemo) {
    bulanRomawiMemo = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  }
  return bulanRomawiMemo[bulan - 1] || String(bulan)
}

export async function buildDocxData(
  pengaduanId: string,
  documentTypeKode: string,
): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pengaduan, error } = await supabase
    .from('pengaduan')
    .select(`
      *,
      unit:organizations!pengaduan_unit_id_fkey(nama, kode),
      klasifikasi:klasifikasi(nama),
      wujud_perbuatan:wujud_perbuatan(nama),
      created_by_pe:personel!pengaduan_created_by_fkey(nama, pangkat)
    `)
    .eq('id', pengaduanId)
    .single()

  if (error || !pengaduan) {
    throw new Error('Data pengaduan tidak ditemukan: ' + (error?.message || 'not found'))
  }

  const p = pengaduan as any

  const { data: terlaporList } = await supabase
    .from('terlapor')
    .select('nama, nip')
    .eq('pengaduan_id', pengaduanId)

  const terlaporFormatted = terlaporList?.length
    ? terlaporList.map((t, i) => `${i + 1}. ${t.nama}${t.nip ? ` (NIP: ${t.nip})` : ''}`).join('\n')
    : ''

  const jenisLabel = p.jenis === 'laporan_informasi' ? 'Laporan Informasi' : 'Pengaduan'

  const now = new Date()
  const tgl = p.tgl_pengaduan ? formatDate(p.tgl_pengaduan) : formatDate(now.toISOString().split('T')[0])

  const data: Record<string, string> = {
    id: p.id,
    nomor_register: p.nomor_register || '',
    jenis: jenisLabel,
    tgl_pengaduan: tgl,
    pelapor_nama: p.pelapor_nama || '',
    pelapor_kontak: p.pelapor_kontak || '',
    satker_dilaporkan: p.satker_dilaporkan || '',
    kronologi: p.kronologi || '',
    perihal: p.kronologi?.substring(0, 120) || '',
    atensi: p.atensi ? 'Atensi' : '',
    status: p.status || '',
    unit_nama: p.unit?.nama || '',
    unit_kode: p.unit?.kode || '',
    klasifikasi_nama: p.klasifikasi?.nama || '',
    wujud_perbuatan_nama: p.wujud_perbuatan?.nama || '',
    disposisi_kabid: formatArray(p.disposisi_kabid),
    disposisi_kasubbid: formatArray(p.disposisi_kasubbid),
    disposisi_tambahan: p.disposisi_tambahan || '',
    created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
    created_by_nama: p.created_by_pe?.nama || '',
    created_by_pangkat: p.created_by_pe?.pangkat || '',
    terlapor_list: terlaporFormatted,
    tgl_sekarang: formatDate(now.toISOString().split('T')[0]),
    jam_sekarang: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    tahun: String(now.getFullYear()),
    bulan_romawi: bulanRomawi(now.getMonth() + 1),
  }

  // Load tenant variables
  const { data: tenantVars } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', p.tenant_id)

  for (const v of tenantVars || []) {
    data[v.key] = v.value || ''
  }

  // Load stempel image
  const stempelPath = `${p.tenant_id}/stempel.png`
  try {
    const stempelBuffer = await loadTemplateFromStorage(stempelPath)
    if (stempelBuffer) {
      data.stempel_img_base64 = stempelBuffer.toString('base64')
    } else {
      data.stempel_img_base64 = ''
    }
  } catch {
    data.stempel_img_base64 = ''
  }

  // System variables
  const { data: register } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', p.tenant_id)
    .eq('document_type_kode', documentTypeKode)
    .eq('tahun', now.getFullYear())
    .eq('bulan', now.getMonth() + 1)
    .maybeSingle()

  const nextNomor = (register?.nomor_terakhir || 0) + 1

  data.next_nomor = String(nextNomor)
  data.nomor_surat = data.nomor_UUK ||
    data.nomor_surat ||
    `R/${documentTypeKode}-${nextNomor}/${bulanRomawi(now.getMonth() + 1)}/${now.getFullYear()}`

  return data
}
