'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { updateDistribusiAction } from '@/app/(dashboard)/pengaduan/actions'
import { Organization } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface DistribusiFormProps {
  pengaduanId: string
  currentUnitId: string | null
  units: Organization[]
  initialDisposisiKabid?: string[]
  initialDisposisiKasubbid?: string[]
  initialDisposisiTambahan?: string
}

const disposisiOptions = [
  "WAKILI/HADIRI",
  "ACC/MAKLUM",
  "GUNAKAN SEBAGAI PEDOMAN",
  "TELITI/PELAJARI",
  "SARAN",
  "PROSES SESUAI PROSEDUR",
  "JADWALKAN/AGENDAKAN",
  "TINDAKLANJUTI",
  "TUNTASKAN",
  "LAPORKAN PERKEMBANGANYA",
  "BICARAKAN DENGAN SAYA",
  "CATAT/DATAKAN/FILE",
  "PERTIMBANGKAN",
  "AKOMODIR",
  "RAPATKAN",
  "UDK"
]

export function DistribusiForm({ pengaduanId, currentUnitId, units, initialDisposisiKabid, initialDisposisiKasubbid, initialDisposisiTambahan }: DistribusiFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unitId, setUnitId] = useState<string>(currentUnitId || '')
  
  const [disposisiKabid, setDisposisiKabid] = useState<string[]>(initialDisposisiKabid || [])
  const [disposisiKasubbid, setDisposisiKasubbid] = useState<string[]>(initialDisposisiKasubbid || [])
  const [catatanTambahanKabid, setCatatanTambahanKabid] = useState<string>(initialDisposisiTambahan ? initialDisposisiTambahan.split(' | ')[0] : '')
  const [catatanTambahanKasubbid, setCatatanTambahanKasubbid] = useState<string>(initialDisposisiTambahan && initialDisposisiTambahan.includes(' | ') ? initialDisposisiTambahan.split(' | ')[1] : '')

  const handleToggleKabid = (option: string) => {
    setDisposisiKabid(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const handleToggleKasubbid = (option: string) => {
    setDisposisiKasubbid(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitId) return
    setIsSubmitting(true)
    
    let combinedCatatan = ''
    if (disposisiKabid.length > 0 || catatanTambahanKabid) {
      combinedCatatan += 'Disposisi Kabid: ' + disposisiKabid.join(', ')
      if (catatanTambahanKabid) combinedCatatan += ' | Tambahan: ' + catatanTambahanKabid
      combinedCatatan += '\n'
    }
    if (disposisiKasubbid.length > 0 || catatanTambahanKasubbid) {
      combinedCatatan += 'Disposisi Kasubbidpaminal: ' + disposisiKasubbid.join(', ')
      if (catatanTambahanKasubbid) combinedCatatan += ' | Tambahan: ' + catatanTambahanKasubbid
      combinedCatatan += '\n'
    }

    const res = await updateDistribusiAction(pengaduanId, unitId, combinedCatatan.trim(), disposisiKabid, disposisiKasubbid, [catatanTambahanKabid, catatanTambahanKasubbid].filter(Boolean).join(' | '))
    setIsSubmitting(false)
    if (res.success) {
      alert('Distribusi berhasil disimpan.')
      router.refresh()
    } else {
      alert(res.error || 'Gagal menyimpan distribusi.')
    }
  }

  const selectedUnit = units.find(u => u.id === unitId)
  const unitNameDisplay = selectedUnit ? selectedUnit.nama : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl bg-card p-4 rounded-md border">
      <div>
        <h3 className="font-bold text-lg mb-1">Distribusi Unit & Disposisi</h3>
      </div>

      <div className="space-y-2 max-w-md">
        <Label>Pilih Unit Tujuan</Label>
        <Select value={unitId} onValueChange={(val) => setUnitId(val || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih unit...">{unitNameDisplay}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
        <div className="space-y-4 bg-blue-100 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <Label className="text-base text-blue-800 dark:text-blue-300">Catatan Disposisi Kabid (Wajib)</Label>
          <div className="grid grid-cols-1 gap-2">
            {disposisiOptions.map((opt) => (
              <div key={'kabid-' + opt} className="flex items-center space-x-2">
                <Checkbox id={'kabid-' + opt} checked={disposisiKabid.includes(opt)} onCheckedChange={() => handleToggleKabid(opt)} className="border-black dark:border-white" />
                <label 
                  htmlFor={'kabid-' + opt}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Label className="text-xs text-blue-800/80 dark:text-blue-300/80 mb-2 block">Catatan Disposisi (Tambahan)</Label>
            <Textarea 
              placeholder="Catatan tambahan..."
              value={catatanTambahanKabid}
              onChange={(e) => setCatatanTambahanKabid(e.target.value)}
              rows={2}
              className="bg-white/50 dark:bg-background/50"
            />
          </div>
        </div>

        <div className="space-y-4 bg-green-100 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <Label className="text-base text-green-800 dark:text-green-300">Catatan Disposisi Kasubbidpaminal (Wajib)</Label>
          <div className="grid grid-cols-1 gap-2">
            {disposisiOptions.map((opt) => (
              <div key={'kasubbid-' + opt} className="flex items-center space-x-2">
                <Checkbox id={'kasubbid-' + opt} checked={disposisiKasubbid.includes(opt)} onCheckedChange={() => handleToggleKasubbid(opt)} className="border-black dark:border-white" />
                <label 
                  htmlFor={'kasubbid-' + opt}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Label className="text-xs text-green-800/80 dark:text-green-300/80 mb-2 block">Catatan Disposisi (Tambahan)</Label>
            <Textarea 
              placeholder="Catatan tambahan..."
              value={catatanTambahanKasubbid}
              onChange={(e) => setCatatanTambahanKasubbid(e.target.value)}
              rows={2}
              className="bg-white/50 dark:bg-background/50"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || !unitId || unitId === currentUnitId}>
        {isSubmitting ? 'Menyimpan...' : 'Simpan Distribusi & Disposisi'}
      </Button>
    </form>
  )
}









