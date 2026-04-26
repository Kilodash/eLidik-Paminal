'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Send, CheckCircle, XCircle,
  Brain, FileText, Download, Sparkles, User, MapPin,
  AlertCircle, Clock, Wrench, Target, BookOpen, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ── UUK Preview Component ──────────────────────────────────────────────────────
interface UUKData {
  nomor_uuk: string
  bidang: string
  masalah: string
  sasaran: string
  periode: string
  unit: string
  indikasi: string
  intisari: string
  sumber_baket: string
  teknik_taktik: string
  waktu_baket: string
  waktu_tempat_serah: string
  nama_kasubbid: string
  pangkat_kasubbid: string
  nrp_kasubbid: string
}

function UUKPreview({ data, dumasNoDumas }: { data: Partial<UUKData>, dumasNoDumas: string }) {
  const d = data

  return (
    <div className="bg-white border border-gray-300 font-serif text-[11pt] text-black p-6 shadow-sm" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: 1.4 }}>
      {/* KOP */}
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <div className="font-bold text-[12pt]">KEPOLISIAN NEGARA REPUBLIK INDONESIA</div>
        <div className="font-bold text-[12pt]">DAERAH JAWA BARAT</div>
        <div className="font-bold">BIDANG PROFESI DAN PENGAMANAN</div>
        <div className="text-sm font-semibold mt-1">SUB BIDANG PENGAMANAN INTERNAL</div>
      </div>

      {/* Judul */}
      <div className="text-center my-4">
        <div className="font-bold text-[14pt] tracking-widest underline">UNSUR-UNSUR UTAMA KETERANGAN</div>
      </div>

      {/* Identitas */}
      <table className="w-full mb-4 text-[11pt]">
        <tbody>
          {[
            { label: 'No. Pol', value: d.nomor_uuk || `R/UUK/___/${new Date().toLocaleString('id-ID', { month: 'long' })}/HUK.12.10./${new Date().getFullYear()}/Paminal` },
            { label: 'Bidang', value: d.bidang || 'Paminal' },
            { label: 'Masalah', value: d.masalah || '...' },
            { label: 'Sasaran', value: d.sasaran || '...' },
            { label: 'Periode', value: d.periode || '...' },
            { label: 'Unit', value: d.unit || '...' },
          ].map(({ label, value }) => (
            <tr key={label}>
              <td className="w-24 py-0.5 font-semibold align-top">{label}</td>
              <td className="w-4 py-0.5 text-center">:</td>
              <td className="py-0.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tabel Utama */}
      <table className="w-full border-collapse border border-black text-[9.5pt] mb-4">
        <thead>
          <tr className="bg-gray-100">
            {['NO', 'INDIKASI', 'INTISARI YANG DIBUTUHKAN', 'SUMBER BAKET YANG DIPERLUKAN', 'TEKNIK/TAKTIK YANG DIGUNAKAN', 'WAKTU BAKET YANG DIPERLUKAN', 'WAKTU/TEMPAT BAKET DISERAHKAN', 'KET'].map(h => (
              <th key={h} className="border border-black px-1 py-1 text-center font-bold text-[8.5pt] align-top">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-1 py-2 text-center align-top">1</td>
            <td className="border border-black px-2 py-2 align-top">{d.indikasi || '...'}</td>
            <td className="border border-black px-2 py-2 align-top">{d.intisari || '...'}</td>
            <td className="border border-black px-2 py-2 align-top">{d.sumber_baket || '...'}</td>
            <td className="border border-black px-2 py-2 align-top">{d.teknik_taktik || '...'}</td>
            <td className="border border-black px-2 py-2 text-center align-top">2 hari kerja</td>
            <td className="border border-black px-2 py-2 align-top">{d.waktu_tempat_serah || 'di Kantor Bid Propam Polda Jabar'}</td>
            <td className="border border-black px-2 py-2 align-top"></td>
          </tr>
        </tbody>
      </table>

      {/* TTD */}
      <div className="flex justify-end mt-6">
        <div className="text-center">
          <div className="text-[11pt]">a.n. KEPALA BIDANG PROFESI DAN PENGAMANAN</div>
          <div className="font-semibold text-[11pt]">KASUBBIDPAMINAL</div>
          <div className="mt-16 font-bold text-[12pt]">{d.nama_kasubbid || '.................................'}</div>
          <div className="text-[11pt]">{d.pangkat_kasubbid || '...'}</div>
          <div className="text-[11pt]">NRP {d.nrp_kasubbid || '...'}</div>
        </div>
      </div>
    </div>
  )
}

// ── SIADIDEMENBABI Element Card ──────────────────────────────────────────────
const SIADIDEMEN_CONFIG = [
  { key: 'siapa', label: 'SIAPA', desc: 'Subjek/Pelaku & Korban', icon: User, color: 'from-violet-500 to-purple-600' },
  { key: 'apa', label: 'APA', desc: 'Dugaan Pelanggaran', icon: AlertCircle, color: 'from-red-500 to-rose-600' },
  { key: 'dimana', label: 'DIMANA', desc: 'Lokasi Kejadian', icon: MapPin, color: 'from-blue-500 to-cyan-600' },
  { key: 'dengan_apa', label: 'DENGAN APA', desc: 'Alat / Sarana', icon: Wrench, color: 'from-amber-500 to-orange-600' },
  { key: 'menggunakan_apa', label: 'MENGGUNAKAN APA', desc: 'Modus Operandi', icon: Target, color: 'from-green-500 to-emerald-600' },
  { key: 'bagaimana', label: 'BAGAIMANA', desc: 'Kronologi Singkat', icon: BookOpen, color: 'from-teal-500 to-cyan-600' },
  { key: 'bilamana', label: 'BILAMANA', desc: 'Waktu Kejadian', icon: Clock, color: 'from-pink-500 to-rose-600' },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DumasDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dumas, setDumas] = useState<any>(null)
  const [tindakLanjut, setTindakLanjut] = useState<any>({})
  const [user, setUser] = useState<any>(null)

  // UUK state
  const [showUUKPreview, setShowUUKPreview] = useState(false)
  const [uukData, setUukData] = useState<Partial<UUKData>>({})
  const [generatingUUK, setGeneratingUUK] = useState(false)
  const [uukGenerated, setUukGenerated] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    if (id) {
      fetchDumasDetail()
    }
  }, [id])

  const fetchDumasDetail = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dumas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Gagal mengambil data')

      const data = await response.json()
      setDumas(data.data)

      // Extract tindak lanjut data
      const { dumas_id, ...tlData } = data.data
      setTindakLanjut(tlData)

      // Pre-fill UUK data from AI context
      const ctx = data.data.context_ai || {}
      if (ctx && !ctx.error) {
        setUukData(prev => ({
          ...prev,
          masalah: ctx.apa || '',
          sasaran: ctx.siapa || '',
          indikasi: ctx.apa || '',
          intisari: ctx.bagaimana || '',
          sumber_baket: ctx.siapa || '',
          teknik_taktik: 'Wawancara, Penelusuran Data',
          periode: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
          waktu_tempat_serah: 'di Kantor Bid Propam Polda Jabar',
          bidang: 'Paminal',
          analis: ctx.analisis_singkat || '',
          saran: ctx.saran || '',
        }))
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTindakLanjut = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tindak-lanjut/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tindakLanjut)
      })

      if (!response.ok) throw new Error('Gagal menyimpan')

      toast.success('Tindak lanjut berhasil disimpan')
      fetchDumasDetail()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitVerification = async () => {
    if (!confirm('Ajukan tindak lanjut untuk verifikasi?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tindak-lanjut/${id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Gagal mengajukan verifikasi')

      toast.success('Berhasil diajukan untuk verifikasi')
      fetchDumasDetail()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleApproval = async (action: 'approve' | 'reject', catatan?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tindak-lanjut/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, catatan_revisi: catatan })
      })

      if (!response.ok) throw new Error('Gagal memproses approval')

      toast.success(action === 'approve' ? 'Berhasil disetujui' : 'Dikembalikan untuk revisi')
      fetchDumasDetail()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleGenerateUUK = async () => {
    setGeneratingUUK(true)
    try {
      // Simulate AI-enhanced generation with current context
      await new Promise(r => setTimeout(r, 800))
      const ctx = dumas?.context_ai || {}
      const now = new Date()
      const bulan = now.toLocaleString('id-ID', { month: 'long' })
      const tahun = now.getFullYear()
      const bulanRomawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][now.getMonth()]

      setUukData(prev => ({
        ...prev,
        nomor_uuk: `R/UUK/___/${bulanRomawi}/HUK.12.10./${tahun}/Paminal`,
        bidang: 'Paminal',
        masalah: ctx.apa || dumas?.wujud_perbuatan || '...',
        sasaran: ctx.siapa || dumas?.terlapor || '...',
        periode: `${bulan} ${tahun}`,
        unit: dumas?.unit_name || '...',
        indikasi: ctx.apa || '...',
        intisari: [
          ctx.apa ? `1. ${ctx.apa}` : '',
          ctx.bagaimana ? `2. ${ctx.bagaimana}` : '',
          ctx.dimana ? `3. Lokasi: ${ctx.dimana}` : '',
        ].filter(Boolean).join('\n') || '...',
        sumber_baket: ctx.siapa || dumas?.pelapor || '...',
        teknik_taktik: 'Wawancara, Penelusuran Dokumen, Observasi',
        waktu_baket: '2 hari kerja',
        waktu_tempat_serah: `${bulan} ${tahun} di Kantor Bid Propam Polda Jabar`,
        nama_kasubbid: '...............................',
        pangkat_kasubbid: 'AKBP',
        nrp_kasubbid: '...............',
      }))

      setShowUUKPreview(true)
      setUukGenerated(true)
      toast.success('Dokumen UUK berhasil digenerate dari data AI!')
    } catch (e) {
      toast.error('Gagal generate UUK')
    } finally {
      setGeneratingUUK(false)
    }
  }

  const handleDownloadUUK = () => {
    // Trigger browser print dialog of the UUK preview
    const el = document.getElementById('uuk-preview-content')
    if (!el) return
    const win = window.open('', '', 'width=900,height=700')
    if (!win) return
    win.document.write(`
      <html><head><title>UUK - ${dumas?.no_dumas}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; margin: 2cm; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 4px 6px; }
        th { background: #f5f5f5; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .tracking-widest { letter-spacing: 0.15em; }
      </style>
      </head><body>${el.innerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (!dumas) {
    return <div className="p-6">Data tidak ditemukan</div>
  }

  const canEdit = user?.role === 'unit' || ['admin', 'superadmin'].includes(user?.role)
  const canApprove = user?.role === 'kasubbid_paminal' || ['admin', 'superadmin'].includes(user?.role)
  const hasAIContext = dumas.context_ai && !dumas.context_ai.error && Object.keys(dumas.context_ai).length > 0

  return (
    <div className="space-y-6" data-testid="dumas-detail-page">
      {/* Header */}
      <div>
        <Link href="/dumas">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">{dumas.no_dumas}</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(dumas.tgl_dumas), 'dd MMMM yyyy', { locale: idLocale })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={dumas.status === 'terbukti' ? 'default' : 'secondary'}>
              {dumas.status}
            </Badge>
            {tindakLanjut.status_verifikasi && (
              <Badge variant="outline">{tindakLanjut.status_verifikasi}</Badge>
            )}
            {hasAIContext && (
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Analyzed
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="informasi" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informasi" data-testid="tab-informasi">Informasi</TabsTrigger>
          <TabsTrigger value="analisis-ai" data-testid="tab-analisis-ai" className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Analisis AI
            {hasAIContext && <span className="w-2 h-2 bg-violet-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="tindak-lanjut" data-testid="tab-tindak-lanjut">Tindak Lanjut</TabsTrigger>
        </TabsList>

        {/* ── TAB: INFORMASI ── */}
        <TabsContent value="informasi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengaduan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Satker</Label>
                  <p className="font-medium">{dumas.satker}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit Penanganan</Label>
                  <p className="font-medium">{dumas.unit_name || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Pelapor</Label>
                <p className="font-medium">{dumas.pelapor}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Terlapor</Label>
                <p className="font-medium">{dumas.terlapor}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Jenis Dumas</Label>
                  <p className="font-medium">{dumas.jenis_dumas}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Wujud Perbuatan</Label>
                  <p className="font-medium">{dumas.wujud_perbuatan}</p>
                </div>
              </div>

              {dumas.keterangan && (
                <div>
                  <Label className="text-muted-foreground">Keterangan</Label>
                  <p className="font-medium whitespace-pre-wrap">{dumas.keterangan}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: ANALISIS AI ── */}
        <TabsContent value="analisis-ai" className="space-y-4">
          {!hasAIContext ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Analisis AI Belum Tersedia</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Dumas ini belum dianalisis oleh AI. Buat Dumas baru dengan fitur AI Analyzer untuk mendapatkan ekstraksi SIADIDEMENBABI otomatis.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* SIADIDEMENBABI Cards */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-6 shadow-xl">
                {/* Animated background orbs */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-400/30">
                      <Sparkles className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">Analisis AI — SIADIDEMENBABI</h2>
                      <p className="text-violet-300/70 text-xs">Diekstrak oleh Gemini AI · {dumas.no_dumas}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SIADIDEMEN_CONFIG.map(({ key, label, desc, icon: Icon, color }) => {
                      const value = dumas.context_ai[key] || '-'
                      return (
                        <div
                          key={key}
                          className="group relative rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 hover:border-white/20 hover:shadow-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white/60 tracking-widest uppercase">{label}</span>
                                <span className="text-xs text-white/30">·</span>
                                <span className="text-xs text-white/40">{desc}</span>
                              </div>
                              <p className="text-sm text-white/90 leading-relaxed font-medium">
                                {value === '-' ? <span className="text-white/30 italic">Tidak ditemukan</span> : value}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </div>

                  {/* SOP Analysis Sections (Analisis Singkat & Saran) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Analisis Singkat</h3>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed italic">
                        "{dumas.context_ai?.analisis_singkat || 'AI belum memberikan analisis singkat untuk perkara ini.'}"
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Saran Tindak Lanjut</h3>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {dumas.context_ai?.saran || 'AI belum memberikan saran tindak lanjut.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate UUK Section */}
              <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-violet-900">
                    <FileText className="h-5 w-5 text-violet-600" />
                    Generate Dokumen UUK
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Data AI yang sudah diekstrak dapat langsung digunakan untuk membuat dokumen
                    <strong className="text-violet-700"> Unsur-Unsur Utama Keterangan (UUK)</strong> secara otomatis.
                  </p>

                  {/* UUK Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-violet-800">No. Pol UUK</Label>
                      <Input
                        placeholder="Contoh: R/UUK/174/X/HUK.12.10./2023/Paminal"
                        value={uukData.nomor_uuk || ''}
                        onChange={e => setUukData(p => ({ ...p, nomor_uuk: e.target.value }))}
                        className="border-violet-200 focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-violet-800">Unit</Label>
                      <Input
                        placeholder="Contoh: Unit Opsnal III"
                        value={uukData.unit || dumas.unit_name || ''}
                        onChange={e => setUukData(p => ({ ...p, unit: e.target.value }))}
                        className="border-violet-200 focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-violet-800">Masalah</Label>
                      <Input
                        value={uukData.masalah || dumas.context_ai?.apa || ''}
                        onChange={e => setUukData(p => ({ ...p, masalah: e.target.value }))}
                        className="border-violet-200 focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-violet-800">Sasaran</Label>
                      <Input
                        value={uukData.sasaran || dumas.context_ai?.siapa || ''}
                        onChange={e => setUukData(p => ({ ...p, sasaran: e.target.value }))}
                        className="border-violet-200 focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-violet-800">Periode</Label>
                      <Input
                        placeholder="Contoh: Oktober 2023"
                        value={uukData.periode || ''}
                        onChange={e => setUukData(p => ({ ...p, periode: e.target.value }))}
                        className="border-violet-200 focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-violet-800">Nama Kasubbid Paminal</Label>
                      <Input
                        placeholder="Nama pejabat TTD"
                        value={uukData.nama_kasubbid || ''}
                        onChange={e => setUukData(p => ({ ...p, nama_kasubbid: e.target.value }))}
                        className="border-violet-200 focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleGenerateUUK}
                      disabled={generatingUUK}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                    >
                      {generatingUUK ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate UUK
                        </>
                      )}
                    </Button>

                    {uukGenerated && (
                      <Button
                        variant="outline"
                        onClick={handleDownloadUUK}
                        className="border-violet-300 text-violet-700 hover:bg-violet-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Cetak / Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* UUK Preview */}
              {showUUKPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Pratinjau Dokumen UUK
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div id="uuk-preview-content" className="overflow-x-auto">
                      <UUKPreview data={uukData} dumasNoDumas={dumas.no_dumas} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── TAB: TINDAK LANJUT ── */}
        <TabsContent value="tindak-lanjut" className="space-y-4">
          {tindakLanjut.catatan_revisi && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600">Catatan Revisi</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{tindakLanjut.catatan_revisi}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Form Tindak Lanjut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal UUK</Label>
                  <Input
                    type="date"
                    value={tindakLanjut.tgl_uuk || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_uuk: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No UUK</Label>
                  <Input
                    value={tindakLanjut.no_uuk || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_uuk: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal SPRIN</Label>
                  <Input
                    type="date"
                    value={tindakLanjut.tgl_sprin_lidik || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_sprin_lidik: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No SPRIN</Label>
                  <Input
                    value={tindakLanjut.no_sprin || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_sprin: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal LHP</Label>
                  <Input
                    type="date"
                    value={tindakLanjut.tgl_lhp || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_lhp: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No LHP</Label>
                  <Input
                    value={tindakLanjut.no_lhp || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_lhp: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hasil Lidik</Label>
                <Select
                  value={tindakLanjut.hasil_lidik || ''}
                  onValueChange={(value) => setTindakLanjut({ ...tindakLanjut, hasil_lidik: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hasil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbukti">Terbukti</SelectItem>
                    <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                    <SelectItem value="dihentikan">Dihentikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tindakLanjut.hasil_lidik === 'terbukti' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>No Nodin</Label>
                    <Input
                      value={tindakLanjut.no_nodin || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_nodin: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No Berkas</Label>
                    <Input
                      value={tindakLanjut.no_berkas || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_berkas: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}

              {tindakLanjut.hasil_lidik === 'tidak_terbukti' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Tanggal SP2HP2</Label>
                    <Input
                      type="date"
                      value={tindakLanjut.tgl_sp2hp2 || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_sp2hp2: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No SP2HP2</Label>
                    <Input
                      value={tindakLanjut.no_sp2hp2 || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_sp2hp2: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveTindakLanjut} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  {tindakLanjut.status_verifikasi === 'draft' && (
                    <Button variant="secondary" onClick={handleSubmitVerification}>
                      <Send className="h-4 w-4 mr-2" />
                      Ajukan Verifikasi
                    </Button>
                  )}
                </div>
              )}

              {canApprove && tindakLanjut.status_verifikasi === 'menunggu_verifikasi' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApproval('approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const catatan = prompt('Catatan revisi:')
                      if (catatan) handleApproval('reject', catatan)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Minta Revisi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
