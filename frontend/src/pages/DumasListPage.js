import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Eye, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatusBadge, SLABadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/SkeletonLoader';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DumasListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dumasList, setDumasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchDumas = async () => {
      try {
        const res = await api.get('/dumas');
        setDumasList(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDumas();
  }, []);

  const filtered = dumasList.filter((d) => {
    const matchSearch = !search || 
      (d.no_dumas || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.pelapor || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.terlapor || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.satker || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'unit' ? 'Dumas Saya' : 'Daftar Dumas'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} data ditemukan</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <Button
            className="bg-blue-800 hover:bg-blue-900 text-white h-10 sm:h-11"
            onClick={() => navigate('/dumas/create')}
            data-testid="create-dumas-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrasi Dumas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari no dumas, pelapor, terlapor, satker..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-dumas"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48 h-10" data-testid="filter-status">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
            <SelectItem value="terbukti">Terbukti</SelectItem>
            <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada data dumas</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">No. Dumas</th>
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">Tanggal</th>
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">Pelapor</th>
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">Terlapor</th>
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">Satker</th>
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-slate-600 font-semibold">Unit</th>
                      <th className="text-center py-3 px-4 text-slate-600 font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dumas/${d.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">{d.no_dumas || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{d.tgl_dumas ? format(new Date(d.tgl_dumas), 'dd MMM yyyy', { locale: id }) : '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{d.pelapor || '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{d.terlapor || '-'}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{d.satker || '-'}</td>
                        <td className="py-3 px-4"><StatusBadge status={d.status} /></td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{d.unit_name || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/dumas/${d.id}`); }}>
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dumas/${d.id}`)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-900 text-sm">{d.no_dumas || 'No Dumas'}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                      <span>Pelapor: <span className="text-slate-800">{d.pelapor || '-'}</span></span>
                      <span>Terlapor: <span className="text-slate-800">{d.terlapor || '-'}</span></span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{d.satker || '-'}</span>
                      <span>{d.tgl_dumas ? format(new Date(d.tgl_dumas), 'dd/MM/yyyy') : '-'}</span>
                    </div>
                    {d.unit_name && <p className="text-xs text-blue-600 font-medium">{d.unit_name}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
