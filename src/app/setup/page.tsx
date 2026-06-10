import { redirect } from 'next/navigation'
import { getUser, getPersonel } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default async function SetupPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const personel = await getPersonel()
  if (personel) redirect('/')

  const admin = createAdminClient()

  const { data: tenants } = await admin.from('tenants').select('id, kode, nama').order('nama')
  const { data: units } = await admin.from('organizations').select('id, nama').order('nama')

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-50">
      <Card className="w-full max-w-md border-0 ring-1 ring-border/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Setup Akun Personel</CardTitle>
          <CardDescription>
            Akun Anda belum terdaftar di sistem. Lengkapi data di bawah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (fd: FormData) => {
              'use server'
              const { getUser } = await import('@/lib/auth')
              const { createAdminClient } = await import('@/lib/supabase/admin')
              const u = await getUser()
              if (!u) redirect('/login')

              const admin = createAdminClient()
              await admin.from('personel').insert({
                id: u.id,
                tenant_id: fd.get('tenant_id') as string,
                organization_id: fd.get('organization_id') as string || null,
                role: fd.get('role') as string,
                nip: fd.get('nip') as string || null,
                nama_lengkap: fd.get('nama_lengkap') as string,
                pangkat: fd.get('pangkat') as string || null,
                jabatan: fd.get('jabatan') as string || null,
                kesatuan: fd.get('kesatuan') as string || null,
              })
              redirect('/')
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="tenant_id" className="text-xs">Instansi (Polda)</Label>
              <Select name="tenant_id" required>
                <SelectTrigger><SelectValue placeholder="Pilih Polda" /></SelectTrigger>
                <SelectContent>
                  {(tenants || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nama} ({t.kode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs">Role</Label>
              <Select name="role" required>
                <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oversight">Oversight (Bidpropam)</SelectItem>
                  <SelectItem value="admin_subbid">Admin Subbid</SelectItem>
                  <SelectItem value="operator_unit">Operator Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_id" className="text-xs">Unit (opsional)</Label>
              <Select name="organization_id">
                <SelectTrigger><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                <SelectContent>
                  {(units || []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nip" className="text-xs">NRP/NIP</Label>
                <Input name="nip" placeholder="NRP" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pangkat" className="text-xs">Pangkat</Label>
                <Input name="pangkat" placeholder="Pangkat" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_lengkap" className="text-xs">Nama Lengkap</Label>
              <Input name="nama_lengkap" placeholder="Nama" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="jabatan" className="text-xs">Jabatan</Label>
                <Input name="jabatan" placeholder="Jabatan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kesatuan" className="text-xs">Kesatuan</Label>
                <Input name="kesatuan" placeholder="Kesatuan" />
              </div>
            </div>

            {(!tenants || tenants.length === 0) && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                Belum ada instansi (tenant) terdaftar. Hubungi administrator untuk membuat tenant terlebih dahulu.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!tenants || tenants.length === 0}>
              Daftarkan Akun
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
