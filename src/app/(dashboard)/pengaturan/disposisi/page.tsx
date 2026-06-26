"use client"

import { useState, useEffect } from "react"
import { Input, Switch, Button, Tabs, Popconfirm, App } from "antd"
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"
import { disposisiData } from "@/lib/data/disposisi"

export default function DisposisiSettingsPage() {
  const { message } = App.useApp()
  const [data, setData] = useState(disposisiData)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem('master_disposisi')
    if (saved) {
      setData(JSON.parse(saved))
    }
  }, [])

  const saveToLocal = (newData: any[]) => {
    setData(newData)
    localStorage.setItem('master_disposisi', JSON.stringify(newData))
  }

  const kabidpropamData = data.filter(d => d.tipe === 'kabidpropam').sort((a, b) => a.urutan - b.urutan)
  const kasubbidpaminalData = data.filter(d => d.tipe === 'kasubbidpaminal').sort((a, b) => a.urutan - b.urutan)

  const handleToggleActive = (id: string) => {
    const newData = data.map(d => d.id === id ? { ...d, is_active: !d.is_active } : d)
    saveToLocal(newData)
    message.success("Status diubah")
  }

  const handleDelete = (id: string) => {
    const newData = data.filter(d => d.id !== id)
    saveToLocal(newData)
    message.success("Item dihapus")
  }

  const handleAdd = (tipe: string) => {
    if (!newLabel.trim()) return
    const typeData = data.filter(d => d.tipe === tipe)
    const maxUrutan = typeData.length > 0 ? Math.max(...typeData.map(d => d.urutan)) : 0
    const newItem = {
      id: Math.random().toString(36).substring(7),
      label: newLabel,
      tipe,
      is_active: true,
      urutan: maxUrutan + 1
    }
    saveToLocal([...data, newItem])
    setNewLabel("")
    setIsAdding(null)
    message.success("Item ditambahkan")
  }

  const handleSaveEdit = (id: string) => {
    if (!editLabel.trim()) return
    const newData = data.map(d => d.id === id ? { ...d, label: editLabel } : d)
    saveToLocal(newData)
    setEditingId(null)
    message.success("Item diperbarui")
  }

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const itemToMove = data.find(d => d.id === id)
    if (!itemToMove) return
    const typeData = data.filter(d => d.tipe === itemToMove.tipe).sort((a, b) => a.urutan - b.urutan)
    const currentIndex = typeData.findIndex(d => d.id === id)
    
    if (direction === 'up' && currentIndex > 0) {
      const prevItem = typeData[currentIndex - 1]
      const newData = data.map(d => {
        if (d.id === id) return { ...d, urutan: prevItem.urutan }
        if (d.id === prevItem.id) return { ...d, urutan: itemToMove.urutan }
        return d
      })
      saveToLocal(newData)
    } else if (direction === 'down' && currentIndex < typeData.length - 1) {
      const nextItem = typeData[currentIndex + 1]
      const newData = data.map(d => {
        if (d.id === id) return { ...d, urutan: nextItem.urutan }
        if (d.id === nextItem.id) return { ...d, urutan: itemToMove.urutan }
        return d
      })
      saveToLocal(newData)
    }
  }

  const renderList = (items: any[], tipe: string) => (
    <div>
      {items.map((item, index) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveItem(item.id, 'up')} style={{ padding: 0, width: 20, height: 16, fontSize: 10 }} />
              <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === items.length - 1} onClick={() => moveItem(item.id, 'down')} style={{ padding: 0, width: 20, height: 16, fontSize: 10 }} />
            </div>
            
            {editingId === item.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} size="small" autoFocus style={{ maxWidth: 300 }} />
                <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => handleSaveEdit(item.id)} style={{ color: '#52c41a' }} />
                <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setEditingId(null)} style={{ color: '#ff4d4f' }} />
              </div>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 500, color: item.is_active ? '#333' : '#bbb', textDecoration: item.is_active ? 'none' : 'line-through' }}>
                {item.label}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#888' }}>{item.is_active ? 'Aktif' : 'Non-aktif'}</span>
              <Switch size="small" checked={item.is_active} onChange={() => handleToggleActive(item.id)} />
            </div>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingId(item.id); setEditLabel(item.label) }} disabled={editingId === item.id} />
            <Popconfirm title="Hapus item ini?" onConfirm={() => handleDelete(item.id)} okText="Ya" cancelText="Batal">
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </div>
        </div>
      ))}

      {isAdding === tipe ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0f5ff', border: '1px solid #d6e4ff', borderRadius: 4, margin: '8px 0' }}>
          <Input
            placeholder="Masukkan label disposisi..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            size="small"
            autoFocus
            onPressEnter={() => handleAdd(tipe)}
            style={{ flex: 1 }}
          />
          <Button size="small" type="primary" onClick={() => handleAdd(tipe)}>Simpan</Button>
          <Button size="small" onClick={() => { setIsAdding(null); setNewLabel("") }}>Batal</Button>
        </div>
      ) : (
        <div style={{ padding: '8px 12px' }}>
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setIsAdding(tipe)} size="small">
            Tambah Pilihan Disposisi
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pengaturan Disposisi</h2>
      
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600 }}>
          Master Disposisi
        </div>
        <div style={{ padding: 0 }}>
          <Tabs
            defaultActiveKey="kabidpropam"
            items={[
              { key: 'kabidpropam', label: 'Disposisi Kabidpropam', children: renderList(kabidpropamData, 'kabidpropam') },
              { key: 'kasubbidpaminal', label: 'Disposisi Kasubbidpaminal', children: renderList(kasubbidpaminalData, 'kasubbidpaminal') },
            ]}
            style={{ padding: '0 16px' }}
          />
        </div>
      </div>
    </div>
  )
}
