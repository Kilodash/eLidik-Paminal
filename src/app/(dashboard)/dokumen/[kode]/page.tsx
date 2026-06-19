'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Upload, Download, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getTemplateAction } from '../actions'
import { getDocxTemplateAction, uploadDocxTemplateAction, removeDocxTemplateAction } from '../docx-actions'
import { toast } from 'sonner'

export default function TemplateEditorPage() {
  const params = useParams()
  const kode = params.kode as string

  const [loading, setLoading] = useState(true)
  const [docType, setDocType] = useState<{ kode: string; nama: string } | null>(null)
  const [docxPath, setDocxPath] = useState<string | null>(null)
  const [docxDownloadUrl, setDocxDownloadUrl] = useState<string | null>(null)
  const [uploadingDocx, setUploadingDocx] = useState(false)
  const [removingDocx, setRemovingDocx] = useState(false)
  const fileInputRef = useState<HTMLInputElement | null>(null)

  useEffect(() => {
    getTemplateAction(kode).then(async (templateRes) => {
      if (templateRes.docType) {
        setDocType(templateRes.docType)
      }

      const docxRef = await getDocxTemplateAction(kode)
      if (docxRef.template?.template_docx_path) {
        setDocxPath(docxRef.template.template_docx_path)
        setDocxDownloadUrl(docxRef.template.downloadUrl)
      }

      setLoading(false)
    })
  }, [kode])

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDocx(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadDocxTemplateAction(kode, formData)
    setUploadingDocx(false)

    if (res.error) {
      toast.error('Gagal mengunggah: ' + res.error)
      return
    }

    if ('path' in res && res.path) {
      setDocxPath(res.path)
    }

    const refresh = await getDocxTemplateAction(kode)
    if (refresh.template?.downloadUrl) {
      setDocxDownloadUrl(refresh.template.downloadUrl)
    }
    toast.success('Template DOCX berhasil diunggah!')
  }

  const handleDocxRemove = async () => {
    if (!confirm('Hapus template DOCX?')) return

    setRemovingDocx(true)
    const res = await removeDocxTemplateAction(kode)
    setRemovingDocx(false)

    if (res.error) {
      toast.error('Gagal menghapus: ' + res.error)
      return
    }

    setDocxPath(null)
    setDocxDownloadUrl(null)
    toast.success('Template DOCX berhasil dihapus.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!docType) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Jenis dokumen tidak ditemukan.
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dokumen">
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-bold">{docType.nama}</h2>
          <p className="text-xs text-muted-foreground font-mono">{docType.kode}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Template DOCX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Unggah template dalam format <strong>.docx</strong> dengan placeholder <code className="bg-muted px-1 py-0.5 rounded">{'{placeholder}'}</code>.
          </p>

          <div className="flex items-center gap-3">
            <input
              ref={el => { fileInputRef[1](el) }}
              type="file"
              accept=".docx"
              onChange={handleDocxUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => fileInputRef[0]?.click()}
              disabled={uploadingDocx}
            >
              {uploadingDocx ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadingDocx ? 'Mengunggah...' : 'Unggah .docx'}
            </Button>

            {docxDownloadUrl && (
              <a href={docxDownloadUrl} download>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </a>
            )}

            {docxPath && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-red-600"
                onClick={handleDocxRemove}
                disabled={removingDocx}
              >
                <Trash2 className="h-4 w-4" />
                {removingDocx ? 'Menghapus...' : 'Hapus'}
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
    </div>
  )
}
