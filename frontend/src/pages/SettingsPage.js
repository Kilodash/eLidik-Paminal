import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Settings, Plus, Trash2, Save, Loader2, Edit2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const SETTING_TYPES = [
  { key: 'satker', label: 'Satker', type: 'list' },
  { key: 'jenis_dumas', label: 'Jenis Dumas', type: 'list' },
  { key: 'wujud_perbuatan', label: 'Wujud Perbuatan', type: 'list' },
  { key: 'daftar_anggota', label: 'Daftar Anggota', type: 'object_list' },
  { key: 'format_nomor_surat', label: 'Format Nomor Surat', type: 'object' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [newItem, setNewItem] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const mapped = {};
        res.data.forEach(s => { mapped[s.type] = s.value; });
        setSettings(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (type) => {
    setSaving(p => ({ ...p, [type]: true }));
    try {
      await api.put(`/settings/${type}`, { value: settings[type] });
      toast.success(`${type} berhasil disimpan`);
    } catch (err) {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(p => ({ ...p, [type]: false }));
    }
  };

  const addListItem = (type) => {
    const val = newItem[type]?.trim();
    if (!val) return;
    setSettings(p => ({ ...p, [type]: [...(p[type] || []), val] }));
    setNewItem(p => ({ ...p, [type]: '' }));
  };

  const removeListItem = (type, index) => {
    setSettings(p => ({ ...p, [type]: (p[type] || []).filter((_, i) => i !== index) }));
  };

  const addAnggota = () => {
    const nama = newItem.anggota_nama?.trim();
    if (!nama) return;
    const anggota = {
      nama,
      nrp: newItem.anggota_nrp || '',
      pangkat: newItem.anggota_pangkat || '',
      no_hp: newItem.anggota_no_hp || '',
    };
    setSettings(p => ({ ...p, daftar_anggota: [...(p.daftar_anggota || []), anggota] }));
    setNewItem(p => ({ ...p, anggota_nama: '', anggota_nrp: '', anggota_pangkat: '', anggota_no_hp: '' }));
  };

  const removeAnggota = (index) => {
    setSettings(p => ({ ...p, daftar_anggota: (p.daftar_anggota || []).filter((_, i) => i !== index) }));
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-blue-800" />
          Pengaturan Master
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola data master aplikasi</p>
      </div>

      <Tabs defaultValue="satker">
        <TabsList className="bg-slate-100 flex-wrap h-auto gap-1 p-1">
          {SETTING_TYPES.map(s => (
            <TabsTrigger key={s.key} value={s.key} className="text-xs sm:text-sm" data-testid={`tab-${s.key}`}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* List Settings (satker, jenis_dumas, wujud_perbuatan) */}
        {SETTING_TYPES.filter(s => s.type === 'list').map(st => (
          <TabsContent key={st.key} value={st.key}>
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{st.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Tambah ${st.label}...`}
                    className="h-9"
                    value={newItem[st.key] || ''}
                    onChange={(e) => setNewItem(p => ({ ...p, [st.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addListItem(st.key)}
                    data-testid={`add-${st.key}-input`}
                  />
                  <Button size="sm" className="h-9 bg-blue-800 hover:bg-blue-900" onClick={() => addListItem(st.key)} data-testid={`add-${st.key}-btn`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(settings[st.key] || []).map((item, i) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 pr-1 text-sm">
                      {item}
                      <button className="ml-1.5 hover:text-red-500 p-0.5" onClick={() => removeListItem(st.key, i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button size="sm" className="bg-blue-800 hover:bg-blue-900" onClick={() => handleSave(st.key)} disabled={saving[st.key]} data-testid={`save-${st.key}`}>
                  {saving[st.key] ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Simpan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Daftar Anggota */}
        <TabsContent value="daftar_anggota">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daftar Anggota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input placeholder="Nama" className="h-9" value={newItem.anggota_nama || ''} onChange={(e) => setNewItem(p => ({ ...p, anggota_nama: e.target.value }))} />
                <Input placeholder="NRP" className="h-9" value={newItem.anggota_nrp || ''} onChange={(e) => setNewItem(p => ({ ...p, anggota_nrp: e.target.value }))} />
                <Input placeholder="Pangkat" className="h-9" value={newItem.anggota_pangkat || ''} onChange={(e) => setNewItem(p => ({ ...p, anggota_pangkat: e.target.value }))} />
                <div className="flex gap-2">
                  <Input placeholder="No HP" className="h-9" value={newItem.anggota_no_hp || ''} onChange={(e) => setNewItem(p => ({ ...p, anggota_no_hp: e.target.value }))} />
                  <Button size="sm" className="h-9 bg-blue-800 hover:bg-blue-900" onClick={addAnggota}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 text-slate-600">Nama</th>
                      <th className="text-left py-2 px-2 text-slate-600">NRP</th>
                      <th className="text-left py-2 px-2 text-slate-600">Pangkat</th>
                      <th className="text-left py-2 px-2 text-slate-600">No HP</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(settings.daftar_anggota || []).map((a, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 px-2 text-slate-800">{a.nama}</td>
                        <td className="py-2 px-2 text-slate-600">{a.nrp}</td>
                        <td className="py-2 px-2 text-slate-600">{a.pangkat}</td>
                        <td className="py-2 px-2 text-slate-600">{a.no_hp}</td>
                        <td className="py-2 px-2">
                          <button className="text-red-400 hover:text-red-600" onClick={() => removeAnggota(i)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button size="sm" className="bg-blue-800 hover:bg-blue-900" onClick={() => handleSave('daftar_anggota')} disabled={saving.daftar_anggota} data-testid="save-daftar-anggota">
                {saving.daftar_anggota ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Format Nomor Surat */}
        <TabsContent value="format_nomor_surat">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Format Nomor Surat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">Variabel: {'{nomor}'}, {'{bulan_romawi}'}, {'{tahun}'}, {'{unit}'}</p>
              {Object.entries(settings.format_nomor_surat || {}).map(([key, val]) => (
                <div key={key}>
                  <label className="text-sm text-slate-700 font-medium capitalize">{key.replace(/_/g, ' ')}</label>
                  <Input
                    className="mt-1 h-9 text-sm"
                    value={val}
                    onChange={(e) => {
                      setSettings(p => ({
                        ...p,
                        format_nomor_surat: { ...p.format_nomor_surat, [key]: e.target.value }
                      }));
                    }}
                  />
                </div>
              ))}
              <Button size="sm" className="bg-blue-800 hover:bg-blue-900" onClick={() => handleSave('format_nomor_surat')} disabled={saving.format_nomor_surat} data-testid="save-format">
                {saving.format_nomor_surat ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
