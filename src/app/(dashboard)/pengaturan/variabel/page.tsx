import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Variable, Plus } from 'lucide-react'

export default async function VariabelPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const tenantId = await requireTenant()
  const supabase = await createClient()
  const { data: vars } = await supabase.from('tenant_variables').select('*').eq('tenant_id', tenantId).order('key')

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Pengaturan Variabel Dokumen" description="Placeholder template dokumen dinas ({{key}})" />

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Variable className="h-4 w-4 text-primary" />
            Daftar Variabel ({(vars || []).length})
          </CardTitle>
          <CardDescription>Key = nama placeholder, Value = isi yang akan ditampilkan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(vars || []).map((v) => (
            <form key={v.id} action={async (fd: FormData) => {
              'use server'
              const supabase = await (await import('@/lib/supabase/server')).createClient()
              await supabase.from('tenant_variables').update({ value: fd.get('value') as string || '' }).eq('id', fd.get('id') as string)
              redirect('/pengaturan/variabel')
            }} className="flex items-end gap-3 p-3 rounded-lg bg-muted/20">
              <div className="w-48 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Key</Label>
                <p className="font-mono text-sm font-medium">{v.key}</p>
                <input type="hidden" name="id" value={v.id} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`val-${v.id}`} className="text-xs text-muted-foreground">Value</Label>
                <Input name="value" id={`val-${v.id}`} defaultValue={v.value || ''} className="h-9" />
              </div>
              <Button type="submit" size="sm" className="h-9">Simpan</Button>
            </form>
          ))}

          <div className="border-t pt-4">
            <form action={async (fd: FormData) => {
              'use server'
              const { requireTenant } = await import('@/lib/auth')
              const supabase = await (await import('@/lib/supabase/server')).createClient()
              const tid = await requireTenant()
              await supabase.from('tenant_variables').insert({ tenant_id: tid, key: fd.get('key') as string, value: fd.get('value') as string || '' })
              redirect('/pengaturan/variabel')
            }} className="flex items-end gap-3">
              <div className="w-48 space-y-1.5">
                <Label htmlFor="key" className="text-xs">Key Baru</Label>
                <Input name="key" placeholder="nama_kasat" required className="h-9" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="value" className="text-xs">Value</Label>
                <Input name="value" placeholder="Nilai variabel" className="h-9" />
              </div>
              <Button type="submit" size="sm" className="h-9 shrink-0">
                <Plus className="h-4 w-4 mr-1" />Tambah
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
