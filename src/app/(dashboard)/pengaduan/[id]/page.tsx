import { notFound, redirect } from 'next/navigation'
import { getPengaduanById, updatePengaduan } from '@/lib/data/pengaduan'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PengaduanDetailPage({ params }: Props) {
  const { id } = await params
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const pengaduan = await getPengaduanById(id).catch(() => null)
  if (!pengaduan) notFound()

  const klas = pengaduan.klasifikasi as unknown as { nama: string } | null
  const unit = pengaduan.unit as unknown as { nama: string } | null

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader title={`${pengaduan.nomor_register || 'Pengaduan'}`} description="Detail pengaduan">
        <StatusBadge status={pengaduan.status} className="text-sm px-3 py-1" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pengaduan</CardTitle>
              <CardDescription>Detail data pengaduan dan pihak terkait</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Jenis</Label>
                  <p className="font-medium mt-0.5">{pengaduan.jenis === 'laporan_informasi' ? 'Laporan Informasi' : 'Pengaduan'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tanggal</Label>
                  <p className="font-medium mt-0.5">{pengaduan.tgl_pengaduan}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Klasifikasi</Label>
                  <p className="font-medium mt-0.5">{klas?.nama || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Unit</Label>
                  <p className="font-medium mt-0.5">{unit?.nama || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Satker Dilaporkan</Label>
                  <p className="font-medium mt-0.5">{pengaduan.satker_dilaporkan || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Nomor Surat</Label>
                  <p className="font-medium mt-0.5">{pengaduan.nomor_surat || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tanggal Surat</Label>
                  <p className="font-medium mt-0.5">{pengaduan.tgl_surat || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Atensi</Label>
                  <p className="mt-0.5">{pengaduan.atensi ? <Badge variant="destructive">Atensi</Badge> : '-'}</p>
                </div>
              </div>
              {pengaduan.berkas_id && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground text-xs">Berkas</Label>
                    <p className="font-mono text-sm font-medium mt-0.5">
                      {(pengaduan.berkas as unknown as { nomor_berkas: string })?.nomor_berkas || pengaduan.berkas_id}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <Label className="text-muted-foreground text-xs">Pelapor</Label>
                <p className="font-medium mt-0.5">{pengaduan.pelapor_nama || 'Anonim'}{pengaduan.pelapor_kontak ? ` (${pengaduan.pelapor_kontak})` : ''}</p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Terlapor</Label>
                {pengaduan.pengaduan_terlapor?.length ? (
                  <ul className="mt-1 space-y-1">
                    {pengaduan.pengaduan_terlapor.map((pt) => {
                      const t = pt.terlapor as Record<string, unknown>
                      return (
                        <li key={String(t.id || '')} className="flex items-center gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {String(t.nama || 'Tidak diketahui')}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic text-sm mt-0.5">Belum ditambahkan</p>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground text-xs">Isi Dumas (Kronologi)</Label>
                <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">
                  {pengaduan.kronologi || '-'}
                </div>
              </div>

              {pengaduan.keterangan && (
                <div className="mt-4">
                  <Label className="text-muted-foreground text-xs">Keterangan</Label>
                  <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">
                    {pengaduan.keterangan}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Status</CardTitle>
              <CardDescription>Log perubahan status pengaduan</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusHistory pengaduanId={id} tenantId={pengaduan.tenant_id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 ring-1 ring-border/50 sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (fd: FormData) => {
                'use server'
                const newStatus = fd.get('status') as string
                const catatan = fd.get('catatan') as string
                await updatePengaduan(id, { status: newStatus })
                const { createClient } = await import('@/lib/supabase/server')
                const supabase = await createClient()
                await supabase.from('status_history').insert({
                  tenant_id: pengaduan.tenant_id,
                  ref_type: 'pengaduan',
                  ref_id: id,
                  status_lama: pengaduan.status,
                  status_baru: newStatus,
                  catatan: catatan || null,
                  user_id: personel.id,
                })
                redirect(`/pengaduan/${id}`)
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs text-muted-foreground">Status Baru</Label>
                  <Select name="status" defaultValue={pengaduan.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diterima">Diterima</SelectItem>
                      <SelectItem value="registrasi">Registrasi</SelectItem>
                      <SelectItem value="verifikasi">Verifikasi</SelectItem>
                      <SelectItem value="disposisi">Disposisi</SelectItem>
                      <SelectItem value="lidik_berjalan">Lidik Berjalan</SelectItem>
                      <SelectItem value="lidik_selesai">Lidik Selesai</SelectItem>
                      <SelectItem value="gelar">Gelar Perkara</SelectItem>
                      <SelectItem value="terbukti">Terbukti</SelectItem>
                      <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                      <SelectItem value="perdamaian">Perdamaian</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catatan" className="text-xs text-muted-foreground">Catatan</Label>
                  <Textarea name="catatan" rows={2} placeholder="Opsional..." />
                </div>
                <Button type="submit" className="w-full">Update Status</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Dibuat</span>
                <span className="font-medium text-foreground">{new Date(pengaduan.created_at).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <StatusBadge status={pengaduan.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function StatusHistory({ pengaduanId, tenantId }: { pengaduanId: string; tenantId: string }) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('status_history')
    .select('*, user:personel(nama_lengkap, nip)')
    .eq('tenant_id', tenantId)
    .eq('ref_type', 'pengaduan')
    .eq('ref_id', pengaduanId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data?.length) {
    return <p className="text-muted-foreground text-sm">Belum ada riwayat perubahan status</p>
  }

  return (
    <div className="space-y-0">
      {data.map((h, i) => (
        <div key={h.id} className="relative pl-6 pb-4 last:pb-0">
          {i < data.length - 1 && (
            <div className="absolute left-2 top-3 bottom-0 w-0.5 bg-border" />
          )}
          <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary/10 border-2 border-primary/30" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={h.status_lama} />
              <span className="text-muted-foreground text-xs">→</span>
              <StatusBadge status={h.status_baru} />
            </div>
            {h.catatan && <p className="text-sm text-muted-foreground mt-1">{h.catatan}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(h.created_at).toLocaleDateString('id-ID')} — oleh {(h.user as unknown as { nama_lengkap: string })?.nama_lengkap || '-'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
