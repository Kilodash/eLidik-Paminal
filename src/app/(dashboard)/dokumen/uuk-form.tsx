'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, RotateCcw } from 'lucide-react'
import { getUukFormDataAction } from './actions'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { ComponentType } from 'react'
import { registerForm } from '@/lib/template'
import type { VariableDef, GenericFormProps } from '@/lib/template'

interface UukFormValues {
  nomorUUK: string
  tanggalUUK: string
  pelaksanaNama: string
  perihal: string
  indikasiUUK: string
  baket: string[]
  sumberBaket: string[]
  taktik: string[]
  waktuMulai: string
  waktuSelesai: string
  tempat: string
  pejabatNama: string
  pejabatPangkat: string
  pejabatNRP: string
  kopBaris1: string
  kopBaris2: string
  kopBaris3: string
}

function getTaktikOptions(defs: VariableDef[]): string[] {
  for (const def of defs) {
    if (def.variable_key === 'list_taktik_baket' && def.list_config?.options) {
      return def.list_config.options
    }
  }
  return [
    'Observasi',
    'Wawancara',
    'Pengumpulan Dokumen',
    'Survei Lokasi',
    'Analisis Data',
    'Koordinasi Lintas Sektor',
    'Undercover',
    'Surveillance',
  ]
}

