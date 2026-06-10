import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPengaduanList } from '@/lib/data/pengaduan'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { PengaduanTable } from '@/components/layout/pengaduan-table'
import { Plus } from 'lucide-react'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PengaduanListPage({ searchParams }: Props) {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const sp = await searchParams
  const page = parseInt(String(sp.page || '1'))
  const query = String(sp.q || '')
  const statusParam = String(sp.status || '')
  const unitId = String(sp.unit || '')
  const klasifikasiId = String(sp.klasifikasi || '')
  const overdue = sp.overdue === 'true'

  const { data, total } = await getPengaduanList({
    page,
    query: query || undefined,
    status: statusParam ? statusParam.split(',') : undefined,
    unitId: unitId || undefined,
    klasifikasiId: klasifikasiId || undefined,
    overdue: overdue || undefined,
  })

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Pengaduan" description="Daftar pengaduan masyarakat dan laporan informasi" />

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {personel.role !== 'operator_unit' ? (
          <div className="border border-border/50 rounded-xl bg-card p-6 h-fit space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <Plus className="h-4 w-4 text-primary" />
                Tambah Aduan
              </h3>
              <p className="text-sm text-muted-foreground">Buat data registrasi pengaduan masyarakat yang baru.</p>
            </div>
            <Link href="/pengaduan/new" className="block">
              <Button className="w-full">
                Mulai Registrasi
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border border-border/50 rounded-xl bg-muted/30 p-6 h-fit">
            <h3 className="font-semibold mb-2">Informasi</h3>
            <p className="text-sm text-muted-foreground">Anda login sebagai operator unit dan hanya dapat melihat data pengaduan yang diarahkan ke unit Anda.</p>
          </div>
        )}

        <div className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold text-base">Daftar Pengaduan</h3>
            <p className="text-xs text-muted-foreground">Total {total} aduan terdaftar</p>
          </div>
          <div className="p-4">
            <PengaduanTable data={data} total={total} page={page} />
          </div>
        </div>
      </div>
    </div>
  )
}
