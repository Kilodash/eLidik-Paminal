import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function OrganisasiPage({ searchParams }: Props) {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const sp = await searchParams
  const tenantId = await requireTenant()
  const supabase = await createClient()

    const { data: orgs } = await supabase.from('organizations').select('*').eq('tenant_id', tenantId).order('tipe').order('nama')

  return (
    <div className="space-y-6 max-w-4xl">
      {sp.error === 'delete_fk' && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Unit tidak dapat dihapus karena masih digunakan oleh personel atau pengaduan. Pindahkan data terlebih dahulu.
        </div>
      )}
      <PageHeader title="Pengaturan Organisasi" description="Data instansi dan struktur organisasi" />

      
      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base">Pejabat Penandatangan</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <PejabatForm tenantId={tenantId} />
        </CardContent>
      </Card>

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Struktur Unit ({orgs?.length || 0})</CardTitle>
            <CardDescription></CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={async (fd: FormData) => {
            'use server'
            const { requireTenant } = await import('@/lib/auth')
            const supabase = await (await import('@/lib/supabase/server')).createClient()
            const tid = await requireTenant()
            await supabase.from('organizations').insert({
              tenant_id: tid,
              tipe: fd.get('tipe') as string,
              kode: fd.get('kode') as string || null,
              nama: fd.get('nama') as string,
            })
            redirect('/pengaturan/organisasi')
          }} className="flex items-end gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-32 space-y-1.5">
              <Label htmlFor="tipe" className="text-xs">Tipe</Label>
              <Select name="tipe" required>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subbid">Subbid</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="kode" className="text-xs">Kode</Label>
              <Input name="kode" placeholder="UNIT-A" className="h-9" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="nama" className="text-xs">Nama</Label>
              <Input name="nama" placeholder="Nama unit" required className="h-9" />
            </div>
            <Button type="submit" size="sm" className="h-9"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </form>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm stripe-table">
              <thead>
                <tr className="bg-primary/5">
                  <th className="text-left p-3 font-semibold text-primary">Tipe</th>
                  <th className="text-left p-3 font-semibold text-primary">Kode</th>
                  <th className="text-left p-3 font-semibold text-primary">Nama</th>
                  <th className="text-right p-3 font-semibold text-primary w-16">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(orgs || []).map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {o.tipe}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{o.kode || '-'}</td>
                    <td className="p-3 font-medium">{o.nama}</td>
                    <td className="p-3 text-right">
                      <form action={async (fd: FormData) => {
                        'use server'
                        const supabase = await (await import('@/lib/supabase/server')).createClient()
                        const { error } = await supabase.from('organizations').delete().eq('id', fd.get('id') as string)
                        if (error) redirect('/pengaturan/organisasi?error=delete_fk')
                        redirect('/pengaturan/organisasi')
                      }}>
                        <input type="hidden" name="id" value={o.id} />
                        <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!orgs || orgs.length === 0) && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Belum ada unit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function PejabatForm({ tenantId }: { tenantId: string }) {
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: vars } = await supabase.from('tenant_variables')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('key', ['nama_kabid', 'pangkat_kabid', 'nip_kabid', 'nama_kasubbid', 'pangkat_kasubbid', 'nrp_kasubbid'])
    .order('key')

  const map: Record<string, string> = {}
  for (const v of (vars || [])) { map[v.key] = v.value || '' }

  return (
    <form action={async (fd: FormData) => {
      'use server'
      const { requireTenant } = await import('@/lib/auth')
      const supabase = await (await import('@/lib/supabase/server')).createClient()
      const tid = await requireTenant()
      const keys = ['nama_kabid', 'pangkat_kabid', 'nip_kabid', 'nama_kasubbid', 'pangkat_kasubbid', 'nrp_kasubbid']
      for (const key of keys) {
        const value = (fd.get(key) as string) || ''
        const { data: existing } = await supabase.from('tenant_variables').select('id').eq('tenant_id', tid).eq('key', key).maybeSingle()
        if (existing) {
          await supabase.from('tenant_variables').update({ value }).eq('id', existing.id)
        } else {
          await supabase.from('tenant_variables').insert({ tenant_id: tid, key, value })
        }
      }
      redirect('/pengaturan/organisasi')
    }} className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/10">
        <Label className="text-sm font-semibold mb-3 block">Kabidpropam</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nama_kabid" className="text-xs text-muted-foreground">Nama</Label>
            <Input name="nama_kabid" defaultValue={map.nama_kabid} placeholder="Nama Kabid" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pangkat_kabid" className="text-xs text-muted-foreground">Pangkat</Label>
            <Input name="pangkat_kabid" defaultValue={map.pangkat_kabid} placeholder="Pangkat" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nip_kabid" className="text-xs text-muted-foreground">NIP/NRP</Label>
            <Input name="nip_kabid" defaultValue={map.nip_kabid} placeholder="NIP" className="h-9" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-muted/10">
        <Label className="text-sm font-semibold mb-3 block">Kasubbid Paminal</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nama_kasubbid" className="text-xs text-muted-foreground">Nama</Label>
            <Input name="nama_kasubbid" defaultValue={map.nama_kasubbid} placeholder="Nama Kasubbid" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pangkat_kasubbid" className="text-xs text-muted-foreground">Pangkat</Label>
            <Input name="pangkat_kasubbid" defaultValue={map.pangkat_kasubbid} placeholder="Pangkat" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nrp_kasubbid" className="text-xs text-muted-foreground">NIP/NRP</Label>
            <Input name="nrp_kasubbid" defaultValue={map.nrp_kasubbid} placeholder="NIP" className="h-9" />
          </div>
        </div>
      </div>

      <Button type="submit">Simpan Pejabat</Button>
    </form>
  )
}
