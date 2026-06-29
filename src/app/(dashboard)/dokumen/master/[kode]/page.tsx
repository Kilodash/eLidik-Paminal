'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, Eye, ArrowLeft, Upload, Download, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import {
  getMasterTemplateAction,
  saveMasterTemplateAction,
  getMasterDocxDownloadUrlAction,
  convertDocxToHtmlAction,
} from '../../actions'
import { renderTemplateHtml } from '@/lib/template'
import { createClient } from '@/lib/supabase/client'

export default function MasterTemplatePage() {
  const params = useParams()
  const kode = params.kode as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [headerHtml, setHeaderHtml] = useState('')
  const [footerHtml, setFooterHtml] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [docxPath, setDocxPath] = useState<string | null>(null)
  const [docxDownloadUrl, setDocxDownloadUrl] = useState<string | null>(null)
  const [uploadingDocx, setUploadingDocx] = useState(false)
  const [removingDocx, setRemovingDocx] = useState(false)
  const [docxRemoveOpen, setDocxRemoveOpen] = useState(false)
  const [docTypeName, setDocTypeName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMasterTemplateAction(kode).then(async (master) => {
      setDocTypeName(kode)

      if (master) {
        setContent(master.content || '')
        setHeaderHtml(master.header_html || '')
        setFooterHtml(master.footer_html || '')
        if (master.template_docx_path) {
          setDocxPath(master.template_docx_path)
          const url = await getMasterDocxDownloadUrlAction(master.template_docx_path)
          setDocxDownloadUrl(url)
        }
      }

      setLoading(false)
    })
  }, [kode])

  const buildPreview = useCallback(() => {
    const sampleVars: Record<string, string> = {
      kop_polda: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      kop_baris1: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      kop_baris2: 'DAERAH METRO JAYA',
      kop_baris3: 'BIDANG PROFESI DAN PENGAMANAN',
      alamat: 'Jl. Trunojoyo No. 3, Kebayoran Baru, Jakarta Selatan',
      kabid: 'KOMBES POL. Dr. NAMA KABID',
      pangkat_kabid: 'KOMBES POL.',
      kasubbid: 'AKBP NAMA KASUBBID',
      pangkat_kasubbid: 'AKBP',
      pejabat_penanda_tangan: 'KOMBES POL. NAMA PEJABAT',
      nomor_surat: 'LI/METRO/2026/06/001',
      nomor_UUK: 'R/UUK-1/VI/HUK.12.10./2026/Paminal',
      tanggal: '18 Juni 2026',
      tanggal_uuk: '18 Juni 2026',
      pelapor: 'BRIPKA NAMA PELAPOR',
      terlapor: 'BRIPKA NAMA TERLAPOR',
      pangkat_terlapor: 'BRIPKA',
      jabatan_terlapor: 'Anggota Polsek',
      kronologi: 'Isi kronologi pengaduan masyarakat di sini.',
      satker: 'Polres Metro Jakarta Selatan',
      unit: 'Unit 3',
      jenis: 'Laporan Informasi',
      tgl_pengaduan: '2026-06-18',
      nomor_register: 'LI/METRO/2026/06/001',
      tgl_sekarang: '18 Juni 2026',
      bulan_romawi: 'VI',
      tahun: '2026',
      metadata_analisa: 'Analisa singkat berdasarkan fakta.',
      metadata_saran: 'Saran tindak lanjut.',
      perihal_uuk: 'Perihal penyelidikan UUK',
      unit_uuk: 'Subbid Paminal',
      indikasi_uuk: 'Indikasi permasalahan yang ditemukan.',
      list_baket: '1. Baket A<br/>2. Baket B',
      list_sumber_baket: '1. Sumber A<br/>2. Sumber B',
      list_taktik_baket: 'Observasi<br/>Wawancara',
      waktu_baket: '2026-01-01 s.d. 2026-01-15',
      tempat_baket: 'Jakarta Selatan',
      pejabat_kasubbidpaminal: 'AKBP NAMA PEJABAT',
      nrp_kasubbid: '12345678',
    }
    const source = headerHtml + (content || '<p style="color:#999;text-align:center;">Template belum diisi</p>') + footerHtml
    setPreviewHtml(renderTemplateHtml(source, sampleVars))
  }, [content, headerHtml, footerHtml])

  const handleSave = async () => {
    setSaving(true)
    const res = await saveMasterTemplateAction(kode, {
      content,
      header_html: headerHtml,
      footer_html: footerHtml,
      template_docx_path: docxPath,
    })
    setSaving(false)
    if (res.error) {
      toast.error('Gagal menyimpan: ' + res.error)
    } else {
      toast.success('Template master berhasil disimpan!')
    }
  }

  const handleDocxUpload = async () => {
    const supabase = createClient()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploadingDocx(true)

    const storagePath = `master/${kode}.docx`
    const { error } = await supabase.storage
      .from('templates')
      .upload(storagePath, file, {
        upsert: true,
      })

    if (error) {
      setUploadingDocx(false)
      toast.error('Gagal mengunggah: ' + error.message)
      return
    }

    const url = await getMasterDocxDownloadUrlAction(storagePath)
    setDocxPath(storagePath)
    setDocxDownloadUrl(url)

    const formData = new FormData()
    formData.append('file', file)
    const convRes = await convertDocxToHtmlAction(formData)

    if (convRes.error || !convRes.html) {
      setUploadingDocx(false)
      toast.error('Gagal konversi DOCX: ' + (convRes.error || 'hasil kosong'))
      return
    }

    const htmlContent = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4;">\n${convRes.html}\n</div>`
    setContent(htmlContent)

    const saveRes = await saveMasterTemplateAction(kode, {
      content: htmlContent,
      header_html: headerHtml,
      footer_html: footerHtml,
      template_docx_path: storagePath,
    })

    setUploadingDocx(false)

    if (saveRes.error) {
      toast.error('Gagal menyimpan template: ' + saveRes.error)
    } else {
      toast.success('Template DOCX berhasil diunggah, dikonversi, dan disimpan!')
    }
  }

  const handleDocxRemove = async () => {
    setDocxRemoveOpen(false)
    setRemovingDocx(true)
    const supabase = createClient()

    if (docxPath) {
      await supabase.storage.from('templates').remove([docxPath])
    }

    setDocxPath(null)
    setDocxDownloadUrl(null)
    setRemovingDocx(false)
    toast.success('Template DOCX dihapus.')
  }

  const INSERT_VARIABLES = [
    { key: 'kop_baris1', label: 'Kop Baris 1', source: 'tenant' },
    { key: 'kop_baris2', label: 'Kop Baris 2', source: 'tenant' },
    { key: 'kop_baris3', label: 'Kop Baris 3', source: 'tenant' },
    { key: 'nomor_surat', label: 'Nomor Surat', source: 'system' },
    { key: 'nomor_UUK', label: 'Nomor UUK', source: 'system' },
    { key: 'tanggal', label: 'Tanggal', source: 'system' },
    { key: 'tanggal_uuk', label: 'Tanggal UUK', source: 'user_input' },
    { key: 'tgl_sekarang', label: 'Tgl Hari Ini', source: 'system' },
    { key: 'bulan_romawi', label: 'Bulan Romawi', source: 'system' },
    { key: 'tahun', label: 'Tahun', source: 'system' },
    { key: 'perihal', label: 'Perihal', source: 'user_input' },
    { key: 'perihal_uuk', label: 'Perihal UUK', source: 'pengaduan' },
    { key: 'pelapor', label: 'Pelapor', source: 'pengaduan' },
    { key: 'terlapor', label: 'Terlapor', source: 'pengaduan' },
    { key: 'pangkat_terlapor', label: 'Pangkat Terlapor', source: 'pengaduan' },
    { key: 'jabatan_terlapor', label: 'Jabatan Terlapor', source: 'pengaduan' },
    { key: 'kronologi', label: 'Kronologi', source: 'pengaduan' },
    { key: 'satker', label: 'Satker', source: 'pengaduan' },
    { key: 'unit', label: 'Unit', source: 'pengaduan' },
    { key: 'unit_uuk', label: 'Unit UUK', source: 'pengaduan' },
    { key: 'indikasi_uuk', label: 'Indikasi UUK', source: 'user_input' },
    { key: 'list_baket', label: 'List Baket', source: 'user_input' },
    { key: 'list_sumber_baket', label: 'List Sumber', source: 'user_input' },
    { key: 'list_taktik_baket', label: 'List Taktik', source: 'user_input' },
    { key: 'waktu_baket', label: 'Waktu Baket', source: 'user_input' },
    { key: 'tempat_baket', label: 'Tempat', source: 'tenant' },
    { key: 'pejabat_kasubbidpaminal', label: 'Pejabat TTD', source: 'tenant' },
    { key: 'pangkat_kasubbid', label: 'Pangkat', source: 'tenant' },
    { key: 'nrp_kasubbid', label: 'NRP', source: 'tenant' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dokumen">
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{docTypeName || kode}</h2>
            <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Admin Master</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{kode} — Template berlaku untuk semua tenant</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/dokumen/${kode}`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">Template Tenant &rarr;</Button>
          </Link>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={buildPreview}>
            <Eye className="h-4 w-4" /> Pratinjau
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Master'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor" className="gap-1"><FileText className="h-3.5 w-3.5" /> Editor HTML</TabsTrigger>
          <TabsTrigger value="preview" className="gap-1"><Eye className="h-3.5 w-3.5" /> Pratinjau</TabsTrigger>
          <TabsTrigger value="docx" className="gap-1"><Upload className="h-3.5 w-3.5" /> DOCX</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Konten Template (HTML)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full min-h-[350px] p-3 font-mono text-xs border rounded-md resize-y bg-muted/10"
                  placeholder="Masukkan HTML template dengan {{placeholder}}..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold mb-1 text-muted-foreground">Header HTML</p>
                    <textarea
                      value={headerHtml}
                      onChange={e => setHeaderHtml(e.target.value)}
                      className="w-full min-h-[60px] p-2 font-mono text-[10px] border rounded-md resize-y bg-muted/10"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold mb-1 text-muted-foreground">Footer HTML</p>
                    <textarea
                      value={footerHtml}
                      onChange={e => setFooterHtml(e.target.value)}
                      className="w-full min-h-[60px] p-2 font-mono text-[10px] border rounded-md resize-y bg-muted/10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Variabel</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">Copy-paste ke editor:</p>
                <div className="space-y-1">
                  {INSERT_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}
                      className="w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border text-xs"
                    >
                      <span className="font-mono font-semibold">{`{{${v.key}}}`}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">{v.source}</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pratinjau (dengan data sampel)</CardTitle>
            </CardHeader>
            <CardContent>
              {previewHtml ? (
                <div className="border rounded-md p-6 bg-white text-black" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p>Klik <strong>Pratinjau</strong> untuk melihat hasil.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docx" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Template DOCX Master</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Unggah template <strong>.docx</strong> master. File akan otomatis dikonversi ke HTML untuk pratinjau.
                Placeholder: <code className="bg-muted px-1 py-0.5 rounded">{'{nama}'}</code>
              </p>

              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept=".docx" className="hidden" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDocx}
                >
                  {uploadingDocx ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingDocx ? 'Mengunggah...' : 'Unggah .docx'}
                </Button>

                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleDocxUpload} disabled={uploadingDocx}>
                  <Save className="h-4 w-4" /> Konversi & Simpan
                </Button>

                {docxDownloadUrl && (
                  <a href={docxDownloadUrl} download>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </a>
                )}

                {docxPath && (
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-red-600" onClick={() => setDocxRemoveOpen(true)} disabled={removingDocx}>
                    <Trash2 className="h-4 w-4" /> {removingDocx ? 'Menghapus...' : 'Hapus'}
                  </Button>
                )}
              </div>

              {docxPath && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded p-2">
                  <Badge variant="secondary" className="text-[10px] font-mono">DOCX</Badge>
                  <span className="font-mono text-[11px]">{docxPath}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={docxRemoveOpen}
        onOpenChange={setDocxRemoveOpen}
        title="Hapus Template DOCX Master"
        description="Anda yakin ingin menghapus template DOCX master? Tindakan ini tidak dapat dibatalkan."
        variant="destructive"
        confirmLabel="Hapus"
        onConfirm={handleDocxRemove}
      />
    </div>
  )
}
