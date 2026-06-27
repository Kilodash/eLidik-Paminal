'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function PengaduanFormNav({
  ids,
  currentId,
  baseParams,
}: {
  ids: string[]
  currentId?: string | null
  baseParams?: string
}) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || ids.length === 0) return

      const idx = currentId ? ids.indexOf(currentId) : -1
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (idx <= 0) {
          toast.info('Ini adalah data pertama pada halaman ini')
          return
        }
        navigate(ids[idx - 1])
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (idx === -1 || idx >= ids.length - 1) {
          toast.info('Ini adalah data terakhir pada halaman ini')
          return
        }
        navigate(ids[idx + 1])
      }
    }

    const navigate = (id: string) => {
      const params = new URLSearchParams(baseParams || '')
      params.set('edit', id)
      router.push(`/pengaduan?${params.toString()}`)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ids, currentId, baseParams, router])

  return null
}
