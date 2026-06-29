import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { getAISettingsAction } from './actions'
import { AISettingsForm } from './ai-settings-form'

export default async function AISettingsPage() {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  if (personel.role !== 'admin_subbid' && personel.role !== 'oversight') {
    redirect('/')
  }

  const res = await getAISettingsAction()
  if (res.error) {
    return <div className="p-4 text-red-600">{res.error}</div>
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Pengaturan AI</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi AI untuk ringkasan kronologi, ekstraksi satker, dan klasifikasi otomatis.
        </p>
      </div>
      <AISettingsForm initialSettings={res.data || {}} />
    </div>
  )
}
