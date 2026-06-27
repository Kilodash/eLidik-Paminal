'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { Search, GitMerge, Trash2, Unlink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Handshake, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatNameCase } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import {
  deletePengaduanAction,
  mergePengaduanAction,
  splitPengaduanAction,
  getActiveBerkasListAction,
  submitPerdamaianAction,
  generateSingleDocumentAction,
} from '@/app/(dashboard)/pengaduan/actions'

type PengaduanRow = {
  id: string
  nomor_register: string | null
  jenis: string
  pelapor_nama: string | null
  pengaduan_terlapor?: { terlapor: { nama: string; pangkat?: string | null; nrp?: string | null; jabatan?: string | null; kesatuan?: string | null } }[]
  kronologi: string | null
  kronologi_lengkap?: string | null
  satker_dilaporkan: string | null
  klasifikasi?: unknown
  unit?: unknown
  status: string
  tgl_pengaduan: string | null
  berkas?: { id: string; nomor_berkas: string } | null
  atensi: boolean
}

interface Props {
  data: PengaduanRow[]
  total: number
  page: number
  query?: string
  userRole: string
  userId: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function PengaduanTable({ data, total, page, query = '', userRole, userId, sortBy = 'created_at', sortOrder = 'desc' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localQuery, setLocalQuery] = useState(query)

  // State for Modals
  const [activeBerkas, setActiveBerkas] = useState<{ id: string; nomor_berkas: string; judul: string }[]>([])
  const [selectedRow, setSelectedRow] = useState<PengaduanRow | null>(null)
  const [alasanHapus, setAlasanHapus] = useState('')
  const [selectedBerkasId, setSelectedBerkasId] = useState('')

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isMergeOpen, setIsMergeOpen] = useState(false)
  const [isSplitOpen, setIsSplitOpen] = useState(false)
  const [isPerdamaianOpen, setIsPerdamaianOpen] = useState(false)
  const [syaratPerdamaian, setSyaratPerdamaian] = useState({
    materil_keresahan: false,
    materil_konflik: false,
    materil_tidak_keberatan: false,
    materil_mensrea: false,
    materil_bukan_residivis: false,
    formil_permohonan: false,
    formil_pernyataan: false,
    formil_pencabutan: false,
    formil_bap_tambahan: false,
    sebelum_pencabutan_diteliti: false,
    sebelum_klarifikasi_pencabutan: false,
  })
  const [tindakLanjutDocs, setTindakLanjutDocs] = useState({
    undangan_klarifikasi: false,
    ba_klarifikasi: false,
    lhp_klarifikasi: false,
    nd_penutupan: false,
    nd_gelar: false,
    lhp_gelar: false,
    sprin_henti: false,
    nd_ankum: false,
    sp2hp: false,
    ba_pemeriksaan_tambahan: false,
    nd_saran_penghentian: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [perdamaianDate, setPerdamaianDate] = useState<Date | undefined>(undefined)
  const [pihakHadir, setPihakHadir] = useState('pelapor, terlapor, saksi')
  const [kronologi, setKronologi] = useState('')

  const [tahapSaatDamai, setTahapSaatDamai] = useState<'Perdamaian Sebelum Penyelidikan' | 'Perdamaian Setelah Penyelidikan'>('Perdamaian Sebelum Penyelidikan')

  useEffect(() => {
    if (isPerdamaianOpen && selectedRow) {
      const isSetelahLidik = selectedRow.berkas || 
        !['diterima', 'registrasi', 'verifikasi', 'disposisi'].includes(selectedRow.status);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTahapSaatDamai(isSetelahLidik ? 'Perdamaian Setelah Penyelidikan' : 'Perdamaian Sebelum Penyelidikan');
    }
  }, [isPerdamaianOpen, selectedRow])

  useEffect(() => {
    if (!isPerdamaianOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPerdamaianDate(undefined)
      setPihakHadir('pelapor, terlapor, saksi')
      setKronologi('')
      setSyaratPerdamaian({
        materil_keresahan: false,
        materil_konflik: false,
        materil_tidak_keberatan: false,
        materil_mensrea: false,
        materil_bukan_residivis: false,
        formil_permohonan: false,
        formil_pernyataan: false,
        formil_pencabutan: false,
        formil_bap_tambahan: false,
        sebelum_pencabutan_diteliti: false,
        sebelum_klarifikasi_pencabutan: false,
      })
      setTindakLanjutDocs({
        undangan_klarifikasi: false,
        ba_klarifikasi: false,
        lhp_klarifikasi: false,
        nd_penutupan: false,
        nd_gelar: false,
        lhp_gelar: false,
        sprin_henti: false,
        nd_ankum: false,
        sp2hp: false,
        ba_pemeriksaan_tambahan: false,
        nd_saran_penghentian: false,
      })
    }
  }, [isPerdamaianOpen])

  const handleSyaratClick = (key: keyof typeof syaratPerdamaian, e: React.MouseEvent<HTMLElement>): void => {
    if (e.ctrlKey) {
      e.preventDefault()
      const nextValue = !syaratPerdamaian[key]
      setSyaratPerdamaian({
        materil_keresahan: nextValue,
        materil_konflik: nextValue,
        materil_tidak_keberatan: nextValue,
        materil_mensrea: nextValue,
        materil_bukan_residivis: nextValue,
        formil_permohonan: nextValue,
        formil_pernyataan: nextValue,
        formil_pencabutan: nextValue,
        formil_bap_tambahan: nextValue,
        sebelum_pencabutan_diteliti: nextValue,
        sebelum_klarifikasi_pencabutan: nextValue,
      })
    }
  }

  const handleDocClick = (key: keyof typeof tindakLanjutDocs, e: React.MouseEvent<HTMLElement>): void => {
    if (e.ctrlKey) {
      e.preventDefault()
      const nextValue = !tindakLanjutDocs[key]
      setTindakLanjutDocs({
        undangan_klarifikasi: nextValue,
        ba_klarifikasi: nextValue,
        lhp_klarifikasi: nextValue,
        nd_penutupan: nextValue,
        nd_gelar: nextValue,
        lhp_gelar: nextValue,
        sprin_henti: nextValue,
        nd_ankum: nextValue,
        sp2hp: nextValue,
        ba_pemeriksaan_tambahan: nextValue,
        nd_saran_penghentian: nextValue,
      })
    }
  }

  const openMergeModal = async (row: PengaduanRow) => {
    setSelectedRow(row)
    setIsMergeOpen(true)
    const res = await getActiveBerkasListAction()
    if (res.data) {
      setActiveBerkas(res.data)
    }
  }

  const handleDelete = async () => {
    if (!selectedRow || !alasanHapus.trim()) return
    setIsSubmitting(true)
    const res = await deletePengaduanAction(selectedRow.id, alasanHapus, userId)
    setIsSubmitting(false)
    if (res.success) {
      setIsDeleteOpen(false)
      setAlasanHapus('')
      setSelectedRow(null)
      router.refresh()
    } else {
      alert(res.error || 'Gagal membatalkan dumas')
    }
  }

  const handleMerge = async () => {
    if (!selectedRow || !selectedBerkasId) return
    setIsSubmitting(true)
    const res = await mergePengaduanAction(selectedBerkasId, selectedRow.id)
    setIsSubmitting(false)
    if (res.success) {
      setIsMergeOpen(false)
      setSelectedBerkasId('')
      setSelectedRow(null)
      router.refresh()
    } else {
      alert(res.error || 'Gagal menggabungkan dumas')
    }
  }

  const handleSplit = async () => {
    if (!selectedRow) return
    setIsSubmitting(true)
    const res = await splitPengaduanAction(selectedRow.id)
    setIsSubmitting(false)
    if (res.success) {
      setIsSplitOpen(false)
      setSelectedRow(null)
      router.refresh()
    } else {
      alert(res.error || 'Gagal memisahkan dumas')
    }
  }

  const handlePerdamaian = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRow) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set('tahap_saat_damai', tahapSaatDamai)
    formData.set('tindak_lanjut_docs', JSON.stringify(tindakLanjutDocs))
    const res = await submitPerdamaianAction(selectedRow.id, formData)
    setIsSubmitting(false)
    if (res.success) {
      setIsPerdamaianOpen(false)
      setSelectedRow(null)
      router.refresh()
    } else {
      alert(res.error || 'Gagal mengajukan perdamaian')
    }
  }

