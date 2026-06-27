'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getRegisterSuratListAction, getDocumentTypesAction } from '@/app/(dashboard)/register-surat/actions'
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function RegisterSuratTable() {
  const [docTypes, setDocTypes] = React.useState<{ kode: string; nama: string }[]>([])
  const [selectedType, setSelectedType] = React.useState('')
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch] = useDebounce(search, 500)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalCount, setTotalCount] = React.useState(0)
  const limit = 10
  const [autoNumberStates, setAutoNumberStates] = React.useState<Record<string, boolean>>({})
  const [showSettings, setShowSettings] = React.useState(false)
  const [debug, setDebug] = React.useState<any>(null)

  React.useEffect(() => {
    const saved = localStorage.getItem('auto_number_settings')
    if (saved) {
      try { setAutoNumberStates(JSON.parse(saved)) }
      catch (e) { /* ignore */ }
    }
  }, [])

  const handleToggleAutoNumber = (kode: string, isAuto: boolean) => {
    setAutoNumberStates(prev => {
      const next = { ...prev, [kode]: isAuto }
      localStorage.setItem('auto_number_settings', JSON.stringify(next))
      return next
    })
  }

  React.useEffect(() => {
    getDocumentTypesAction().then(res => {
      if (res.data) setDocTypes(res.data)
    })
  }, [])

  const handleTypeChange = (val: string | null) => {
    setSelectedType(val === 'all' ? '' : (val || ''))
  }

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    // When searching, fetch more data for client-side perihal filtering
    const searchLimit = debouncedSearch ? 500 : limit
    const res = await getRegisterSuratListAction({ page: debouncedSearch ? 1 : page, limit: searchLimit, search: '', docType: selectedType })
    if (res.success && res.data) {
      let result = res.data
      // Client-side search across nomor_surat, tahap, AND perihal
      const searchLower = debouncedSearch.toLowerCase()
      if (searchLower) {
        result = result.filter((item: any) => {
          if ((item.nomor_surat || '').toLowerCase().includes(searchLower)) return true
          if ((item.tahap || '').toLowerCase().includes(searchLower)) return true
          const p = item.pengaduan
          if (p) {
            const fields = [p.jenis, p.satker_dilaporkan, p.pelapor_nama, p.kronologi]
            return fields.some(f => (f || '').toLowerCase().includes(searchLower))
          }
          return false
        })
      }
      setData(result)
      setTotalPages(debouncedSearch ? Math.ceil(result.length / limit) : (res.totalPages || 0))
      setTotalCount(result.length)
      setDebug(res._debug || null)
    } else {
      setData([])
      setTotalPages(0)
      setTotalCount(0)
    }
    setLoading(false)
  }, [page, debouncedSearch, selectedType])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedType])

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor surat..."
            className="pl-9 bg-background h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedType || 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[200px] h-9 bg-background">
            <SelectValue placeholder="Semua Jenis Dokumen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis Dokumen</SelectItem>
            {docTypes.map(dt => (
              <SelectItem key={dt.kode} value={dt.kode}>{dt.nama || dt.kode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={() => setShowSettings(!showSettings)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Auto-Number
        </Button>
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {totalCount} dokumen | Hal {page}/{Math.max(1, totalPages)}
        </span>
      </div>

      {debug && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg p-2 text-xs font-mono whitespace-pre-wrap break-all">
          {JSON.stringify(debug, null, 2)}
        </div>
      )}

      {/* Auto-number settings panel */}
      {showSettings && (
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="text-sm font-semibold mb-3">Pengaturan Auto-Number</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {docTypes.map(dt => (
              <div key={dt.kode} className="flex items-center gap-2">
                <Switch
                  id={`auto-${dt.kode}`}
                  checked={autoNumberStates[dt.kode] !== false}
                  onChange={(e) => handleToggleAutoNumber(dt.kode, e.target.checked)}
                  className="scale-75"
                />
                <Label htmlFor={`auto-${dt.kode}`} className="text-xs cursor-pointer">{dt.nama || dt.kode}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12">NO</TableHead>
              <TableHead>NOMOR</TableHead>
              <TableHead>PERIHAL</TableHead>
              <TableHead>UNIT</TableHead>
              <TableHead className="w-20">KET</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Tidak ada data dokumen ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => {
                const noUrut = (page - 1) * limit + i + 1
                const p = item.pengaduan
                let perihal = '-'
                let unit = '-'
                if (p) {
                  const formatDateLocal = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
                  const jenisText = p.jenis === 'laporan_informasi' ? 'Laporan Informasi' : p.jenis || 'Pengaduan Masyarakat'
                  const pelaporText = p.pelapor_nama || 'Anonim'
                  const satker = p.satker_dilaporkan || ''
                  const terlaporList = p.pengaduan_terlapor || []
                  const terlaporText = Array.isArray(terlaporList) && terlaporList.length > 0
                    ? terlaporList.map((pt: any) => {
                        const t = pt.terlapor
                        return `${t?.nama || 'Anonim'}${t?.pangkat ? ' pangkat ' + t.pangkat : ''}${t?.jabatan ? ' jabatan ' + t.jabatan : ''}`
                      }).join(', ')
                    : 'Belum ada terlapor'
                  unit = satker || '-'
                  perihal = `${jenisText} tanggal ${formatDateLocal(p.tgl_pengaduan)} a.n. pelapor ${pelaporText}, terlapor ${terlaporText} tentang ${p.kronologi || '-'}`
                }
                const docTypeName = docTypes.find(dt => dt.kode === item.tahap)?.nama || item.tahap || '-'

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-center">{noUrut}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      <div>{item.nomor_surat || <span className="text-muted-foreground italic">Belum ada nomor</span>}</div>
                      <Badge variant="outline" className="font-mono text-[10px] mt-0.5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        {docTypeName}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm truncate" title={perihal}>{perihal}</div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{unit}</TableCell>
                    <TableCell>
                      {item.file_url ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">Final</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {((page - 1) * limit) + 1}-{Math.min(page * limit, totalCount)} dari {totalCount}
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            <ChevronLeft className="h-4 w-4 mr-1" />Sebelumnya
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
            Selanjutnya<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
