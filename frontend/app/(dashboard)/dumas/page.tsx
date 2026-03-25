'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Merge } from 'lucide-react'
import { format } from 'date-fns'

interface Dumas {
  id: string
  no_dumas: string
  tgl_dumas: string
  pelapor: string
  terlapor: string
  satker: string
  status: string
  unit_name?: string
  sla_days: number
}

export default function DumasListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dumas, setDumas] = useState<Dumas[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 })

  useEffect(() => {
    fetchDumas()
  }, [pagination.page, statusFilter])

  const fetchDumas = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`/api/dumas?${params}`, {
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

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchDumas()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Pilih minimal 1 dumas')
      return
    }

    if (!confirm(`Hapus ${selectedIds.length} dumas?`)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dumas/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'delete', ids: selectedIds })
      })

      if (!response.ok) throw new Error('Gagal menghapus')

      toast.success('Dumas berhasil dihapus')
      setSelectedIds([])
      fetchDumas()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      dalam_proses: { variant: 'default', label: 'Dalam Proses' },
      terbukti: { variant: 'default', label: 'Terbukti', className: 'bg-green-500' },
      tidak_terbukti: { variant: 'secondary', label: 'Tidak Terbukti' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  const getSLABadge = (days: number) => {
    if (days > 30) return <Badge variant="destructive">{days} hari</Badge>
    if (days > 14) return <Badge className="bg-yellow-500 text-white">{days} hari</Badge>
    return <Badge variant="outline">{days} hari</Badge>
  }

  return (
    <div className="space-y-6" data-testid="dumas-list-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Daftar Dumas</h1>
          <p className="text-muted-foreground mt-1">Kelola semua pengaduan masyarakat</p>
        </div>
        <Link href="/dumas/create">
          <Button data-testid="create-dumas-button">
            <Plus className="h-4 w-4 mr-2" />
            Registrasi Dumas
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Cari no dumas, pelapor, terlapor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="search-input"
              />
              <Button onClick={handleSearch} data-testid="search-button">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="status-filter">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
                <SelectItem value="terbukti">Terbukti</SelectItem>
                <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} dipilih
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                data-testid="bulk-delete-button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
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
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : dumas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  dumas.map((item) => (
                    <TableRow key={item.id} data-testid={`dumas-row-${item.id}`}>
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
                      <TableCell>
                        {item.unit_name && (
                          <Badge variant="outline" className="text-xs">{item.unit_name}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getSLABadge(item.sla_days)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dumas/${item.id}`)}
                          data-testid={`view-dumas-${item.id}`}
                        >
                          Lihat
                        </Button>
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
              Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                data-testid="prev-page-button"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
                data-testid="next-page-button"
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
