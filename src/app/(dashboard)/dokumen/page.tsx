import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default async function DokumenPage() {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  return (
    <div>
      <PageHeader title="Dokumen" description="Generate & cetak dokumen dari template" />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Modul Dokumen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Template editor dan generator dokumen akan diimplementasikan di tahap berikutnya.</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>HTML Rich Editor 2-panel</li>
            <li>Auto-generate dari template + variabel database</li>
            <li>Cetak via browser print</li>
            <li>Simpan DOCX/PDF ke storage</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
