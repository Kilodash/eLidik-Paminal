'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { syncGajamadaIntakeAction } from '@/app/(dashboard)/pengaduan/actions'

export function SyncGajamadaButton({ autoSyncMinutes = 30 }: { autoSyncMinutes?: number }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const doIntake = useCallback(async () => {
    setIsPending(true)
    try {
      const res = await syncGajamadaIntakeAction()
      if (res.error) {
        toast.error(res.error)
        return
      }
      localStorage.setItem('gajamada_last_sync', Date.now().toString())
      if (res.count && res.count > 0) {
        toast.success(`Intake: ${res.count} laporan baru masuk, ${res.skipped} sudah ada`)
      } else {
        toast.success(`Tidak ada laporan baru (${res.skipped} sudah ada)`)
      }
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal intake')
    } finally {
      setIsPending(false)
    }
  }, [router])

  useEffect(() => {
    const lastStr = localStorage.getItem('gajamada_last_sync')
    if (lastStr) {
      const diff = (Date.now() - parseInt(lastStr, 10)) / 1000 / 60
      if (diff < autoSyncMinutes) return
    }
    doIntake()
  }, [autoSyncMinutes, doIntake])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={doIntake}
      disabled={isPending}
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Intake...' : 'Sinkron Gajamada'}
    </Button>
  )
}
