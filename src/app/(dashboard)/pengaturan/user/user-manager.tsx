'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, Trash2, Pencil, Plus, Search } from 'lucide-react';
import {
  createUserAction,
  updateUserAction,
  resetPasswordAction,
  deleteUserAction,
} from './actions';

type UserRow = {
  id: string;
  nama_lengkap: string;
  role: string;
  nip: string | null;
  pangkat: string | null;
  jabatan: string | null;
  organization: { id: string; nama: string }[] | null;
  email: string;
};

const roleLabels: Record<string, string> = {
  oversight: 'Oversight (Admin)',
  admin_subbid: 'Kasubbid',
  operator_unit: 'Operator Unit',
};

export function UserManager({
  users,
  units,
}: {
  users: UserRow[];
  units: { id: string; nama: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [search, setSearch] = useState('');

  const filtered = users.filter(
    (u) =>
      u.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      const res = await createUserAction(formData);
      if (res.error) toast.error(res.error);
      else {
        toast.success('User berhasil dibuat');
        setShowAdd(false);
      }
    });
  };

  const handleEdit = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateUserAction(formData);
      if (res.error) toast.error(res.error);
      else {
        toast.success('User berhasil diupdate');
        setEditUser(null);
      }
    });
  };

  const handleReset = () => {
    if (!resetUser || !newPassword) return;
    startTransition(async () => {
      const res = await resetPasswordAction(resetUser.id, newPassword);
      if (res.error) toast.error(res.error);
      else {
        toast.success('Password berhasil direset');
        setResetUser(null);
        setNewPassword('');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteUser) return;
    startTransition(async () => {
      const res = await deleteUserAction(deleteUser.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success('User berhasil dihapus');
        setDeleteUser(null);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pengaturan User</h1>
          <p className="text-sm text-muted-foreground">Kelola akun login & hak akses</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Table */}
      <Card className="border-0 ring-1 ring-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary/5">
                  <th className="text-left p-3 font-semibold text-primary">Nama</th>
                  <th className="text-left p-3 font-semibold text-primary">Email</th>
                  <th className="text-left p-3 font-semibold text-primary">Role</th>
                  <th className="text-left p-3 font-semibold text-primary">Unit</th>
                  <th className="text-left p-3 font-semibold text-primary">Jabatan</th>
                  <th className="text-right p-3 font-semibold text-primary w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-medium">{u.nama_lengkap || '-'}</td>
                    <td className="p-3 font-mono text-xs">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-3">{u.organization?.[0]?.nama || '-'}</td>
                    <td className="p-3">{u.jabatan || '-'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setResetUser(u)}
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => setEditUser(u)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteUser(u)}
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Belum ada user
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <CardDescription>Buat akun login baru. Password default: rahasia2026</CardDescription>
          </DialogHeader>
          <form action={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Username / Email</Label>
              <Input
                name="email"
                placeholder="contoh: unit_1_paminal_jabar"
                required
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Akan ditambah @poldajabar.go.id otomatis
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input name="password" defaultValue="rahasia2026" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lengkap</Label>
              <Input name="nama_lengkap" placeholder="Nama" required className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select name="role" defaultValue="operator_unit">
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oversight">Oversight (Admin)</SelectItem>
                    <SelectItem value="admin_subbid">Kasubbid</SelectItem>
                    <SelectItem value="operator_unit">Operator Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit</Label>
                <Select name="organization_id" defaultValue="--">
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--">--</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pangkat</Label>
                <Input name="pangkat" placeholder="Pangkat" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jabatan</Label>
                <Input name="jabatan" placeholder="Jabatan" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">NRP/NIP</Label>
              <Input name="nip" placeholder="NRP" className="h-9" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="h-9"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="h-9">
                {isPending ? 'Menyimpan...' : 'Buat User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <CardDescription>{editUser?.email}</CardDescription>
          </DialogHeader>
          <form action={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={editUser?.id} />
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lengkap</Label>
              <Input
                name="nama_lengkap"
                defaultValue={editUser?.nama_lengkap}
                required
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select name="role" defaultValue={editUser?.role}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oversight">Oversight (Admin)</SelectItem>
                    <SelectItem value="admin_subbid">Kasubbid</SelectItem>
                    <SelectItem value="operator_unit">Operator Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit</Label>
                <Select
                  name="organization_id"
                  defaultValue={editUser?.organization?.[0]?.id || '--'}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--">--</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pangkat</Label>
                <Input name="pangkat" defaultValue={editUser?.pangkat || ''} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jabatan</Label>
                <Input name="jabatan" defaultValue={editUser?.jabatan || ''} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">NRP/NIP</Label>
              <Input name="nip" defaultValue={editUser?.nip || ''} className="h-9" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUser(null)}
                className="h-9"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="h-9">
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(v) => !v && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <CardDescription>
              {resetUser?.nama_lengkap} ({resetUser?.email})
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Password Baru</Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="h-9"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetUser(null)}
                className="h-9"
              >
                Batal
              </Button>
              <Button onClick={handleReset} disabled={isPending || !newPassword} className="h-9">
                {isPending ? 'Reset...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <CardDescription>
              Yakin ingin menghapus {deleteUser?.nama_lengkap} ({deleteUser?.email})? Akun login dan
              data personel akan dihapus permanen.
            </CardDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteUser(null)}
              className="h-9"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="h-9"
            >
              {isPending ? 'Menghapus...' : 'Hapus Permanen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
