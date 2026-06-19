'use client'

import { useState, useEffect, useCallback, useRef, createElement } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Download, Menu, FileText, Upload } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { getDocumentTypesAction, getTemplateAction } from './actions'
import { getDocxBufferAction, generateDocxAction, uploadDocxTemplateAction, renderDocxPreviewAction } from './docx-actions'
import { DocxEditorWrapper } from '@/components/dokumen/docx-editor-wrapper'
import { getFormComponent, hasFormComponent } from '@/lib/template'
import type { VariableDef } from '@/lib/template'
import { toast } from 'sonner'
import './uuk-form'

interface DocTypeItem {
  kode: string
  nama: string
}

export function DocumentEditor() {
  const [docTypes, setDocTypes] = useState<DocTypeItem[]>([])
  const [selectedKode, setSelectedKode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [docTypeName, setDocTypeName] = useState('')
  const [variableDefs, setVariableDefs] = useState<VariableDef[]>([])
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null)
  const [hasTemplate, setHasTemplate] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadTemplate = useCallback(async (kode: string) => {
    setDocxBuffer(null)
    setHasTemplate(false)

    const res = await getTemplateAction(kode)

    setDocTypeName(res.docType?.nama || kode)

    if (res.variableDefs) {
      setVariableDefs(res.variableDefs)
    }

    if (!res.template?.template_docx_path) {
      setVariables({})
      toast.error('Belum ada template DOCX untuk jenis dokumen ini. Silakan upload template terlebih dahulu.')
      return
    }

    setHasTemplate(true)
    const bufRes = await getDocxBufferAction(kode)
    if (bufRes.base64) {
      const binary = atob(bufRes.base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      setDocxBuffer(bytes.buffer as ArrayBuffer)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      getDocumentTypesAction(),
    ]).then(([docTypeRes]) => {
      if (docTypeRes.data) {
        const types = docTypeRes.data as DocTypeItem[]
        setDocTypes(types)
        if (types.length > 0) {
          const first = types[0]
          setSelectedKode(first.kode)
          setDocTypeName(first.nama)
          loadTemplate(first.kode)
        }
      }
      setLoading(false)
    })
  }, [loadTemplate])

  const handleSelectDocType = (kode: string | null) => {
    if (!kode) return
    setSelectedKode(kode)
    const dt = docTypes.find(d => d.kode === kode)
    setDocTypeName(dt?.nama || '')
    loadTemplate(kode)
  }

  const handleFormChange = useCallback((allVars: Record<string, string>) => {
    setVariables(allVars)
  }, [])

  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!hasTemplate || !selectedKode) return

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(async () => {
      const res = await renderDocxPreviewAction(selectedKode, variables)
      if (res.base64) {
        const binary = atob(res.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        setDocxBuffer(bytes.buffer as ArrayBuffer)
      }
    }, 800)

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [variables, selectedKode, hasTemplate])

  const handleSave = async () => {
    setSaving(true)
    const res = await generateDocxAction(selectedKode, variables)
    setSaving(false)

    if (res.error) {
      toast.error('Gagal menyimpan: ' + res.error)
      return
    }

    toast.success('Dokumen berhasil disimpan')

    if (res.downloadUrl) {
      const a = document.createElement('a')
      a.href = res.downloadUrl
      a.download = res.fileName || `${selectedKode}.docx`
      a.click()
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const res = await generateDocxAction(selectedKode, variables)
    setGenerating(false)

    if (res.error) {
      toast.error('Gagal generate DOCX: ' + res.error)
      return
    }

    toast.success('Dokumen berhasil digenerate')

    if (res.downloadUrl) {
      const a = document.createElement('a')
      a.href = res.downloadUrl
      a.download = res.fileName || `${selectedKode}.docx`
      a.click()
    }
  }

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedKode) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadDocxTemplateAction(selectedKode, formData)
    setUploading(false)

    if (res.error) {
      toast.error('Gagal upload template: ' + res.error)
      return
    }

    toast.success('Template DOCX berhasil diunggah!')
    loadTemplate(selectedKode)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const useSpecialForm = hasFormComponent(selectedKode)
  const specialFormComponent = useSpecialForm ? getFormComponent(selectedKode) : null

  const renderSidebar = () => {
    if (useSpecialForm && specialFormComponent) {
      return createElement(specialFormComponent, {
        pengaduanId: undefined,
        variableDefs,
        values: variables,
        onChange: handleFormChange,
        onSave: handleSave,
      })
    }
    return (
      <div className="flex-1 overflow-auto flex flex-col h-full bg-muted/20">
        <div className="flex flex-col min-h-0" style={{ height: '100%' }}>
          <div className="px-3 py-2 border-b bg-muted/40 shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider">Variabel</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="text-center py-8 text-xs text-muted-foreground">
              Form khusus untuk jenis dokumen ini belum tersedia.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sidebarContent = renderSidebar()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30 shrink-0">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" className="lg:hidden h-7 w-7">
                <Menu className="h-4 w-4" />
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-[350px] sm:w-[400px]">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <h2 className="text-sm font-bold hidden sm:block">Editor Dokumen</h2>
        <Select value={selectedKode} onValueChange={handleSelectDocType}>
          <SelectTrigger className="w-[200px] h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {docTypes.map(dt => (
              <SelectItem key={dt.kode} value={dt.kode} className="text-xs">{dt.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedKode && (
          <>
            <Link href={`/dokumen/${selectedKode}`}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" /> Edit Template
              </Button>
            </Link>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleUploadTemplate}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {uploading ? 'Uploading...' : 'Upload Template'}
            </Button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleGenerate} disabled={generating || !hasTemplate}>
            <Download className="h-3 w-3" /> {generating ? 'Generating...' : 'Generate'}
          </Button>
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSave} disabled={saving || !hasTemplate}>
            <Save className="h-3 w-3" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:block w-[350px] shrink-0 border-r bg-muted/20">
          {sidebarContent}
        </div>
        <div className="flex-1 bg-white flex flex-col min-w-0">
          {docxBuffer ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <DocxEditorWrapper
                documentBuffer={docxBuffer}
                onSave={(buffer) => {
                  setDocxBuffer(buffer)
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                {hasTemplate ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                ) : (
                  <p className="text-sm">Pilih jenis dokumen dan upload template DOCX untuk memulai.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
