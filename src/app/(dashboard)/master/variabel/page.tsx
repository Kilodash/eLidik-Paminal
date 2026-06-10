import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

export default async function VariabelPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const tenantId = await requireTenant()
  const supabase = await createClient()
  const { data: vars } = await supabase.from('tenant_variables').select('*').eq('tenant_id', tenantId).order('key')

  const DEFAULT_KEYS = [
    'kop_surat', 'nama_polda', 'alamat', 'kode_polda',
    'nama_kabid', 'pangkat_kabid', 'nip_kabid', 'ttd_kabid',
    'nama_kasi', 'pangkat_kasi', 'nip_kasi',
  ]

  return (
    <div>
      <PageHeader title="Variabel Tenant" description="Pengaturan identitas & pejabat di template dokumen" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-lg">Variabel ({vars?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(vars || []).map((v) => (
              <form key={v.id} action={handleUpdate} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-mono">{v.key}</Label>
                  <Input name="value" defaultValue={v.value || ''} />
                </div>
                <input type="hidden" name="id" value={v.id} />
                <Button type="submit" size="sm">Simpan</Button>
              </form>
            ))}
            <form action={handleAdd} className="flex items-end gap-2 pt-4 border-t">
              <div className="flex-1 space-y-2">
                <Label htmlFor="key">Key baru</Label>
                <Input name="key" placeholder="nama_kasat" required />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input name="value" />
              </div>
              <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function handleAdd(fd: FormData) {
  'use server'
  const { requireTenant } = await import('@/lib/auth')
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const tenantId = await requireTenant()
  await supabase.from('tenant_variables').insert({ tenant_id: tenantId, key: fd.get('key') as string, value: fd.get('value') as string || '' })
  redirect('/master/variabel')
}

async function handleUpdate(fd: FormData) {
  'use server'
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  await supabase.from('tenant_variables').update({ value: fd.get('value') as string || '' }).eq('id', fd.get('id') as string)
  redirect('/master/variabel')
}
