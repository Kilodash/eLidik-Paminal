import { callAI } from '@/lib/ai/client'
import type { AISettings } from '@/lib/ai/client'
import type { GajamadaReport } from './types'

export function mapGajamadaStatus(statusLabel: string | null): string {
  if (!statusLabel) return 'diterima'
  const s = statusLabel.toLowerCase()
  if (s.includes('terbukti')) return 'terbukti'
  if (s.includes('tidak terbukti')) return 'tidak_terbukti'
  if (s.includes('perdamaian')) return 'perdamaian'
  if (s.includes('tolak') || s.includes('batal')) return 'dibatalkan'
  if (s.includes('diterima')) return 'diterima'
  return 'diterima'
}

export function normalizeCategoryName(category: string | null): string {
  if (!category) return 'Lainnya'
  return category
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function epochToDate(ts: number | null | undefined): string | null {
  if (!ts) return null
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

export async function summarizeKronologi(
  content: string,
  settings: AISettings,
  prompt: string
): Promise<string> {
  if (!content) return ''
  return callAI({
    settings,
    prompt,
    userContent: content,
    temperature: 0.3,
  })
}

export async function extractSatker(
  content: string,
  satkerList: string[],
  settings: AISettings,
  prompt: string
): Promise<string | null> {
  if (!content) return null
  const listText = satkerList.length > 0 ? satkerList.join('\n') : 'Tidak ada daftar satker.'
  const userContent = `Teks pengaduan:\n${content}\n\nDaftar satker:\n${listText}`

  const result = await callAI({
    settings,
    prompt,
    userContent,
    temperature: 0.1,
  })

  const cleaned = result.replace(/^["']|["']$/g, '').trim()
  if (!cleaned || cleaned.toLowerCase() === 'tidak diketahui') return null
  return cleaned
}

export async function mapGajamadaReport(
  report: GajamadaReport,
  tenantId: string,
  klasifikasiId: string | null,
  satker: string | null,
  summary: string,
  createdBy: string
): Promise<{
  pengaduan: Record<string, unknown>
  terlapor: Record<string, unknown>
}> {
  const pengaduan: Record<string, unknown> = {
    tenant_id: tenantId,
    gajamada_id: report.id,
    gajamada_status: report.status_label,
    gajamada_synced_at: new Date().toISOString(),
    nomor_register: report.id,
    jenis: 'Pengaduan Cepat Propam',
    tgl_pengaduan: epochToDate(report.created_date),
    tgl_kejadian: epochToDate(report['5w1h_when']),
    pelapor_nama: report.pengirim || null,
    pelapor_kontak: report.phone_no || null,
    pelapor_email: report.email || null,
    pelapor_nik: report.reporter_nik || null,
    pelapor_total_report: Number(report.total_report) || 0,
    satker_dilaporkan: satker,
    kronologi: summary,
    kronologi_lengkap: report.content || null,
    status: mapGajamadaStatus(report.status_label),
    klasifikasi_id: klasifikasiId,
    created_by: createdBy,
  }

  const terlapor: Record<string, unknown> = {
    tenant_id: tenantId,
    nama: report.prepetrator_name?.trim() || 'Tidak Diketahui',
    status_identitas: report.prepetrator_name ? 'diketahui' : 'tidak_diketahui',
  }

  return { pengaduan, terlapor }
}