  const handleGenerateSingleDoc = async (docKode: string, docNama: string, key: keyof typeof tindakLanjutDocs) => {
    if (!selectedRow) return
    setIsSubmitting(true)
    const res = await generateSingleDocumentAction(selectedRow.id, docKode, docNama)
    setIsSubmitting(false)
    if (res.success) {
      setTindakLanjutDocs(prev => ({ ...prev, [key]: true }))
      alert(res.message || `Dokumen ${docNama} berhasil dibuat!`)
    } else {
      alert(res.error || 'Gagal membuat dokumen')
    }
  }

  const executeSearch = () => {
    const params = new URLSearchParams(window.location.search)
    if (localQuery) params.set('q', localQuery)
    else params.delete('q')
    params.set('page', '1')
    router.push(`/pengaduan?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', newPage.toString())
    router.push(`/pengaduan?${params.toString()}`)
  }

  const columns: ColumnDef<PengaduanRow>[] = [
    {
      id: 'nomor_urut',
      header: 'No',
      cell: ({ row }) => {
        const offset = (page - 1) * 20
        return (
          <div className="flex flex-col gap-1 w-8">
            <span className="font-medium">{offset + row.index + 1}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'jenis',
      header: 'Jenis',
      cell: ({ row }) => (
        <span className="font-medium whitespace-normal max-w-[100px] block leading-tight">{row.original.jenis}</span>
      ),
    },
    {
      accessorKey: 'tgl_pengaduan',
      header: () => {
        const nextOrder = sortBy === 'tgl_pengaduan' && sortOrder === 'desc' ? 'asc' : 'desc'
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', 'tgl_pengaduan')
        params.set('order', nextOrder)
        params.set('page', '1')
        return (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/pengaduan?${params.toString()}`)
            }}
          >
            Tanggal
            {sortBy === 'tgl_pengaduan' ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
        )
      },
      cell: ({ row }) => <div className="text-center whitespace-nowrap w-[80px]">{row.original.tgl_pengaduan || '-'}</div>,
    },
    {
      accessorKey: 'pelapor_nama',
      header: 'Pelapor',
      cell: ({ row }) => <span className="whitespace-normal block max-w-[120px]">{formatNameCase(row.original.pelapor_nama) || 'Anonim'}</span>,
    },
    {
      id: 'terlapor',
      header: 'Terlapor',
      cell: ({ row }) => {
        const terlaporArr = row.original.pengaduan_terlapor || []
        if (terlaporArr.length === 0) return <span>-</span>
        return (
          <div className="flex flex-col gap-0.5 whitespace-normal max-w-[200px]">
            {terlaporArr.map((t, i) => {
              const tl = t.terlapor
              const pangkat = tl?.pangkat?.trim() || ''
              const nama = tl?.nama?.trim()
              const nrp = tl?.nrp?.trim() || ''
              const jabatan = tl?.jabatan?.trim() || ''
              const kesatuan = tl?.kesatuan?.trim() || ''

              const parts: string[] = []
              if (pangkat) parts.push(pangkat)
              if (nama && nama !== '-' && nama !== 'Anggota Polri (identitas belum dikenali)') {
                parts.push(nama)
              }
              if (nrp && nrp !== 'xxxxxxxx') parts.push(`nrp ${nrp}`)
              // Combine jabatan + kesatuan
              const lokasi = [jabatan, kesatuan].filter(Boolean).join(', ')
              if (lokasi) parts.push(`jabatan ${lokasi}`)

              const line = parts.join(', ') || 'Anggota'

              return (
                <span key={i} className="font-medium leading-tight text-xs">
                  {line}
                </span>
              )
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'kronologi',
      header: 'Isi Dumas / Kronologis',
      cell: ({ row }) => {
        const [expanded, setExpanded] = useState(false)
        const hasLengkap = !!(row.original.kronologi_lengkap && row.original.kronologi_lengkap !== row.original.kronologi)
        return (
          <div className="flex flex-col gap-1.5 w-full min-w-[250px]">
            <div className="whitespace-pre-wrap text-justify">
              {row.original.kronologi || '-'}
            </div>
            {hasLengkap && (
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline self-start"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              >
                {expanded ? 'Sembunyikan lengkap' : 'Lihat kronologi asli'}
              </button>
            )}
            {expanded && hasLengkap && (
              <div className="whitespace-pre-wrap text-justify text-muted-foreground text-xs border-t pt-1 mt-1">
                {row.original.kronologi_lengkap}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <span className="whitespace-nowrap w-[60px] block">{(row.original.unit as { nama: string })?.nama || '-'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex flex-col items-center justify-center gap-1.5 whitespace-nowrap w-[100px]">
          {row.original.atensi && (
            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
              <AlertCircle className="w-3 h-3 mr-1" /> Atensi
            </span>
          )}
          <StatusBadge status={row.original.status} />
          {row.original.berkas && (
            <Link
              href={`/berkas/${row.original.berkas.id}`}
              className="text-[10px] text-blue-600 hover:underline font-mono font-bold tracking-tight block"
              title="Lihat Berkas"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.berkas.nomor_berkas}
            </Link>
          )}
        </div>
      ),
    },
    {
      id: 'aksi',
      header: 'Aksi',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">

            {!row.original.berkas ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openMergeModal(row.original)
                }}
                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors font-semibold border border-blue-200"
                title="Gabung Dumas"
              >
                <GitMerge className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRow(row.original)
                  setIsSplitOpen(true)
                }}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors font-semibold border border-amber-200"
                title="Pisahkan dari Berkas"
              >
                <Unlink className="w-4 h-4" />
              </button>
            )}

            {userRole !== 'operator_unit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRow(row.original)
                  setIsDeleteOpen(true)
                }}
                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors font-semibold border border-red-200"
                title="Hapus Dumas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {row.original.status !== 'closed' && row.original.status !== 'perdamaian' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRow(row.original)
                  setIsPerdamaianOpen(true)
                }}
                className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded transition-colors font-semibold border border-teal-200"
                title="Ajukan Perdamaian"
              >
                <Handshake className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  const isSyaratLengkap = syaratPerdamaian.materil_keresahan &&
    syaratPerdamaian.materil_konflik &&
    syaratPerdamaian.materil_tidak_keberatan &&
    syaratPerdamaian.materil_mensrea &&
    syaratPerdamaian.materil_bukan_residivis &&
    syaratPerdamaian.formil_permohonan &&
    syaratPerdamaian.formil_pernyataan &&
    syaratPerdamaian.formil_pencabutan &&
    syaratPerdamaian.formil_bap_tambahan &&
    syaratPerdamaian.sebelum_pencabutan_diteliti &&
    syaratPerdamaian.sebelum_klarifikasi_pencabutan;

  return (
    <div className="space-y-4 flex flex-col flex-1 min-h-0">
      <div className="flex w-full max-w-xs items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor register, pelapor..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeSearch()
            }}
            className="pl-9 h-9"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={executeSearch} className="h-9">
          Cari
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        totalCount={total}
        page={page}
        onPageChange={handlePageChange}
        onRowClick={(row) => router.push(`/pengaduan?edit=${row.id}`)}
        bordered
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan / Hapus Pengaduan</DialogTitle>
            <DialogDescription>
              Tindakan ini akan membatalkan pengaduan aktif. Silakan masukkan alasan pembatalan untuk arsip log audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Alasan Pembatalan *</label>
              <Textarea
                placeholder="Tulis alasan pembatalan..."
                value={alasanHapus}
                onChange={(e) => setAlasanHapus(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || !alasanHapus.trim()}
            >
              {isSubmitting ? 'Memproses...' : 'Ya, Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Modal */}
      <Dialog open={isMergeOpen} onOpenChange={setIsMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gabungkan Dumas ke Berkas</DialogTitle>
            <DialogDescription>
              Pilih berkas aktif dari unit Anda untuk menggabungkan laporan pengaduan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Pilih Berkas Aktif *</label>
              {activeBerkas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Tidak ada berkas aktif yang tersedia.</p>
              ) : (
                <Select value={selectedBerkasId} onValueChange={(val) => setSelectedBerkasId(val || '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih berkas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBerkas.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nomor_berkas} - {b.judul}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMergeOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleMerge}
              disabled={isSubmitting || !selectedBerkasId || activeBerkas.length === 0}
            >
              {isSubmitting ? 'Menggabungkan...' : 'Gabungkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Split Modal */}
      <Dialog open={isSplitOpen} onOpenChange={setIsSplitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pisahkan Dumas dari Berkas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memisahkan pengaduan ini dari berkas yang terhubung? Tindakan ini akan mengembalikan status pengaduan menjadi bebas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSplitOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleSplit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Ya, Pisahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Perdamaian Modal */}
      <Dialog
        open={isPerdamaianOpen}
        onOpenChange={setIsPerdamaianOpen}
        disablePointerDismissal={true}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto p-5">
          <form onSubmit={handlePerdamaian}>
            <div className="space-y-3.5 py-1">
              {/* Rujukan Block */}
              <div className="text-black select-none text-xs font-semibold">
                Rujukan: Perkadiv Propam Polri No. 4 Tahun 2021 tentang Perdamaian Garplin KEPP
              </div>

              {/* Tahap Pelaksanaan Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-black block mb-0.5">
                  Tahap Pelaksanaan Perdamaian (Pasal 8 ayat 1)
                </label>
                <Select
                  value={tahapSaatDamai}
                  onValueChange={(val) => setTahapSaatDamai(val as 'Perdamaian Sebelum Penyelidikan' | 'Perdamaian Setelah Penyelidikan')}
                >
                  <SelectTrigger className="w-full h-9 text-black">
                    <SelectValue placeholder="Pilih Tahap" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Perdamaian Sebelum Penyelidikan">
                      Perdamaian Sebelum Penyelidikan
                    </SelectItem>
                    <SelectItem value="Perdamaian Setelah Penyelidikan">
                      Perdamaian Setelah Penyelidikan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid 2 Column */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
                <DatePicker
                  name="tgl_perdamaian"
                  required
                  disableFuture
                  value={perdamaianDate}
                  onChange={setPerdamaianDate}
                  className="w-full h-9"
                  placeholder="Tanggal Perdamaian *"
                  variant="split"
                />
                <Input
                  name="pihak_hadir"
                  required
                  placeholder="Pihak yang Hadir * (Pelapor, Terlapor, Saksi...)"
                  className="h-9"
                  value={pihakHadir}
                  onChange={(e) => setPihakHadir(e.target.value)}
                />
              </div>

              {/* Kronologi */}
              <Textarea
                name="kronologi"
                required
                placeholder="Kronologi / Kesepakatan Perdamaian * (Jelaskan secara singkat kesepakatan damai...)"
                className="min-h-[70px] resize-y"
                value={kronologi}
                onChange={(e) => setKronologi(e.target.value)}
              />

              {/* Syarat Panels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Syarat Materil (Pasal 5 & 6) */}
                <div className="space-y-2 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-center border-b border-slate-200 pb-1.5 mb-1.5 text-black text-sm">
                    Syarat Materiil (Pasal 5 & 6)
                  </h4>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.materil_keresahan}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, materil_keresahan: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('materil_keresahan', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      a. tidak menimbulkan keresahan dan penolakan dari masyarakat;
                    </span>
                  </label>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.materil_konflik}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, materil_konflik: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('materil_konflik', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      b. tidak berdampak konflik sosial;
                    </span>
                  </label>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.materil_tidak_keberatan}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, materil_tidak_keberatan: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('materil_tidak_keberatan', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      c. adanya pernyataan dari semua pihak yang terlibat untuk tidak keberatan;
                    </span>
                  </label>
                  <div className="pt-0.5">
                    <span className="font-semibold text-black block mb-1.5 text-sm">
                      d. memenuhi kriteria Prinsip pembatas, yaitu (Pasal 6):
                    </span>
                    <div className="pl-4 space-y-2">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={syaratPerdamaian.materil_mensrea}
                          onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, materil_mensrea: checked as boolean }))}
                          onClick={(e) => handleSyaratClick('materil_mensrea', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          a. tingkat kesalahan pelaku tidak berat dengan mempertimbangkan niat and tujuan pelaku (Mensrea);
                        </span>
                      </label>
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={syaratPerdamaian.materil_bukan_residivis}
                          onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, materil_bukan_residivis: checked as boolean }))}
                          onClick={(e) => handleSyaratClick('materil_bukan_residivis', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          b. pelaku bukan anggota yang sering melakukan pelanggaran Disiplin dan/atau KEPP dan atas pertimbangan ankum layak untuk dilakukan perdamaian.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Syarat Formil (Pasal 7) */}
                <div className="space-y-2 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-center border-b border-slate-200 pb-1.5 mb-1.5 text-black text-sm">
                    Syarat Formil (Pasal 7)
                  </h4>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.formil_permohonan}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, formil_permohonan: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('formil_permohonan', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      a. Surat Permohonan Perdamaian dari kedua belah pihak;
                    </span>
                  </label>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.formil_pernyataan}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, formil_pernyataan: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('formil_pernyataan', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      b. Surat Pernyataan Perdamaian kedua belah pihak;
                    </span>
                  </label>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.formil_pencabutan}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, formil_pencabutan: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('formil_pencabutan', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      c. Surat Pencabutan Laporan oleh pelapor di atas meterai; dan
                    </span>
                  </label>
                  <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                    <Checkbox
                      className="mt-0.5"
                      checked={syaratPerdamaian.formil_bap_tambahan}
                      onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, formil_bap_tambahan: checked as boolean }))}
                      onClick={(e) => handleSyaratClick('formil_bap_tambahan', e)}
                    />
                    <span className="font-medium leading-tight text-black text-sm">
                      d. Berita acara pemeriksaan tambahan terhadap kedua belah pihak.
                    </span>
                  </label>

                  <div className="border-t border-slate-200 mt-2.5 pt-2.5 space-y-2">
                    <span className="font-bold text-black block text-xs tracking-wider uppercase text-slate-500 mb-1">
                      Ceklist Penanganan Pencabutan
                    </span>
                    <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                      <Checkbox
                        className="mt-0.5"
                        checked={syaratPerdamaian.sebelum_pencabutan_diteliti}
                        onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, sebelum_pencabutan_diteliti: checked as boolean }))}
                        onClick={(e) => handleSyaratClick('sebelum_pencabutan_diteliti', e)}
                      />
                      <span className="font-medium leading-tight text-black text-sm">
                        Surat Pencabutan Dumas sudah diteliti
                      </span>
                    </label>
                    <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                      <Checkbox
                        className="mt-0.5"
                        checked={syaratPerdamaian.sebelum_klarifikasi_pencabutan}
                        onCheckedChange={(checked) => setSyaratPerdamaian(prev => ({ ...prev, sebelum_klarifikasi_pencabutan: checked as boolean }))}
                        onClick={(e) => handleSyaratClick('sebelum_klarifikasi_pencabutan', e)}
                      />
                      <span className="font-medium leading-tight text-black text-sm">
                        melakukan klarifikasi kepada pelapor/pengadu terkait pencabutan
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Produk Dokumen Tindak Lanjut */}
              <div className="space-y-2 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                <h4 className="font-bold text-center border-b border-slate-200 pb-1.5 mb-1.5 text-black text-sm">
                  Produk Dokumen Tindak Lanjut
                </h4>
                {tahapSaatDamai === 'Perdamaian Sebelum Penyelidikan' ? (
                  <div className="space-y-1.5">
                    {/* Berita Acara Pemeriksaan Tambahan 2 pihak */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={tindakLanjutDocs.ba_pemeriksaan_tambahan}
                          onCheckedChange={(checked) => setTindakLanjutDocs(prev => ({ ...prev, ba_pemeriksaan_tambahan: checked as boolean }))}
                          onClick={(e) => handleDocClick('ba_pemeriksaan_tambahan', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          Berita Acara Pemeriksaan Tambahan 2 pihak
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingleDoc('BA-BAP-TAMBAHAN', 'Berita Acara Pemeriksaan Tambahan 2 pihak', 'ba_pemeriksaan_tambahan')}
                        className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        Buat Dokumen
                      </Button>
                    </div>

                    {/* Nota Dinas Saran Penghentian Penanganan Dumas */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={tindakLanjutDocs.nd_saran_penghentian}
                          onCheckedChange={(checked) => setTindakLanjutDocs(prev => ({ ...prev, nd_saran_penghentian: checked as boolean }))}
                          onClick={(e) => handleDocClick('nd_saran_penghentian', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          Nota Dinas Saran Penghentian Penanganan Dumas
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingleDoc('ND-SARAN-HENTI', 'Nota Dinas Saran Penghentian Penanganan Dumas', 'nd_saran_penghentian')}
                        className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        Buat Dokumen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {/* permohonan gelar perkara/penyelidikan */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={tindakLanjutDocs.nd_gelar}
                          onCheckedChange={(checked) => setTindakLanjutDocs(prev => ({ ...prev, nd_gelar: checked as boolean }))}
                          onClick={(e) => handleDocClick('nd_gelar', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          permohonan gelar perkara/penyelidikan
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingleDoc('ND-GELAR', 'permohonan gelar perkara/penyelidikan', 'nd_gelar')}
                        className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        Buat Dokumen
                      </Button>
                    </div>

                    {/* rekomendasi gelar perkara/penyelidikan */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={tindakLanjutDocs.lhp_gelar}
                          onCheckedChange={(checked) => setTindakLanjutDocs(prev => ({ ...prev, lhp_gelar: checked as boolean }))}
                          onClick={(e) => handleDocClick('lhp_gelar', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          rekomendasi gelar perkara/penyelidikan
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingleDoc('LHP-GELAR', 'rekomendasi gelar perkara/penyelidikan', 'lhp_gelar')}
                        className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        Buat Dokumen
                      </Button>
                    </div>

                    {/* Surat Perintah Penghentian Penyelidikan */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={tindakLanjutDocs.sprin_henti}
                          onCheckedChange={(checked) => setTindakLanjutDocs(prev => ({ ...prev, sprin_henti: checked as boolean }))}
                          onClick={(e) => handleDocClick('sprin_henti', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          Surat Perintah Penghentian Penyelidikan
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingleDoc('SPRIN-HENTI', 'Surat Perintah Penghentian Penyelidikan', 'sprin_henti')}
                        className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        Buat Dokumen
                      </Button>
                    </div>

                    {/* Surat Pemberitahuan kepada Ankum */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <label className="flex items-start space-x-1.5 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={tindakLanjutDocs.nd_ankum}
                          onCheckedChange={(checked) => setTindakLanjutDocs(prev => ({ ...prev, nd_ankum: checked as boolean }))}
                          onClick={(e) => handleDocClick('nd_ankum', e)}
                        />
                        <span className="font-medium leading-tight text-black text-sm">
                          Surat Pemberitahuan kepada Ankum
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingleDoc('ND-ANKUM', 'Surat Pemberitahuan kepada Ankum', 'nd_ankum')}
                        className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isSubmitting}
                      >
                        Buat Dokumen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPerdamaianOpen(false)}
                disabled={isSubmitting}
                className="w-[180px] h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !perdamaianDate ||
                  !pihakHadir.trim() ||
                  !kronologi.trim() ||
                  !isSyaratLengkap
                }
                className="w-[180px] h-9"
              >
                {isSubmitting ? 'Memproses...' : 'Simpan & Tutup Dumas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
