import React from 'react';
import { Badge } from './ui/badge';

const STATUS_MAP = {
  dalam_proses: { label: 'Dalam Proses', variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100' },
  terbukti: { label: 'Terbukti', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' },
  tidak_terbukti: { label: 'Tidak Terbukti', variant: 'default', className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100' },
  draft: { label: 'Draft', variant: 'default', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', variant: 'default', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100' },
  revisi: { label: 'Revisi', variant: 'default', className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100' },
  disetujui: { label: 'Disetujui', variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
};

export function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return <Badge className={`${config.className} font-medium text-xs px-2.5 py-0.5`}>{config.label}</Badge>;
}

export function SLABadge({ daysElapsed }) {
  if (daysElapsed > 30) return <Badge className="bg-red-100 text-red-800 border-red-200 font-medium"> {daysElapsed} hari</Badge>;
  if (daysElapsed > 14) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium"> {daysElapsed} hari</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-green-200 font-medium"> {daysElapsed} hari</Badge>;
}
