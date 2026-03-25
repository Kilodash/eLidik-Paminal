'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, CheckCircle, Clock, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardStats {
  total: number
  dalam_proses: number
  terbukti: number
  tidak_terbukti: number
  sla_warning: number
  sla_critical: number
}

interface SLAItem {
  id: string
  no_dumas: string
  pelapor: string
  terlapor: string
  satker: string
  sla_days: number
  unit_name?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [slaList, setSlaList] = useState<SLAItem[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Gagal mengambil data dashboard')
      }

      const data = await response.json()
      setStats(data.stats)
      setSlaList(data.sla_list)
      setChartData(data.by_satker || [])
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const getSLABadge = (days: number) => {
    if (days > 30) {
      return <Badge variant="destructive" className="text-xs">Kritis ({days} hari)</Badge>
    } else if (days > 14) {
      return <Badge variant="secondary" className="bg-yellow-500 text-white text-xs">Warning ({days} hari)</Badge>
    } else {
      return <Badge variant="default" className="bg-green-500 text-xs">Normal ({days} hari)</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative" data-testid="dashboard-page">
      {/* Stats Cards - Apple Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto relative z-10 pt-2">
        <Card data-testid="stat-card-total" className="relative overflow-hidden border-none apple-glass hover:bg-white/80 group col-span-1 lg:col-span-2 rounded-[2rem]">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 blur-sm group-hover:blur-none">
             <FileText className="w-32 h-32 text-blue-900" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative px-8 pt-8">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Pengaduan</CardTitle>
            <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl text-blue-600 border border-white/50 shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative px-8 pb-8">
            <div className="text-6xl font-extrabold text-slate-900 tracking-tighter mt-2">{stats?.total || 0}</div>
            <p className="text-sm text-slate-500 mt-4 font-semibold bg-white/50 backdrop-blur-md border border-white/50 inline-block px-4 py-1.5 rounded-full shadow-sm">Keseluruhan dumas terdaftar</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-dalam-proses" className="relative overflow-hidden border-none bg-blue-600/10 backdrop-blur-xl border-blue-500/20 shadow-[0_8px_32px_rgba(37,99,235,0.1)] hover:bg-blue-600/15 group text-blue-900 rounded-[2rem]">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 mix-blend-overlay">
             <Clock className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative px-6 pt-6">
            <CardTitle className="text-sm font-bold text-blue-800/80 uppercase tracking-widest">Dalam Proses</CardTitle>
          </CardHeader>
          <CardContent className="z-10 relative px-6 pb-6">
            <div className="text-5xl font-extrabold tracking-tighter mt-2 text-blue-700">{stats?.dalam_proses || 0}</div>
            <p className="text-xs text-blue-800/80 mt-3 font-semibold tracking-wide">Sedang ditindaklanjuti</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-terbukti" className="relative overflow-hidden border-none apple-glass hover:bg-white/80 group rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative px-6 pt-6">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Terbukti</CardTitle>
            <div className="p-2.5 bg-green-500/10 backdrop-blur-md rounded-2xl text-green-600 border border-green-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative px-6 pb-6">
            <div className="text-4xl font-extrabold text-slate-800 tracking-tighter mt-2">{stats?.terbukti || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-tidak-terbukti" className="relative overflow-hidden border-none apple-glass hover:bg-white/80 group rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative px-6 pt-6">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tdk Terbukti</CardTitle>
            <div className="p-2.5 bg-slate-500/10 backdrop-blur-md rounded-2xl text-slate-600 border border-slate-500/20">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative px-6 pb-6">
            <div className="text-4xl font-extrabold text-slate-800 tracking-tighter mt-2">{stats?.tidak_terbukti || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-sla-warning" className="relative overflow-hidden border-none apple-glass hover:bg-white/80 group rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative px-6 pt-6">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">SLA Warning</CardTitle>
            <div className="p-2.5 bg-yellow-500/10 backdrop-blur-md rounded-2xl text-yellow-600 border border-yellow-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative px-6 pb-6">
            <div className="text-4xl font-extrabold text-yellow-600 tracking-tighter mt-2">{stats?.sla_warning || 0}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">&gt; 14 hari</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-sla-critical" className="relative overflow-hidden border-none bg-red-500/10 backdrop-blur-xl border-red-500/20 shadow-[0_8px_32px_rgba(239,68,68,0.1)] hover:bg-red-500/15 group text-red-900 lg:col-span-2 rounded-[2rem]">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 mix-blend-overlay">
             <AlertCircle className="w-32 h-32 text-red-700" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative px-8 pt-8">
            <CardTitle className="text-sm font-bold text-red-700/80 uppercase tracking-widest">SLA Kritis (Tunggakan)</CardTitle>
            <div className="p-3 bg-red-500/20 backdrop-blur-md rounded-2xl text-red-700 border border-red-500/30 animate-pulse">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative px-8 pb-8">
            <div className="text-5xl font-extrabold text-red-600 tracking-tighter mt-2">{stats?.sla_critical || 0}</div>
            <p className="text-sm text-red-600 mt-4 font-bold bg-white/40 backdrop-blur-md border border-red-500/20 inline-block px-4 py-1.5 rounded-full shadow-sm">&gt; 30 hari tanpa kepastian</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
        <Card className="lg:col-span-3 border-none apple-glass overflow-hidden rounded-[2rem]">
          <CardHeader className="px-8 py-6 border-b border-white/20">
            <CardTitle className="text-xl font-bold text-slate-800">Distribusi Satker</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Beban pengaduan tiap satuan kerja wilayah (Top 10)</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="satker" axisLine={false} tickLine={false} textAnchor="end" height={80} fontSize={11} angle={-35} fill="#475569" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} fill="#475569" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.4)'}} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="rgba(59, 130, 246, 0.8)" radius={[8, 8, 4, 4]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA List */}
        <Card className="lg:col-span-2 border-none apple-glass overflow-hidden flex flex-col rounded-[2rem]">
          <CardHeader className="px-8 py-6 border-b border-white/20 bg-white/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  SLA Warning
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Melewati batas normal</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white/60 backdrop-blur-md px-3 py-1.5 text-slate-700 shadow-sm border-white/80 font-bold rounded-full">
                {slaList.length} dumas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="max-h-[350px] overflow-y-auto w-full p-4">
              {slaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="bg-white/50 p-4 rounded-full mb-4 shadow-sm border border-white/60">
                    <CheckCircle className="h-10 w-10 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold tracking-wide">Bagus! Semua dumas aman.</p>
                </div>
              ) : (
                <div className="space-y-3 p-2">
                  {slaList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl hover:bg-white/60 hover:shadow-lg cursor-pointer transition-all duration-300 group hover:-translate-y-1"
                      onClick={() => router.push(`/dumas/${item.id}`)}
                      data-testid={`sla-item-${item.id}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{item.no_dumas}</p>
                        <p className="text-xs text-slate-600 mt-1 truncate font-medium">
                          <span className="text-slate-400">Terlapor:</span> {item.terlapor}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate font-bold bg-white/50 inline-block px-2 py-0.5 rounded-full border border-white/40">{item.satker}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getSLABadge(item.sla_days)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
