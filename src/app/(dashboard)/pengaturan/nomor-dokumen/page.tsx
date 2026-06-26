"use client"

import { useState, useEffect } from "react"
import { Input, Button, App } from "antd"
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons"

const STORAGE_KEY = 'master_nomor_dokumen'

const defaultFormats: Record<string, { nama: string; format: string }> = {
  'SURAT-PEMBERITAHUAN-AWAL': {
    nama: 'Surat Pemberitahuan Awal kepada Pelapor',
    format: 'B/{{nomor}}/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  },
  'UNSUR-KETERANGAN': {
    nama: 'Unsur Unsur Keterangan',
    format: 'R/{{nomor}}/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  },
  'SPRIN-LIDIK': {
    nama: 'Surat Perintah Penyelidikan',
    format: 'Sprin.Lidik/{{nomor}}/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  },
  'RAB-LIDIK': {
    nama: 'Rencana Kebutuhan Anggaran',
    format: 'R/{{nomor}}/RAB/{{bulan_romawi}}/{{tahun}}/Bid Propam',
  },
}

export default function NomorDokumenSettingsPage() {
  const { message } = App.useApp()
  const [formats, setFormats] = useState(defaultFormats)
  const [editingKode, setEditingKode] = useState<string | null>(null)
  const [editFormat, setEditFormat] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setFormats({ ...defaultFormats, ...JSON.parse(saved) })
    }
  }, [])

  const saveToLocal = (newData: typeof formats) => {
    setFormats(newData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
  }

  const handleSaveEdit = (kode: string) => {
    if (!editFormat.trim()) return
    const updated = { ...formats, [kode]: { ...formats[kode], format: editFormat } }
    saveToLocal(updated)
    setEditingKode(null)
    message.success("Format nomor diperbarui")
  }

  const handleReset = (kode: string) => {
    const updated = { ...formats, [kode]: defaultFormats[kode] }
    saveToLocal(updated)
    message.success("Format nomor direset ke default")
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pengaturan Format Nomor Dokumen</h2>

      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600 }}>
          Format Nomor per Jenis Dokumen
        </div>
        <div style={{ padding: 0 }}>
          {Object.entries(formats).map(([kode, item]) => (
            <div key={kode} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.nama}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Kode: {kode}</div>
              {editingKode === kode ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    size="small"
                    autoFocus
                    onPressEnter={() => handleSaveEdit(kode)}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => handleSaveEdit(kode)} style={{ color: '#52c41a' }} />
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setEditingKode(null)} style={{ color: '#ff4d4f' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 8px', borderRadius: 3, flex: 1 }}>{item.format}</code>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingKode(kode); setEditFormat(item.format) }} />
                    {item.format !== defaultFormats[kode]?.format && (
                      <Button type="text" size="small" onClick={() => handleReset(kode)} style={{ fontSize: 11, color: '#888' }}>Reset</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, background: '#f6f8fa', borderRadius: 6, border: '1px solid #e1e4e8' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Variabel yang tersedia:</div>
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
          <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 3, border: '1px solid #e1e4e8' }}>{'{{nomor}}'}</code> — Nomor urut (diisi manual)<br />
          <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 3, border: '1px solid #e1e4e8' }}>{'{{bulan_romawi}}'}</code> — Bulan dalam angka Romawi (I, II, ... XII)<br />
          <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 3, border: '1px solid #e1e4e8' }}>{'{{tahun}}'}</code> — Tahun (4 digit)
        </div>
      </div>
    </div>
  )
}
