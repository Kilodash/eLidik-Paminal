'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireTenant, requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { TenantRole } from '@/types';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function createUserAction(formData: FormData) {
  try {
    const admin = await requireRole('admin_subbid', 'oversight');
    if (!admin) return { error: 'Akses ditolak' };

    const tenantId = await requireTenant();

    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string) || 'rahasia2026';
    const namaLengkap = (formData.get('nama_lengkap') as string)?.trim();
    const role = formData.get('role') as string as TenantRole;
    const organizationId = (formData.get('organization_id') as string) || null;
    const nip = (formData.get('nip') as string) || null;
    const pangkat = (formData.get('pangkat') as string) || null;
    const jabatan = (formData.get('jabatan') as string) || null;

    if (!email || !namaLengkap || !role) {
      return { error: 'Email, nama lengkap, dan role wajib diisi' };
    }

    const fullEmail = email.includes('@') ? email : `${email}@poldajabar.go.id`;

    const supabase = createAdminClient();
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: fullEmail,
      password,
      email_confirm: true,
    });

    if (authErr) return { error: `Auth: ${authErr.message}` };

    const { error: perErr } = await supabase.from('personel').insert({
      id: authData.user.id,
      tenant_id: tenantId,
      organization_id: organizationId === '--' ? null : organizationId,
      role,
      nama_lengkap: namaLengkap,
      nip,
      pangkat,
      jabatan,
    });

    if (perErr) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: `Personel: ${perErr.message}` };
    }

    revalidatePath('/pengaturan/user');
    return { success: true };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
}

export async function updateUserAction(formData: FormData) {
  try {
    const admin = await requireRole('admin_subbid', 'oversight');
    if (!admin) return { error: 'Akses ditolak' };

    const tenantId = await requireTenant();
    const userId = formData.get('id') as string;
    if (!userId) return { error: 'ID user tidak ditemukan' };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('personel')
      .update({
        nama_lengkap: (formData.get('nama_lengkap') as string)?.trim(),
        role: formData.get('role') as TenantRole,
        organization_id:
          (formData.get('organization_id') as string) === '--'
            ? null
            : (formData.get('organization_id') as string) || null,
        nip: (formData.get('nip') as string) || null,
        pangkat: (formData.get('pangkat') as string) || null,
        jabatan: (formData.get('jabatan') as string) || null,
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (error) return { error: error.message };

    revalidatePath('/pengaturan/user');
    return { success: true };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
}

export async function resetPasswordAction(userId: string, newPassword: string) {
  try {
    const admin = await requireRole('admin_subbid', 'oversight');
    if (!admin) return { error: 'Akses ditolak' };
    if (!newPassword || newPassword.length < 6) return { error: 'Password minimal 6 karakter' };

    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) return { error: error.message };

    return { success: true };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const admin = await requireRole('admin_subbid', 'oversight');
    if (!admin) return { error: 'Akses ditolak' };

    const tenantId = await requireTenant();
    const supabase = createAdminClient();

    const { error: perErr } = await supabase
      .from('personel')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (perErr) {
      if (perErr.code === '23503') {
        return {
          error: 'User tidak dapat dihapus karena masih terkait dengan data pengaduan/berkas',
        };
      }
      return { error: perErr.message };
    }

    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) {
      return { error: `Auth: ${authErr.message}` };
    }

    revalidatePath('/pengaturan/user');
    return { success: true };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
}

export async function getUserList() {
  const supabase = await createClient();
  const tenantId = await requireTenant();

  const { data, error } = await supabase
    .from('personel')
    .select('id, nama_lengkap, role, nip, pangkat, jabatan, organization:organizations(id, nama)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const admin = createAdminClient();
  const usersWithEmail: Array<{
    id: string;
    nama_lengkap: string;
    role: string;
    nip: string | null;
    pangkat: string | null;
    jabatan: string | null;
    organization: { id: string; nama: string }[] | null;
    email: string;
  }> = [];

  for (const p of data || []) {
    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    const org = p.organization as { id: string; nama: string }[] | null;
    usersWithEmail.push({
      ...p,
      organization: org,
      email: authUser?.user?.email || '(no auth)',
    });
  }

  return usersWithEmail;
}
