import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPengaduanList } from '@/lib/data/pengaduan'
import { getPersonel } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { MonitoringSearch } from '@/components/pengaduan/monitoring-search'
import { AiEnrichAllButton } from '@/components/pengaduan/ai-enrich-all-button'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GajamadaMonitoringPage({ searchParams }: Props) {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const sp = await searchParams
  const page = parseInt(String(sp.page || '1'))
  const query = String(sp.q || '')
  const limit = 20

  const { data, total } = await getPengaduanList({
    jenis: 'Pengaduan Cepat Propam',
    query: query || undefined,
    page,
    limit,
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div>
          <h1 className="text-lg font-bold">Monitoring Gajamada</h1>
          <p className="text-sm text-muted-foreground">
            Pengaduan Cepat Propam yang masuk dari Gajamada ({total} data)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(personel.role === 'admin_subbid' || personel.role === 'oversight') && <AiEnrichAllButton />}
          <Link href="/pengaduan">
            <Button type="button" variant="outline" size="sm">Kembali</Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <MonitoringSearch initialQuery={query} />

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">No</th>
                <th className="px-3 py-2 text-left font-semibold">ID Gajamada</th>
                <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
                <th className="px-3 py-2 text-left font-semibold">Pelapor</th>
                <th className="px-3 py-2 text-left font-semibold">Terlapor</th>
                <th className="px-3 py-2 text-left font-semibold">Satker</th>
                <th className="px-3 py-2 text-left font-semibold">Klasifikasi</th>
                <th className="px-3 py-2 text-left font-semibold">Status Lokal</th>
                <th className="px-3 py-2 text-left font-semibold">Status Gajamada</th>
                <th className="px-3 py-2 text-left font-semibold">Unit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const terlapor = row.terlapor_list?.[0]?.nama || '-'
                return (
                  <tr key={row.id} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.gajamada_id || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.tgl_pengaduan}</td>
                    <td className="px-3 py-2">{row.pelapor_nama || '-'}</td>
                    <td className="px-3 py-2">{terlapor}</td>
                    <td className="px-3 py-2">{row.satker_dilaporkan || '-'}</td>
                    <td className="px-3 py-2">{row.klasifikasi?.nama || '-'}</td>
                    <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-2">{row.gajamada_status || '-'}</td>
                    <td className="px-3 py-2">{row.unit?.nama || '-'}</td>
                  </tr>
                )
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                    Belum ada data Pengaduan Cepat Propam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} ({total} data)
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/pengaduan/gajamada?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                >
                  <Button type="button" variant="outline" size="sm">Sebelumnya</Button>
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/pengaduan/gajamada?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                >
                  <Button type="button" variant="outline" size="sm">Berikutnya</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
