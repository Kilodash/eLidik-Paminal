import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ArchivePage() {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    try {
      const res = await api.get('/archive/dumas');
      setArchived(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchived(); }, []);

  const handleRestore = async (id) => {
    try {
      await api.post(`/archive/dumas/${id}/restore`);
      toast.success('Dumas berhasil di-restore');
      fetchArchived();
    } catch (err) {
      toast.error('Gagal restore');
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await api.delete(`/archive/dumas/${id}/permanent`);
      toast.success('Dumas berhasil dihapus permanen');
      fetchArchived();
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Trash2 className="h-7 w-7 text-slate-500" />
          Arsip / Trash
        </h1>
        <p className="text-slate-500 text-sm mt-1">Data yang dihapus (soft delete). Hanya Superadmin yang bisa mengelola.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}</div>
      ) : archived.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <Trash2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada data yang diarsipkan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {archived.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{d.no_dumas || 'No Dumas'}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-sm text-slate-600">Pelapor: {d.pelapor || '-'} | Terlapor: {d.terlapor || '-'}</p>
                      <p className="text-xs text-slate-400">Dihapus: {d.deleted_at ? format(new Date(d.deleted_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-9" onClick={() => handleRestore(d.id)} data-testid={`restore-${d.id}`}>
                        <RotateCcw className="h-4 w-4 mr-1" />Restore
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="h-9" data-testid={`delete-permanent-${d.id}`}>
                            <Trash2 className="h-4 w-4 mr-1" />Hapus Permanen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Hapus Permanen
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak bisa dibatalkan. Data dumas {d.no_dumas} beserta tindak lanjut dan data terkait akan dihapus secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handlePermanentDelete(d.id)}>
                              Ya, Hapus Permanen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
