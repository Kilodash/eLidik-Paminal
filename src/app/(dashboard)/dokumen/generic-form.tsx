'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getGenericFormDefaultsAction } from './actions'
import type { GenericFormProps, VariableDef } from '@/lib/template'

// Nilai mentah per field. Untuk input_type 'list' & 'checkbox_group' disimpan sebagai array.
type FieldValue = string | string[]
type FormState = Record<string, FieldValue>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isListType(t: string) {
  return t === 'list'
}
function isMultiType(t: string) {
  return t === 'checkbox_group'
}

/**
 * Serialisasi state form -> Record<string,string> sesuai placeholder docxtemplater.
 * - date: diformat "dd MMMM yyyy" (locale ID) bila berupa ISO date.
 * - list: tiap item jadi baris bernomor "1. xxx" dipisah newline (\n).
 * - checkbox_group: item terpilih jadi baris bernomor dipisah newline.
 * - lainnya: apa adanya.
 */
function serialize(defs: VariableDef[], state: FormState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const def of defs) {
    const key = def.variable_key
    const raw = state[key]

    if (isListType(def.input_type) || isMultiType(def.input_type)) {
      const arr = Array.isArray(raw) ? raw : []
      const items = arr.filter(v => v && v.trim() !== '')
      out[key] = items.map((v, i) => `${i + 1}. ${v}`).join('\n')
      // Akses per-item juga didukung: key_1, key_2, ...
      items.forEach((v, i) => { out[`${key}_${i + 1}`] = v })
      continue
    }

    let val = typeof raw === 'string' ? raw : ''
    if (def.input_type === 'date' && ISO_DATE.test(val)) {
      val = format(new Date(val + 'T00:00:00'), 'dd MMMM yyyy', { locale: idLocale })
    }
    out[key] = val
  }
  return out
}

/**
 * Nilai awal sebuah field: prioritas draft form (localStorage) -> tenant var -> pengaduan -> kosong.
 */
function initialValue(
  def: VariableDef,
  draft: Record<string, string>,
  tenantVars: Record<string, string>,
  pengaduanData: Record<string, string>,
  nextNomor: number,
): FieldValue {
  const key = def.variable_key

  if (isListType(def.input_type) || isMultiType(def.input_type)) {
    if (draft[key]) {
      // Draft disimpan sbg teks bernomor; pecah kembali jadi array.
      const items = draft[key]
        .split('\n')
        .map(l => l.replace(/^\s*\d+\.\s*/, '').trim())
        .filter(Boolean)
      return items
    }
    return isListType(def.input_type) ? [''] : []
  }

  if (draft[key] !== undefined && draft[key] !== '') return draft[key]
  if (tenantVars[key]) return tenantVars[key]
  if (pengaduanData[key]) return pengaduanData[key]

  // Default berbasis source/heuristik key.
  if (def.source === 'system' || /nomor/i.test(key)) {
    if (/nomor/i.test(key) && pengaduanData.nomor_register) return pengaduanData.nomor_register
  }
  if (def.input_type === 'date' || /tanggal|tgl/i.test(key)) {
    return new Date().toISOString().split('T')[0]
  }
  return ''
}

