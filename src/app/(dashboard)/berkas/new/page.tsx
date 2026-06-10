import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { getUnitList } from '@/lib/data/master'
import { getAvailablePengaduan } from '@/lib/data/berkas'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, FileText } from 'lucide-react'

export default async function NewBerkasPage() {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const units = await getUnitList()
  const pengaduan = await getAvailablePengaduan()

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Buat Berkas" description="Gabungkan Dumas ke dalam satu berkas tindak lanjut" />

      <form action={handleCreate} className="space-y-6">
        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Informasi Berkas
            </CardTitle>
            <CardDescription>Judul dan unit penanganan berkas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="judul">Judul Berkas</Label>
              <Input name="judul" placeholder="Contoh: Berkas Penanganan Dumas a.n. Andi" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit Penanganan</Label>
              <Select name="unit_id" required>
                <SelectTrigger><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Pilih Dumas
            </CardTitle>
            <CardDescription>Pengaduan yang belum digabung ke berkas lain</CardDescription>
          </CardHeader>
          <CardContent>
            {pengaduan.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">Tidak ada Dumas yang tersedia untuk digabung</p>
              </div>
            ) : (
              <div className="rounded-lg border p-1 space-y-0.5 max-h-64 overflow-y-auto">
                {pengaduan.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-accent/50 p-2.5 rounded-md transition-colors">
                    <input type="checkbox" name="pengaduan_ids" value={p.id} className="rounded h-4 w-4" />
                    <span className="font-mono font-medium">{p.nomor_register}</span>
                    <Badge variant="outline" className="text-xs">{p.jenis}</Badge>
                    <span className="text-muted-foreground truncate flex-1">{p.pelapor_nama || 'Anonim'}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <input type="hidden" name="operator_id" value={personel.id} />
        <Button type="submit" size="lg" className="w-full">Buat Berkas</Button>
      </form>
    </div>
  )
}

async function handleCreate(formData: FormData) {
  'use server'
  const { createBerkas } = await import('@/lib/data/berkas')
  const ids = formData.getAll('pengaduan_ids') as string[]

  const result = await createBerkas({
    judul: formData.get('judul') as string,
    unit_id: formData.get('unit_id') as string,
    operator_id: formData.get('operator_id') as string,
    pengaduan_ids: ids,
  })

  redirect(`/berkas/${result.id}`)
}
