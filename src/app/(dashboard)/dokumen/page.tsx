import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { DocumentEditor } from './document-editor'

export default async function DokumenPage() {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  return (
    <Suspense fallback={null}>
      <DocumentEditor />
    </Suspense>
  )
}
