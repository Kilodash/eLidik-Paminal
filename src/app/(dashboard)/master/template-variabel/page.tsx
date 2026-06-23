import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Layers } from 'lucide-react'
import { TemplateVariabelManager } from './manager'
import {
  getTemplateVariablesAction,
  getDistinctDocTypeKodesAction,
} from './actions'

export default async function TemplateVariabelPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/')

  const kodes = await getDistinctDocTypeKodesAction()

  // Ambil kode dari query param untuk filter default (jika ada).
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Template Variabel"
        description="Definisikan field, tipe input, dan validasi untuk form variabel per jenis dokumen (admin only)."
      />

      <Card className="border-0 ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Kelola Variabel Form
          </CardTitle>
          <CardDescription>
            Tentukan komponen form (text, textarea, select, list, dsb.) dan atur validasi, pengurutan, pengelompokan.
            Variabel ini akan digunakan oleh form generik di editor dokumen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateVariabelManager initialKodes={kodes} />
        </CardContent>
      </Card>
    </div>
  )
}
