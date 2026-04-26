'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Save, Trash2, Edit2, 
  DollarSign, Hash, Users, Calendar, 
  Search, Filter, ChevronRight, BookOpen
} from 'lucide-react'

export default function MasterDipaPage() {
  const router = useRouter()
  const [dipaItems, setDipaItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (!['admin', 'superadmin'].includes(user.role)) {
      router.push('/')
      return
    }
    fetchDipa()
  }, [])

  const fetchDipa = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('master_dipa')
        .select('*')
        .order('jenis_giat', { ascending: true })

      if (error) throw error
      setDipaItems(data || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('master_dipa')
        .upsert(editingItem)

      if (error) throw error
      toast.success('Berhasil disimpan')
      setShowModal(false)
      fetchDipa()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item DIPA ini?')) return
    try {
      const { error } = await supabase
        .from('master_dipa')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Berhasil dihapus')
      fetchDipa()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const filteredItems = dipaItems.filter(item => 
    item.jenis_giat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/perwabkeu')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading">Master DIPA 2026</h1>
            <p className="text-sm text-muted-foreground">Kendalikan pagu dan tarif anggaran kegiatan</p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingItem({ jenis_giat: '', pagu_anggaran: 0, tarif_uh_dk: 0, tarif_uh_lk: 0, kuota_orang: 0, kuota_hari: 0 })
          setShowModal(true)
        }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Item DIPA
        </Button>
      </div>

      {/* Controls */}
      <Card className="bg-slate-50/50 border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari jenis kegiatan..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Jenis Kegiatan</TableHead>
                <TableHead className="text-right">Pagu Anggaran</TableHead>
                <TableHead className="text-center">UH (DK/LK)</TableHead>
                <TableHead className="text-center">Kuota (Org/Hari)</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Tidak ditemukan item DIPA
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-emerald-700" />
                        </div>
                        {item.jenis_giat}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {formatCurrency(item.pagu_anggaran)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">DK: {formatCurrency(item.tarif_uh_dk)}</span>
                        <span className="text-xs text-muted-foreground">LK: {formatCurrency(item.tarif_uh_lk)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1 border-slate-200">
                        {item.kuota_orang} <Users className="h-3 w-3" />
                      </Badge>
                      <Badge variant="outline" className="ml-1 gap-1 border-slate-200">
                        {item.kuota_hari} <Calendar className="h-3 w-3" />
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setEditingItem(item); setShowModal(true) }}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="border-b">
              <CardTitle>{editingItem.id ? 'Edit Item DIPA' : 'Tambah Item DIPA'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Jenis Kegiatan</Label>
                  <Input 
                    required 
                    placeholder="LIDIK PAMINAL..." 
                    value={editingItem.jenis_giat} 
                    onChange={e => setEditingItem({ ...editingItem, jenis_giat: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Pagu Anggaran</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input 
                        type="number" 
                        className="pl-8" 
                        value={editingItem.pagu_anggaran} 
                        onChange={e => setEditingItem({ ...editingItem, pagu_anggaran: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kuota Orang</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input 
                        type="number" 
                        className="pl-8" 
                        value={editingItem.kuota_orang} 
                        onChange={e => setEditingItem({ ...editingItem, kuota_orang: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tarif UH DK</Label>
                    <Input 
                      type="number" 
                      value={editingItem.tarif_uh_dk} 
                      onChange={e => setEditingItem({ ...editingItem, tarif_uh_dk: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tarif UH LK</Label>
                    <Input 
                      type="number" 
                      value={editingItem.tarif_uh_lk} 
                      onChange={e => setEditingItem({ ...editingItem, tarif_uh_lk: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
