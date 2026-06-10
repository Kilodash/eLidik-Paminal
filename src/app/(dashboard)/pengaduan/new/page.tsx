import { redirect } from 'next/navigation'
import { getPersonel } from '@/lib/auth'
import { getWilayahSatkerList } from '@/lib/data/master'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileEdit } from 'lucide-react'

export default async function NewPengaduanPage() {
  const personel = await getPersonel()
  if (!personel || personel.role === 'operator_unit') redirect('/pengaduan')

  const tenantId = personel.tenant_id

  // Fetch Satwil/Satker lookup list
  const wilayahSatker = await getWilayahSatkerList()

  // Get next register number preview (sequencing)
  const tahun = new Date().getFullYear()
  const bulan = new Date().getMonth() + 1
  const supabase = await createClient()
  const { data: reg } = await supabase
    .from('document_registers')
    .select('nomor_terakhir')
    .eq('tenant_id', tenantId)
    .eq('document_type_kode', 'REG')
    .eq('tahun', tahun)
    .eq('bulan', bulan)
    .maybeSingle()

  const nextNum = (reg?.nomor_terakhir || 0) + 1

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2 px-4">
      <form action={handleCreate} className="space-y-6">
        <Card className="border-0 ring-1 ring-border/50 shadow-xl shadow-foreground/5 bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2 text-foreground">
                <FileEdit className="size-4 text-primary" />
                Registrasi Pengaduan Baru
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">No. Berkas</span>
                <span className="text-lg font-bold font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-md leading-none select-none">
                  {nextNum}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-5">
            {/* Form grid layout: 2 columns responsive */}
            <div className="space-y-5">
              
              {/* Tanggal Terima * */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="tgl_pengaduan" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Tanggal Terima <span className="text-destructive">*</span>
                </Label>
                <div className="relative flex items-center">
                  <DatePicker 
                    name="tgl_pengaduan" 
                    value={new Date()} 
                    required 
                    className="w-full bg-background"
                  />
                </div>
              </div>

              {/* Pelapor */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="pelapor_nama" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Pelapor
                </Label>
                <Input 
                  id="pelapor_nama" 
                  name="pelapor_nama" 
                  placeholder="Nama pelapor (kosongkan jika anonim)" 
                  className="w-full bg-background"
                />
              </div>

              {/* Terlapor * */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="terlapor_nama" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Terlapor <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="terlapor_nama" 
                  name="terlapor_nama" 
                  placeholder="Nama terlapor (wajib diisi)" 
                  required 
                  className="w-full bg-background"
                />
              </div>

              {/* Jenis Dumas * */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="jenis" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Jenis Dumas <span className="text-destructive">*</span>
                </Label>
                <Select name="jenis" defaultValue="pengaduan" required>
                  <SelectTrigger className="w-full bg-background justify-between">
                    <SelectValue placeholder="Pilih Jenis Dumas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pengaduan">Pengaduan</SelectItem>
                    <SelectItem value="laporan_informasi">Laporan Informasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tanggal Surat * */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="tgl_surat" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Tanggal Surat <span className="text-destructive">*</span>
                </Label>
                <DatePicker 
                  name="tgl_surat" 
                  required 
                  className="w-full bg-background"
                />
              </div>

              {/* Nomor Surat */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="nomor_surat" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Nomor Surat
                </Label>
                <Input 
                  id="nomor_surat" 
                  name="nomor_surat" 
                  placeholder="Nomor surat pengaduan" 
                  className="w-full bg-background"
                />
              </div>

              {/* Isi Dumas * */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-start pt-2">
                <Label htmlFor="kronologi" className="text-sm font-medium text-muted-foreground sm:text-right sm:pt-2">
                  Isi Dumas <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-1 w-full">
                  <Textarea 
                    id="kronologi" 
                    name="kronologi" 
                    rows={5} 
                    maxLength={5000} 
                    placeholder="Uraian kronologi kejadian dumas..." 
                    required 
                    className="w-full bg-background resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">Maksimal 5000 karakter</p>
                </div>
              </div>

              {/* Satwil/Satker * */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-center">
                <Label htmlFor="satker_dilaporkan" className="text-sm font-medium text-muted-foreground sm:text-right">
                  Satwil/Satker <span className="text-destructive">*</span>
                </Label>
                <Select name="satker_dilaporkan" required>
                  <SelectTrigger className="w-full bg-background justify-between">
                    <SelectValue placeholder="Pilih Wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayahSatker.map((ws) => (
                      <SelectItem key={ws.id} value={ws.nama}>
                        {ws.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keterangan */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-start pt-2">
                <Label htmlFor="keterangan" className="text-sm font-medium text-muted-foreground sm:text-right sm:pt-2">
                  Keterangan
                </Label>
                <Textarea 
                  id="keterangan" 
                  name="keterangan" 
                  rows={3} 
                  placeholder="Keterangan tambahan (jika ada)..." 
                  className="w-full bg-background resize-y"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Hidden inputs to capture context */}
        <input type="hidden" name="created_by" value={personel.id} />

        <div className="flex gap-4">
          <Button type="submit" size="lg" className="w-full font-semibold shadow-md transition-all hover:shadow-lg">
            Simpan Aduan
          </Button>
        </div>
      </form>
    </div>
  )
}

async function handleCreate(formData: FormData) {
  'use server'

  const { createPengaduan } = await import('@/lib/data/pengaduan')

  const result = await createPengaduan({
    jenis: (formData.get('jenis') as 'pengaduan' | 'laporan_informasi') || 'pengaduan',
    tgl_pengaduan: formData.get('tgl_pengaduan') as string,
    pelapor_nama: (formData.get('pelapor_nama') as string) || null,
    pelapor_kontak: null,
    terlapor_nama: (formData.get('terlapor_nama') as string) || undefined,
    nomor_surat: (formData.get('nomor_surat') as string) || null,
    tgl_surat: (formData.get('tgl_surat') as string) || null,
    keterangan: (formData.get('keterangan') as string) || null,
    satker_dilaporkan: (formData.get('satker_dilaporkan') as string) || null,
    kronologi: (formData.get('kronologi') as string) || null,
    atensi: false,
    created_by: formData.get('created_by') as string,
  })
  redirect(`/pengaduan/${result.id}`)
}