export function UukForm({ pengaduanId, variableDefs, onChange }: GenericFormProps) {
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<UukFormValues>({
    nomorUUK: '',
    tanggalUUK: '',
    pelaksanaNama: '',
    perihal: '',
    indikasiUUK: '',
    baket: [''],
    sumberBaket: [''],
    taktik: [] as string[],
    waktuMulai: '',
    waktuSelesai: '',
    tempat: '',
    pejabatNama: '',
    pejabatPangkat: '',
    pejabatNRP: '',
    kopBaris1: '',
    kopBaris2: '',
    kopBaris3: '',
  })

  const [taktikOptions] = useState(() => getTaktikOptions(variableDefs || []))

  const buildVars = useCallback((data: UukFormValues): Record<string, string> => {
    // Pakai newline (\n) bukan <br/>: docxtemplater dgn linebreaks:true membuat baris baru asli.
    const baketHtml = data.baket.filter(b => b).map((b, i) => `${i + 1}. ${b}`).join('\n')
    const sumberHtml = data.sumberBaket.filter(s => s).map((s, i) => `${i + 1}. ${s}`).join('\n')
    const taktikHtml = data.taktik.map((t, i) => `${i + 1}. ${t}`).join('\n')
    const waktuHtml = data.waktuMulai && data.waktuSelesai
      ? `${data.waktuMulai} s.d. ${data.waktuSelesai}`
      : '-'

    const tgl = data.tanggalUUK ? format(new Date(data.tanggalUUK + 'T00:00:00'), 'dd MMMM yyyy', { locale: id }) : ''

    return {
      nomor_UUK: data.nomorUUK,
      tanggal_uuk: tgl,
      unit_uuk: data.pelaksanaNama,
      perihal_uuk: data.perihal,
      indikasi_uuk: data.indikasiUUK,
      list_baket: baketHtml,
      list_sumber_baket: sumberHtml,
      list_taktik_baket: taktikHtml,
      waktu_baket: waktuHtml,
      tempat_baket: data.tempat,
      pejabat_kasubbidpaminal: data.pejabatNama,
      pangkat_kasubbid: data.pejabatPangkat,
      nrp_kasubbid: data.pejabatNRP,
      kop_baris1: data.kopBaris1,
      kop_baris2: data.kopBaris2,
      kop_baris3: data.kopBaris3,
      baket1: data.baket[0] || '',
      baket2: data.baket[1] || '',
      sumber: data.sumberBaket[0] || '',
      sumber2: data.sumberBaket[1] || '',
      taktik: data.taktik[0] || '',
      taktik2: data.taktik[1] || '',
    }
  }, [])

  const loadFormData = useCallback(async () => {
    setLoading(true)
    const res = await getUukFormDataAction(pengaduanId)

    if (res.tenantVars) {
      const newData: UukFormValues = {
        nomorUUK: res.nomorUUK || '',
        tanggalUUK: new Date().toISOString().split('T')[0],
        pelaksanaNama: res.pengaduanData?.unit_nama || '',
        perihal: res.pengaduanData?.perihal || '',
        indikasiUUK: '',
        baket: [''],
        sumberBaket: [''],
        taktik: [],
        waktuMulai: '',
        waktuSelesai: '',
        tempat: res.tenantVars.alamat || '',
        pejabatNama: res.tenantVars.nama_kasubbid || res.tenantVars.nama_kasi || '',
        pejabatPangkat: res.tenantVars.pangkat_kasubbid || res.tenantVars.pangkat_kasi || '',
        pejabatNRP: res.tenantVars.nip_kasubbid || res.tenantVars.nip_kasi || '',
        kopBaris1: res.tenantVars.kop_baris1 || '',
        kopBaris2: res.tenantVars.kop_baris2 || '',
        kopBaris3: res.tenantVars.kop_baris3 || '',
      }
      setFormData(newData)
    }
    setLoading(false)
  }, [pengaduanId])

  useEffect(() => {
    loadFormData()
  }, [loadFormData])

  useEffect(() => {
    if (!loading) {
      onChange(buildVars(formData))
    }
  }, [loading, formData, onChange, buildVars])

  const updateForm = useCallback((updater: (prev: UukFormValues) => UukFormValues) => {
    setFormData(updater)
  }, [])

  const addBaket = () => updateForm(prev => ({ ...prev, baket: [...prev.baket, ''] }))
  const removeBaket = (idx: number) => updateForm(prev => ({ ...prev, baket: prev.baket.filter((_, i) => i !== idx) }))
  const updateBaket = (idx: number, val: string) => updateForm(prev => ({ ...prev, baket: prev.baket.map((v, i) => i === idx ? val : v) }))

  const addSumber = () => updateForm(prev => ({ ...prev, sumberBaket: [...prev.sumberBaket, ''] }))
  const removeSumber = (idx: number) => updateForm(prev => ({ ...prev, sumberBaket: prev.sumberBaket.filter((_, i) => i !== idx) }))
  const updateSumber = (idx: number, val: string) => updateForm(prev => ({ ...prev, sumberBaket: prev.sumberBaket.map((v, i) => i === idx ? val : v) }))

  const toggleTaktik = (taktik: string) => updateForm(prev => ({
    ...prev,
    taktik: prev.taktik.includes(taktik)
      ? prev.taktik.filter(t => t !== taktik)
      : [...prev.taktik, taktik]
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b bg-muted/40 shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Form UUK</h3>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Informasi Dokumen</p>
          <div className="space-y-1.5">
            <Label className="text-sm">Nomor UUK</Label>
            <Input value={formData.nomorUUK} onChange={e => updateForm(prev => ({ ...prev, nomorUUK: e.target.value }))} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Tanggal UUK</Label>
            <Input type="date" value={formData.tanggalUUK} onChange={e => updateForm(prev => ({ ...prev, tanggalUUK: e.target.value }))} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Pelaksana (Unit)</Label>
            <Input value={formData.pelaksanaNama} onChange={e => updateForm(prev => ({ ...prev, pelaksanaNama: e.target.value }))} className="h-8" placeholder="Nama unit pelaksana" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Perihal</Label>
            <Input value={formData.perihal} onChange={e => updateForm(prev => ({ ...prev, perihal: e.target.value }))} className="h-8" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Indikasi Permasalahan</Label>
          <Textarea value={formData.indikasiUUK} onChange={e => updateForm(prev => ({ ...prev, indikasiUUK: e.target.value }))} className="min-h-[60px]" placeholder="Deskripsi indikasi..." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 flex-1">Baket yang Dibutuhkan</p>
            <Button variant="outline" size="sm" className="h-7 text-xs ml-2" onClick={addBaket}>+ Tambah</Button>
          </div>
          {formData.baket.map((b, idx) => (
            <div key={idx} className="flex gap-1">
              <Input value={b} onChange={e => updateBaket(idx, e.target.value)} className="h-8" placeholder={`Baket ${idx + 1}`} />
              {formData.baket.length > 1 && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => removeBaket(idx)}>&times;</Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 flex-1">Sumber Baket</p>
            <Button variant="outline" size="sm" className="h-7 text-xs ml-2" onClick={addSumber}>+ Tambah</Button>
          </div>
          {formData.sumberBaket.map((s, idx) => (
            <div key={idx} className="flex gap-1">
              <Input value={s} onChange={e => updateSumber(idx, e.target.value)} className="h-8" placeholder={`Sumber ${idx + 1}`} />
              {formData.sumberBaket.length > 1 && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => removeSumber(idx)}>&times;</Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Teknik / Taktik</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {taktikOptions.map(t => (
              <div key={t} className="flex items-center gap-2">
                <Checkbox id={`taktik-${t}`} checked={formData.taktik.includes(t)} onCheckedChange={() => toggleTaktik(t)} className="h-3.5 w-3.5" />
                <label htmlFor={`taktik-${t}`} className="text-sm cursor-pointer">{t}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Waktu</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Mulai</Label>
              <Input type="date" value={formData.waktuMulai} onChange={e => updateForm(prev => ({ ...prev, waktuMulai: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Selesai</Label>
              <Input type="date" value={formData.waktuSelesai} onChange={e => updateForm(prev => ({ ...prev, waktuSelesai: e.target.value }))} className="h-8" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Tempat Pelaporan</Label>
          <Input value={formData.tempat} onChange={e => updateForm(prev => ({ ...prev, tempat: e.target.value }))} className="h-8" />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Penanda Tangan</p>
          <div className="space-y-1.5">
            <Label className="text-sm">Nama</Label>
            <Input value={formData.pejabatNama} onChange={e => updateForm(prev => ({ ...prev, pejabatNama: e.target.value }))} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Pangkat</Label>
            <Input value={formData.pejabatPangkat} onChange={e => updateForm(prev => ({ ...prev, pejabatPangkat: e.target.value }))} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">NRP / NIP</Label>
            <Input value={formData.pejabatNRP} onChange={e => updateForm(prev => ({ ...prev, pejabatNRP: e.target.value }))} className="h-8" />
          </div>
        </div>

        <div className="flex gap-2 pt-1 pb-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={loadFormData}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

registerForm('UNSUR-KETERANGAN', UukForm as ComponentType<GenericFormProps>)
