import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VariabelForm } from './components/variabel-form'
import { VariabelAddForm } from './components/variabel-add-form'

export default async function VariabelPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const tenantId = await requireTenant()
  const supabase = await createClient()
  const { data: vars } = await supabase.from('tenant_variables').select('*').eq('tenant_id', tenantId).order('key')

  return (
    <div>
      <PageHeader title="Variabel Tenant" description="Pengaturan identitas & pejabat di template dokumen" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-lg">Variabel ({vars?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(vars || []).map((v) => (
              <VariabelForm 
                key={v.id} 
                id={v.id} 
                varKey={v.key} 
                initialValue={v.value || ''} 
                action={handleUpdate} 
              />
            ))}
            <VariabelAddForm action={handleAdd} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function handleAdd(state: any, fd: FormData) {
  'use server'
  try {
    const { requireTenant } = await import('@/lib/auth')
    const { revalidatePath } = await import('next/cache')
    const supabase = await (await import('@/lib/supabase/server')).createClient()
    const tenantId = await requireTenant()
    
    const key = fd.get('key') as string
    const value = fd.get('value') as string || ''
    
    const { error } = await supabase.from('tenant_variables').insert({ tenant_id: tenantId, key, value })
    
    if (error) throw new Error(error.message)
      
    revalidatePath('/master/variabel')
    return { success: true, message: 'Variabel berhasil ditambahkan' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menambahkan variabel' }
  }
}

async function handleUpdate(state: any, fd: FormData) {
  'use server'
  try {
    const { revalidatePath } = await import('next/cache')
    const supabase = await (await import('@/lib/supabase/server')).createClient()
    
    const id = fd.get('id') as string
    const value = fd.get('value') as string || ''
    
    const { error } = await supabase.from('tenant_variables').update({ value }).eq('id', id)
    
    if (error) throw new Error(error.message)
      
    revalidatePath('/master/variabel')
    return { success: true, message: 'Variabel berhasil diperbarui' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memperbarui variabel' }
  }
}
