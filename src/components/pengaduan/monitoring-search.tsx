'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function MonitoringSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    params.set('page', '1')
    router.push(`/pengaduan/gajamada?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari ID, pelapor, terlapor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm" className="h-9">Cari</Button>
    </form>
  )
}
