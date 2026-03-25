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
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-heading">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan statistik dan monitoring dumas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card data-testid="stat-card-total" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Dumas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Seluruh pengaduan terdaftar</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-dalam-proses" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dalam Proses</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.dalam_proses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Sedang ditindaklanjuti</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-terbukti" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terbukti</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.terbukti || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Hasil penyelidikan positif</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-tidak-terbukti" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tidak Terbukti</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats?.tidak_terbukti || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Hasil penyelidikan negatif</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-sla-warning" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SLA Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats?.sla_warning || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">&gt; 14 hari</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-sla-critical" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SLA Kritis</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.sla_critical || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">&gt; 30 hari</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dumas per Satker (Top 10)</CardTitle>
            <CardDescription>Distribusi pengaduan berdasarkan satuan kerja</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="satker" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA List */}
        <Card>
          <CardHeader>
            <CardTitle>Dumas dengan SLA Warning</CardTitle>
            <CardDescription>Daftar pengaduan yang melewati batas waktu normal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {slaList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada dumas dengan SLA warning
                </p>
              ) : (
                slaList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dumas/${item.id}`)}
                    data-testid={`sla-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.no_dumas}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.terlapor} - {item.satker}
                      </p>
                      {item.unit_name && (
                        <Badge variant="outline" className="mt-1 text-xs">{item.unit_name}</Badge>
                      )}
                    </div>
                    <div className="ml-2">
                      {getSLABadge(item.sla_days)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
