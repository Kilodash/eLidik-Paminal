'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, AlertCircle } from 'lucide-react'
import { checkUnsavedPropamDataAction, saveSinglePropamDataAction } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function PropamImportModalTrigger({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([])
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (open) {
      handleCheck()
    } else {
      setItems([])
      setHasChecked(false)
    }
  }, [open])

  async function handleCheck() {
    setLoading(true)
    setHasChecked(false)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleAdd(item: any) {
    const loadingToast = toast.loading('Menyimpan data...')
    try {
      const res = await saveSinglePropamDataAction(item)
      if (res.error) {
        toast.error(res.error, { id: loadingToast })
      } else {
        toast.success('Berhasil ditambahkan', { id: loadingToast })
        // Remove from list
        setItems(prev => prev.filter(p => p.id !== item.id))
      }
    } catch (e) {
      toast.error('Terjadi kesalahan', { id: loadingToast })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Data Pengaduan GAJAMADA — Polda Jabar (Belum Masuk)</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 mt-4 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Mengambil data dari GAJAMADA...
            </div>
          ) : hasChecked && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border border-dashed rounded-lg">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p>Tidak ada pengaduan untuk Kasubbid Paminal Polda Jabar.</p>
            </div>
          ) : hasChecked && items.length > 0 ? (
            <>
              <div className="flex gap-2 mb-2 text-sm text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">Belum masuk: {items.filter((i: any) => !i.alreadySaved).length}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Sudah ada: {items.filter((i: any) => i.alreadySaved).length}</span>
              </div>
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
                    <th className="px-3 py-3 min-w-[250px]">Ringkasan</th>
                    <th className="px-3 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => {
                    const isSaved = item.alreadySaved
                    return (
                    <tr key={item.id} className={`bg-card hover:bg-muted/50 transition-colors ${isSaved ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                        {item.id}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {new Date(item.created_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        {item.pengirim || '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {item.phone_no || '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {item.prepetrator_name || '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {item.status_label || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs">
                        {item.disposisi_case_position || item.disposisi_polda || '-'}
                      </td>
                      <td className="px-3 py-3 min-w-[250px]">
                        <div className="line-clamp-2 text-muted-foreground text-xs" title={item.summary || item.content}>
                          {item.summary || item.content || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isSaved ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Sudah Ada
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => handleAdd(item)} className="h-7 text-xs whitespace-nowrap">
                            <Plus className="w-3 h-3 mr-1" /> Tambahkan
                          </Button>
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
