import { redirect } from 'next/navigation';
import { getPersonel, requireTenant } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getUserList } from './actions';
import { UserManager } from './user-manager';

export default async function UserPage() {
  const currentUser = await getPersonel();
  if (!currentUser || currentUser.role === 'operator_unit') redirect('/');

  const tenantId = await requireTenant();
  const supabase = await createClient();

  const { data: units } = await supabase
    .from('organizations')
    .select('id, nama')
    .eq('tenant_id', tenantId)
    .eq('tipe', 'unit')
    .order('nama');

  const users = await getUserList();

  return (
    <UserManager
      users={users}
      units={(units || []).map((u) => ({ id: u.id, nama: u.nama || '' }))}
    />
  );
}
