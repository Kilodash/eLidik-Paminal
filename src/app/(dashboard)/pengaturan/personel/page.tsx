import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getPersonelList, getPersonelById } from '@/lib/data/personel'
import { ConfirmDeletePersonel } from '@/components/personel/confirm-delete'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Trash2, Pencil, Search } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{
    page?: string
    q?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    edit?: string
  }>
}

export default async function PersonelPage({ searchParams }: Props) {
  const currentUser = await getPersonel()
  if (!currentUser || currentUser.role === 'operator_unit') redirect('/')

  const sp = await searchParams
  const page = parseInt(sp.page || '1', 10)
  const query = sp.q || ''
  const sortBy = sp.sortBy || 'default'
  const sortOrder = sp.sortOrder || 'asc'
  const editId = sp.edit || ''

  const tenantId = await requireTenant()
  const supabase = await createClient()

  // Fetch paginated, searched, and sorted personnel list
  const { data: list, total, limit } = await getPersonelList({
    page,
    query,
    sortBy,
    sortOrder,
  })

  // Load editing data if editId is provided
  let editData = null
  if (editId) {
    editData = await getPersonelById(editId).catch(() => null)
  }

  const { data: units } = await supabase
    .from('organizations')
    .select('id, nama')
    .eq('tenant_id', tenantId)
    .eq('tipe', 'unit')
    .order('nama')

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Pengaturan Personel" description="Kelola data personel unit dan tim" />

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        <Card className="border-0 ring-1 ring-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {editData ? 'Edit Personel' : 'Tambah Personel'}
            </CardTitle>
            <CardDescription>
              {editData ? 'Ubah data anggota personel terdaftar' : 'Daftarkan anggota baru — tidak memerlukan akun auth'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (fd: FormData) => {
              'use server'
              const { requireTenant } = await import('@/lib/auth')
              const { createClient } = await import('@/lib/supabase/server')
              const tid = await requireTenant()
              const supabase = await createClient()
              
              const editIdVal = fd.get('editId') as string | null

              const payload = {
                nip: fd.get('nip') as string || null,
                nama_lengkap: fd.get('nama_lengkap') as string,
                pangkat: fd.get('pangkat') as string || null,
                jabatan: fd.get('jabatan') as string || null,
                kesatuan: fd.get('kesatuan') as string || null,
                tim: fd.get('tim') as string || null,
                organization_id: (fd.get('organization_id') === '--' ? null : fd.get('organization_id') as string) || null,
              }

              if (editIdVal) {
                await supabase.from('personel').update(payload).eq('id', editIdVal).eq('tenant_id', tid)
              } else {
                await supabase.from('personel').insert({
                  ...payload,
                  tenant_id: tid,
                })
              }
              redirect('/pengaturan/personel')
            }} key={editId || 'new'} className="space-y-4">
              {editData && <input type="hidden" name="editId" value={editData.id} />}
              
              <div className="space-y-1.5">
                <Label htmlFor="nip" className="text-xs">NRP/NIP</Label>
                <Input name="nip" placeholder="NRP" defaultValue={editData?.nip || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nama_lengkap" className="text-xs">Nama Lengkap</Label>
                <Input name="nama_lengkap" placeholder="Nama" required defaultValue={editData?.nama_lengkap || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pangkat" className="text-xs">Pangkat</Label>
                <Input name="pangkat" placeholder="Pangkat" defaultValue={editData?.pangkat || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jabatan" className="text-xs">Jabatan</Label>
                <Input name="jabatan" placeholder="Jabatan" defaultValue={editData?.jabatan || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kesatuan" className="text-xs">Kesatuan</Label>
                <Input name="kesatuan" placeholder="Kesatuan" defaultValue={editData?.kesatuan || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tim" className="text-xs">Tim</Label>
                <Input name="tim" placeholder="Tim" defaultValue={editData?.tim || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization_id" className="text-xs">Unit</Label>
                <Select name="organization_id" defaultValue={editData?.organization_id || '--'}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--">--</SelectItem>
                    {(units || []).map((u) => <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 space-y-2">
                <Button type="submit" size="sm" className="w-full h-9">
                  {editData ? 'Simpan Perubahan' : 'Tambah Personel'}
                </Button>
                {editData && (
                  <Link href="/pengaturan/personel" className="block w-full">
                    <Button type="button" variant="outline" size="sm" className="w-full h-9">
                      Batal Edit
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <form method="GET" action="/pengaturan/personel" className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px] space-y-1.5">
                  <Label htmlFor="q" className="text-xs">Kata Kunci</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input name="q" placeholder="Cari nama, pangkat, NRP, jabatan..." defaultValue={query} className="pl-8 h-9" />
                  </div>
                </div>
                <div className="w-44 space-y-1.5">
                  <Label htmlFor="sortBy" className="text-xs">Urutkan Berdasarkan</Label>
                  <Select name="sortBy" defaultValue={sortBy}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Jabatan)</SelectItem>
                      <SelectItem value="nama">Nama</SelectItem>
                      <SelectItem value="pangkat">Pangkat</SelectItem>
                      <SelectItem value="nip">NRP/NIP</SelectItem>
                      <SelectItem value="jabatan">Jabatan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-36 space-y-1.5">
                  <Label htmlFor="sortOrder" className="text-xs">Arah</Label>
                  <Select name="sortOrder" defaultValue={sortOrder}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Menaik (ASC)</SelectItem>
                      <SelectItem value="desc">Menurun (DESC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="h-9 font-semibold">Cari</Button>
                  {(query || sortBy !== 'default' || sortOrder !== 'asc') && (
                    <Link href="/pengaturan/personel">
                      <Button type="button" variant="outline" size="sm" className="h-9">
                        Reset
                      </Button>
                    </Link>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-base">Daftar Personel ({total})</CardTitle>
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
                      <th className="text-right p-3 font-semibold text-primary w-24 whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(list || []).map((p, i) => {
                      const editUrl = `/pengaturan/personel?edit=${p.id}&page=${page}&q=${query}&sortBy=${sortBy}&sortOrder=${sortOrder}`
                      return (
                        <tr key={p.id} className="border-t hover:bg-muted/50 transition-colors">
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 text-muted-foreground hover:no-underline">
                              {(page - 1) * limit + i + 1}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 font-mono text-xs whitespace-nowrap hover:no-underline text-foreground">
                              {p.nip || '-'}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 font-medium whitespace-nowrap hover:no-underline text-foreground">
                              {p.nama_lengkap || '-'}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 whitespace-nowrap hover:no-underline text-foreground">
                              {p.pangkat || '-'}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 whitespace-nowrap hover:no-underline text-foreground">
                              {p.jabatan || '-'}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 whitespace-nowrap hover:no-underline text-foreground">
                              {p.kesatuan || '-'}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 whitespace-nowrap hover:no-underline text-foreground">
                              {(p.org as unknown as { nama: string })?.nama || '-'}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={editUrl} className="block p-3 whitespace-nowrap hover:no-underline text-foreground">
                              {p.tim || '-'}
                            </Link>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                            <Link href={editUrl}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <ConfirmDeletePersonel id={p.id} nama={p.nama_lengkap || 'Personel'} />
                          </td>
                        </tr>
                      )
                    })}
                    {(list || []).length === 0 && (
                      <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Belum ada personel</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span className="font-medium">Total {total} personel</span>
                  <div className="flex items-center gap-2">
                    <Link href={`/pengaturan/personel?page=${page - 1}&q=${query}&sortBy=${sortBy}&sortOrder=${sortOrder}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                      <Button variant="outline" size="sm" disabled={page <= 1}>
                        Sebelumnya
                      </Button>
                    </Link>
                    <span className="px-2 font-medium tabular-nums">{page} / {totalPages}</span>
                    <Link href={`/pengaturan/personel?page=${page + 1}&q=${query}&sortBy=${sortBy}&sortOrder=${sortOrder}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
                      <Button variant="outline" size="sm" disabled={page >= totalPages}>
                        Berikutnya
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

