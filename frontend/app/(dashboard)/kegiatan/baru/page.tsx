'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Users, Calendar, MapPin, FileText, AlertTriangle,
  CheckCircle, ClipboardList, Link2, DollarSign
} from 'lucide-react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────
type Anggota = {
  id: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
}

type Dumas = {
  id: string
  no_dumas: string
  terlapor: string
  wujud_perbuatan: string
  context_ai: any
}

// ── SPRIN Preview Component ──────────────────────────────────────────────────
function SprinPreview({
  nomor_sprin, tgl_sprin, tgl_mulai, tgl_selesai,
  tujuan, dasar_giat, tempat_tujuan, personel, ketuaId
}: any) {
  const sorted = [...personel].sort((a: any, b: any) => {
    if (a.id === ketuaId) return -1
    if (b.id === ketuaId) return 1
    return 0
  })
  const now = new Date()
  const bulanRomawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
  const d = tgl_sprin ? new Date(tgl_sprin) : now
  const bulan = bulanRomawi[d.getMonth()]
  const tahun = d.getFullYear()
  const formatTgl = (s: string) => {
    if (!s) return '...'
    return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="bg-white text-black font-serif text-[10.5pt] p-6 border border-gray-300 shadow-sm" style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <div className="font-bold text-[12pt]">KEPOLISIAN NEGARA REPUBLIK INDONESIA</div>
        <div className="font-bold text-[12pt]">DAERAH JAWA BARAT</div>
        <div className="font-bold">BIDANG PROFESI DAN PENGAMANAN</div>
      </div>

      <div className="text-center my-4">
        <div className="font-bold text-[13pt] tracking-widest">SURAT PERINTAH</div>
        <div className="text-[11pt]">
          Nomor: {nomor_sprin || `Sprin/     /${bulan}/HUK.6.6./${tahun}`}
        </div>
      </div>

      <p className="mb-2">
        <span className="font-semibold">Pertimbangan  :</span> Bahwa untuk kepentingan dinas Kepolisian Daerah Jawa Barat maka dipandang perlu mengeluarkan Surat Perintah ini.
      </p>
      <p className="mb-4">
        <span className="font-semibold">Dasar         :</span> {dasar_giat || 'Rencana Kegiatan Bidpropam Polda Jabar'}
      </p>

      <div className="text-center font-bold my-3 tracking-widest">DIPERINTAHKAN</div>
      <p className="font-semibold">Kepada :</p>
      <ol className="list-none ml-8 mb-4">
        {sorted.map((p: any, i: number) => (
          <li key={p.id}>
            {i + 1}. {p.pangkat?.toUpperCase()} {p.nama?.toUpperCase()} NRP. {p.nrp}
            {p.id === ketuaId && <span className="ml-2 text-xs font-bold text-blue-600">(Ketua Tim)</span>}
          </li>
        ))}
        {sorted.length === 0 && <li className="text-gray-400 italic">— pilih personel —</li>}
      </ol>

      <p className="font-semibold">Untuk :</p>
      <ol className="list-none ml-8 mb-4">
        <li>1. {tujuan || '(belum diisi)'}</li>
        <li>2. waktu tanggal {tgl_mulai ? new Date(tgl_mulai).getDate() : '...'} s.d. {tgl_selesai ? new Date(tgl_selesai).getDate() : '...'} {tgl_mulai ? new Date(tgl_mulai).toLocaleDateString('id-ID', { month: 'long' }) : '...'} {tahun}</li>
        <li>3. menggunakan kendaraan umum/dinas</li>
        <li>4. melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab</li>
        <li>5. sesudah melaksanakan perintah ini melaporkan hasilnya ke Kabid Propam Polda Jabar</li>
      </ol>

      <p className="mb-6">Selesai.</p>

      <div className="flex justify-between text-[10.5pt]">
        <div />
        <div>
          <p>Dikeluarkan di : Bandung</p>
          <p>pada tanggal  : {tgl_sprin ? formatTgl(tgl_sprin) : `       ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}</p>
          <br />
          <p className="font-bold">KABIDPROPAM POLDA JABAR</p>
          <br /><br /><br />
          <p className="font-bold">.................................</p>
          <p>.......... NRP ..........</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KegiatanBaruPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Form state
  const [jenisGiat, setJenisGiat] = useState('Penyelidikan Paminal Dalam Kota')
  const [lokasi, setLokasi] = useState('DK')
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [tglSprin, setTglSprin] = useState('')
  const [nomorSprin, setNomorSprin] = useState('')
  const [tujuan, setTujuan] = useState('')
  const [dasarGiat, setDasarGiat] = useState('')
  const [tempatTujuan, setTempatTujuan] = useState('')
  const [linkedDumasId, setLinkedDumasId] = useState<string | null>(null)
  const [idDipa, setIdDipa] = useState<string | null>(null)

  // Personnel
  const [anggota, setAnggota] = useState<Anggota[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [ketuaId, setKetuaId] = useState<string | null>(null)
  const [anggotaSearch, setAnggotaSearch] = useState('')

  // Dumas link
  const [dumasList, setDumasList] = useState<Dumas[]>([])
  const [linkedDumas, setLinkedDumas] = useState<Dumas | null>(null)
  const [dipaList, setDipaList] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    fetchAnggota()
    fetchActiveDumas()
    fetchDipaList()
  }, [])

  const fetchAnggota = async () => {
    const { data } = await supabase
      .from('anggota')
      .select('id, nama, pangkat, nrp, jabatan')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('pangkat')
    if (data) setAnggota(data)
  }

  const fetchActiveDumas = async () => {
    const { data } = await supabase
      .from('dumas')
      .select('id, no_dumas, terlapor, wujud_perbuatan, context_ai')
      .is('deleted_at', null)
      .eq('status', 'dalam_proses')
      .order('created_at', { ascending: false })
    if (data) setDumasList(data)
  }

  const fetchDipaList = async () => {
    const { data } = await supabase
      .from('master_dipa')
      .select('*')
      .order('jenis_giat')
    if (data) setDipaList(data)
  }

  const selectedAnggota = useMemo(() => {
    return anggota.filter(a => selected.includes(a.id))
  }, [anggota, selected])

  useEffect(() => {
    if (selectedAnggota.length > 0 && !ketuaId) {
      setKetuaId(selectedAnggota[0].id)
    }
    if (selectedAnggota.length === 0) setKetuaId(null)
  }, [selectedAnggota])

  // Auto-fill from linked Dumas AI context
  useEffect(() => {
    if (!linkedDumas?.context_ai || linkedDumas.context_ai.error) return
    const ctx = linkedDumas.context_ai
    if (ctx.tujuan) setTujuan(ctx.tujuan)
    if (ctx.dimana) setTempatTujuan(ctx.dimana)
    if (ctx.dasar) setDasarGiat(ctx.dasar)
  }, [linkedDumas])

  // Auto-fill from selected DIPA
  useEffect(() => {
    if (idDipa) {
      const dipa = dipaList.find(d => d.id === idDipa)
      if (dipa) {
        setJenisGiat(dipa.jenis_giat)
        setDasarGiat(`Rencana Kegiatan Bidpropam Polda Jabar T.A. 2026 (Pagu: ${dipa.jenis_giat})`)
      }
    }
  }, [idDipa, dipaList])

  const filteredAnggota = useMemo(() => {
    if (!anggotaSearch) return anggota
    return anggota.filter(a =>
      a.nama.toLowerCase().includes(anggotaSearch.toLowerCase()) ||
      a.nrp.includes(anggotaSearch)
    )
  }, [anggota, anggotaSearch])

  const validate = (): string | null => {
    if (!tglMulai || !tglSelesai) return 'Tanggal mulai dan selesai wajib diisi'
    if (tglSelesai < tglMulai) return 'Tanggal selesai tidak boleh sebelum tanggal mulai'
    if (!tujuan.trim()) return 'Tujuan kegiatan wajib diisi'
    if (selected.length === 0) return 'Minimal 1 personel harus dipilih'
    if (!ketuaId) return 'Ketua tim harus dipilih'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setIsSubmitting(true)

    try {
      const personelList = selected.map(pid => ({
        id_personel: pid,
        is_ketua_tim: pid === ketuaId
      }))

      const { data: newId, error: rpcErr } = await supabase.rpc('upsert_kegiatan_with_personel', {
        p_id: null,
        p_jenis_giat: jenisGiat,
        p_lokasi: lokasi,
        p_tgl_mulai: tglMulai,
        p_tgl_selesai: tglSelesai,
        p_tgl_sprin: tglSprin || null,
        p_nomor_sprin: nomorSprin || null,
        p_tempat_tujuan: tempatTujuan,
        p_tujuan: tujuan,
        p_dasar_giat: dasarGiat,
        p_status: 'selesai',
        p_personel_list: personelList,
        p_dumas_id: linkedDumasId || null,
        p_id_dipa: idDipa || null,
      })

      if (rpcErr || !newId) throw new Error(rpcErr?.message || 'Gagal menyimpan')

      toast.success('Kegiatan berhasil dibuat!')
      router.push('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              Kegiatan Baru
            </h1>
            <p className="text-muted-foreground mt-1">
              Catat kegiatan operasional Paminal — tersedia untuk semua unit
            </p>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Operasional SPRIN
          </Badge>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── LEFT: Form ── */}
        <div className="space-y-5">
          {/* Link ke Dumas */}
          <Card className="border-violet-100 bg-violet-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Hubungkan dengan Dumas (Opsional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="flex h-10 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                value={linkedDumasId || ''}
                onChange={e => {
                  const val = e.target.value
                  setLinkedDumasId(val || null)
                  setLinkedDumas(val ? dumasList.find(d => d.id === val) || null : null)
                }}
              >
                <option value="">— Tidak dihubungkan —</option>
                {dumasList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.no_dumas} — {d.terlapor}
                  </option>
                ))}
              </select>
              {linkedDumas?.context_ai && !linkedDumas.context_ai.error && (
                <div className="text-xs text-violet-700 bg-violet-100 rounded-lg px-3 py-2">
                  ✨ Data AI dari Dumas <strong>{linkedDumas.no_dumas}</strong> akan otomatis mengisi beberapa kolom
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sumber Anggaran (DIPA) */}
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Sumber Anggaran DIPA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                value={idDipa || ''}
                onChange={e => setIdDipa(e.target.value || null)}
              >
                <option value="">— Tidak menggunakan DIPA (Opsional) —</option>
                {dipaList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.jenis_giat} (Pagu: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.pagu_anggaran)})
                  </option>
                ))}
              </select>
              {idDipa && (
                <div className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Kegiatan ini akan ditagihkan ke pos <strong>{dipaList.find(d => d.id === idDipa)?.jenis_giat}</strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jenis & Lokasi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Detail Kegiatan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Jenis Kegiatan</Label>
                  <Input
                    value={jenisGiat}
                    onChange={e => setJenisGiat(e.target.value)}
                    placeholder="Contoh: Penyelidikan Paminal Dalam Kota"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Lokasi</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={lokasi}
                    onChange={e => setLokasi(e.target.value)}
                  >
                    <option value="DK">Dalam Kota (DK)</option>
                    <option value="LK">Luar Kota (LK)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tanggal Mulai</Label>
                  <Input type="date" value={tglMulai} onChange={e => setTglMulai(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tanggal Selesai</Label>
                  <Input type="date" value={tglSelesai} onChange={e => setTglSelesai(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tanggal SPRIN</Label>
                  <Input type="date" value={tglSprin} onChange={e => setTglSprin(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nomor SPRIN</Label>
                  <Input
                    value={nomorSprin}
                    onChange={e => setNomorSprin(e.target.value)}
                    placeholder="Sprin/     /I/HUK.6.6./2026"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tempat Tujuan</Label>
                <Input
                  value={tempatTujuan}
                  onChange={e => setTempatTujuan(e.target.value)}
                  placeholder="Contoh: Polres Cimahi, Polres Majalengka"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tujuan / Uraian Kegiatan</Label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                  value={tujuan}
                  onChange={e => setTujuan(e.target.value)}
                  placeholder="Melaksanakan Penyelidikan Paminal ke wilayah..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Dasar Kegiatan</Label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                  value={dasarGiat}
                  onChange={e => setDasarGiat(e.target.value)}
                  placeholder="Rencana Kegiatan Bidpropam Polda Jabar T.A. 2026"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Pilih Personel ({selected.length} dipilih)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Cari nama atau NRP..."
                value={anggotaSearch}
                onChange={e => setAnggotaSearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredAnggota.map(a => {
                  const isSelected = selected.includes(a.id)
                  const isKetua = ketuaId === a.id
                  return (
                    <label
                      key={a.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelected(prev => [...prev, a.id])
                          } else {
                            setSelected(prev => prev.filter(id => id !== a.id))
                            if (ketuaId === a.id) setKetuaId(null)
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.nama}</p>
                        <p className="text-xs text-slate-500">{a.pangkat} · {a.nrp}</p>
                      </div>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setKetuaId(a.id) }}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isKetua ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                        >
                          {isKetua ? '✓ Ketua' : 'Set Ketua'}
                        </button>
                      )}
                    </label>
                  )
                })}
                {filteredAnggota.length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-400 text-center">Tidak ada personel ditemukan</div>
                )}
              </div>

              {/* Selected summary */}
              {selectedAnggota.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAnggota.map(a => (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${ketuaId === a.id ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                      {a.pangkat} {a.nama}
                      {ketuaId === a.id && <span className="font-bold">(Ketua)</span>}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Simpan Kegiatan
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
          </div>
        </div>

        {/* ── RIGHT: SPRIN Preview ── */}
        <div className="hidden xl:block">
          <div className="sticky top-24">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Pratinjau SPRIN
              </h3>
              <Badge variant="outline" className="text-xs">Live Preview</Badge>
            </div>
            <div className="overflow-y-auto max-h-[75vh] border border-slate-200 rounded-xl shadow-sm">
              <SprinPreview
                nomor_sprin={nomorSprin}
                tgl_sprin={tglSprin}
                tgl_mulai={tglMulai}
                tgl_selesai={tglSelesai}
                tujuan={tujuan}
                dasar_giat={dasarGiat}
                tempat_tujuan={tempatTujuan}
                personel={selectedAnggota}
                ketuaId={ketuaId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
