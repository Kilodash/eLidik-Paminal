'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select as AntSelect, Radio as AntRadio } from 'antd'
import { generateSingleDocumentAction } from '@/app/(dashboard)/pengaduan/actions'
import { formatNomorDokumen } from '@/lib/utils'

interface PersonelOption {
  value: string
  label: string
  pangkat: string
  nip: string
}

interface PenyelidikanPanelProps {
  pengaduanId: string
  personelOptions: PersonelOption[]
}

const defaultFormats: Record<string, string> = {
  'SPRIN-LIDIK': 'Sprin.Lidik/{{nomor}}/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  'SURAT-PEMBERITAHUAN-AWAL': 'B/{{nomor}}/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  'UNSUR-KETERANGAN': 'R/{{nomor}}/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  'RAB-LIDIK': 'R/{{nomor}}/RAB/{{bulan_romawi}}/{{tahun}}/Bid Propam',
}

const dokumenItems = [
  { kode: 'SPRIN-LIDIK', nama: 'Surat Perintah Penyelidikan', desc: 'Penunjukan tim penyelidik' },
  { kode: 'SURAT-PEMBERITAHUAN-AWAL', nama: 'Surat Pemberitahuan Awal kepada Pelapor', desc: 'Pemberitahuan dimulainya penyelidikan' },
  { kode: 'UNSUR-KETERANGAN', nama: 'Unsur Unsur Keterangan', desc: 'Arahan tertulis pimpinan (UUK)' },
  { kode: 'RAB-LIDIK', nama: 'Rencana Kebutuhan Anggaran', desc: 'RAB kegiatan penyelidikan' },
]

function getFormatFromSettings(kode: string): string {
  if (typeof window === 'undefined') return defaultFormats[kode] || ''
  const saved = localStorage.getItem('master_nomor_dokumen')
  if (saved) {
    const parsed = JSON.parse(saved)
    if (parsed[kode]?.format) return parsed[kode].format
  }
  return defaultFormats[kode] || ''
}

