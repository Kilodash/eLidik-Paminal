import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getBerkasList } from '@/lib/data/berkas'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { BerkasTable } from '@/components/layout/berkas-table'
import { Plus } from 'lucide-react'

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function BerkasListPage({ searchParams }: Props) {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const sp = await searchParams
  const page = parseInt(sp.page || '1')
  const { data, total } = await getBerkasList(page)

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader title="Berkas" description="Daftar berkas tindak lanjut pengaduan" />

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        <div className="border border-border/50 rounded-xl bg-card p-6 h-fit space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-1">
              <Plus className="h-4 w-4 text-primary" />
              Buat Berkas
            </h3>
            <p className="text-sm text-muted-foreground">Mulai proses penyidikan tindak lanjut baru.</p>
          </div>
          <Link href="/berkas/new" className="block">
            <Button className="w-full">
              Mulai Penyidikan
            </Button>
          </Link>
        </div>

        <div className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold text-base">Daftar Berkas</h3>
            <p className="text-xs text-muted-foreground">Total {total} berkas terdaftar</p>
          </div>
          <div className="p-4">
            <BerkasTable data={data} total={total} page={page} />
          </div>
        </div>
      </div>
    </div>
  )
}
