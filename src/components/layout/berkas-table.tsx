'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import type { ColumnDef } from '@tanstack/react-table'

type BerkasRow = {
  id: string
  nomor_berkas: string | null
  judul: string | null
  tahun: number | null
  unit: unknown
  tahap: string | null
  status: string
  created_at: string
}

const columns: ColumnDef<BerkasRow>[] = [
  {
    accessorKey: 'nomor_berkas',
    header: 'No Berkas',
    cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.nomor_berkas || '-'}</span>,
  },
  {
    accessorKey: 'judul',
    header: 'Judul',
    cell: ({ row }) => row.original.judul || '-',
  },
  {
    accessorKey: 'tahun',
    header: 'Tahun',
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
    cell: ({ row }) => (row.original.unit as { nama: string })?.nama || '-',
  },
  {
    accessorKey: 'tahap',
    header: 'Tahap',
    cell: ({ row }) => row.original.tahap ? <StatusBadge status={row.original.tahap} /> : '-',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'created_at',
    header: 'Dibuat',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('id-ID'),
  },
]

interface Props {
  data: BerkasRow[]
  total: number
  page: number
}

export function BerkasTable({ data, total, page }: Props) {
  const router = useRouter()
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="nomor_berkas"
      searchPlaceholder="Cari nomor berkas..."
      totalCount={total}
      page={page}
      onRowClick={(row) => router.push(`/berkas/${row.id}`)}
    />
  )
}
