'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { RotateCcw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ArchivedDumas {
  id: string
  no_dumas: string
  tgl_dumas: string
  terlapor: string
  satker: string
  deleted_at: string
}

export default function ArsipPage() {
  const [loading, setLoading] = useState(true)
  const [dumas, setDumas] = useState<ArchivedDumas[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 })

  useEffect(() => {
    fetchArchivedDumas()
  }, [pagination.page])

  const fetchArchivedDumas = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      const response = await fetch(`/api/arsip?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Gagal mengambil data')

      const data = await response.json()
      setDumas(data.data)
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'restore' | 'permanent_delete') => {
    if (selectedIds.length === 0) {
      toast.error('Pilih minimal 1 dumas')
      return
    }

    const confirmMsg = action === 'restore'
      ? `Restore ${selectedIds.length} dumas?`
      : `HAPUS PERMANEN ${selectedIds.length} dumas? Aksi ini tidak dapat dibatalkan!`

    if (!confirm(confirmMsg)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/arsip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ids: selectedIds })
      })

      if (!response.ok) throw new Error('Gagal melakukan action')

      toast.success(action === 'restore' ? 'Berhasil di-restore' : 'Berhasil dihapus permanen')
      setSelectedIds([])
      fetchArchivedDumas()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6" data-testid="arsip-page">
      <div>
        <h1 className="text-3xl font-bold font-heading">Arsip</h1>
        <p className="text-muted-foreground mt-1">Dumas yang telah dihapus (soft delete)</p>
      </div>

      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} dipilih
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAction('restore')}
              data-testid="restore-button"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('permanent_delete')}
              data-testid="permanent-delete-button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Permanen
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Arsip</CardTitle>
          <CardDescription>{pagination.total} item dalam arsip</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === dumas.length && dumas.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedIds(checked ? dumas.map(d => d.id) : [])
                      }}
                      data-testid="select-all-checkbox"
                    />
                  </TableHead>
                  <TableHead>No Dumas</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Terlapor</TableHead>
                  <TableHead>Satker</TableHead>
                  <TableHead>Dihapus Pada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : dumas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Arsip kosong
                    </TableCell>
                  </TableRow>
                ) : (
                  dumas.map((item) => (
                    <TableRow key={item.id} data-testid={`archived-row-${item.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev =>
                              checked
                                ? [...prev, item.id]
                                : prev.filter(id => id !== item.id)
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.no_dumas}</TableCell>
                      <TableCell>{format(new Date(item.tgl_dumas), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{item.terlapor}</TableCell>
                      <TableCell className="text-sm">{item.satker}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(item.deleted_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Halaman {pagination.page} dari {pagination.total_pages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
