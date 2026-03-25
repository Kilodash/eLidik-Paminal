'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function DumasDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dumas, setDumas] = useState<any>(null)
  const [tindakLanjut, setTindakLanjut] = useState<any>({})
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    if (id) {
      fetchDumasDetail()
    }
  }, [id])

  const fetchDumasDetail = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dumas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Gagal mengambil data')

      const data = await response.json()
      setDumas(data.data)
      
      // Extract tindak lanjut data
      const { dumas_id, ...tlData } = data.data
      setTindakLanjut(tlData)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTindakLanjut = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tindak-lanjut/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tindakLanjut)
      })

      if (!response.ok) throw new Error('Gagal menyimpan')

      toast.success('Tindak lanjut berhasil disimpan')
      fetchDumasDetail()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitVerification = async () => {
    if (!confirm('Ajukan tindak lanjut untuk verifikasi?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tindak-lanjut/${id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Gagal mengajukan verifikasi')

      toast.success('Berhasil diajukan untuk verifikasi')
      fetchDumasDetail()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleApproval = async (action: 'approve' | 'reject', catatan?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tindak-lanjut/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, catatan_revisi: catatan })
      })

      if (!response.ok) throw new Error('Gagal memproses approval')

      toast.success(action === 'approve' ? 'Berhasil disetujui' : 'Dikembalikan untuk revisi')
      fetchDumasDetail()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!dumas) {
    return <div className="p-6">Data tidak ditemukan</div>
  }

  const canEdit = user?.role === 'unit' || ['admin', 'superadmin'].includes(user?.role)
  const canApprove = user?.role === 'kasubbid_paminal' || ['admin', 'superadmin'].includes(user?.role)

  return (
    <div className="space-y-6" data-testid="dumas-detail-page">
      <div>
        <Link href="/dumas">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">{dumas.no_dumas}</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(dumas.tgl_dumas), 'dd MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={dumas.status === 'terbukti' ? 'default' : 'secondary'}>
              {dumas.status}
            </Badge>
            {tindakLanjut.status_verifikasi && (
              <Badge variant="outline">{tindakLanjut.status_verifikasi}</Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="informasi" className="w-full">
        <TabsList>
          <TabsTrigger value="informasi" data-testid="tab-informasi">Informasi</TabsTrigger>
          <TabsTrigger value="tindak-lanjut" data-testid="tab-tindak-lanjut">Tindak Lanjut</TabsTrigger>
        </TabsList>

        <TabsContent value="informasi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengaduan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Satker</Label>
                  <p className="font-medium">{dumas.satker}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit Penanganan</Label>
                  <p className="font-medium">{dumas.unit_name || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Pelapor</Label>
                <p className="font-medium">{dumas.pelapor}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Terlapor</Label>
                <p className="font-medium">{dumas.terlapor}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Jenis Dumas</Label>
                  <p className="font-medium">{dumas.jenis_dumas}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Wujud Perbuatan</Label>
                  <p className="font-medium">{dumas.wujud_perbuatan}</p>
                </div>
              </div>

              {dumas.keterangan && (
                <div>
                  <Label className="text-muted-foreground">Keterangan</Label>
                  <p className="font-medium">{dumas.keterangan}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tindak-lanjut" className="space-y-4">
          {tindakLanjut.catatan_revisi && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600">Catatan Revisi</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{tindakLanjut.catatan_revisi}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Form Tindak Lanjut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal UUK</Label>
                  <Input
                    type="date"
                    value={tindakLanjut.tgl_uuk || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_uuk: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No UUK</Label>
                  <Input
                    value={tindakLanjut.no_uuk || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_uuk: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal SPRIN</Label>
                  <Input
                    type="date"
                    value={tindakLanjut.tgl_sprin_lidik || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_sprin_lidik: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No SPRIN</Label>
                  <Input
                    value={tindakLanjut.no_sprin || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_sprin: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal LHP</Label>
                  <Input
                    type="date"
                    value={tindakLanjut.tgl_lhp || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_lhp: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No LHP</Label>
                  <Input
                    value={tindakLanjut.no_lhp || ''}
                    onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_lhp: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hasil Lidik</Label>
                <Select
                  value={tindakLanjut.hasil_lidik || ''}
                  onValueChange={(value) => setTindakLanjut({ ...tindakLanjut, hasil_lidik: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hasil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbukti">Terbukti</SelectItem>
                    <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                    <SelectItem value="dihentikan">Dihentikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tindakLanjut.hasil_lidik === 'terbukti' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>No Nodin</Label>
                    <Input
                      value={tindakLanjut.no_nodin || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_nodin: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No Berkas</Label>
                    <Input
                      value={tindakLanjut.no_berkas || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_berkas: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}

              {tindakLanjut.hasil_lidik === 'tidak_terbukti' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Tanggal SP2HP2</Label>
                    <Input
                      type="date"
                      value={tindakLanjut.tgl_sp2hp2 || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, tgl_sp2hp2: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No SP2HP2</Label>
                    <Input
                      value={tindakLanjut.no_sp2hp2 || ''}
                      onChange={(e) => setTindakLanjut({ ...tindakLanjut, no_sp2hp2: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveTindakLanjut} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  {tindakLanjut.status_verifikasi === 'draft' && (
                    <Button variant="secondary" onClick={handleSubmitVerification}>
                      <Send className="h-4 w-4 mr-2" />
                      Ajukan Verifikasi
                    </Button>
                  )}
                </div>
              )}

              {canApprove && tindakLanjut.status_verifikasi === 'menunggu_verifikasi' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApproval('approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const catatan = prompt('Catatan revisi:')
                      if (catatan) handleApproval('reject', catatan)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Minta Revisi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
