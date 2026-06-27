'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enrichGajamadaAction } from '@/app/(dashboard)/pengaduan/actions'

const CHUNK_SIZE = 2

export function AiEnrichAllButton() {
  const [isPending, setIsPending] = useState(false)

  const run = async () => {
    if (isPending) return
    setIsPending(true)
    toast.loading('AI memproses pengaduan...', { id: 'ai-enrich-all' })

    let totalProcessed = 0
    let totalErrors = 0
    let remaining = 0

    try {
      do {
        const res = await enrichGajamadaAction(CHUNK_SIZE)
        if (!res || 'error' in res) {
          toast.error(res?.error || 'Respons tidak valid', { id: 'ai-enrich-all' })
          return
        }
        totalProcessed += res.processed
        totalErrors += res.errors
        remaining = res.remaining
        toast.loading(
          `AI memproses: ${totalProcessed} selesai${totalErrors > 0 ? `, ${totalErrors} gagal` : ''}${remaining > 0 ? `, ${remaining} tersisa` : ''}`,
          { id: 'ai-enrich-all' }
        )
      } while (remaining > 0)

      toast.success(`AI selesai: ${totalProcessed} diproses${totalErrors > 0 ? `, ${totalErrors} gagal` : ''}`, {
        id: 'ai-enrich-all',
      })
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses AI', { id: 'ai-enrich-all' })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      disabled={isPending}
      className="gap-2"
    >
      <Sparkles className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Memproses AI...' : 'Proses AI Semua'}
    </Button>
  )
}
