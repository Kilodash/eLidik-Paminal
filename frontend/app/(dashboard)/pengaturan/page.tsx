'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Database, Users, Activity, Settings2, Save, X } from 'lucide-react'

type MasterType = 'satker' | 'jenis_dumas' | 'wujud_perbuatan'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [masterData, setMasterData] = useState<Record<string, string[]>>({
    satker: [],
    jenis_dumas: [],
    wujud_perbuatan: []
  })
  const [anggota, setAnggota] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<any[]>([])

  // CRUD State for Master Data
  const [activeMasterType, setActiveMasterType] = useState<MasterType>('satker')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [addDialog, setAddDialog] = useState(false)
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [satker, jenis, wujud, anggotaData, auditData] = await Promise.all([
        fetch('/api/settings/satker', { headers }).then(r => r.json()),
        fetch('/api/settings/jenis_dumas', { headers }).then(r => r.json()),
        fetch('/api/settings/wujud_perbuatan', { headers }).then(r => r.json()),
        fetch('/api/anggota?limit=100', { headers }).then(r => r.json()),
        fetch('/api/audit-log?limit=50', { headers }).then(r => r.json())
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

  // --- Master Data CRUD ---
  const saveMasterArray = async (type: MasterType, newArray: string[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/settings/${type}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: newArray })
      })

      if (!response.ok) throw new Error('Gagal menyimpan ke server')
      
      setMasterData(prev => ({ ...prev, [type]: newArray }))
      toast.success('Data berhasil diperbarui')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCreate = async () => {
    if (!newValue.trim()) return
    const newArray = [...masterData[activeMasterType], newValue.trim()]
    await saveMasterArray(activeMasterType, newArray)
    setAddDialog(false)
    setNewValue('')
  }

  const handleUpdate = async (index: number) => {
    if (!editValue.trim()) return
    const newArray = [...masterData[activeMasterType]]
    newArray[index] = editValue.trim()
    await saveMasterArray(activeMasterType, newArray)
    setEditIdx(null)
  }

  const handleDelete = async (index: number) => {
    if (!confirm('Hapus item ini?')) return
    const newArray = masterData[activeMasterType].filter((_, i) => i !== index)
    await saveMasterArray(activeMasterType, newArray)
  }

  // --- Anggota Actions ---
  const handleDeleteAnggota = async (id: string) => {
    if (!confirm('Hapus anggota ini secara permanen?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/anggota/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Gagal menghapus anggota')
      toast.success('Anggota berhasil dihapus')
      fetchAllData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getMasterLabel = (type: string) => {
    if (type === 'satker') return 'Satuan Kerja (Satker)'
    if (type === 'jenis_dumas') return 'Jenis Pengaduan'
    if (type === 'wujud_perbuatan') return 'Wujud Perbuatan'
    return type
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" data-testid="settings-page">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Pengaturan Sistem</h1>
          <p className="text-slate-500 mt-1 font-medium">Lakukan konfigurasi Master Data, Manajemen Anggota, dan Log Aktivitas.</p>
        </div>
        <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl text-blue-600 border border-white/50 shadow-sm">
          <Settings2 className="h-6 w-6" />
        </div>
      </div>

      <Tabs defaultValue="master-data" className="w-full">
        <TabsList className="bg-white/40 backdrop-blur-md border border-white/60 p-1.5 h-12 rounded-full shadow-sm mb-6 w-full sm:w-auto inline-flex">
          <TabsTrigger value="master-data" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database className="w-4 h-4 mr-2" />
            Master Data
          </TabsTrigger>
          <TabsTrigger value="anggota" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            Anggota
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity className="w-4 h-4 mr-2" />
            Log Server
          </TabsTrigger>
        </TabsList>

        <TabsContent value="master-data" className="space-y-6">
          <Card className="apple-glass border-white/50 shadow-sm rounded-3xl overflow-hidden">
            <div className="md:flex h-[600px]">
              {/* Sidebar for Master Data Categories */}
              <div className="w-full md:w-64 bg-slate-100/50 border-r border-white/60 p-6 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kategori Data</h3>
                {(['satker', 'jenis_dumas', 'wujud_perbuatan'] as MasterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveMasterType(type)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      activeMasterType === type 
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                        : 'text-slate-600 hover:bg-white/60 hover:shadow-sm'
                    }`}
                  >
                    {getMasterLabel(type)}
                  </button>
                ))}
              </div>
              
              {/* CRUD Table Area */}
              <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{getMasterLabel(activeMasterType)}</h2>
                    <p className="text-sm text-slate-500">{masterData[activeMasterType]?.length || 0} entri terdaftar</p>
                  </div>
                  <Button onClick={() => setAddDialog(true)} className="rounded-full shadow-sm bg-slate-900 hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" /> Tambah Baru
                  </Button>
                </div>

                <div className="flex-1 overflow-auto rounded-2xl border border-white/60 bg-white/40">
                  <Table>
                    <TableHeader className="bg-slate-100/50 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow>
                        <TableHead className="w-16 text-center">No</TableHead>
                        <TableHead>Nama Label</TableHead>
                        <TableHead className="text-right w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData[activeMasterType]?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12 text-slate-400">
                            Belum ada entri. Klik Tambah Baru.
                          </TableCell>
                        </TableRow>
                      ) : (
                        masterData[activeMasterType]?.map((item, index) => (
                          <TableRow key={index} className="hover:bg-white/60 transition-colors">
                            <TableCell className="text-center text-slate-400 font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {editIdx === index ? (
                                <div className="flex items-center gap-2">
                                  <Input 
                                    value={editValue} 
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-8 max-w-sm bg-white/80"
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdate(index)}
                                  />
                                  <Button size="sm" variant="ghost" className="h-8 text-green-600 rounded-full" onClick={() => handleUpdate(index)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-slate-400 rounded-full" onClick={() => setEditIdx(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700">{item}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editIdx !== index && (
                                <div className="flex items-center justify-end gap-1">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setEditIdx(index); setEditValue(item) }}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50" onClick={() => handleDelete(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="anggota" className="space-y-4">
          <Card className="apple-glass border-white/50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/20 border-b border-white/40 pb-6 pt-8 px-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Daftar Anggota Personel</CardTitle>
                <CardDescription className="text-slate-500 mt-1 font-medium">{anggota.length} anggota terautentikasi dalam sistem</CardDescription>
              </div>
              <Button className="rounded-full bg-slate-900 hover:bg-slate-800 shadow-sm" disabled>
                <Plus className="h-4 w-4 mr-2" /> Sinkronisasi / Tambah
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-8">Nama Lengkap</TableHead>
                    <TableHead>Pangkat / NRP</TableHead>
                    <TableHead>Jabatan / Unit</TableHead>
                    <TableHead className="text-right pr-8">Hak Akses & Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                        Tidak ada data anggota
                      </TableCell>
                    </TableRow>
                  ) : (
                    anggota.map((item) => (
                      <TableRow key={item.id} className="hover:bg-white/60 transition-colors">
                        <TableCell className="px-8 font-bold text-slate-700">{item.nama}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-slate-800 block">{item.pangkat || '-'}</span>
                            <span className="text-xs text-slate-500 font-mono">{item.nrp}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-slate-700 block">{item.jabatan || '-'}</span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{item.unit || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-3">
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Terdaftar</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full h-8 w-8 p-0"
                              onClick={() => handleDeleteAnggota(item.id)}
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
        </TabsContent>

        <TabsContent value="audit-log" className="space-y-4">
          <Card className="apple-glass border-white/50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/20 border-b border-white/40 pb-6 pt-8 px-8">
              <CardTitle className="text-xl font-bold text-slate-800">Log Aktivitas Server (Audit Trail)</CardTitle>
              <CardDescription>Jejak histori 50 aktivitas terakhir untuk kepatuhan (Read-Only)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-8 w-48">Timestamp</TableHead>
                    <TableHead>Identitas Aktor</TableHead>
                    <TableHead>Tindakan</TableHead>
                    <TableHead className="pr-8">Target (Entity)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                        Database Log Kosong
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLog.map((log) => (
                      <TableRow key={log.id} className="hover:bg-white/60 transition-colors">
                        <TableCell className="px-8 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-bold text-slate-700 block text-sm">{log.user_name || 'System / Unknown'}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">{log.user_role}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100/50 text-slate-600 border border-slate-200 shadow-sm font-semibold tracking-wide text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-sm font-medium text-slate-600">{log.entity_type || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modern Dialog for Add Master Data */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="apple-glass border border-white/60 shadow-xl rounded-3xl p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Tambah {getMasterLabel(activeMasterType)}</DialogTitle>
            <DialogDescription className="text-slate-500">
              Masukkan nama/label baru untuk dimasukkan ke dalam daftar referensi.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder={`Contoh: ${activeMasterType === 'satker' ? 'Polres Baru' : 'Laporan Baru'}`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-12 border-slate-200/60 bg-white/60 shadow-inner rounded-2xl px-4 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
              autoFocus
              onKeyPress={(e) => {
                if(e.key === 'Enter') handleCreate()
              }}
            />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddDialog(false)} className="rounded-full hover:bg-slate-200/50">
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={!newValue.trim()} className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105 active:scale-90">
              Simpan Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
