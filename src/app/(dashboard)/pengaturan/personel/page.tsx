import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Plus, Trash2 } from 'lucide-react'

export default async function PersonelPage() {
  const currentUser = await getPersonel()
  if (!currentUser || currentUser.role === 'operator_unit') redirect('/')

  const tenantId = await requireTenant()
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('personel')
    .select('*, org:organizations(nama)')
    .eq('tenant_id', tenantId)
    .order('nama_lengkap')

  const { data: units } = await supabase.from('organizations').select('id, nama').eq('tenant_id', tenantId).eq('tipe', 'unit').order('nama')

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Pengaturan Personel" description="Kelola data personel unit dan tim" />

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        <Card className="border-0 ring-1 ring-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Tambah Personel
            </CardTitle>
            <CardDescription>Daftarkan anggota baru — tidak memerlukan akun auth</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (fd: FormData) => {
              'use server'
              const { requireTenant } = await import('@/lib/auth')
              const supabase = await (await import('@/lib/supabase/server')).createClient()
              const tid = await requireTenant()
              await supabase.from('personel').insert({
                tenant_id: tid,
                nip: fd.get('nip') as string || null,
                nama_lengkap: fd.get('nama_lengkap') as string,
                pangkat: fd.get('pangkat') as string || null,
                jabatan: fd.get('jabatan') as string || null,
                kesatuan: fd.get('kesatuan') as string || null,
                tim: fd.get('tim') as string || null,
                organization_id: fd.get('organization_id') as string || null,
              })
              redirect('/pengaturan/personel')
            }} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nip" className="text-xs">NRP/NIP</Label>
                <Input name="nip" placeholder="NRP" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nama_lengkap" className="text-xs">Nama Lengkap</Label>
                <Input name="nama_lengkap" placeholder="Nama" required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pangkat" className="text-xs">Pangkat</Label>
                <Input name="pangkat" placeholder="Pangkat" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jabatan" className="text-xs">Jabatan</Label>
                <Input name="jabatan" placeholder="Jabatan" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kesatuan" className="text-xs">Kesatuan</Label>
                <Input name="kesatuan" placeholder="Kesatuan" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tim" className="text-xs">Tim</Label>
                <Input name="tim" placeholder="Tim" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization_id" className="text-xs">Unit</Label>
                <Select name="organization_id">
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                  <SelectContent>
                    {(units || []).map((u) => <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" className="w-full h-9"><Plus className="h-4 w-4 mr-1" />Tambah Personel</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base">Daftar Personel ({(list || []).length})</CardTitle>
            <CardDescription>Data personel terdaftar di instansi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm stripe-table">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="text-left p-3 font-semibold text-primary w-8">No</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">NRP/NIP</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">Nama</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">Pangkat</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">Jabatan</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">Kesatuan</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">Unit</th>
                    <th className="text-left p-3 font-semibold text-primary whitespace-nowrap">Tim</th>
                    <th className="text-right p-3 font-semibold text-primary w-16 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(list || []).map((p, i) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-mono text-xs whitespace-nowrap">{p.nip || '-'}</td>
                      <td className="p-3 font-medium whitespace-nowrap">{p.nama_lengkap || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{p.pangkat || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{p.jabatan || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{p.kesatuan || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{(p.org as unknown as { nama: string })?.nama || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{p.tim || '-'}</td>
                      <td className="p-3 text-right">
                        <form action={async (fd: FormData) => {
                          'use server'
                          const supabase = await (await import('@/lib/supabase/server')).createClient()
                          await supabase.from('personel').delete().eq('id', fd.get('id') as string)
                          redirect('/pengaturan/personel')
                        }}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button variant="ghost" size="icon" type="submit" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {(!list || list.length === 0) && (
                    <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">Belum ada personel</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
