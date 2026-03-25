import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { ClipboardCheck, CheckCircle, RotateCcw, Eye, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ApprovalInboxPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTL, setSelectedTL] = useState(null);
  const [action, setAction] = useState('');
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await api.get('/approval/inbox');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openDialog = (tl, act) => {
    setSelectedTL(tl);
    setAction(act);
    setCatatan('');
    setDialogOpen(true);
  };

  const handleApproval = async () => {
    if (!selectedTL) return;
    if (action === 'revisi' && !catatan.trim()) {
      toast.error('Catatan revisi wajib diisi');
      return;
    }
    setProcessing(true);
    try {
      await api.post(`/tindak-lanjut/${selectedTL.id}/approve`, {
        action,
        catatan_revisi: action === 'revisi' ? catatan : null,
      });
      toast.success(action === 'setujui' ? 'Tindak lanjut disetujui' : 'Tindak lanjut dikembalikan untuk revisi');
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memproses');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-blue-800" />
          Verifikasi Tindak Lanjut
        </h1>
        <p className="text-slate-500 text-sm mt-1">{items.length} item menunggu persetujuan</p>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : items.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada item yang perlu diverifikasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{item.no_dumas || 'No Dumas'}</span>
                        <StatusBadge status="menunggu_verifikasi" />
                      </div>
                      <div className="text-sm text-slate-600 space-y-0.5">
                        <p>Pelapor: <span className="text-slate-800">{item.pelapor || '-'}</span> | Terlapor: <span className="text-slate-800">{item.terlapor || '-'}</span></p>
                        <p>Satker: {item.satker || '-'} | Jenis: {item.jenis_dumas || '-'}</p>
                        <p className="text-xs text-slate-400">Unit: {item.unit_name || '-'} | Diajukan: {item.updated_at ? format(new Date(item.updated_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9" onClick={() => navigate(`/dumas/${item.dumas_id}`)} data-testid={`view-${item.id}`}>
                        <Eye className="h-4 w-4 mr-1" />Detail
                      </Button>
                      <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700" onClick={() => openDialog(item, 'setujui')} data-testid={`approve-${item.id}`}>
                        <CheckCircle className="h-4 w-4 mr-1" />Setujui
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 border-orange-400 text-orange-600 hover:bg-orange-50" onClick={() => openDialog(item, 'revisi')} data-testid={`revise-${item.id}`}>
                        <RotateCcw className="h-4 w-4 mr-1" />Revisi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {action === 'setujui' ? 'Setujui Tindak Lanjut' : 'Revisi Tindak Lanjut'}
            </DialogTitle>
            <DialogDescription>
              {action === 'setujui'
                ? `Apakah Anda yakin menyetujui tindak lanjut untuk ${selectedTL?.no_dumas}?`
                : `Tuliskan catatan revisi untuk ${selectedTL?.no_dumas}`
              }
            </DialogDescription>
          </DialogHeader>
          {action === 'revisi' && (
            <Textarea
              placeholder="Catatan revisi..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="min-h-[100px]"
              data-testid="catatan-revisi-input"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              className={action === 'setujui' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}
              onClick={handleApproval}
              disabled={processing}
              data-testid="confirm-approval-btn"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {action === 'setujui' ? 'Ya, Setujui' : 'Kirim Revisi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
