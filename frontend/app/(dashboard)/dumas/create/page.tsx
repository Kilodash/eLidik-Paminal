'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateDumasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<any>({})
  const [formData, setFormData] = useState({
    tgl_dumas: '',
    pelapor: '',
    terlapor: '',
    satker: '',
    wujud_perbuatan: '',
    jenis_dumas: '',
    keterangan: '',
    disposisi_kabid: '',
    disposisi_kasubbid: '',
    unit_id: '',
    unit_name: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const [satker, jenis, wujud, units] = await Promise.all([
        fetch('/api/settings/satker', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/settings/jenis_dumas', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/settings/wujud_perbuatan', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/settings/unit_list', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ])

      setSettings({
        satker: satker.data?.value || [],
        jenis_dumas: jenis.data?.value || [],
        wujud_perbuatan: wujud.data?.value || [],
        units: units.data?.value || []
      })
    } catch (error) {
      toast.error('Gagal memuat data settings')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dumas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal membuat dumas')
      }

      const data = await response.json()
      toast.success('Dumas berhasil dibuat!')
      router.push(`/dumas/${data.data.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6" data-testid="create-dumas-page">
      <div>
        <Link href="/dumas">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <h1 className="text-3xl font-bold font-heading">Registrasi Dumas</h1>
        <p className="text-muted-foreground mt-1">Buat pengaduan baru</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pengaduan</CardTitle>
            <CardDescription>Lengkapi formulir di bawah ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tgl_dumas">Tanggal Dumas *</Label>
                <Input
                  id="tgl_dumas"
                  type="date"
                  value={formData.tgl_dumas}
                  onChange={(e) => setFormData({ ...formData, tgl_dumas: e.target.value })}
                  required
                  data-testid="input-tgl-dumas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="satker">Satker *</Label>
                <Select
                  value={formData.satker}
                  onValueChange={(value) => setFormData({ ...formData, satker: value })}
                >
                  <SelectTrigger data-testid="select-satker">
                    <SelectValue placeholder="Pilih Satker" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.satker?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pelapor">Pelapor *</Label>
              <Textarea
                id="pelapor"
                value={formData.pelapor}
                onChange={(e) => setFormData({ ...formData, pelapor: e.target.value })}
                placeholder="Nama dan identitas pelapor"
                required
                data-testid="input-pelapor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terlapor">Terlapor *</Label>
              <Textarea
                id="terlapor"
                value={formData.terlapor}
                onChange={(e) => setFormData({ ...formData, terlapor: e.target.value })}
                placeholder="Nama dan identitas terlapor"
                required
                data-testid="input-terlapor"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_dumas">Jenis Dumas *</Label>
                <Select
                  value={formData.jenis_dumas}
                  onValueChange={(value) => setFormData({ ...formData, jenis_dumas: value })}
                >
                  <SelectTrigger data-testid="select-jenis">
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.jenis_dumas?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wujud_perbuatan">Wujud Perbuatan *</Label>
                <Select
                  value={formData.wujud_perbuatan}
                  onValueChange={(value) => setFormData({ ...formData, wujud_perbuatan: value })}
                >
                  <SelectTrigger data-testid="select-wujud">
                    <SelectValue placeholder="Pilih Wujud Perbuatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.wujud_perbuatan?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
                rows={3}
                data-testid="input-keterangan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disposisi_kabid">Disposisi Kabid</Label>
                <Textarea
                  id="disposisi_kabid"
                  value={formData.disposisi_kabid}
                  onChange={(e) => setFormData({ ...formData, disposisi_kabid: e.target.value })}
                  placeholder="Disposisi dari Kabid"
                  data-testid="input-disposisi-kabid"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposisi_kasubbid">Disposisi Kasubbid</Label>
                <Textarea
                  id="disposisi_kasubbid"
                  value={formData.disposisi_kasubbid}
                  onChange={(e) => setFormData({ ...formData, disposisi_kasubbid: e.target.value })}
                  placeholder="Disposisi dari Kasubbid"
                  data-testid="input-disposisi-kasubbid"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Tugaskan ke Unit</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(value) => {
                  const unit = settings.units?.find((u: any) => u.id === value)
                  setFormData({ 
                    ...formData, 
                    unit_id: value,
                    unit_name: unit?.name || ''
                  })
                }}
              >
                <SelectTrigger data-testid="select-unit">
                  <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                  {settings.units?.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} data-testid="submit-button">
                {loading ? 'Menyimpan...' : 'Simpan Dumas'}
              </Button>
              <Link href="/dumas">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
