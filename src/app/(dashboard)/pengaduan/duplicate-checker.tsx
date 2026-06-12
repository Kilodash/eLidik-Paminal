'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { checkDuplicatePengaduanAction } from './actions'

export function DuplicateChecker({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [hasChecked, setHasChecked] = useState(false)

  const handleCheck = async () => {
    setLoading(true)
    setHasChecked(true)
    const pelaporEl = document.getElementById('pelapor_nama') as HTMLInputElement
    const terlaporEl = document.getElementById('terlapor_nama') as HTMLInputElement
    
    const pelaporNama = pelaporEl?.value || ''
    const terlaporNama = terlaporEl?.value || ''
    
    if (!pelaporNama && !terlaporNama) {
      setDuplicates([])
      setLoading(false)
      return
    }

    const res = await checkDuplicatePengaduanAction(pelaporNama, terlaporNama)
    if (res.duplicates) {
      setDuplicates(res.duplicates)
    }
    setLoading(false)
  }

  return (
    <div className={className}>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs w-fit" 
        onClick={handleCheck}
        disabled={loading}
      >
        <Search className="w-3 h-3 mr-1" /> {loading ? 'Mengecek...' : 'Cek Duplikasi Data'}
      </Button>
      
      {hasChecked && !loading && duplicates.length === 0 && (
        <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-200">
          ✅ Tidak ditemukan aduan serupa.
        </div>
      )}
      
      {hasChecked && !loading && duplicates.length > 0 && (
        <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex flex-col gap-1">
          <span className="font-bold">⚠️ Peringatan: Kemungkinan Duplikasi ({duplicates.length} aduan mirip)</span>
          <ul className="list-disc pl-4 mt-1">
            {duplicates.map(d => (
              <li key={d.id}>
                {d.nomor_register || 'Draft'} - Pelapor: {d.pelapor_nama} - Terlapor: {d.pengaduan_terlapor?.[0]?.terlapor?.nama}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