export function PenyelidikanPanel({ pengaduanId, personelOptions }: PenyelidikanPanelProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, boolean>>({})
  const [checklist, setChecklist] = useState({ penelaahan: false, gelar_internal: false })
  const [docDates, setDocDates] = useState<Record<string, Date | undefined>>({})
  const [docNomors, setDocNomors] = useState<Record<string, string>>({})
  const [formats, setFormats] = useState<Record<string, string>>(defaultFormats)
  const [activeDoc, setActiveDoc] = useState<string | null>(null)
  
  // Specific data for docs
  const [timPenyelidik, setTimPenyelidik] = useState<string[]>([])
  const [kontakPersonel, setKontakPersonel] = useState<string | null>(null)

  useEffect(() => {
    const loaded: Record<string, string> = {}
    for (const doc of dokumenItems) {
      loaded[doc.kode] = getFormatFromSettings(doc.kode)
    }
    setFormats(loaded)
  }, [])

  const handleDateChange = (kode: string, date: Date | undefined) => {
    setDocDates(prev => ({ ...prev, [kode]: date }))
    if (date) {
      const fmt = formats[kode] || ''
      const rendered = formatNomorDokumen(fmt, date)
      setDocNomors(prev => ({ ...prev, [kode]: rendered }))
    }
  }

  const handleGenerateDoc = async (kode: string, nama: string) => {
    setIsSubmitting(true)
    
    // Convert array of string IDs to JSON for the action
    let metadataStr = ''
    if (kode === 'SPRIN-LIDIK') {
      metadataStr = JSON.stringify({ tim_penyelidik_ids: timPenyelidik })
    } else if (kode === 'SURAT-PEMBERITAHUAN-AWAL') {
      metadataStr = JSON.stringify({ kontak_id: kontakPersonel })
    }

    const res = await generateSingleDocumentAction(pengaduanId, kode, nama, 'Penyelidikan', metadataStr)
    setIsSubmitting(false)
    if (res.success) {
      setGeneratedDocs(prev => ({ ...prev, [kode]: true }))
      alert(res.message || `Dokumen "${nama}" berhasil dibuat!`)
    } else {
      alert(res.error || 'Gagal membuat dokumen')
    }
  }

  // Filter options for radio
  const kontakOptions = personelOptions.filter(p => timPenyelidik.includes(p.value))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Progress */}
      <div className="shrink-0 mb-4 bg-muted/20 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Persiapan Administrasi Penyelidikan</h3>
          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Tahap Perencanaan</span>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border shadow-sm">
            <Checkbox checked={checklist.penelaahan} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, penelaahan: !!c }))} />
            <span className="text-xs font-medium">Sudah penelaahan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border shadow-sm">
            <Checkbox checked={checklist.gelar_internal} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, gelar_internal: !!c }))} />
            <span className="text-xs font-medium">Sudah Gelar Internal Awal</span>
          </label>
        </div>
        {(!checklist.penelaahan || !checklist.gelar_internal) && (
          <div className="mt-2 text-[11px] text-amber-600 font-medium">
            * Lengkapi checklist persiapan sebelum membuat dokumen penyelidikan (Sesuai SOP Perkadiv Propam No 1/2015).
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Panel Kiri: Daftar Dokumen */}
        <div className="w-1/3 flex flex-col bg-slate-50 border rounded-lg overflow-hidden shrink-0">
          <div className="p-3 border-b bg-white">
            <span className="text-xs font-bold text-slate-500 uppercase">Daftar Dokumen</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {dokumenItems.map(doc => {
              const isGenerated = generatedDocs[doc.kode]
              const isActive = activeDoc === doc.kode
              return (
                <button
                  key={doc.kode}
                  onClick={() => setActiveDoc(doc.kode)}
                  className={`w-full text-left px-3 py-2.5 rounded-md border text-sm transition-colors ${
                    isActive 
                      ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-medium leading-tight ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                      {doc.nama}
                    </span>
                    <span className={`shrink-0 flex size-2.5 rounded-full mt-1 ${isGenerated ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{doc.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel Kanan: Form Detail */}
        <div className="flex-1 bg-white border rounded-lg overflow-y-auto custom-scrollbar relative">
          {activeDoc ? (
            <div className="p-5">
              {dokumenItems.map(doc => doc.kode === activeDoc && (
                <div key={doc.kode} className="animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">{doc.nama}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.desc}</p>
                    </div>
                    {generatedDocs[doc.kode] && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                        Draf Dibuat
                      </span>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Tanggal Dokumen</label>
                        <DatePicker
                          value={docDates[doc.kode]}
                          onChange={(date) => handleDateChange(doc.kode, date)}
                          className="w-full"
                          placeholder="Pilih tanggal"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Nomor Dokumen</label>
                        <Input
                          value={docNomors[doc.kode] || ''}
                          onChange={(e) => setDocNomors(prev => ({ ...prev, [doc.kode]: e.target.value }))}
                          className="font-mono text-xs"
                          placeholder="Terisi otomatis..."
                        />
                      </div>
                    </div>

                    {/* Specific Form Fields per Document */}
                    {doc.kode === 'SPRIN-LIDIK' && (
                      <div className="space-y-1.5 bg-slate-50 p-4 rounded-lg border">
                        <label className="text-xs font-bold text-slate-700">Tim Penyelidik (Pilih Anggota)</label>
                        <AntSelect
                          mode="multiple"
                          allowClear
                          style={{ width: '100%' }}
                          placeholder="Pilih ketua dan anggota tim..."
                          value={timPenyelidik}
                          onChange={setTimPenyelidik}
                          options={personelOptions}
                          optionRender={(option) => (
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{option.data.label}</span>
                              <span className="text-xs text-slate-500">{option.data.pangkat} {option.data.nip ? `| ${option.data.nip}` : ''}</span>
                            </div>
                          )}
                        />
                        <p className="text-[10px] text-slate-500 pt-1">Personel yang dipilih akan tercantum dalam Sprin Lidik.</p>
                      </div>
                    )}

                    {doc.kode === 'SURAT-PEMBERITAHUAN-AWAL' && (
                      <div className="space-y-2.5 bg-slate-50 p-4 rounded-lg border">
                        <label className="text-xs font-bold text-slate-700">Personel Kontak (Untuk Pelapor)</label>
                        {kontakOptions.length > 0 ? (
                          <AntRadio.Group value={kontakPersonel} onChange={(e) => setKontakPersonel(e.target.value)} className="flex flex-col gap-2">
                            {kontakOptions.map(opt => (
                              <AntRadio key={opt.value} value={opt.value}>
                                <span className="text-sm font-medium">{opt.label}</span>
                                <span className="text-xs text-slate-500 ml-1">({opt.pangkat})</span>
                              </AntRadio>
                            ))}
                          </AntRadio.Group>
                        ) : (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                            Silakan pilih Tim Penyelidik di menu <b>Surat Perintah Penyelidikan</b> terlebih dahulu.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-6 border-t mt-6 flex justify-end gap-2">
                      {generatedDocs[doc.kode] ? (
                        <>
                          <Button variant="outline" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50" onClick={() => router.push(`/dokumen?pengaduan=${pengaduanId}&jenis=${doc.kode}`)}>
                            Buka Editor Dokumen
                          </Button>
                          <Button onClick={() => alert('Fitur Finalisasi akan hadir di tahap selanjutnya')}>
                            Kunci Dokumen (Final)
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => handleGenerateDoc(doc.kode, doc.nama)} 
                          disabled={isSubmitting || (!checklist.penelaahan || !checklist.gelar_internal)}
                        >
                          Generate Draf Dokumen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Pilih dokumen di panel kiri untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
