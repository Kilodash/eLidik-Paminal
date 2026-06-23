'use client'

import { useState, useEffect, useCallback, useRef, createElement } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Download, Menu, FileText, Upload, Bookmark, RotateCcw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { getDocumentTypesAction, getTemplateAction } from './actions'
import { getDocxBufferAction, generateDocxAction, uploadDocxTemplateAction, renderDocxPreviewAction, saveDocxAsTemplateAction, saveEditedDocxAction, getDraftDocxAction, getTemplatePlaceholdersAction } from './docx-actions'
import { DocxEditorWrapper, type DocxEditorWrapperHandle } from '@/components/dokumen/docx-editor-wrapper'
import { getFormComponent, hasFormComponent } from '@/lib/template'
import type { VariableDef } from '@/lib/template'
import { toast } from 'sonner'
import { GenericForm } from './generic-form'
import './uuk-form'

interface DocTypeItem {
  kode: string
  nama: string
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer as ArrayBuffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function DocumentEditor() {
  const searchParams = useSearchParams()
  const pengaduanId = searchParams.get('pengaduan') || undefined
  const jenisFromUrl = searchParams.get('jenis') || undefined

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
  const [previewLoading, setPreviewLoading] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  // Mode pratinjau: 'variabel' = sinkron dari form; 'manual' = user sedang edit langsung di pratinjau.
  const [editMode, setEditMode] = useState<'variabel' | 'manual'>('variabel')
  const [savingDraft, setSavingDraft] = useState(false)
  // base64 draft editan manual yang tersimpan (jika ada). Tidak dimuat otomatis;
  // user memuatnya lewat tombol "Muat draft" agar mode variabel tetap aktif saat membuka editor.
  const [pendingDraftBase64, setPendingDraftBase64] = useState<string | null>(null)
  // Status diagnostik untuk ditampilkan di UI (bukan untuk user, tapi untuk debugging).
  const [loadStatus, setLoadStatus] = useState<string>('')
  // Panel debug: placeholder template vs key form.
  const [debugPlaceholders, setDebugPlaceholders] = useState<string[]>([])
  const [debugFormKeys, setDebugFormKeys] = useState<string[]>([])
  const [debugTemplatePath, setDebugTemplatePath] = useState<string>('')
  const [debugVisible, setDebugVisible] = useState(false)
  const mountedRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editModeRef = useRef<'variabel' | 'manual'>('variabel')
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<DocxEditorWrapperHandle | null>(null)
  // Kunci re-mount editor: hanya berganti saat dokumen awal benar-benar diganti
  // (ganti jenis dokumen atau memuat draft), BUKAN saat pembaruan pratinjau dari form.
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => { editModeRef.current = editMode }, [editMode])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current)
    }
  }, [])

  const loadTemplate = useCallback(async (kode: string) => {
    setDocxBuffer(null)
    setHasTemplate(false)
    setEditMode('variabel')
    setPendingDraftBase64(null)
    setLoadStatus('Memuat info template…')

    const res = await getTemplateAction(kode)

    setDocTypeName(res.docType?.nama || kode)

    if (res.variableDefs) {
      setVariableDefs(res.variableDefs)
    }

    if (!res.template?.template_docx_path) {
      setVariables({})
      setLoadStatus('')
      toast.error('Belum ada template DOCX untuk jenis dokumen ini. Silakan upload template terlebih dahulu.')
      return
    }

    setHasTemplate(true)
    setLoadStatus(`Template ditemukan: ${res.template.template_docx_path}`)

    // Pulihkan draft variabel form (per jenis dokumen).
    try {
      const savedDraft = localStorage.getItem(`draft:${kode}`)
      if (savedDraft) setVariables(JSON.parse(savedDraft))
    } catch {}

    // 1) Cek draft editan manual yang tersimpan untuk pengaduan+jenis ini.
    //    JANGAN auto-masuk mode manual: cukup simpan draft-nya dan biarkan
    //    mode variabel aktif agar perubahan form langsung tampil di pratinjau.
    setLoadStatus('Mengecek draft tersimpan…')
    const draftRes = await getDraftDocxAction(kode, pengaduanId)
    if (!mountedRef.current) return
    if (draftRes.base64) {
      setPendingDraftBase64(draftRes.base64)
      toast.info('Ada draft editan manual tersimpan. Klik "Muat draft" bila ingin melanjutkan editan tersebut.')
    }

    // 2) Muat template asli sebagai pratinjau awal (akan dirender ulang oleh effect pratinjau dari form).
    setLoadStatus('Mendownload template dari storage…')
    const bufRes = await getDocxBufferAction(kode)
    if (!mountedRef.current) return
    if (bufRes.base64) {
      setDocxBuffer(base64ToArrayBuffer(bufRes.base64))
      setEditorKey(k => k + 1)
      setLoadStatus('')
    } else {
      // Gagal memuat buffer template -> jangan biarkan spinner berputar tanpa henti.
      setHasTemplate(false)
      setLoadStatus('')
      toast.error('Gagal memuat template DOCX: ' + (bufRes.error || 'tidak diketahui'))
    }
  }, [pengaduanId])

  // Muat draft editan manual yang tersimpan secara eksplisit -> masuk mode manual.
  const handleLoadDraft = useCallback(() => {
    if (!pendingDraftBase64) return
    setDocxBuffer(base64ToArrayBuffer(pendingDraftBase64))
    setEditMode('manual')
    editModeRef.current = 'manual'
    setEditorKey(k => k + 1)
    toast.info('Draft editan manual dimuat. Ubah variabel form tidak akan menimpa editan ini sampai Anda menekan "Terapkan ulang variabel".')
  }, [pendingDraftBase64])

  useEffect(() => {
    Promise.all([
      getDocumentTypesAction(),
    ]).then(([docTypeRes]) => {
      if (docTypeRes.data) {
        const types = docTypeRes.data as DocTypeItem[]
        setDocTypes(types)
        if (types.length > 0) {
          // Prioritaskan jenis dokumen dari URL (?jenis=), fallback ke jenis pertama.
          const initial = (jenisFromUrl && types.find(t => t.kode === jenisFromUrl)) || types[0]
          setSelectedKode(initial.kode)
          setDocTypeName(initial.nama)
          loadTemplate(initial.kode)
        }
      }
      setLoading(false)
    })
  }, [loadTemplate, jenisFromUrl])

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

  // Render pratinjau dari template + variabel form, lalu dorong hasilnya ke editor
  // via loadBuffer() (tanpa re-mount, tidak mencuri fokus form).
  const doPreviewUpdate = useCallback(async (vars: Record<string, string>) => {
    // Jangan menimpa editan manual.
    if (editModeRef.current === 'manual') {
      setPreviewLoading(false)
      return
    }
    const res = await renderDocxPreviewAction(selectedKode, vars)
    if (!mountedRef.current) return
    if (res.base64) {
      const buf = base64ToArrayBuffer(res.base64)
      if (wrapperRef.current) {
        await wrapperRef.current.loadBuffer(buf)
      } else {
        // Editor belum siap → simpan sebagai buffer awal.
        setDocxBuffer(buf)
        setEditorKey(k => k + 1)
      }
    } else if (res.error) {
      // Render pratinjau gagal (mis. placeholder template rusak). Tampilkan agar tidak diam.
      toast.error('Gagal memperbarui pratinjau: ' + res.error)
    }
    setPreviewLoading(false)
  }, [selectedKode])

  useEffect(() => {
    if (!hasTemplate || !selectedKode) return
    // Dalam mode manual, perubahan variabel TIDAK me-render ulang pratinjau.
    if (editMode === 'manual') return

    setPreviewLoading(true)

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(() => {
      doPreviewUpdate(variables)
    }, 300)

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [variables, selectedKode, hasTemplate, editMode, doPreviewUpdate])

  useEffect(() => {
    if (selectedKode && Object.keys(variables).length > 0) {
      localStorage.setItem(`draft:${selectedKode}`, JSON.stringify(variables))
    }
  }, [variables, selectedKode])

  // Debug: update form keys saat variables berubah.
  useEffect(() => {
    setDebugFormKeys(Object.keys(variables).sort())
  }, [variables])

  // Debug: fetch placeholder template saat selectedKode berubah.
  useEffect(() => {
    if (!hasTemplate || !selectedKode) return
    getTemplatePlaceholdersAction(selectedKode).then(res => {
      if (!mountedRef.current) return
      setDebugTemplatePath(res.path || '')
      setDebugPlaceholders(res.placeholders || [])
    })
  }, [selectedKode, hasTemplate])

  const handleSaveAsTemplate = async () => {
    if (!selectedKode) return
    // Ambil isi editor terkini (termasuk editan manual) sebagai template.
    const buffer = (await wrapperRef.current?.getBuffer()) || docxBuffer
    if (!buffer) return
    setSavingTemplate(true)
    const base64 = arrayBufferToBase64(buffer)
    const res = await saveDocxAsTemplateAction(selectedKode, base64)
    setSavingTemplate(false)
    if (res.error) {
      toast.error('Gagal menyimpan template: ' + res.error)
      return
    }
    toast.success('Template DOCX tersimpan. Dokumen baru akan menggunakan template ini.')
  }

  // Dipanggil saat user mengedit langsung di pratinjau (editor WYSIWYG).
  // Masuk mode manual, lalu auto-save (debounce) draft ke server.
  const handleUserEdit = useCallback(() => {
    setEditMode('manual')
    editModeRef.current = 'manual'

    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current)
    draftSaveTimerRef.current = setTimeout(async () => {
      if (!selectedKode || !wrapperRef.current) return
      const buffer = await wrapperRef.current.getBuffer()
      if (!buffer) return
      setSavingDraft(true)
      const base64 = arrayBufferToBase64(buffer)
      const res = await saveEditedDocxAction(selectedKode, variables, base64, pengaduanId)
      if (!mountedRef.current) return
      setSavingDraft(false)
      if (res.error) {
        toast.error('Gagal menyimpan draft: ' + res.error)
      }
    }, 1200)
  }, [selectedKode, variables, pengaduanId])

  // Buang editan manual, kembali ke mode variabel: render ulang dari template + form.
  const handleReapplyVariables = useCallback(async () => {
    setEditMode('variabel')
    editModeRef.current = 'variabel'
    setPreviewLoading(true)
    const res = await renderDocxPreviewAction(selectedKode, variables)
    if (!mountedRef.current) return
    if (res.base64) {
      const buf = base64ToArrayBuffer(res.base64)
      if (wrapperRef.current) {
        await wrapperRef.current.loadBuffer(buf)
      } else {
        setDocxBuffer(buf)
        setEditorKey(k => k + 1)
      }
    }
    setPreviewLoading(false)
    toast.success('Pratinjau dikembalikan ke isi form.')
  }, [selectedKode, variables])

  const handleSave = async () => {
    setSaving(true)

    // Mode manual: simpan persis editan pratinjau (jangan render ulang dari template).
    if (editMode === 'manual') {
      const buffer = (await wrapperRef.current?.getBuffer()) || docxBuffer
      if (!buffer) {
        setSaving(false)
        toast.error('Tidak ada konten untuk disimpan')
        return
      }
      const base64 = arrayBufferToBase64(buffer)
      const res = await saveEditedDocxAction(selectedKode, variables, base64, pengaduanId)
      setSaving(false)
      if (res.error) {
        toast.error('Gagal menyimpan: ' + res.error)
        return
      }
      toast.success('Draft dokumen (editan manual) berhasil disimpan')
      return
    }

    // Mode variabel: generate dari template + isi form.
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
        pengaduanId,
        variableDefs,
        values: variables,
        onChange: handleFormChange,
        onSave: handleSave,
      })
    }
    // Fallback: form generik dinamis dari definisi variabel (variableDefs).
    return (
      <GenericForm
        key={selectedKode}
        pengaduanId={pengaduanId}
        variableDefs={variableDefs}
        values={variables}
        onChange={handleFormChange}
        onSave={handleSave}
      />
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
        {editMode === 'manual' && (
          <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
            Mode edit manual
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {editMode === 'variabel' && pendingDraftBase64 && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleLoadDraft} disabled={!hasTemplate}>
              <FileText className="h-3 w-3" /> Muat draft
            </Button>
          )}
          {editMode === 'manual' && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleReapplyVariables} disabled={!hasTemplate}>
              <RotateCcw className="h-3 w-3" /> Terapkan ulang variabel
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleGenerate} disabled={generating || !hasTemplate}>
            <Download className="h-3 w-3" /> {generating ? 'Generating...' : 'Generate'}
          </Button>
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSave} disabled={saving || !hasTemplate}>
            <Save className="h-3 w-3" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button variant="secondary" size="sm" className="h-7 gap-1 text-xs" onClick={handleSaveAsTemplate} disabled={savingTemplate || !docxBuffer}>
            <Bookmark className="h-3 w-3" /> {savingTemplate ? 'Menyimpan...' : 'Simpan Template'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:flex lg:flex-col w-[350px] shrink-0 border-r bg-muted/20">
          <div className="flex-1 min-h-0">{sidebarContent}</div>
          {/* Panel debug: placeholder template vs key form */}
          {(debugPlaceholders.length > 0 || debugFormKeys.length > 0) && (
            <div className="border-t bg-background shrink-0" style={{ maxHeight: '30%' }}>
              <button
                className="w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 flex items-center gap-1"
                onClick={() => setDebugVisible(v => !v)}
              >
                {debugVisible ? '▾' : '▸'} Debug: Placeholder vs Form
              </button>
              {debugVisible && (
                <div className="overflow-auto px-3 py-1.5 text-[9px] leading-relaxed space-y-1 max-h-48">
                  {debugTemplatePath && (
                    <p className="text-muted-foreground">📁 {debugTemplatePath}</p>
                  )}
                  <p className="font-semibold text-green-700">Template ({debugPlaceholders.length}):</p>
                  <p className="text-green-800 break-all">
                    {debugPlaceholders.length === 0
                      ? '(kosong — template tanpa placeholder!)'
                      : debugPlaceholders.join(', ')}
                  </p>
                  <p className="font-semibold text-blue-700">Form ({debugFormKeys.length}):</p>
                  <p className="text-blue-800 break-all">{debugFormKeys.join(', ')}</p>
                  {(() => {
                    const missing = debugFormKeys.filter(k => !debugPlaceholders.includes(k))
                    const extra = debugPlaceholders.filter(k => !debugFormKeys.includes(k))
                    return (missing.length > 0 || extra.length > 0) ? (
                      <>
                        {missing.length > 0 && (
                          <p className="text-red-700 font-semibold">
                            ❌ Form emit key yg TIDAK ADA di template: {missing.join(', ')}
                          </p>
                        )}
                        {extra.length > 0 && (
                          <p className="text-amber-700">
                            ⚠️ Placeholder template yg TIDAK diisi form: {extra.join(', ')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-green-600 font-semibold">✅ Semua key cocok</p>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 bg-white flex flex-col min-w-0 relative">
          {docxBuffer ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <DocxEditorWrapper
                key={editorKey}
                ref={wrapperRef}
                documentBuffer={docxBuffer}
                onUserEdit={handleUserEdit}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                {hasTemplate ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs">Memuat template DOCX…</p>
                    {loadStatus && (
                      <p className="text-[10px] text-amber-600 mt-1 max-w-[280px]">{loadStatus}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm">Pilih jenis dokumen dan upload template DOCX untuk memulai.</p>
                )}
              </div>
            </div>
          )}
          {(previewLoading || savingDraft) && docxBuffer && (
            <div className="absolute top-2 right-2 bg-muted/80 rounded-full px-2 py-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {savingDraft ? 'menyimpan draft...' : 'pratinjau...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
