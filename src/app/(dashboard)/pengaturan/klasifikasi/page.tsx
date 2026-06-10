import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { getKlasifikasiList } from '@/lib/data/master'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tags, Plus, Trash2 } from 'lucide-react'

export default async function KlasifikasiPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const items = await getKlasifikasiList()

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Pengaturan Klasifikasi" description="Kelola klasifikasi jenis pengaduan" />

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-4 w-4 text-primary" />
            Tambah Klasifikasi
          </CardTitle>
          <CardDescription>Kode dan nama klasifikasi pengaduan</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (fd: FormData) => {
            'use server'
            const { requireTenant } = await import('@/lib/auth')
            const supabase = await (await import('@/lib/supabase/server')).createClient()
            const tid = await requireTenant()
            await supabase.from('klasifikasi').insert({ tenant_id: tid, kode: fd.get('kode') as string || null, nama: fd.get('nama') as string })
            redirect('/pengaturan/klasifikasi')
          }} className="flex items-end gap-3">
            <div className="w-32 space-y-1.5">
              <Label htmlFor="kode" className="text-xs">Kode</Label>
              <Input name="kode" placeholder="DISIPLIN" className="h-9" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="nama" className="text-xs">Nama</Label>
              <Input name="nama" placeholder="Pelanggaran Disiplin" required className="h-9" />
            </div>
            <Button type="submit" size="sm" className="h-9"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base">Daftar Klasifikasi ({items.length})</CardTitle>
          <CardDescription>Klasifikasi yang tersedia untuk pengaduan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm stripe-table">
              <thead>
                <tr className="bg-primary/5">
                  <th className="text-left p-3 font-semibold text-primary">Kode</th>
                  <th className="text-left p-3 font-semibold text-primary">Nama</th>
                  <th className="text-right p-3 font-semibold text-primary w-16">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((k) => (
                  <tr key={k.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{k.kode || '-'}</td>
                    <td className="p-3 font-medium">{k.nama}</td>
                    <td className="p-3 text-right">
                      <form action={async (fd: FormData) => {
                        'use server'
                        const supabase = await (await import('@/lib/supabase/server')).createClient()
                        await supabase.from('klasifikasi').delete().eq('id', fd.get('id') as string)
                        redirect('/pengaturan/klasifikasi')
                      }}>
                        <input type="hidden" name="id" value={k.id} />
                        <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-6 text-muted-foreground">Belum ada klasifikasi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
