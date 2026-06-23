'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  getTemplateVariablesAction,
  addTemplateVariableAction,
  updateTemplateVariableAction,
  deleteTemplateVariableAction,
} from './actions'
import type { VariableDef } from '@/lib/template'

const INPUT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select (dropdown)' },
  { value: 'list', label: 'List (tambah/hapus item)' },
  { value: 'checkbox_group', label: 'Checkbox Group' },
  { value: 'auto', label: 'Auto (read-only)' },
]

const SOURCES = [
  { value: 'user_input', label: 'User Input' },
  { value: 'tenant', label: 'Tenant Variable' },
  { value: 'pengaduan', label: 'Pengaduan Data' },
  { value: 'system', label: 'System' },
  { value: 'metadata', label: 'Metadata' },
]

function badgeColorForType(t: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (t) {
    case 'text': return 'default'
    case 'textarea': return 'secondary'
    case 'date': return 'outline'
    case 'select': return 'default'
    case 'list': return 'secondary'
    case 'checkbox_group': return 'outline'
    case 'auto': return 'destructive'
    default: return 'default'
  }
}

interface Props {
  initialKodes: string[]
}

export function TemplateVariabelManager({ initialKodes }: Props) {
  const [kodes, setKodes] = useState<string[]>(initialKodes)
  const [selectedKode, setSelectedKode] = useState(initialKodes[0] || '')
  const [variables, setVariables] = useState<VariableDef[]>([])
  const [loading, setLoading] = useState(false)

  // Form add
  const [showAdd, setShowAdd] = useState(false)

  // Form edit
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadKodes = useCallback(async () => {
    const { getDistinctDocTypeKodesAction } = await import('./actions')
    const fresh = await getDistinctDocTypeKodesAction()
    setKodes(fresh)
  }, [])

  const loadVariables = useCallback(async (kode: string) => {
    if (!kode) { setVariables([]); return }
    setLoading(true)
    const data = await getTemplateVariablesAction(kode)
    setVariables(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedKode) loadVariables(selectedKode)
  }, [selectedKode, loadVariables])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const targetKode = (fd.get('document_type_kode') as string).trim()
    if (!targetKode) { toast.error('Isi kode jenis dokumen'); return }

    const res = await addTemplateVariableAction(fd)
    if (res.error) { toast.error(res.error); return }
    toast.success('Variabel ditambahkan')

    setShowAdd(false)
    if (!kodes.includes(targetKode)) {
      setKodes((prev) => [...prev, targetKode].sort())
    }
    setSelectedKode(targetKode)
    loadVariables(targetKode)
  }

  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await updateTemplateVariableAction(id, fd)
    if (res.error) { toast.error(res.error); return }
    toast.success('Variabel diperbarui')
    setEditingId(null)
    loadVariables(selectedKode)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus variabel ini?')) return
    const res = await deleteTemplateVariableAction(id)
    if (res.error) { toast.error(res.error); return }
    toast.success('Variabel dihapus')
    loadVariables(selectedKode)
  }

  const formFields = (defaults?: Partial<VariableDef>, isEdit = false) => (
    <>
      <input type="hidden" name="source" value={defaults?.source || 'user_input'} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input name="variable_label" defaultValue={defaults?.variable_label || ''} placeholder="Nama Kepala" required className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tipe Input</Label>
          <Select name="input_type" defaultValue={defaults?.input_type || 'text'}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{INPUT_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Group</Label>
          <Input name="display_group" defaultValue={defaults?.display_group || 'Umum'} placeholder="Umum" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Urutan</Label>
          <Input name="display_order" type="number" defaultValue={defaults?.display_order || 0} className="h-8 text-sm" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox name="required" id={`req-${defaults?.id || 'new'}`} defaultChecked={defaults?.required || false} className="h-3.5 w-3.5" />
        <Label htmlFor={`req-${defaults?.id || 'new'}`} className="text-xs">Required</Label>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Deskripsi (tooltip)</Label>
        <Input name="description" defaultValue={defaults?.description || ''} placeholder="Petunjuk untuk user" className="h-8 text-sm" />
      </div>

      {/* List / Select / Checkbox config */}
      <div className="border-t pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Konfigurasi Pilihan (Select / List / Checkbox)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Opsi (pisah koma)</Label>
            <Input
              name="list_options"
              defaultValue={defaults?.list_config?.options?.join(', ') || ''}
              placeholder="Ops1, Ops2, Ops3"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Items (list only)</Label>
            <Input
              name="list_max_items"
              type="number"
              defaultValue={defaults?.list_config?.max_items || ''}
              placeholder="5"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Validation */}
      <div className="border-t pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Validasi</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Min Length</Label>
            <Input name="val_min_length" type="number" defaultValue={defaults?.validation?.min_length || ''} placeholder="0" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Length</Label>
            <Input name="val_max_length" type="number" defaultValue={defaults?.validation?.max_length || ''} placeholder="255" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Regex Pattern</Label>
            <Input name="val_pattern" defaultValue={defaults?.validation?.pattern || ''} placeholder="^[a-zA-Z]+$" className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5 mt-2">
          <Label className="text-xs">Pesan Error</Label>
          <Input name="val_message" defaultValue={defaults?.validation?.message || ''} placeholder="Harus diisi dengan format yang benar" className="h-8 text-sm" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="h-8 text-xs">{isEdit ? 'Update' : 'Tambah'}</Button>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setShowAdd(false); setEditingId(null) }}>
          Batal
        </Button>
      </div>
    </>
  )

  return (
    <div className="space-y-4">
      {/* Select doctype + add new */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">Filter Jenis Dokumen</Label>
          <Select value={selectedKode} onValueChange={(v) => v && setSelectedKode(v)}>
            <SelectTrigger className="h-8 w-[240px] text-sm">
              <SelectValue placeholder="Pilih jenis dokumen..." />
            </SelectTrigger>
            <SelectContent>
              {kodes.map((k) => (
                <SelectItem key={k} value={k} className="text-sm">{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" className="h-8 gap-1" onClick={() => setShowAdd(true)} disabled={showAdd}>
          <Plus className="h-3.5 w-3.5" /> Tambah Variabel
        </Button>

        {kodes.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground self-center">Belum ada template variabel. Buat baru dengan menekan "Tambah Variabel".</p>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="border rounded-lg p-4 bg-muted/10 space-y-3 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variabel Baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc-kode-input" className="text-xs">Kode Jenis Dokumen</Label>
              <Input
                id="doc-kode-input"
                name="document_type_kode"
                list="doc-type-kodes"
                placeholder="Pilih atau ketik kode baru..."
                required
                className="h-8 text-sm"
              />
              <datalist id="doc-type-kodes">
                {kodes.map((k) => <option key={k} value={k} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Key</Label>
              <Input name="variable_key" placeholder="ex: nama_pejabat" required className="h-8 text-sm" />
            </div>
          </div>
          {formFields()}
        </form>
      )}

      {/* Table */}
      {selectedKode && loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat...</span>
        </div>
      ) : selectedKode && variables.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Belum ada variabel untuk jenis dokumen <strong>{selectedKode}</strong>.
        </p>
      ) : selectedKode && variables.length > 0 ? (
        <div className="overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="w-[80px]">Tipe</TableHead>
                <TableHead className="w-[90px]">Group</TableHead>
                <TableHead className="w-[50px]">Urut</TableHead>
                <TableHead className="w-[50px]">Req</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((v) => (
                editingId === v.id ? (
                  /* Edit row */
                  <TableRow key={v.id}>
                    <TableCell colSpan={7} className="p-3">
                      <form onSubmit={(e) => handleUpdate(v.id!, e)} className="space-y-3">
                        <p className="text-xs font-semibold">Edit: <code className="text-primary-foreground bg-primary px-1 rounded text-[11px]">{v.variable_key}</code></p>
                        <input type="hidden" name="source" value={v.source} />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Label</Label>
                            <Input name="variable_label" defaultValue={v.variable_label} required className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tipe Input</Label>
                            <Select name="input_type" defaultValue={v.input_type}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{INPUT_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Group</Label>
                            <Input name="display_group" defaultValue={v.display_group} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Urutan</Label>
                            <Input name="display_order" type="number" defaultValue={v.display_order} className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox name="required" id={`req-${v.id}`} defaultChecked={v.required} className="h-3.5 w-3.5" />
                          <Label htmlFor={`req-${v.id}`} className="text-xs">Required</Label>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Deskripsi</Label>
                          <Input name="description" defaultValue={v.description || ''} className="h-8 text-sm" />
                        </div>
                        <div className="border-t pt-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Opsi (Select/List/Checkbox)</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Opsi (pisah koma)</Label>
                              <Input name="list_options" defaultValue={v.list_config?.options?.join(', ') || ''} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Max Items</Label>
                              <Input name="list_max_items" type="number" defaultValue={v.list_config?.max_items || ''} className="h-8 text-sm" />
                            </div>
                          </div>
                        </div>
                        <div className="border-t pt-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Validasi</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Min Length</Label>
                              <Input name="val_min_length" type="number" defaultValue={v.validation?.min_length || ''} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Max Length</Label>
                              <Input name="val_max_length" type="number" defaultValue={v.validation?.max_length || ''} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Pattern</Label>
                              <Input name="val_pattern" defaultValue={v.validation?.pattern || ''} className="h-8 text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1.5 mt-2">
                            <Label className="text-xs">Pesan Error</Label>
                            <Input name="val_message" defaultValue={v.validation?.message || ''} className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="h-8 text-xs"><Check className="h-3.5 w-3.5 mr-1" />Simpan</Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5 mr-1" />Batal</Button>
                        </div>
                      </form>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs font-mono">{v.variable_key}</TableCell>
                    <TableCell className="text-xs">{v.variable_label}</TableCell>
                    <TableCell>
                      <Badge variant={badgeColorForType(v.input_type)} className="text-[10px] px-1.5 py-0">{v.input_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.display_group}</TableCell>
                    <TableCell className="text-xs">{v.display_order}</TableCell>
                    <TableCell>{v.required && <span className="text-destructive text-xs font-bold">*</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(v.id!)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(v.id!)} title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
