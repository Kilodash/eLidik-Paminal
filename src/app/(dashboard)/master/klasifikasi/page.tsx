import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { getKlasifikasiList } from '@/lib/data/master'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

export default async function KlasifikasiPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const items = await getKlasifikasiList()

  return (
    <div>
      <PageHeader title="Klasifikasi" description="Kelola klasifikasi pengaduan" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Tambah Klasifikasi</CardTitle></CardHeader>
          <CardContent>
            <form action={handleAdd} className="space-y-3">
              <div className="space-y-2"><Label htmlFor="kode">Kode</Label><Input name="kode" placeholder="DISIPLIN" /></div>
              <div className="space-y-2"><Label htmlFor="nama">Nama</Label><Input name="nama" placeholder="Pelanggaran Disiplin" required /></div>
              <Button type="submit"><Plus className="h-4 w-4 mr-2" />Tambah</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Daftar ({items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((k) => (
              <form key={k.id} action={handleDelete} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <div>
                  <span className="font-mono text-xs text-muted-foreground mr-2">{k.kode}</span>
                  <span className="text-sm">{k.nama}</span>
                </div>
                <input type="hidden" name="id" value={k.id} />
                <Button variant="ghost" size="icon" type="submit" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function handleAdd(fd: FormData) {
  'use server'
  const { requireTenant } = await import('@/lib/auth')
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const tenantId = await requireTenant()
  await supabase.from('klasifikasi').insert({ tenant_id: tenantId, kode: fd.get('kode') as string || null, nama: fd.get('nama') as string })
  redirect('/master/klasifikasi')
}

async function handleDelete(fd: FormData) {
  'use server'
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const id = fd.get('id') as string
  await supabase.from('klasifikasi').delete().eq('id', id)
  redirect('/master/klasifikasi')
}
