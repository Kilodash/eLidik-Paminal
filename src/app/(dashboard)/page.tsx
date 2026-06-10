import { redirect } from 'next/navigation'
import { getPersonel, requireTenant } from '@/lib/auth'
import { getDashboardStats, getAnevJenis, getAnevUnit } from '@/lib/data/pengaduan'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Plus, FileText, FolderOpen, TrendingUp, Clock, AlertTriangle, Inbox } from 'lucide-react'
import Link from 'next/link'

function StatCard({ label, value, href, icon: Icon, color }: {
  label: string; value: number; href: string; icon: React.ElementType; color: string
}) {
  return (
    <Link href={href} prefetch={true}>
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 border-0 ring-1 ring-border/50">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`flex items-center justify-center h-12 w-12 rounded-xl shrink-0 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function QuickAction({ href, label, icon: Icon, color }: {
  href: string; label: string; icon: React.ElementType; color: string
}) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="h-auto py-4 px-4 flex flex-col items-center gap-2 w-full border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
      >
        <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xs font-medium">{label}</span>
      </Button>
    </Link>
  )
}

const PROSES_STATUSES = ['registrasi', 'verifikasi', 'disposisi', 'lidik_berjalan', 'gelar']
const SELESAI_STATUSES = ['closed', 'terbukti', 'tidak_terbukti']

