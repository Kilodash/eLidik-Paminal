'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Save } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [masterData, setMasterData] = useState<any>({})
  const [anggota, setAnggota] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [editDialog, setEditDialog] = useState({ open: false, type: '', items: [] as string[] })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [satker, jenis, wujud, anggotaData, auditData] = await Promise.all([
        fetch('/api/settings/satker', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/settings/jenis_dumas', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/settings/wujud_perbuatan', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/anggota?limit=100', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/audit-log?limit=50', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ])

      setMasterData({
        satker: satker.data?.value || [],
        jenis_dumas: jenis.data?.value || [],
        wujud_perbuatan: wujud.data?.value || []
      })
      setAnggota(anggotaData.data || [])
      setAuditLog(auditData.data || [])
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditMasterData = (type: string, items: string[]) => {
    setEditDialog({ open: true, type, items: [...items] })
  }

  const handleSaveMasterData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/settings/${editDialog.type}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: editDialog.items })
      })

      if (!response.ok) throw new Error('Gagal menyimpan')

      toast.success('Data berhasil disimpan')
      setEditDialog({ open: false, type: '', items: [] })
      fetchAllData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const addItem = () => {
    const newItem = prompt('Masukkan item baru:')
    if (newItem) {
      setEditDialog(prev => ({ ...prev, items: [...prev.items, newItem] }))
    }
  }

  const removeItem = (index: number) => {
    setEditDialog(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleDeleteAnggota = async (id: string) => {
    if (!confirm('Hapus anggota ini?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/anggota/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Gagal menghapus')

      toast.success('Anggota berhasil dihapus')
      fetchAllData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-bold font-heading">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Kelola master data dan konfigurasi sistem</p>
      </div>

      <Tabs defaultValue="master-data" className="w-full">
        <TabsList>
          <TabsTrigger value="master-data">Master Data</TabsTrigger>
          <TabsTrigger value="anggota">Anggota</TabsTrigger>
          <TabsTrigger value="audit-log">Log Aktivitas</TabsTrigger>
        </TabsList>

        <TabsContent value="master-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Satker (Satuan Kerja)</CardTitle>
              <CardDescription>{masterData.satker?.length || 0} item</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {masterData.satker?.map((item: string, i: number) => (
                  <Badge key={i} variant="secondary">{item}</Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => handleEditMasterData('satker', masterData.satker)}
                data-testid="edit-satker-button"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jenis Dumas</CardTitle>
              <CardDescription>{masterData.jenis_dumas?.length || 0} item</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {masterData.jenis_dumas?.map((item: string, i: number) => (
                  <Badge key={i} variant="secondary">{item}</Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => handleEditMasterData('jenis_dumas', masterData.jenis_dumas)}
                data-testid="edit-jenis-button"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wujud Perbuatan</CardTitle>
              <CardDescription>{masterData.wujud_perbuatan?.length || 0} item</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {masterData.wujud_perbuatan?.map((item: string, i: number) => (
                  <Badge key={i} variant="secondary">{item}</Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => handleEditMasterData('wujud_perbuatan', masterData.wujud_perbuatan)}
                data-testid="edit-wujud-button"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anggota" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daftar Anggota</CardTitle>
                  <CardDescription>{anggota.length} anggota terdaftar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Pangkat</TableHead>
                    <TableHead>NRP</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    anggota.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nama}</TableCell>
                        <TableCell>{item.pangkat}</TableCell>
                        <TableCell>{item.nrp}</TableCell>
                        <TableCell>{item.jabatan || '-'}</TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnggota(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Aktivitas Sistem</CardTitle>
              <CardDescription>50 aktivitas terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Tidak ada log
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-sm">{log.user_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{log.user_role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entity_type || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Master Data Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editDialog.type?.replace('_', ' ')}</DialogTitle>
            <DialogDescription>
              Tambah, edit, atau hapus item dari daftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {editDialog.items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={item} onChange={(e) => {
                  const newItems = [...editDialog.items]
                  newItems[index] = e.target.value
                  setEditDialog({ ...editDialog, items: newItems })
                }} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
            </Button>
            <Button onClick={handleSaveMasterData}>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
