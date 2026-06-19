'use client'

import '@eigenpal/docx-editor-react/styles.css'
import dynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const DocxEditor = dynamic(
  () => import('@eigenpal/docx-editor-react').then((mod) => mod.DocxEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-muted/10 border rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
)

const TAB_ALIGNMENTS = [
  { value: 'left', label: 'Kiri └' },
  { value: 'center', label: 'Tengah ┬' },
  { value: 'right', label: 'Kanan ┘' },
  { value: 'decimal', label: 'Desimal' },
]

interface DocxEditorWrapperProps {
  documentBuffer: ArrayBuffer | null
  onSave: (buffer: ArrayBuffer) => void
}

export function DocxEditorWrapper({ documentBuffer, onSave }: DocxEditorWrapperProps) {
  const editorRef = useRef<any>(null)
  const [tabAlign, setTabAlign] = useState('left')
  const [tabPos, setTabPos] = useState('')

  const addTabStop = useCallback(() => {
    const pagedEditor = editorRef.current?.getEditorRef?.()
    const view = pagedEditor?.getView()
    if (!view) {
      toast.error('Editor belum siap')
      return
    }
    const cm = parseFloat(tabPos)
    if (isNaN(cm) || cm <= 0) {
      toast.error('Masukkan posisi tab yang valid (cm)')
      return
    }

    const twips = Math.round(cm * 567)
    const state = view.state
    const { $from } = state.selection

    let paraPos = -1
    let paraAttrs: Record<string, any> = {}
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d)
      if (node?.type?.name === 'paragraph') {
        paraPos = $from.before(d)
        paraAttrs = { ...node.attrs }
        break
      }
    }

    if (paraPos < 0) {
      toast.error('Tidak dapat menemukan paragraf aktif')
      return
    }

    const existingTabs = (paraAttrs.tabs as any[]) || []
    const newTabs = [...existingTabs, { position: twips, alignment: tabAlign, leader: 'none' }]

    view.dispatch(state.tr.setNodeMarkup(paraPos, null, { ...paraAttrs, tabs: newTabs }))
    view.focus()
    setTabPos('')
    toast.success(`Tab ${tabAlign} ditambahkan di ${cm} cm`)
  }, [tabAlign, tabPos])

  const insertTextAtCursor = useCallback((text: string) => {
    const pagedEditor = editorRef.current?.getEditorRef?.()
    const view = pagedEditor?.getView()
    if (!view) return
    const { state } = view
    const { from, to } = state.selection
    const tr = state.tr.insertText(text, from, to)
    view.dispatch(tr)
    view.focus()
  }, [])

  if (!documentBuffer) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/10 border rounded-md">
        <p className="text-sm text-muted-foreground">Unggah template .docx terlebih dahulu di tab "Template DOCX".</p>
      </div>
    )
  }

  return (
    <div className="ep-editor-container border rounded-md flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20 shrink-0 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tab Stop</span>
        <Select value={tabAlign} onValueChange={(v) => v && setTabAlign(v)}>
          <SelectTrigger className="h-7 text-xs w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_ALIGNMENTS.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={tabPos}
          onChange={e => setTabPos(e.target.value)}
          placeholder="cm"
          className="h-7 text-xs w-[60px]"
          onKeyDown={e => { if (e.key === 'Enter') addTabStop() }}
        />
        <Button size="sm" className="h-7 text-xs" onClick={addTabStop}>
          Tambah
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <DocxEditor
          ref={editorRef}
          documentBuffer={documentBuffer}
          onSave={onSave}
          mode="editing"
          colorMode="light"
          showRuler={true}
          rulerUnit="cm"
          showZoomControl={true}
          showMarginGuides={true}
        />
      </div>
    </div>
  )
}
