'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import {
  DollarSign, FileText, BarChart3, Lock, AlertTriangle,
  Plus, Calendar, Users, TrendingUp, BookOpen, ClipboardList
} from 'lucide-react'

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function PerwabkeuPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    kegiatan_count: 0,
    personel_count: 0,
    jenis_giat_count: 0,
  })
  const [recentKegiatan, setRecentKegiatan] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // Role guard: Admin only
    if (!['admin', 'superadmin'].includes(parsedUser.role)) {
      router.push('/')
      return
    }

    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [{ count: kegCount }, { count: persCount }, recent] = await Promise.all([
        supabase.from('kegiatan_induk').select('id', { count: 'exact', head: true }),
        supabase.from('anggota').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase
          .from('kegiatan_induk')
          .select(`id, jenis_giat, lokasi, tgl_mulai, tgl_selesai, nomor_sprin, status, created_at`)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        kegiatan_count: kegCount || 0,
        personel_count: persCount || 0,
        jenis_giat_count: 0,
      })
      if (recent.data) setRecentKegiatan(recent.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <div className="p-4 rounded-full bg-red-100">
          <Lock className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground text-center">
          Halaman Perwabkeu hanya dapat diakses oleh Admin dan Superadmin.
        </p>
        <Button onClick={() => router.push('/')}>Kembali ke Dashboard</Button>
      </div>
    )
  }

  const formatTgl = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: idLocale }) }
    catch { return d }
  }

  return (
    <div className="space-y-6" data-testid="perwabkeu-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            Perwabkeu
          </h1>
          <p className="text-muted-foreground mt-1">
            Pertanggungjawaban Keuangan — dilihat oleh Admin saja
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
          <Lock className="h-3 w-3 mr-1" />
          Admin Only
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Kegiatan',
            value: stats.kegiatan_count,
            icon: ClipboardList,
            gradient: 'from-blue-500 to-cyan-600',
            bg: 'from-blue-50 to-cyan-50',
          },
          {
            label: 'Anggota Aktif',
            value: stats.personel_count,
            icon: Users,
            gradient: 'from-violet-500 to-purple-600',
            bg: 'from-violet-50 to-purple-50',
          },
          {
            label: 'Dokumen DIPA',
            value: '—',
            icon: BookOpen,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'from-emerald-50 to-teal-50',
          },
        ].map(({ label, value, icon: Icon, gradient, bg }) => (
          <Card key={label} className={`bg-gradient-to-br ${bg} border-0 shadow-sm`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push('/kegiatan/baru')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <Plus className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-sm">Kegiatan Baru</p>
              <p className="text-xs text-muted-foreground">Buat kegiatan operasional</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push('/perwabkeu/dipa')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
              <BarChart3 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-sm">Master DIPA</p>
              <p className="text-xs text-muted-foreground">Kelola pagu & tarif</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group opacity-60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-lg bg-violet-100 group-hover:bg-violet-200 transition-colors">
              <FileText className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <p className="font-semibold text-sm">Laporan Bulanan</p>
              <p className="text-xs text-muted-foreground">Segera tersedia</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Kegiatan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-blue-600" />
            Kegiatan Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentKegiatan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="p-3 rounded-full bg-muted">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Belum ada kegiatan yang tercatat.</p>
              <Button size="sm" onClick={() => router.push('/kegiatan/baru')}>
                <Plus className="h-4 w-4 mr-1.5" /> Buat Kegiatan Pertama
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentKegiatan.map(k => (
                <div key={k.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{k.jenis_giat}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTgl(k.tgl_mulai)} — {formatTgl(k.tgl_selesai)} · {k.lokasi}
                    </p>
                    {k.nomor_sprin && (
                      <p className="text-xs text-blue-600 mt-0.5">{k.nomor_sprin}</p>
                    )}
                  </div>
                  <Badge variant={k.status === 'selesai' ? 'default' : 'secondary'} className="text-xs flex-shrink-0 ml-3">
                    {k.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Migrasi Perwabkeu Sedang Berlangsung</p>
            <p className="text-xs text-amber-700 mt-1">
              Fitur lengkap Perwabkeu (DIPA, SPD, Nominatif, Nota Dinas) sedang dalam proses migrasi dari PerwabkeuApp ke sistem ini.
              Gunakan modul <strong>Kegiatan Baru</strong> untuk mencatat kegiatan operasional sementara.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
