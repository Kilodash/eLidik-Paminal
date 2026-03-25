import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { StatusBadge, SLABadge } from '../components/StatusBadge';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const STAT_CARDS = [
  { key: 'total', label: 'Total Dumas', icon: FileText, color: 'bg-blue-50 text-blue-700', iconBg: 'bg-blue-100' },
  { key: 'dalam_proses', label: 'Dalam Proses', icon: Clock, color: 'bg-yellow-50 text-yellow-700', iconBg: 'bg-yellow-100' },
  { key: 'terbukti', label: 'Terbukti', icon: CheckCircle, color: 'bg-green-50 text-green-700', iconBg: 'bg-green-100' },
  { key: 'tidak_terbukti', label: 'Tidak Terbukti', icon: XCircle, color: 'bg-red-50 text-red-700', iconBg: 'bg-red-100' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, dalam_proses: 0, terbukti: 0, tidak_terbukti: 0 });
  const [slaData, setSlaData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single combined API call for all dashboard data
    api.get('/dashboard/combined')
      .then(res => {
        setStats(res.data.stats || {});
        setSlaData(res.data.sla_data || []);
        setChartData((res.data.chart_data || []).reverse());
      })
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Selamat datang, {user?.name}. Berikut ringkasan monitoring dumas.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`${card.color} border-none shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium opacity-70">{card.label}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1">{stats?.[card.key] || 0}</p>
                    </div>
                    <div className={`${card.iconBg} p-2 rounded-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">Statistik Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="dalam_proses" name="Dalam Proses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terbukti" name="Terbukti" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tidak_terbukti" name="Tidak Terbukti" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA Warning */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            SLA Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slaData.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Tidak ada dumas dalam proses</p>
          ) : (
            <div className="space-y-2">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">No. Dumas</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">Pelapor</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">Satker</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">Unit</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">Status</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">Durasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaData.slice(0, 10).map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{d.no_dumas || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.pelapor || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.satker || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.unit_name || '-'}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={d.status} /></td>
                        <td className="py-2.5 px-3"><SLABadge daysElapsed={d.days_elapsed || 0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {slaData.slice(0, 10).map((d) => (
                  <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-900 text-sm">{d.no_dumas || '-'}</span>
                      <SLABadge daysElapsed={d.days_elapsed || 0} />
                    </div>
                    <p className="text-sm text-slate-600">Pelapor: {d.pelapor || '-'}</p>
                    <p className="text-sm text-slate-500">Satker: {d.satker || '-'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{d.unit_name || '-'}</span>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
