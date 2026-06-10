'use client'

import { redirect } from 'next/navigation'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import type { ColumnDef } from '@tanstack/react-table'

type PengaduanRow = {
  id: string
  nomor_register: string | null
  jenis: string
  pelapor_nama: string | null
  klasifikasi?: unknown
  unit?: unknown
  status: string
  tgl_pengaduan: string | null
}

const columns: ColumnDef<PengaduanRow>[] = [
  {
    accessorKey: 'nomor_register',
    header: 'No Register',
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.original.nomor_register || '-'}</span>
    ),
  },
  {
    accessorKey: 'jenis',
    header: 'Jenis',
    cell: ({ row }) => (
      <StatusBadge status={row.original.jenis === 'laporan_informasi' ? 'draft' : 'open'} />
    ),
  },
  {
    accessorKey: 'pelapor_nama',
    header: 'Pelapor',
    cell: ({ row }) => row.original.pelapor_nama || 'Anonim',
  },
  {
    accessorKey: 'klasifikasi',
    header: 'Klasifikasi',
    cell: ({ row }) => (row.original.klasifikasi as { nama: string })?.nama || '-',
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
    cell: ({ row }) => (row.original.unit as { nama: string })?.nama || '-',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'tgl_pengaduan',
    header: 'Tanggal',
    cell: ({ row }) => row.original.tgl_pengaduan || '-',
  },
]

interface Props {
  data: PengaduanRow[]
  total: number
  page: number
}

export function PengaduanTable({ data, total, page }: Props) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="nomor_register"
      searchPlaceholder="Cari nomor register..."
      totalCount={total}
      page={page}
      onRowClick={(row) => redirect(`/pengaduan/${row.id}`)}
    />
  )
}
