'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, AlertCircle, ChevronLeft, ChevronRight, Eye, ArrowLeft } from 'lucide-react'
import { checkUnsavedPropamDataAction, saveSinglePropamDataAction } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

const PAGE_SIZE = 10

export function PropamImportModal() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([])
  const [hasChecked, setHasChecked] = useState(false)
  const [page, setPage] = useState(1)
  // null = tabel list, number = indeks item detail
  const [detailIndex, setDetailIndex] = useState<number | null>(null)

  async function handleCheck() {
    setLoading(true)
    setHasChecked(false)
    setPage(1)
    setDetailIndex(null)
    try {
      const res = await checkUnsavedPropamDataAction()
      if (res.error) {
        toast.error('Error: ' + res.error)
      } else {
        setItems(res.data || [])
        setHasChecked(true)
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat mengambil data GAJAMADA')
    }
    setLoading(false)
  }

  function handleOpen() {
    setOpen(true)
    handleCheck()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleAdd(item: any) {
    const loadingToast = toast.loading('Menyimpan data...')
    try {
      const res = await saveSinglePropamDataAction(item)
      if (res.error) {
        toast.error(res.error, { id: loadingToast })
      } else {
        toast.success('Berhasil ditambahkan', { id: loadingToast })
        const newItems = items.filter(p => p.id !== item.id)
        setItems(newItems)
        // Jika detail view dan masih ada item, navigasi ke berikutnya atau kembali ke list
        if (detailIndex !== null) {
          if (newItems.length === 0) {
            setDetailIndex(null)
          } else {
            const nextIdx = Math.min(detailIndex, newItems.length - 1)
            setDetailIndex(nextIdx)
          }
        }
      }
    } catch (e) {
      toast.error('Terjadi kesalahan', { id: loadingToast })
    }
  }

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Item yang sedang dilihat detail (indeks global, bukan paged)
  const currentDetail = detailIndex !== null ? items[detailIndex] : null

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Cek GAJAMADA
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setItems([])
          setHasChecked(false)
          setDetailIndex(null)
          setPage(1)
        }
      }}>
        <DialogContent className="!inset-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none sm:!max-w-none !max-h-none !rounded-none !p-0 !gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {detailIndex !== null && (
                  <Button variant="ghost" size="sm" onClick={() => setDetailIndex(null)} className="h-7 px-2">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar
                  </Button>
                )}
                <DialogTitle className="text-base">
                  Data Pengaduan GAJAMADA — Polda Jabar
                  {hasChecked && items.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({items.length} belum masuk)
                    </span>
                  )}
                </DialogTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleCheck} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 py-4">
            {/* LOADING */}
            {loading && (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Mengambil data dari GAJAMADA...
              </div>
            )}

             {/* KOSONG */}
            {!loading && hasChecked && items.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground border border-dashed rounded-lg">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p>Tidak ada pengaduan untuk Kasubbid Paminal Polda Jabar.</p>
              </div>
            )}

            {!loading && hasChecked && items.length > 0 && (
              <div className="flex gap-2 mb-2 text-sm text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">Belum masuk: {items.filter(i => !i.alreadySaved).length}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Sudah ada: {items.filter(i => i.alreadySaved).length}</span>
              </div>
            )}

            {/* DETAIL VIEW */}
            {!loading && hasChecked && detailIndex !== null && currentDetail && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Navigasi detail */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <span className="text-sm text-muted-foreground">
                    {detailIndex + 1} dari {items.length}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetailIndex(detailIndex - 1)} disabled={detailIndex === 0}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDetailIndex(detailIndex + 1)} disabled={detailIndex >= items.length - 1}>
                      Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    {currentDetail.alreadySaved ? (
                      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 self-center">
                        Sudah Ada di Sistem
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleAdd(currentDetail)} className="ml-2">
                        <Plus className="w-4 h-4 mr-1" /> Tambahkan ke Sistem
                      </Button>
                    )}
                  </div>
                </div>

                {/* Detail konten */}
                <div className="flex-1 overflow-y-auto border rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">No. Laporan</p>
                        <p className="font-mono font-semibold">{currentDetail.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tanggal Masuk</p>
                        <p>{new Date(currentDetail.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nama Pelapor</p>
                        <p className="font-medium">{currentDetail.pengirim || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">No. HP Pelapor</p>
                        <p>{currentDetail.phone_no || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">NIK Pelapor</p>
                        <p className="font-mono">{currentDetail.reporter_nik || '-'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nama Terlapor</p>
                        <p className="font-medium">{currentDetail.prepetrator_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sumber</p>
                        <p>{currentDetail.source_alias || currentDetail.source || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Kategori</p>
                        <p>{currentDetail.category || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</p>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {currentDetail.status_label || '-'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Disposisi</p>
                        <p>{currentDetail.disposisi_case_position || currentDetail.disposisi_polda || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Ringkasan AI</p>
                    <p className="text-sm leading-relaxed bg-muted/30 rounded-md p-3">{currentDetail.summary || '-'}</p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Kronologi Lengkap</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentDetail.content || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TABLE LIST */}
            {!loading && hasChecked && items.length > 0 && detailIndex === null && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 border rounded-md overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 whitespace-nowrap">No. Laporan</th>
                        <th className="px-3 py-3 whitespace-nowrap">Tgl Masuk</th>
                        <th className="px-3 py-3">Pelapor</th>
                        <th className="px-3 py-3">No. HP</th>
                        <th className="px-3 py-3">Terlapor</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Disposisi</th>
                        <th className="px-3 py-3 min-w-[300px]">Ringkasan</th>
                        <th className="px-3 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                       {pagedItems.map((item, i) => {
                        const globalIndex = (page - 1) * PAGE_SIZE + i
                        const isSaved = item.alreadySaved
                        return (
                          <tr key={item.id} className={`bg-card hover:bg-muted/50 transition-colors ${isSaved ? 'opacity-60' : ''}`}>
                            <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">{item.id}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{new Date(item.created_date).toLocaleDateString('id-ID')}</td>
                            <td className="px-3 py-3 font-medium whitespace-nowrap">{item.pengirim || '-'}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{item.phone_no || '-'}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{item.prepetrator_name || '-'}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                {item.status_label || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs">{item.disposisi_case_position || item.disposisi_polda || '-'}</td>
                            <td className="px-3 py-3 min-w-[300px]">
                              <div className="line-clamp-2 text-muted-foreground text-xs">{item.summary || item.content || '-'}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1 justify-end">
                                <Button variant="outline" size="sm" onClick={() => setDetailIndex(globalIndex)} className="h-7 text-xs whitespace-nowrap">
                                  <Eye className="w-3 h-3 mr-1" /> Lihat
                                </Button>
                                {isSaved ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 self-center">
                                    Sudah Ada
                                  </span>
                                ) : (
                                  <Button size="sm" onClick={() => handleAdd(item)} className="h-7 text-xs whitespace-nowrap">
                                    <Plus className="w-3 h-3 mr-1" /> Tambah
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginasi */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 shrink-0">
                    <span className="text-sm text-muted-foreground">
                      Halaman {page} dari {totalPages} &middot; {items.length} data
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
