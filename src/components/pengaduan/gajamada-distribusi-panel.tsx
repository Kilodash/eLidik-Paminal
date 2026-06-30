'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchGajamadaUnitOptionsAction, terimaDanDistribusikanGajamadaAction } from '@/app/(dashboard)/pengaduan/actions'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface PengaduanRow {
  id: string
  nomor_register: string | null
  jenis: string
  pelapor_nama: string | null
  pelapor_kontak?: string | null
  pelapor_email?: string | null
  pelapor_nik?: string | null
  satker_dilaporkan: string | null
  kronologi: string | null
  kronologi_lengkap?: string | null
  status: string
  gajamada_id?: string | null
  gajamada_status?: string | null
  gajamada_case_position?: string | null
  gajamada_unit_tujuan?: string | null
  gajamada_polda?: string | null
  tgl_disposisi_kasubbid?: string | null
  unit_id?: string | null
  disposisi_kasubbid_catatan?: string | null
  unit?: { nama: string } | null
  pengaduan_terlapor?: { terlapor: { nama: string; pangkat?: string | null; nrp?: string | null; jabatan?: string | null; kesatuan?: string | null } }[]
}

interface Props {
  pengaduan: PengaduanRow | null
  ids: string[]
  currentId?: string
  baseParams: string
  page: number
  hasNextPage: boolean
}

export function GajamadaDistribusiPanel({ pengaduan, ids, currentId, baseParams, page, hasNextPage }: Props) {
  const router = useRouter()
  const [units, setUnits] = useState<{ unit: string; sub_function: string }[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState('')
  const [note, setNote] = useState('')
  const [tglDisposisi, setTglDisposisi] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingUnits(true)
    fetchGajamadaUnitOptionsAction('SUBBID PAMINAL')
      .then((res) => {
        if (res.data) setUnits(res.data)
        else if (res.error) toast.error(res.error)
      })
      .catch(() => toast.error('Gagal memuat unit'))
      .finally(() => setLoadingUnits(false))
  }, [])

  if (!pengaduan) {
    return (
      <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-20 border border-dashed rounded-lg">
        <p>Silakan pilih pengaduan dari Tabel Dumas</p>
        <p className="mt-1">untuk membuka Distribusi.</p>
      </div>
    )
  }

  const terlaporArr = pengaduan.pengaduan_terlapor || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnit || !note.trim() || !tglDisposisi) return

    setIsSubmitting(true)
    try {
      const res = await terimaDanDistribusikanGajamadaAction(
        pengaduan.id,
        selectedUnit,
        note.trim(),
        tglDisposisi.toISOString().split('T')[0],
      )
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.message || 'Laporan berhasil didistribusikan')
        setSelectedUnit('')
        setNote('')
        setTglDisposisi(new Date())
        router.refresh()
      }
    } catch {
      toast.error('Gagal distribusi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentIndex = ids.indexOf(currentId || '')
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null
  const nextId = currentIndex < ids.length - 1 ? ids[currentIndex + 1] : (hasNextPage ? '_next' : null)

  const navigateTo = (id: string) => {
    if (id === '_next') {
      const params = new URLSearchParams(baseParams)
      params.set('tab', 'distribusi')
      params.set('page', String(page + 1))
      params.set('edit', '_first')
      router.push(`/pengaduan?${params.toString()}`)
    } else {
      const params = new URLSearchParams(baseParams)
      params.set('tab', 'distribusi')
      params.set('edit', id)
      router.push(`/pengaduan?${params.toString()}`)
    }
  }

  const sudahDistribusi = !!(pengaduan.gajamada_unit_tujuan || pengaduan.unit_id)

  return (
    <div className="space-y-4 flex-1 overflow-y-auto p-4">
      {/* Navigasi */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!prevId}
            onClick={() => prevId && navigateTo(prevId)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {ids.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!nextId}
            onClick={() => nextId && navigateTo(nextId)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.refresh()}
          title="Refresh"
          className="h-7 gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">No. Register</span><span className="font-mono font-bold">{pengaduan.nomor_register || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Jenis</span><span>{pengaduan.jenis}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status Gajamada</span><Badge variant="outline">{pengaduan.gajamada_status || '-'}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Posisi Kasus</span><span className="font-medium">{pengaduan.gajamada_case_position || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Polda</span><span>{pengaduan.gajamada_polda || '-'}</span></div>
            {sudahDistribusi && (
              <div className="flex justify-between"><span className="text-muted-foreground">Unit Tujuan</span><span className="font-medium text-primary">{pengaduan.gajamada_unit_tujuan || pengaduan.unit?.nama || '-'}</span></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pelapor</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">{pengaduan.pelapor_nama || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Kontak</span><span>{pengaduan.pelapor_kontak || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{pengaduan.pelapor_email || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">NIK</span><span className="font-mono text-xs">{pengaduan.pelapor_nik || '-'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Terlapor</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {terlaporArr.length === 0 ? (
              <span className="text-sm text-muted-foreground">-</span>
            ) : (
              terlaporArr.map((t, i) => {
                const tl = t.terlapor
                return (
                  <div key={i} className="text-sm border rounded p-2 space-y-0.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">{tl.nama || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pangkat/NRP</span><span>{(tl.pangkat || '-') + ' / ' + (tl.nrp || '-')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Jabatan</span><span>{tl.jabatan || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Kesatuan</span><span>{tl.kesatuan || '-'}</span></div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Kronologi</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap text-justify">
            {pengaduan.kronologi_lengkap || pengaduan.kronologi || '-'}
          </CardContent>
        </Card>
      </div>

      {/* Form Distribusi */}
      {!sudahDistribusi && (
        <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-card">
          <h3 className="font-bold text-sm">Disposisi Kasubbid Paminal</h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal Disposisi *</Label>
            <DatePicker
              name="tgl_disposisi"
              required
              value={tglDisposisi}
              onChange={setTglDisposisi}
              className="w-full h-8"
              placeholder="Pilih tanggal"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Unit/UR Tujuan *</Label>
            {loadingUnits ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-8">
                <RefreshCw className="h-3 w-3 animate-spin" /> Memuat unit...
              </div>
            ) : (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                required
                className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Pilih unit/UR...</option>
                {units.map((u) => (
                  <option key={u.unit} value={u.unit}>
                    {u.unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Isi Disposisi *</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              minLength={3}
              placeholder="Isi catatan disposisi..."
              className="min-h-[80px] resize-y"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-9">
            {isSubmitting ? 'Memproses...' : 'Terima & Distribusikan'}
          </Button>
        </form>
      )}

      {sudahDistribusi && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hasil Distribusi</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span>{pengaduan.tgl_disposisi_kasubbid || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Unit Tujuan</span><span className="font-medium">{pengaduan.gajamada_unit_tujuan || pengaduan.unit?.nama || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Catatan</span><span>{pengaduan.disposisi_kasubbid_catatan || '-'}</span></div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