export function GenericForm({ pengaduanId, variableDefs, onChange }: GenericFormProps) {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<FormState>({})

  const defs = useMemo(
    () => [...(variableDefs || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [variableDefs],
  )

  // Kelompokkan field berdasarkan display_group (urut sesuai kemunculan pertama).
  const groups = useMemo(() => {
    const map = new Map<string, VariableDef[]>()
    for (const d of defs) {
      const g = d.display_group || 'Umum'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(d)
    }
    return Array.from(map.entries())
  }, [defs])

  const loadDefaults = useCallback(async () => {
    setLoading(true)
    let draft: Record<string, string> = {}
    try {
      const saved = localStorage.getItem(`draft:${defs[0]?.document_type_kode || ''}`)
      if (saved) draft = JSON.parse(saved)
    } catch {}

    const res = await getGenericFormDefaultsAction(
      defs[0]?.document_type_kode || '',
      pengaduanId,
    )
    const tenantVars = res.tenantVars || {}
    const pengaduanData = res.pengaduanData || {}
    const nextNomor = res.nextNomor || 1

    const next: FormState = {}
    for (const d of defs) {
      next[d.variable_key] = initialValue(d, draft, tenantVars, pengaduanData, nextNomor)
    }
    setState(next)
    setLoading(false)
  }, [defs, pengaduanId])

  useEffect(() => {
    loadDefaults()
  }, [loadDefaults])

  // Emit serialisasi dengan debounce (150ms) agar tidak memicu re-render tiap keystroke
  const debouncedOnChange = useDebouncedCallback(
    (serialized: Record<string, string>) => onChange(serialized),
    150,
  )

  useEffect(() => {
    if (!loading) debouncedOnChange(serialize(defs, state))
  }, [loading, state, defs, debouncedOnChange])

  const setField = useCallback((key: string, value: FieldValue) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateListItem = (key: string, idx: number, val: string) => {
    setState(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : ['']
      arr[idx] = val
      return { ...prev, [key]: arr }
    })
  }
  const addListItem = (key: string, max?: number) => {
    setState(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : ['']
      if (max && arr.length >= max) return prev
      return { ...prev, [key]: [...arr, ''] }
    })
  }
  const removeListItem = (key: string, idx: number) => {
    setState(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : ['']
      return { ...prev, [key]: arr.filter((_, i) => i !== idx) }
    })
  }
  const toggleMulti = (key: string, opt: string) => {
    setState(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : []
      return {
        ...prev,
        [key]: arr.includes(opt) ? arr.filter(v => v !== opt) : [...arr, opt],
      }
    })
  }

  const renderField = (def: VariableDef) => {
    const key = def.variable_key
    const val = state[key]
    const strVal = typeof val === 'string' ? val : ''
    const arrVal = Array.isArray(val) ? val : []
    const options = def.list_config?.options || []

    const label = (
      <Label className="text-sm">
        {def.variable_label || key}
        {def.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
    )

    switch (def.input_type) {
      case 'textarea':
        return (
          <div key={key} className="space-y-1.5">
            {label}
            <Textarea
              value={strVal}
              onChange={e => setField(key, e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        )

      case 'date':
        return (
          <div key={key} className="space-y-1.5">
            {label}
            <Input
              type="date"
              value={ISO_DATE.test(strVal) ? strVal : ''}
              onChange={e => setField(key, e.target.value)}
              className="h-8"
            />
          </div>
        )

      case 'select':
        return (
          <div key={key} className="space-y-1.5">
            {label}
            <Select value={strVal} onValueChange={v => setField(key, v || '')}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
                  <SelectItem key={opt} value={opt} className="text-sm">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'checkbox_group':
        return (
          <div key={key} className="space-y-2">
            {label}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {options.map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`${key}-${opt}`}
                    checked={arrVal.includes(opt)}
                    onCheckedChange={() => toggleMulti(key, opt)}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={`${key}-${opt}`} className="text-sm cursor-pointer">
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )

      case 'list':
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">{label}</div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs ml-2"
                onClick={() => addListItem(key, def.list_config?.max_items)}
              >
                + Tambah
              </Button>
            </div>
            {(arrVal.length ? arrVal : ['']).map((item, idx) => (
              <div key={idx} className="flex gap-1">
                <Input
                  value={item}
                  onChange={e => updateListItem(key, idx, e.target.value)}
                  className="h-8"
                  placeholder={`${def.variable_label || key} ${idx + 1}`}
                />
                {arrVal.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => removeListItem(key, idx)}
                  >
                    &times;
                  </Button>
                )}
              </div>
            ))}
          </div>
        )

      case 'auto':
        // Field auto: read-only (diisi sistem/template), tetap tampilkan agar transparan.
        return (
          <div key={key} className="space-y-1.5">
            {label}
            <Input value={strVal} readOnly className="h-8 bg-muted/50 text-muted-foreground" />
          </div>
        )

      default:
        return (
          <div key={key} className="space-y-1.5">
            {label}
            <Input
              value={strVal}
              onChange={e => setField(key, e.target.value)}
              className="h-8"
            />
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (defs.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="px-3 py-2 border-b bg-muted/40 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider">Variabel</span>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <p className="text-center py-8 text-xs text-muted-foreground">
            Belum ada definisi variabel untuk jenis dokumen ini. Tambahkan di menu
            Master &rarr; Variabel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b bg-muted/40 shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Form Variabel
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {groups.map(([groupName, fields]) => (
          <div key={groupName} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
              {groupName}
            </p>
            <div className="space-y-3">{fields.map(renderField)}</div>
          </div>
        ))}

        <div className="flex gap-2 pt-1 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={loadDefaults}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
