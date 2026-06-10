import { notFound, redirect } from 'next/navigation'
import { getBerkasById, updateBerkas, getBerkasNotes, addBerkasNote, getTindakLanjut, updateTindakLanjut } from '@/lib/data/berkas'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface Props { params: Promise<{ id: string }> }

export default async function BerkasDetailPage({ params }: Props) {
  const { id } = await params
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const berkas = await getBerkasById(id).catch(() => null)
  if (!berkas) notFound()

  const notes = await getBerkasNotes(id)
  const tl = await getTindakLanjut(id)
  const unit = berkas.unit as unknown as { nama: string } | null

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader title={berkas.nomor_berkas || 'Berkas'} description={berkas.judul || ''}>
        <StatusBadge status={berkas.status} className="text-sm px-3 py-1" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Dumas dalam berkas */}
          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Dumas dalam Berkas</CardTitle>
              <CardDescription>Daftar pengaduan yang tergabung dalam berkas ini</CardDescription>
            </CardHeader>
            <CardContent>
              {berkas.pengaduan?.length ? (
                <div className="space-y-1">
                  {(berkas.pengaduan as Array<Record<string, unknown>>).map((p) => (
                    <Link key={String(p.id)} href={`/pengaduan/${p.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-sm">
                      <span className="font-mono font-medium">{String(p.nomor_register || '-')}</span>
                      <Badge variant="outline">{String(p.jenis || '-')}</Badge>
                      <StatusBadge status={String(p.status || '')} />
                      <span className="ml-auto text-muted-foreground text-xs">Lihat →</span>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm">Belum ada Dumas</p>}
            </CardContent>
          </Card>

          {/* Tindak Lanjut */}
          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tindak Lanjut</CardTitle>
                <CardDescription>Progres penanganan berkas</CardDescription>
              </div>
              {tl && <StatusBadge status={tl.status_tl} />}
            </CardHeader>
            <CardContent className="space-y-4">
              {tl ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <Label className="text-muted-foreground text-xs">Target</Label>
                      <p className="font-medium mt-0.5">{tl.tgl_target || '-'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <Label className="text-muted-foreground text-xs">Selesai</Label>
                      <p className="font-medium mt-0.5">{tl.tgl_selesai || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Deskripsi</Label>
                    <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm">{tl.deskripsi || '-'}</div>
                  </div>
                  <Separator />
                  <form action={async (fd: FormData) => {
                    'use server'
                    await updateTindakLanjut(id, {
                      deskripsi: fd.get('deskripsi') as string,
                      status_tl: fd.get('status_tl') as string,
                      tgl_selesai: fd.get('status_tl') === 'selesai' ? new Date().toISOString().split('T')[0] : undefined,
                    })
                    redirect(`/berkas/${id}`)
                  }} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="deskripsi" className="text-xs text-muted-foreground">Update Progres</Label>
                      <Input name="deskripsi" placeholder="Catatan progres..." />
                    </div>
                    <Select name="status_tl" defaultValue={tl.status_tl}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="selesai">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" size="sm">Update</Button>
                  </form>
                </>
              ) : <p className="text-muted-foreground text-sm">Belum ada tindak lanjut</p>}
            </CardContent>
          </Card>

          {/* Catatan Internal */}
          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Catatan Internal</CardTitle>
              <CardDescription>Diskusi dan catatan tim</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="text-sm p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {String(((n.user as unknown as { nama_lengkap: string })?.nama_lengkap || '-')[0]).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-sm">{(n.user as unknown as { nama_lengkap: string })?.nama_lengkap || '-'}</span>
                          <span className="text-xs text-muted-foreground ml-2">{new Date(n.created_at).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <p className="pl-9">{n.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada catatan</p>
              )}
              <Separator />
              <form action={async (fd: FormData) => {
                'use server'
                const c = fd.get('content') as string
                if (c.trim()) {
                  await addBerkasNote(id, personel.id, c)
                }
                redirect(`/berkas/${id}`)
              }} className="flex gap-2">
                <Input name="content" placeholder="Tambah catatan..." className="flex-1" />
                <Button type="submit" size="sm">Kirim</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 ring-1 ring-border/50 sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Update Status Berkas</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (fd: FormData) => {
                'use server'
                await updateBerkas(id, { status: fd.get('status') as string, tahap: fd.get('tahap') as string || undefined })
                redirect(`/berkas/${id}`)
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                  <Select name="status" defaultValue={berkas.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahap" className="text-xs text-muted-foreground">Tahap</Label>
                  <Select name="tahap" defaultValue={berkas.tahap || ''}>
                    <SelectTrigger><SelectValue placeholder="Pilih tahap" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registrasi">Registrasi</SelectItem>
                      <SelectItem value="verifikasi">Verifikasi</SelectItem>
                      <SelectItem value="lidik_berjalan">Lidik Berjalan</SelectItem>
                      <SelectItem value="lidik_selesai">Lidik Selesai</SelectItem>
                      <SelectItem value="gelar">Gelar Perkara</SelectItem>
                      <SelectItem value="terbukti">Terbukti</SelectItem>
                      <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Update</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Unit</span>
                <span className="font-medium text-foreground">{unit?.nama || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tahun</span>
                <span className="font-medium text-foreground">{berkas.tahun}</span>
              </div>
              <div className="flex justify-between">
                <span>Target</span>
                <span className="font-medium text-foreground">{berkas.tgl_target || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Dibuat</span>
                <span className="font-medium text-foreground">{new Date(berkas.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
