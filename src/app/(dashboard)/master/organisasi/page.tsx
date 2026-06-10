import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

export default async function OrganisasiPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const tenantId = await requireTenant()
  const supabase = await createClient()
  const { data: orgs } = await supabase.from('organizations').select('*').eq('tenant_id', tenantId).order('tipe').order('nama')

  return (
    <div>
      <PageHeader title="Organisasi" description="Kelola struktur organisasi (Bidpropam, Subbid, Unit)" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Tambah</CardTitle></CardHeader>
          <CardContent>
            <form action={handleAdd} className="space-y-3">
              <div className="space-y-2"><Label htmlFor="tipe">Tipe</Label>
                <Select name="tipe" required>
                  <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subbid">Subbid Paminal</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="kode">Kode</Label><Input name="kode" placeholder="UNIT-A" /></div>
              <div className="space-y-2"><Label htmlFor="nama">Nama</Label><Input name="nama" placeholder="Unit A" required /></div>
              <Button type="submit"><Plus className="h-4 w-4 mr-2" />Tambah</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Daftar ({orgs?.length || 0})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {(orgs || []).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground mr-2">[{o.tipe}]</span>
                  <span>{o.nama}</span>
                  {o.kode && <span className="font-mono text-xs text-muted-foreground ml-2">({o.kode})</span>}
                </div>
              </div>
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
  await supabase.from('organizations').insert({
    tenant_id: tenantId,
    tipe: fd.get('tipe') as string,
    kode: fd.get('kode') as string || null,
    nama: fd.get('nama') as string,
  })
  redirect('/master/organisasi')
}
