import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Plus, Trash2, AlertTriangle } from 'lucide-react'

export default async function WilayahPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const tenantId = await requireTenant()
  const supabase = await createClient()

  const { data: list, error: fetchError } = await supabase.from('wilayah_satker').select('*').eq('tenant_id', tenantId).order('nama')

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Pengaturan Wilayah / Satker" description="Kelola data wilayah dan satuan kerja" />

      {fetchError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Tabel belum tersedia</p>
            <p className="mt-1">Jalankan migration <code className="bg-destructive/10 px-1 rounded">008_pengaturan.sql</code> di Supabase terlebih dahulu.</p>
            <p className="text-xs mt-1">{fetchError.message}</p>
          </div>
        </div>
      )}

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Tambah Wilayah / Satker
          </CardTitle>
          <CardDescription>Kode dan nama wilayah atau satker</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (fd: FormData) => {
            'use server'
            const { requireTenant } = await import('@/lib/auth')
            const supabase = await (await import('@/lib/supabase/server')).createClient()
            const tid = await requireTenant()
            const { error } = await supabase.from('wilayah_satker').insert({
              tenant_id: tid,
              kode: fd.get('kode') as string || null,
              nama: fd.get('nama') as string,
            })
            if (error) redirect('/pengaturan/wilayah?error=insert')
            redirect('/pengaturan/wilayah')
          }} className="flex items-end gap-3">
            <div className="w-32 space-y-1.5">
              <Label htmlFor="kode" className="text-xs">Kode</Label>
              <Input name="kode" placeholder="JKT" className="h-9" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="nama" className="text-xs">Nama</Label>
              <Input name="nama" placeholder="Nama wilayah atau satker" required className="h-9" />
            </div>
            <Button type="submit" size="sm" className="h-9"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base">Daftar Wilayah / Satker ({(list || []).length})</CardTitle>
          <CardDescription>Data wilayah dan satuan kerja terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm stripe-table">
              <thead>
                <tr className="bg-primary/5">
                  <th className="text-left p-3 font-semibold text-primary w-12">No</th>
                  <th className="text-left p-3 font-semibold text-primary">Kode</th>
                  <th className="text-left p-3 font-semibold text-primary">Nama</th>
                  <th className="text-right p-3 font-semibold text-primary w-16">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(list || []).map((w, i) => (
                  <tr key={w.id} className="border-t">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-mono text-xs">{w.kode || '-'}</td>
                    <td className="p-3 font-medium">{w.nama}</td>
                    <td className="p-3 text-right">
                      <form action={async (fd: FormData) => {
                        'use server'
                        const supabase = await (await import('@/lib/supabase/server')).createClient()
                        await supabase.from('wilayah_satker').delete().eq('id', fd.get('id') as string)
                        redirect('/pengaturan/wilayah')
                      }}>
                        <input type="hidden" name="id" value={w.id} />
                        <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!list || list.length === 0) && !fetchError && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
