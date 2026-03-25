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
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent font-heading tracking-tight">Perkembangan Dumas</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Ringkasan statistik dan monitoring pengaduan masyarakat secara real-time</p>
      </div>

      {/* Stats Cards - Bento Box Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto">
        <Card data-testid="stat-card-total" className="relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white group col-span-1 lg:col-span-2">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
             <FileText className="w-32 h-32" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Pengaduan</CardTitle>
            <div className="p-2.5 bg-blue-50/80 rounded-xl text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-5xl font-extrabold text-slate-900 tracking-tighter mt-2">{stats?.total || 0}</div>
            <p className="text-sm text-slate-500 mt-3 font-medium bg-slate-50 inline-block px-3 py-1 rounded-full">Keseluruhan dumas terdaftar</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-dalam-proses" className="relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-gradient-to-br from-blue-500 to-blue-600 group text-white">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Clock className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-blue-100 uppercase tracking-widest">Dalam Proses</CardTitle>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-4xl font-extrabold tracking-tighter mt-2">{stats?.dalam_proses || 0}</div>
            <p className="text-xs text-blue-200 mt-3 font-medium">Sedang ditindaklanjuti</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-terbukti" className="relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Terbukti</CardTitle>
            <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-4xl font-extrabold text-slate-800 tracking-tighter mt-2">{stats?.terbukti || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-tidak-terbukti" className="relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tidak Terbukti</CardTitle>
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-4xl font-extrabold text-slate-800 tracking-tighter mt-2">{stats?.tidak_terbukti || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-sla-warning" className="relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">SLA Warning</CardTitle>
            <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-4xl font-extrabold text-yellow-600 tracking-tighter mt-2">{stats?.sla_warning || 0}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">&gt; 14 hari</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-sla-critical" className="relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white group lg:col-span-2">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <AlertCircle className="w-32 h-32 text-red-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-red-500 uppercase tracking-widest">SLA Kritis (Tunggakan)</CardTitle>
            <div className="p-2.5 bg-red-50 rounded-xl text-red-600 animate-pulse">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-5xl font-extrabold text-red-600 tracking-tighter mt-2">{stats?.sla_critical || 0}</div>
            <p className="text-sm text-red-400/80 mt-3 font-medium bg-red-50 inline-block px-3 py-1 rounded-full">&gt; 30 hari tanpa kepastian</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
          <CardHeader className="px-6 py-5 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800">Distribusi Satker</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Beban pengaduan tiap satuan kerja wilayah (Top 10)</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="satker" axisLine={false} tickLine={false} textAnchor="end" height={80} fontSize={11} angle={-35} fill="#64748b" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} fill="#64748b" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA List */}
        <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden flex flex-col">
          <CardHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  SLA Warning
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Melewati batas normal</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white px-3 py-1 text-slate-600 shadow-sm border-slate-200">
                {slaList.length} dumas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="max-h-[350px] overflow-y-auto w-full p-2">
              {slaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle className="h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-sm font-medium">Bagus! Semua dumas aman.</p>
                </div>
              ) : (
                <div className="space-y-1.5 p-2 px-3">
                  {slaList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-200 group"
                      onClick={() => router.push(`/dumas/${item.id}`)}
                      data-testid={`sla-item-${item.id}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{item.no_dumas}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate font-medium">
                          <span className="text-slate-400">Terlapor:</span> {item.terlapor}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase tracking-wider">{item.satker}</p>
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