export default async function DashboardPage() {
  const personel = await getPersonel()
  if (!personel) {
    console.log('[DashboardPage] getPersonel() returned null. Redirecting to /setup')
    redirect('/setup')
  }

  const isAdmin = personel.role !== 'operator_unit'
  const unitId = personel.role === 'operator_unit' ? personel.organization_id || undefined : undefined
  const stats = await getDashboardStats(unitId)
  const anevJenis = await getAnevJenis(unitId)
  const anevUnit = isAdmin ? await getAnevUnit() : null

  const kelengkapan: Array<{ berkas_id: string; nomor_berkas: string; status: string; unit_nama: string; missing_docs: string[] }> = []
  if (isAdmin || unitId) {
    const tenantId = await requireTenant()
    const supabase = await createClient()
    const { data: berkasList } = await supabase.from('berkas')
      .select('*, unit:organizations(nama), documents(document_type:document_types(kode))')
      .eq('tenant_id', tenantId)
      .eq(unitId ? 'unit_id' : 'tenant_id', unitId || tenantId)
      .in('status', ['lidik_selesai', 'gelar', 'terbukti', 'tidak_terbukti', 'closed'])

    const DOC_REQUIREMENTS: Record<string, string[]> = {
      lidik_selesai: ['LHP'],
      gelar: ['LHP', 'NOTULEN_GELAR'],
      terbukti: ['LHP', 'NOTULEN_GELAR', 'PELIMPAHAN'],
      tidak_terbukti: ['LHP', 'NOTULEN_GELAR', 'SPRIN_HENTI', 'PEMBERITAHUAN_ANKUM'],
      closed: ['SURAT_PELAPOR', 'LAPORAN_MABES', 'JUKRAH', 'BERKAS_AKHIR'],
    }

    for (const b of (berkasList || [])) {
      const required = DOC_REQUIREMENTS[b.status] || []
      const existing = (b.documents as Array<{ document_type: { kode: string } }> || []).map(d => d.document_type?.kode).filter(Boolean)
      const missing = required.filter(r => !existing.includes(r))
      if (missing.length > 0) {
        kelengkapan.push({
          berkas_id: b.id,
          nomor_berkas: b.nomor_berkas,
          status: b.status,
          unit_nama: (b.unit as unknown as { nama: string })?.nama || '-',
          missing_docs: missing,
        })
      }
    }
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {personel.nama_lengkap || personel.nip || 'Operator'}
            {!isAdmin && unitId && ' — Hanya data unit Anda'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Dumas" value={stats.total} href="/pengaduan" icon={Inbox} color="bg-primary" />
        <StatCard label="Dalam Proses" value={stats.proses} href={`/pengaduan?status=${PROSES_STATUSES.join(',')}`} icon={TrendingUp} color="bg-amber-500" />
        <StatCard label="Selesai" value={stats.selesai} href={`/pengaduan?status=${SELESAI_STATUSES.join(',')}`} icon={FileText} color="bg-emerald-500" />
        <StatCard label="SLA Terlambat" value={0} href="/pengaduan?overdue=true" icon={Clock} color="bg-red-500" />
      </div>

      {/* Quick Actions */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/pengaduan/new" label="Buat Aduan Baru" icon={Plus} color="bg-primary" />
          <QuickAction href="/berkas/new" label="Buat Berkas" icon={FolderOpen} color="bg-blue-500" />
          <QuickAction href="/pengaduan?overdue=true" label="SLA Terlambat" icon={AlertTriangle} color="bg-red-500" />
          <QuickAction href="/dokumen" label="Buat Dokumen" icon={FileText} color="bg-purple-500" />
        </div>
      )}

      {/* Kelengkapan Berkas */}
      {kelengkapan.length > 0 && (
        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Kelengkapan Berkas ({kelengkapan.length} belum lengkap)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm stripe-table">
                <thead>
                  <tr className="bg-primary/5">
                    {isAdmin && <th className="text-left p-3 font-semibold text-primary">Unit</th>}
                    <th className="text-left p-3 font-semibold text-primary">Berkas</th>
                    <th className="text-left p-3 font-semibold text-primary">Status</th>
                    <th className="text-left p-3 font-semibold text-primary">Dokumen Kurang</th>
                  </tr>
                </thead>
                <tbody>
                  {kelengkapan.slice(0, 10).map((k) => (
                    <tr key={k.berkas_id} className="border-t cursor-pointer transition-colors" onClick={() => redirect(`/berkas/${k.berkas_id}`)}>
                      {isAdmin && <td className="p-3 text-muted-foreground">{k.unit_nama}</td>}
                      <td className="p-3 font-mono text-sm">{k.nomor_berkas}</td>
                      <td className="p-3"><StatusBadge status={k.status} /></td>
                      <td className="p-3 text-destructive text-xs font-medium">{k.missing_docs.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anev Jenis Dumas */}
      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Anev Jenis Dumas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm stripe-table">
              <thead>
                <tr className="bg-primary/5">
                  <th className="text-left p-3 font-semibold text-primary">Klasifikasi</th>
                  <th className="text-right p-3 font-semibold text-primary">Jumlah</th>
                  <th className="text-right p-3 font-semibold text-primary">Proses</th>
                  <th className="text-right p-3 font-semibold text-primary">Selesai</th>
                  <th className="text-right p-3 font-semibold text-primary">Terbukti</th>
                  <th className="text-right p-3 font-semibold text-primary">Tdk Terbukti</th>
                  <th className="text-right p-3 font-semibold text-primary">%</th>
                </tr>
              </thead>
              <tbody>
                {anevJenis.map((a) => (
                  <tr key={a.nama} className="border-t">
                    <td className="p-3 font-medium">{a.nama}</td>
                    <td className="p-3 text-right font-semibold">{a.jumlah}</td>
                    <td className="p-3 text-right">{a.proses}</td>
                    <td className="p-3 text-right">{a.selesai}</td>
                    <td className="p-3 text-right">{a.terbukti}</td>
                    <td className="p-3 text-right">{a.tidak_terbukti}</td>
                    <td className="p-3 text-right font-medium">{a.persen_selesai}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Anev Kinerja Unit */}
      {anevUnit && (
        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Anev Kinerja Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm stripe-table">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="text-left p-3 font-semibold text-primary">Unit</th>
                    <th className="text-right p-3 font-semibold text-primary">Jumlah</th>
                    <th className="text-right p-3 font-semibold text-primary">Proses</th>
                    <th className="text-right p-3 font-semibold text-primary">Selesai</th>
                    <th className="text-right p-3 font-semibold text-primary">Terbukti</th>
                    <th className="text-right p-3 font-semibold text-primary">Tdk Terbukti</th>
                    <th className="text-right p-3 font-semibold text-primary">%</th>
                  </tr>
                </thead>
                <tbody>
                  {anevUnit.map((a) => (
                    <tr key={a.unit_id} className="border-t">
                      <td className="p-3 font-medium">{a.unit}</td>
                      <td className="p-3 text-right font-semibold">{a.jumlah}</td>
                      <td className="p-3 text-right">{a.proses}</td>
                      <td className="p-3 text-right">{a.selesai}</td>
                      <td className="p-3 text-right">{a.terbukti}</td>
                      <td className="p-3 text-right">{a.tidak_terbukti}</td>
                      <td className="p-3 text-right font-medium">{a.persen_selesai}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
