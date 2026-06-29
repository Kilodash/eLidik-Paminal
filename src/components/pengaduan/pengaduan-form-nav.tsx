'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function PengaduanFormNav({
  ids,
  currentId,
  baseParams,
  page = 1,
  hasNextPage = false,
  focusFirst = false,
}: {
  ids: string[]
  currentId?: string | null
  baseParams?: string
  page?: number
  hasNextPage?: boolean
  focusFirst?: boolean
}) {
  const router = useRouter()

  // Smooth scroll table to top, highlight + focus first row
  useEffect(() => {
    if (!focusFirst || ids.length === 0) return
    const timer = setTimeout(() => {
      const tableContainer = document.querySelector('[data-table-container]') as HTMLElement | null
      const firstRow = document.querySelector('[data-table-container] tbody tr:first-child') as HTMLElement | null

      if (tableContainer) {
        tableContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (firstRow) {
        firstRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        firstRow.setAttribute('tabindex', '0')
        firstRow.focus({ preventScroll: true })
        firstRow.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'outline-none')
        setTimeout(() => {
          firstRow.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'outline-none')
          firstRow.removeAttribute('tabindex')
        }, 2500)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [focusFirst, ids])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || ids.length === 0) return

      const idx = currentId ? ids.indexOf(currentId) : -1
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (idx <= 0) {
          if (page > 1) {
            navigatePage(page - 1)
            return
          }
          toast.info('Ini adalah data pertama')
          return
        }
        navigate(ids[idx - 1])
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (idx === -1 || idx >= ids.length - 1) {
          if (hasNextPage) {
            navigatePage(page + 1)
            return
          }
          toast.info('Ini adalah data terakhir')
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

    const navigatePage = (nextPage: number) => {
      const params = new URLSearchParams(baseParams || '')
      params.set('page', String(nextPage))
      params.set('edit', '_first')
      window.location.href = `/pengaduan?${params.toString()}`
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ids, currentId, baseParams, router, page, hasNextPage])

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/20 border-b text-[10px] text-muted-foreground">
      <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">Ctrl+←</kbd>
      <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">Ctrl+→</kbd>
      <span>navigasi</span>
      <span className="text-muted-foreground/50">|</span>
      <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">Ctrl+Shift</kbd>
      <span>toggle kronologi</span>
    </div>
  )
}
