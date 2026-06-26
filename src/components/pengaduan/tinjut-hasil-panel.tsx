'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SentenceCaseTextarea } from '@/components/ui/format-inputs'
import { Label } from '@/components/ui/label'
import { updatePengaduanStatusAction } from '@/app/(dashboard)/pengaduan/actions'

interface TinjutHasilPanelProps {
  pengaduanId: string
  currentStatus: string
}

export function TinjutHasilPanel({ pengaduanId, currentStatus }: TinjutHasilPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (fd: FormData) => {
    setIsSubmitting(true)
    const newStatus = fd.get('status') as string
    const catatan = fd.get('catatan') as string
    
    const res = await updatePengaduanStatusAction(pengaduanId, newStatus, catatan)
    setIsSubmitting(false)
    
    if (res.success) {
      alert('Tindak lanjut hasil penyelidikan berhasil disimpan.')
    } else {
      alert(res.error || 'Gagal menyimpan tindak lanjut')
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Tindak Lanjut Hasil Penyelidikan</h3>
          <p className="text-xs text-slate-500 mt-0.5">Penetapan hasil akhir penyelidikan (Terbukti / Tidak Terbukti)</p>
        </div>
        
        <form action={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Hasil Penyelidikan</Label>
            <Select name="status" defaultValue={currentStatus === 'terbukti' || currentStatus === 'tidak_terbukti' ? currentStatus : undefined} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih hasil penyelidikan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terbukti">Terbukti</SelectItem>
                <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                <SelectItem value="lidik_selesai">Lidik Selesai (Menunggu Gelar Akhir)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-500">Akan mengubah status pengaduan di sistem.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Catatan / Rekomendasi Gelar</Label>
            <SentenceCaseTextarea 
              name="catatan" 
              required 
              placeholder="Tuliskan kesimpulan singkat hasil penyelidikan..." 
              className="min-h-[100px] resize-y"
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil & Update Status'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
