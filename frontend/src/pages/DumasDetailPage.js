import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import api from '../lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Loader2, Send, FileDown, Users, FileText,
  Calendar, MapPin, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatusBadge } from '../components/StatusBadge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function DumasDetailPage() {
  const { dumasId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dumas, setDumas] = useState(null);
  const [tindakLanjut, setTindakLanjut] = useState(null);
  const [timLidik, setTimLidik] = useState([]);
  const [penyelesaian, setPenyelesaian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tlForm, setTlForm] = useState({
    tgl_uuk: '', tgl_sprin_lidik: '', no_sprin: '', tgl_gelar: '',
    tgl_lhp: '', no_lhp: '', hasil_lidik: '', tgl_nodin: '', no_nodin: '',
    no_berkas: '', tgl_sp2hp2: '', no_sp2hp2: '', tgl_ke_ankum: '',
    tgl_ke_mabes: '', no_mabes: '', tgl_st_arahan: '',
  });

  const [statusForm, setStatusForm] = useState('');
  const [penyelesaianForm, setPenyelesaianForm] = useState({ jenis: '', tanggal: '', nomor: '' });

  const fetchData = async () => {
    try {
      const [dumasRes, tlRes, timRes, penRes] = await Promise.all([
        api.get(`/dumas/${dumasId}`),
        api.get(`/tindak-lanjut?dumas_id=${dumasId}`),
        api.get(`/tim-lidik/${dumasId}`),
        api.get(`/penyelesaian/${dumasId}`),
      ]);
      setDumas(dumasRes.data);
      setStatusForm(dumasRes.data.status || 'dalam_proses');
      const tls = tlRes.data;
      if (tls.length > 0) {
        const tl = tls[0];
        setTindakLanjut(tl);
        setTlForm({
          tgl_uuk: tl.tgl_uuk || '', tgl_sprin_lidik: tl.tgl_sprin_lidik || '',
          no_sprin: tl.no_sprin || '', tgl_gelar: tl.tgl_gelar || '',
          tgl_lhp: tl.tgl_lhp || '', no_lhp: tl.no_lhp || '',
          hasil_lidik: tl.hasil_lidik || '', tgl_nodin: tl.tgl_nodin || '',
          no_nodin: tl.no_nodin || '', no_berkas: tl.no_berkas || '',
          tgl_sp2hp2: tl.tgl_sp2hp2 || '', no_sp2hp2: tl.no_sp2hp2 || '',
          tgl_ke_ankum: tl.tgl_ke_ankum || '', tgl_ke_mabes: tl.tgl_ke_mabes || '',
          no_mabes: tl.no_mabes || '', tgl_st_arahan: tl.tgl_st_arahan || '',
        });
      }
      setTimLidik(timRes.data);
      setPenyelesaian(penRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dumasId]);

  const isLocked = tindakLanjut && ['menunggu_verifikasi', 'disetujui'].includes(tindakLanjut.status_verifikasi);
  const canEditTL = user?.role === 'unit' || user?.role === 'superadmin';
  const canSubmit = canEditTL && tindakLanjut && ['draft', 'revisi'].includes(tindakLanjut.status_verifikasi);

  // Date validation
  const dateFields = ['tgl_uuk', 'tgl_sprin_lidik', 'tgl_gelar', 'tgl_lhp', 'tgl_nodin'];
  const dateErrors = {};
  for (let i = 1; i < dateFields.length; i++) {
    const prev = tlForm[dateFields[i - 1]];
    const curr = tlForm[dateFields[i]];
    if (prev && curr && new Date(curr) < new Date(prev)) {
      dateErrors[dateFields[i]] = `Tanggal harus setelah ${dateFields[i - 1].replace('tgl_', '').toUpperCase()}`;
    }
  }

  const handleSaveTL = async () => {
    if (Object.keys(dateErrors).length > 0) {
      toast.error('Perbaiki validasi tanggal terlebih dahulu');
      return;
    }
    setSaving(true);
    try {
      if (tindakLanjut) {
        await api.put(`/tindak-lanjut/${tindakLanjut.id}`, tlForm);
        toast.success('Tindak lanjut berhasil disimpan');
      } else {
        await api.post('/tindak-lanjut', { dumas_id: dumasId, ...tlForm });
        toast.success('Tindak lanjut berhasil dibuat');
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!tindakLanjut) return;
    setSubmitting(true);
    try {
      await api.post(`/tindak-lanjut/${tindakLanjut.id}/submit`);
      toast.success('Tindak lanjut berhasil diajukan untuk verifikasi');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengajukan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/dumas/${dumasId}`, { status: statusForm });
      toast.success('Status dumas berhasil diupdate');
      fetchData();
    } catch (err) {
      toast.error('Gagal update status');
    }
  };

  const handleDownloadDoc = (type) => {
    const token = localStorage.getItem('simondu_token');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    window.open(`${backendUrl}/api/documents/${type}/${dumasId}?token=${token}`, '_blank');
  };

  const handleSavePenyelesaian = async () => {
    if (!penyelesaianForm.jenis) { toast.error('Jenis penyelesaian wajib dipilih'); return; }
    try {
      await api.post('/penyelesaian', { dumas_id: dumasId, ...penyelesaianForm });
      toast.success('Penyelesaian berhasil disimpan');
      setPenyelesaianForm({ jenis: '', tanggal: '', nomor: '' });
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan penyelesaian');
    }
  };

  if (loading) return <div className="space-y-4"><div className="h-8 w-48 bg-slate-200 animate-pulse rounded" /><div className="h-64 bg-slate-100 animate-pulse rounded-xl" /></div>;
  if (!dumas) return <div className="text-center py-12 text-slate-500">Dumas tidak ditemukan</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{dumas.no_dumas || 'Detail Dumas'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={dumas.status} />
              {tindakLanjut && <StatusBadge status={tindakLanjut.status_verifikasi} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-9" onClick={() => handleDownloadDoc('uuk')} data-testid="download-uuk">
            <FileDown className="h-4 w-4 mr-1" />UUK
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => handleDownloadDoc('sprin')} data-testid="download-sprin">
            <FileDown className="h-4 w-4 mr-1" />Sprin
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => handleDownloadDoc('sp2hp2')} data-testid="download-sp2hp2">
            <FileDown className="h-4 w-4 mr-1" />SP2HP2
          </Button>
        </div>
      </div>

      {/* Revision Notes */}
      {tindakLanjut?.status_verifikasi === 'revisi' && tindakLanjut?.catatan_revisi && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">Catatan Revisi dari Pimpinan</p>
              <p className="text-orange-700 text-sm mt-1">{tindakLanjut.catatan_revisi}</p>
            </div>
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="info" data-testid="tab-info">Informasi</TabsTrigger>
          <TabsTrigger value="tindak-lanjut" data-testid="tab-tindak-lanjut">Tindak Lanjut</TabsTrigger>
          <TabsTrigger value="penyelesaian" data-testid="tab-penyelesaian">Penyelesaian</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Tanggal Dumas" value={dumas.tgl_dumas ? format(new Date(dumas.tgl_dumas), 'dd MMMM yyyy', { locale: idLocale }) : '-'} icon={<Calendar className="h-4 w-4" />} />
                <InfoField label="Satker" value={dumas.satker || '-'} icon={<MapPin className="h-4 w-4" />} />
                <InfoField label="Pelapor" value={dumas.pelapor || '-'} />
                <InfoField label="Terlapor" value={dumas.terlapor || '-'} />
                <InfoField label="Jenis Dumas" value={dumas.jenis_dumas || '-'} />
                <InfoField label="Wujud Perbuatan" value={dumas.wujud_perbuatan || '-'} />
                <InfoField label="Unit" value={dumas.unit_name || '-'} icon={<Users className="h-4 w-4" />} />
              </div>
              <Separator />
              <InfoField label="Keterangan" value={dumas.keterangan || '-'} />
              <InfoField label="Disposisi Kabid" value={dumas.disposisi_kabid || '-'} />
              <InfoField label="Disposisi Kasubbid" value={dumas.disposisi_kasubbid || '-'} />
              
              {/* Status Update (admin/superadmin) */}
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <div className="pt-3 border-t border-slate-200">
                  <Label className="text-slate-700 font-medium">Update Status</Label>
                  <div className="flex gap-2 mt-2">
                    <Select value={statusForm} onValueChange={setStatusForm}>
                      <SelectTrigger className="w-48 h-9" data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
                        <SelectItem value="terbukti">Terbukti</SelectItem>
                        <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="bg-blue-800 hover:bg-blue-900 h-9" onClick={handleUpdateStatus} data-testid="update-status-btn">
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tindak-lanjut">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                <span>Form Tindak Lanjut</span>
                {isLocked && <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Form Terkunci</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DateField label="Tanggal UUK" field="tgl_uuk" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} error={dateErrors.tgl_uuk} />
                <DateField label="Tanggal Sprin Lidik" field="tgl_sprin_lidik" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} error={dateErrors.tgl_sprin_lidik} />
                <div>
                  <Label className="text-slate-700">No. Sprin</Label>
                  <Input className="mt-1 h-9" value={tlForm.no_sprin} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, no_sprin: e.target.value}))} />
                </div>
                <DateField label="Tanggal Gelar" field="tgl_gelar" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} error={dateErrors.tgl_gelar} />
                <DateField label="Tanggal LHP" field="tgl_lhp" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} error={dateErrors.tgl_lhp} />
                <div>
                  <Label className="text-slate-700">No. LHP</Label>
                  <Input className="mt-1 h-9" value={tlForm.no_lhp} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, no_lhp: e.target.value}))} />
                </div>
              </div>
              <div>
                <Label className="text-slate-700">Hasil Lidik</Label>
                <Textarea className="mt-1 min-h-[60px]" value={tlForm.hasil_lidik} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, hasil_lidik: e.target.value}))} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DateField label="Tanggal Nodin" field="tgl_nodin" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} error={dateErrors.tgl_nodin} />
                <div>
                  <Label className="text-slate-700">No. Nodin</Label>
                  <Input className="mt-1 h-9" value={tlForm.no_nodin} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, no_nodin: e.target.value}))} />
                </div>
                <div>
                  <Label className="text-slate-700">No. Berkas</Label>
                  <Input className="mt-1 h-9" value={tlForm.no_berkas} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, no_berkas: e.target.value}))} />
                </div>
                <DateField label="Tanggal SP2HP2" field="tgl_sp2hp2" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} />
                <div>
                  <Label className="text-slate-700">No. SP2HP2</Label>
                  <Input className="mt-1 h-9" value={tlForm.no_sp2hp2} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, no_sp2hp2: e.target.value}))} />
                </div>
                <DateField label="Tanggal ke Ankum" field="tgl_ke_ankum" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} />
                <DateField label="Tanggal ke Mabes" field="tgl_ke_mabes" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} />
                <div>
                  <Label className="text-slate-700">No. Mabes</Label>
                  <Input className="mt-1 h-9" value={tlForm.no_mabes} disabled={isLocked || !canEditTL} onChange={(e) => setTlForm(p => ({...p, no_mabes: e.target.value}))} />
                </div>
                <DateField label="Tanggal ST Arahan" field="tgl_st_arahan" form={tlForm} setForm={setTlForm} disabled={isLocked || !canEditTL} />
              </div>

              {/* Actions */}
              {canEditTL && !isLocked && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                  <Button className="bg-blue-800 hover:bg-blue-900 h-10" onClick={handleSaveTL} disabled={saving} data-testid="save-tl-btn">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Simpan
                  </Button>
                  {canSubmit && (
                    <Button variant="outline" className="h-10 border-yellow-400 text-yellow-700 hover:bg-yellow-50" onClick={handleSubmitVerification} disabled={submitting} data-testid="submit-verification-btn">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Ajukan Verifikasi
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="penyelesaian">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">Penyelesaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing penyelesaian */}
              {penyelesaian.length > 0 && (
                <div className="space-y-2">
                  {penyelesaian.map((p) => (
                    <div key={p.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 capitalize">{p.jenis?.replace('_', ' ')}</span>
                        <span className="text-slate-500">{p.tanggal || '-'}</span>
                      </div>
                      {p.nomor && <p className="text-slate-600 mt-1">Nomor: {p.nomor}</p>}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add penyelesaian */}
              {(dumas.status === 'terbukti' || dumas.status === 'tidak_terbukti') && canEditTL && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    {dumas.status === 'terbukti' ? 'Form Pelimpahan' : 'Form Henti Lidik'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select value={penyelesaianForm.jenis} onValueChange={(v) => setPenyelesaianForm(p => ({...p, jenis: v}))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pelimpahan">Pelimpahan</SelectItem>
                        <SelectItem value="henti_lidik">Henti Lidik</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="date" className="h-9" value={penyelesaianForm.tanggal} onChange={(e) => setPenyelesaianForm(p => ({...p, tanggal: e.target.value}))} />
                    <Input className="h-9" placeholder="Nomor" value={penyelesaianForm.nomor} onChange={(e) => setPenyelesaianForm(p => ({...p, nomor: e.target.value}))} />
                  </div>
                  <Button size="sm" className="bg-blue-800 hover:bg-blue-900" onClick={handleSavePenyelesaian} data-testid="save-penyelesaian">
                    <Save className="h-4 w-4 mr-1" />Simpan Penyelesaian
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoField({ label, value, icon }) {
  return (
    <div>
      <p className="text-xs text-slate-500 flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function DateField({ label, field, form, setForm, disabled, error }) {
  return (
    <div>
      <Label className="text-slate-700">{label}</Label>
      <Input
        type="date"
        className={`mt-1 h-9 ${error ? 'border-red-400 focus:ring-red-500' : ''}`}
        value={form[field] || ''}
        disabled={disabled}
        onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
