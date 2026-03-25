import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

export default function DumasCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    no_dumas: '', tgl_dumas: '', pelapor: '', terlapor: '',
    satker: '', wujud_perbuatan: '', jenis_dumas: '',
    keterangan: '', disposisi_kabid: '', disposisi_kasubbid: '', unit_id: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [satkerRes, jenisRes, wujudRes, unitsRes] = await Promise.all([
          api.get('/settings/satker'),
          api.get('/settings/jenis_dumas'),
          api.get('/settings/wujud_perbuatan'),
          api.get('/users/units'),
        ]);
        setSettings({
          satker: satkerRes.data.value || [],
          jenis_dumas: jenisRes.data.value || [],
          wujud_perbuatan: wujudRes.data.value || [],
        });
        setUnits(unitsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pelapor || !form.terlapor) {
      toast.error('Pelapor dan Terlapor wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.unit_id) delete payload.unit_id;
      const res = await api.post('/dumas', payload);
      const data = res.data;
      toast.success('Dumas berhasil diregistrasi');
      navigate(`/dumas/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9" data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrasi Dumas Baru</h1>
          <p className="text-sm text-slate-500">Isi data pengaduan masyarakat</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Dumas */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Data Pengaduan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Nomor Dumas</Label>
                <Input className="mt-1.5 h-10" placeholder="DMS/XXX/XX/XXXX" value={form.no_dumas} onChange={(e) => handleChange('no_dumas', e.target.value)} data-testid="input-no-dumas" />
              </div>
              <div>
                <Label className="text-slate-700">Tanggal Dumas</Label>
                <Input type="date" className="mt-1.5 h-10" value={form.tgl_dumas} onChange={(e) => handleChange('tgl_dumas', e.target.value)} data-testid="input-tgl-dumas" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Pelapor *</Label>
                <Input className="mt-1.5 h-10" placeholder="Nama pelapor" value={form.pelapor} onChange={(e) => handleChange('pelapor', e.target.value)} data-testid="input-pelapor" />
              </div>
              <div>
                <Label className="text-slate-700">Terlapor *</Label>
                <Input className="mt-1.5 h-10" placeholder="Nama terlapor" value={form.terlapor} onChange={(e) => handleChange('terlapor', e.target.value)} data-testid="input-terlapor" />
              </div>
            </div>
            <div>
              <Label className="text-slate-700">Satker</Label>
              <Select value={form.satker} onValueChange={(v) => handleChange('satker', v)}>
                <SelectTrigger className="mt-1.5 h-10" data-testid="select-satker">
                  <SelectValue placeholder="Pilih Satker" />
                </SelectTrigger>
                <SelectContent>
                  {(settings.satker || []).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Jenis Dumas</Label>
                <Select value={form.jenis_dumas} onValueChange={(v) => handleChange('jenis_dumas', v)}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-jenis">
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings.jenis_dumas || []).map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Wujud Perbuatan</Label>
                <Select value={form.wujud_perbuatan} onValueChange={(v) => handleChange('wujud_perbuatan', v)}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-wujud">
                    <SelectValue placeholder="Pilih Wujud Perbuatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings.wujud_perbuatan || []).map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-700">Keterangan</Label>
              <Textarea className="mt-1.5 min-h-[80px]" placeholder="Detail pengaduan..." value={form.keterangan} onChange={(e) => handleChange('keterangan', e.target.value)} data-testid="input-keterangan" />
            </div>
          </CardContent>
        </Card>

        {/* Disposisi */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Disposisi & Penugasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-700">Disposisi Kabid</Label>
              <Textarea className="mt-1.5 min-h-[60px]" placeholder="Catatan disposisi Kabid..." value={form.disposisi_kabid} onChange={(e) => handleChange('disposisi_kabid', e.target.value)} data-testid="input-disposisi-kabid" />
            </div>
            <div>
              <Label className="text-slate-700">Disposisi Kasubbid</Label>
              <Textarea className="mt-1.5 min-h-[60px]" placeholder="Catatan disposisi Kasubbid..." value={form.disposisi_kasubbid} onChange={(e) => handleChange('disposisi_kasubbid', e.target.value)} data-testid="input-disposisi-kasubbid" />
            </div>
            <div>
              <Label className="text-slate-700">Disposisi ke Unit</Label>
              <Select value={form.unit_id} onValueChange={(v) => handleChange('unit_id', v)}>
                <SelectTrigger className="mt-1.5 h-10" data-testid="select-unit">
                  <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}{u.unit_name ? ` (${u.unit_name})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11">Batal</Button>
          <Button type="submit" className="bg-blue-800 hover:bg-blue-900 text-white h-11 px-6" disabled={loading} data-testid="submit-dumas">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Dumas
          </Button>
        </div>
      </form>
    </div>
  );
}
