'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, RotateCcw } from 'lucide-react'
import { enrichSinglePengaduanAction, resetGajamadaAIAction } from '@/app/(dashboard)/pengaduan/actions'

export function AiEnrichButton({ pengaduanId, aiProcessed }: { pengaduanId: string; aiProcessed?: boolean | null }) {
  const [isPending, setIsPending] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleAI = async () => {
    if (isPending) return
    setIsPending(true)
    toast.loading('AI memproses...', { id: 'ai-enrich' })

    try {
      const res = await enrichSinglePengaduanAction(pengaduanId)
      if (res && 'error' in res && res.error) {
        toast.error(res.error, { id: 'ai-enrich' })
      } else {
        toast.success('Selesai diproses AI', { id: 'ai-enrich' })
        window.location.reload()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal', { id: 'ai-enrich' })
    } finally {
      setIsPending(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    const res = await resetGajamadaAIAction(pengaduanId)
    if (res && 'error' in res) {
      toast.error(res.error)
    } else {
      toast.success('AI direset, siap diproses ulang')
      window.location.reload()
    }
    setIsResetting(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAI}
        disabled={isPending || isResetting}
        title="Proses AI"
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
      >
        <Sparkles className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
      </button>
      {aiProcessed && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting || isPending}
          title="Reset hasil AI"
          className="absolute top-2 right-10 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
        </button>
      )}
    </>
  )
}
