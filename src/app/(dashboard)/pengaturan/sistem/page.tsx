import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Wrench, Database, Shield, RefreshCw } from 'lucide-react'

export default async function SistemPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Pengaturan Sistem" description="Konfigurasi sistem dan pemeliharaan" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Audit Log
            </CardTitle>
            <CardDescription>Riwayat aktivitas pengguna sistem</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Semua aksi user tercatat otomatis di tabel <code className="text-xs bg-muted px-1 rounded">audit_logs</code>.</p>
            <p className="mt-2">Tersedia untuk oversight dan admin subbid.</p>
          </CardContent>
        </Card>

        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Keamanan & RLS
            </CardTitle>
            <CardDescription>Row Level Security aktif</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Setiap tabel dilindungi Row Level Security (RLS).</p>
            <p className="mt-2">Multi-tenant: setiap query otomatis terfilter by <code className="text-xs bg-muted px-1 rounded">tenant_id</code>.</p>
          </CardContent>
        </Card>

        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Backup & Restore
            </CardTitle>
            <CardDescription>Manajemen data cadangan</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Gunakan Supabase Dashboard untuk backup database.</p>
            <p className="mt-2">Ekspor via pg_dump atau Supabase CLI.</p>
          </CardContent>
        </Card>

        <Card className="border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Versi & Info
            </CardTitle>
            <CardDescription>Informasi sistem</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between"><span>Framework</span><span className="font-medium text-foreground">Next.js 16.2</span></div>
            <div className="flex justify-between"><span>Database</span><span className="font-medium text-foreground">Supabase (PostgreSQL)</span></div>
            <div className="flex justify-between"><span>Auth</span><span className="font-medium text-foreground">Supabase Auth + RLS</span></div>
            <div className="flex justify-between"><span>UI</span><span className="font-medium text-foreground">shadcn/ui + Tailwind v4</span></div>
            <div className="flex justify-between"><span>Instansi</span><span className="font-medium text-foreground">Bidpropam / Subbid Paminal</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
