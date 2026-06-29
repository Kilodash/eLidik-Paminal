import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  diterima: 'bg-blue-50 text-blue-700 ring-blue-200',
  registrasi: 'bg-sky-50 text-sky-700 ring-sky-200',
  verifikasi: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  disposisi: 'bg-purple-50 text-purple-700 ring-purple-200',
  lidik_berjalan: 'bg-amber-50 text-amber-700 ring-amber-200',
  lidik_selesai: 'bg-orange-50 text-orange-700 ring-orange-200',
  gelar: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  terbukti: 'bg-red-50 text-red-700 ring-red-200',
  tidak_terbukti: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-50 text-gray-600 ring-gray-200',
  perdamaian: 'bg-teal-50 text-teal-700 ring-teal-200',
  open: 'bg-blue-50 text-blue-700 ring-blue-200',
  draft: 'bg-gray-50 text-gray-500 ring-gray-200',
  final: 'bg-green-50 text-green-700 ring-green-200',
  printed: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-200',
  selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const STATUS_LABELS: Record<string, string> = {
  diterima: 'Diterima',
  registrasi: 'Registrasi',
  verifikasi: 'Verifikasi',
  disposisi: 'Disposisi',
  lidik_berjalan: 'Lidik Berjalan',
  lidik_selesai: 'Lidik Selesai',
  gelar: 'Gelar Perkara',
  terbukti: 'Terbukti',
  tidak_terbukti: 'Tidak Terbukti',
  closed: 'Tutup',
  perdamaian: 'Perdamaian',
  open: 'Buka',
  draft: 'Konsep',
  final: 'Final',
  printed: 'Tercetak',
  in_progress: 'Berjalan',
  selesai: 'Selesai',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 ring-gray-200'
  const label = STATUS_LABELS[status] || status

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset', style, className)}>
      {label}
    </span>
  )
}
