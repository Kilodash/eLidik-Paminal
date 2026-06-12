import { redirect } from 'next/navigation'
import { getUser, getPersonel } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SetupForm } from './setup-form'

export default async function SetupPage() {
  const admin = createAdminClient()

  // We no longer require user to be logged in to access setup
  // because setup is now the registration form for the first admin AND tenant

  async function handleRegister(fd: FormData) {
    'use server'
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()

    const email = fd.get('email') as string
    const password = fd.get('password') as string
    
    const tenantNama = fd.get('tenant_nama') as string
    const tenantKode = (fd.get('tenant_kode') as string).toUpperCase()
    const tenantAlamat = fd.get('tenant_alamat') as string

    // 1. Create tenant record
    const { data: tenantData, error: tenantErr } = await admin.from('tenants').insert({
      nama: tenantNama,
      kode: tenantKode,
      alamat: tenantAlamat
    }).select().single()

    if (tenantErr || !tenantData) {
      console.error('Create tenant error:', tenantErr)
      return { error: 'Gagal membuat instansi. Kode mungkin sudah dipakai.' }
    }

    // 2. Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr || !authData.user) {
      console.error('Create user error:', authErr)
      // rollback tenant
      await admin.from('tenants').delete().eq('id', tenantData.id)
      return { error: authErr?.message || 'Gagal membuat akun admin' }
    }

    // 3. Create personel record
    // We must manually generate an UUID for id because Supabase auth.users FK split left the table without default UUID generator active on existing column
    // Note: Since schema cache doesn't recognize user_id right now, we fallback to id = authData.user.id
    const { error: dbErr } = await admin.from('personel').insert({
      id: authData.user.id,
      tenant_id: tenantData.id,
      role: fd.get('role') as string,
      nama_lengkap: fd.get('nama_lengkap') as string,
    })
    
    if (dbErr) {
      console.error('Create personel error:', dbErr)
      // Cleanup auth user and tenant if db insert fails
      await admin.auth.admin.deleteUser(authData.user.id)
      await admin.from('tenants').delete().eq('id', tenantData.id)
      return { error: 'Gagal menyimpan data personel' }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-50">
      <Card className="w-full max-w-md border-0 ring-1 ring-border/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Registrasi Admin Instansi</CardTitle>
          <CardDescription>
            Buat akun admin untuk instansi Anda. Setelah terdaftar, Anda dapat menambahkan akun untuk unit lain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupForm
            onSubmitAction={handleRegister}
          />
        </CardContent>
      </Card>
    </div>
  )
}

