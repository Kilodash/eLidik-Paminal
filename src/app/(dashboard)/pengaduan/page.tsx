import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPengaduanList, getPengaduanById } from '@/lib/data/pengaduan'
import { getWilayahSatkerList, getJenisPengaduanList, getUnitList } from '@/lib/data/master'
import { getPersonel } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { PengaduanTable } from '@/components/layout/pengaduan-table'
import { ResizableFormTableLayout } from '@/components/layout/resizable-form-table-layout'
import { PengaduanClientForm } from './client-form'
import { savePengaduan } from './actions'
import { ClearableDatePicker, ClearableSelect } from '@/components/ui/clearable-fields'
import { ResetButton } from '@/components/ui/reset-button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { NameInput } from '@/components/ui/name-input'
import { UppercaseInput, SentenceCaseTextarea } from '@/components/ui/format-inputs'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DistribusiForm } from '@/components/pengaduan/distribusi-form'
import { AiEnrichButton } from '@/components/pengaduan/ai-enrich-button'
import { SyncGajamadaButton } from '@/components/pengaduan/sync-gajamada-button'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PengaduanListPage({ searchParams }: Props) {
  const personel = await getPersonel()
  if (!personel) redirect('/login')

  const wilayahSatker = await getWilayahSatkerList()
  const jenisPengaduan = await getJenisPengaduanList()
  const units = await getUnitList()

  const sp = await searchParams
  const editId = sp.edit as string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let editData: any = null
  if (editId) {
    editData = await getPengaduanById(editId).catch(() => null)
  }

  const terlaporFull = (() => {
    if (!editData?.pengaduan_terlapor?.[0]?.terlapor) return ''
    const t = editData.pengaduan_terlapor[0].terlapor
    const parts: string[] = []
    if (t.pangkat) parts.push(t.pangkat)
    if (t.nama) parts.push(t.nama)
    if (t.nrp) parts.push(`nrp ${t.nrp}`)
    if (t.jabatan) parts.push(`jabatan ${t.jabatan}`)
    return parts.join(', ') || t.nama || ''
  })()

  const page = parseInt(String(sp.page || '1'))
  const query = String(sp.q || '')
  const statusParam = String(sp.status || '')
  const unitId = String(sp.unit || '')
  const klasifikasiId = String(sp.klasifikasi || '')
  const overdue = sp.overdue === 'true'
  const sortBy = String(sp.sort || 'created_at')
  const sortOrder = (sp.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'

  const { data, total } = await getPengaduanList({
    page,
    query: query || undefined,
    status: statusParam ? statusParam.split(',') : undefined,
    unitId: unitId || undefined,
    klasifikasiId: klasifikasiId || undefined,
    overdue: overdue || undefined,
    sortBy,
    sortOrder,
  })

  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div>
          <h1 className="text-lg font-bold">Pengaduan</h1>
          <p className="text-sm text-muted-foreground">Daftar pengaduan masyarakat dan laporan informasi</p>
        </div>
        <div className="flex items-center gap-2">
          {(personel.role === 'admin_subbid' || personel.role === 'oversight') && <SyncGajamadaButton />}
          <Link href="/pengaduan/gajamada">
            <Button type="button" variant="outline" size="sm">Monitoring Gajamada</Button>
          </Link>
        </div>
      </div>

      <ResizableFormTableLayout
        showForm={personel.role !== 'operator_unit'}
        formPanel={
          <>
            <img src="/logo-simondu.png" alt="Logo SIMONDU" className="w-full h-auto object-cover" />

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold">No. Berkas</span>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <span className="text-xl font-bold font-mono text-muted-foreground">{(editData?.berkas as any)?.nomor_berkas || '-'}</span>
              </div>

              <PengaduanClientForm action={savePengaduan} className="space-y-1.5 flex-1 flex flex-col min-h-0" key={editData?.id || 'new'}>
                <input type="hidden" name="created_by" value={personel.id} />
                {editData && <input type="hidden" name="editId" value={editData.id} />}
                
                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Tanggal Terima *</Label>
                  <ClearableDatePicker name="tgl_pengaduan" required value={editData ? new Date(editData.tgl_pengaduan) : new Date()} className="w-full h-8" disableFuture placeholder="" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Jenis Dumas *</Label>
                  <ClearableSelect 
                    name="jenis" 
                    required 
                    defaultValue={editData?.jenis || '--'}
                    options={[
                      { value: '--', label: '--' },
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      ...jenisPengaduan.map((j: any) => ({ value: j.nama, label: j.nama }))
                    ]}
                  />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Pelapor</Label>
                  <NameInput key={editData?.id || 'pelapor'} id="pelapor_nama" name="pelapor_nama" required minLength={3} maxLength={500} defaultValue={editData?.pelapor_nama || ''} className="h-8" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Terlapor *</Label>
                  <NameInput key={editData?.id || 'terlapor'} id="terlapor_nama" name="terlapor_nama" required minLength={3} maxLength={500} defaultValue={terlaporFull} className="h-8" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Satwil/Satker *</Label>
                  <Select key={editData?.id || 'new-select'} name="satker_dilaporkan" defaultValue={editData?.satker_dilaporkan || undefined} required>
                    <SelectTrigger key="trigger" className="h-8 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent key="content">
                      {wilayahSatker.map((ws) => (
                        <SelectItem key={ws.id} value={ws.nama}>{ws.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Tanggal Surat *</Label>
                  <DatePicker name="tgl_surat" required disableFuture className="h-8 w-full" value={editData?.tgl_surat ? new Date(editData.tgl_surat) : undefined} placeholder="" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0">
                  <Label className="font-semibold">Nomor Surat</Label>
                  <UppercaseInput name="nomor_surat" maxLength={255} defaultValue={editData?.nomor_surat || ''} className="h-8" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-start gap-2 pt-1 flex-1 min-h-[100px]">
                  <Label className="font-semibold pt-2 shrink-0">Isi Dumas *</Label>
                  <SentenceCaseTextarea name="kronologi" required minLength={10} maxLength={3000} defaultValue={editData?.kronologi || ''} className="h-full resize-none" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-start gap-2 pt-1 shrink-0">
                  <Label className="font-semibold pt-2">Keterangan</Label>
                  <SentenceCaseTextarea name="keterangan" maxLength={3000} defaultValue={editData?.keterangan || ''} className="min-h-[60px] resize-y" />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2 shrink-0 pt-2">
                  <Label className="font-semibold text-destructive">Atensi Pimpinan</Label>
                  <div className="flex items-center space-x-2 h-8">
                    <Checkbox id="atensi" name="atensi" value="true" defaultChecked={editData?.atensi || false} />
                    <label
                      htmlFor="atensi"
                      className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
                    >
                      Tandai Atensi
                    </label>
                  </div>
                </div>

                <div className="pt-4 pb-2 flex gap-2 mt-auto shrink-0">
                  <Button type="submit" className="flex-1 font-bold h-8">
                    {editData ? 'Edit Dumas' : 'Simpan Aduan'}
                  </Button>
                  {editData ? (
                    <Link href="/pengaduan" className="flex-1">
                      <Button type="button" variant="outline" className="w-full h-8">
                        Batal Edit
                      </Button>
                    </Link>
                  ) : (
                    <ResetButton />
                  )}
                </div>
              </PengaduanClientForm>
              {editData && (
                <AiEnrichButton pengaduanId={editData.id} aiProcessed={editData.ai_processed} />
              )}
            </div>
          </>
        }
        tablePanel={
          <Tabs defaultValue="tabel-dumas" className="w-full h-full flex flex-col">
            <div className="bg-muted/30 border-b border-black pt-2 px-2 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 flex space-x-1">
                <TabsTrigger value="tabel-dumas" className="data-[state=active]:bg-card data-[state=active]:border-t-black data-[state=active]:border-x-black border-transparent border-t border-x rounded-t-md rounded-b-none px-4 py-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground shadow-none">TABEL DUMAS</TabsTrigger>
                {(personel.role === "admin_subbid" || personel.role === "oversight") && <TabsTrigger value="tindak-lanjut" className="data-[state=active]:bg-card data-[state=active]:border-t-black data-[state=active]:border-x-black border-transparent border-t border-x rounded-t-md rounded-b-none px-4 py-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground shadow-none">DISTRIBUSI</TabsTrigger>}
                <TabsTrigger value="anev-dumas" className="data-[state=active]:bg-card data-[state=active]:border-t-black data-[state=active]:border-x-black border-transparent border-t border-x rounded-t-md rounded-b-none px-4 py-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground shadow-none">PENYELIDIKAN</TabsTrigger>
                <TabsTrigger value="anev-unit" className="data-[state=active]:bg-card data-[state=active]:border-t-black data-[state=active]:border-x-black border-transparent border-t border-x rounded-t-md rounded-b-none px-4 py-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground shadow-none">TINJUT HASIL</TabsTrigger>
                <TabsTrigger value="rekap" className="data-[state=active]:bg-card data-[state=active]:border-t-black data-[state=active]:border-x-black border-transparent border-t border-x rounded-t-md rounded-b-none px-4 py-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground shadow-none">REKAP PENANGANAN</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tabel-dumas" className="flex-1 m-0 flex flex-col overflow-hidden outline-none">
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <PengaduanTable data={data} total={total} page={page} query={query} userRole={personel.role} userId={personel.id} sortBy={sortBy} sortOrder={sortOrder} />
              </div>
            </TabsContent>
                        {(personel.role === "admin_subbid" || personel.role === "oversight") && <TabsContent value="tindak-lanjut" className="flex-1 m-0 p-4 overflow-y-auto">
              <div className="space-y-6">
                {editData ? (
                  <DistribusiForm 
                    pengaduanId={editData.id} 
                    currentUnitId={editData.unit_id} 
                    units={units}
                    initialDisposisiKabid={editData.disposisi_kabid}
                    initialDisposisiKasubbid={editData.disposisi_kasubbid}
                    initialDisposisiTambahan={editData.disposisi_tambahan}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-20 border border-dashed rounded-lg">
                    <p>Silakan klik tombol Edit (Pencil) pada salah satu data pengaduan di Tabel Dumas</p>
                    <p className="mt-1">untuk membuka Tindak Lanjut Distribusi.</p>
                  </div>
                )}
              </div>
            </TabsContent>}
            <TabsContent value="anev-dumas" className="flex-1 m-0 p-4 overflow-y-auto">
              <div className="text-sm text-muted-foreground">Konten Penyelidikan</div>
            </TabsContent>
            <TabsContent value="anev-unit" className="flex-1 m-0 p-4 overflow-y-auto">
              <div className="text-sm text-muted-foreground">Konten Tinjut Hasil</div>
            </TabsContent>
            <TabsContent value="rekap" className="flex-1 m-0 p-4 overflow-y-auto">
              <div className="text-sm text-muted-foreground">Konten Rekap Penanganan</div>
            </TabsContent>
          </Tabs>
        }
      />
    </div>
  )
}




