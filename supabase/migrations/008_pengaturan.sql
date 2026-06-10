-- 008: Pengaturan — wilayah_satker, personel improvements, tenant alamat, org admin policies

-- Tambah alamat ke tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS alamat TEXT;

-- Pisahkan personel dari auth.users: tambah user_id opsional, buat id jadi DEFAULT gen_random_uuid()
-- Step 1: hapus FK constraint lama dari personel.id ke auth.users
ALTER TABLE personel DROP CONSTRAINT IF EXISTS personel_pkey CASCADE;
ALTER TABLE personel ADD PRIMARY KEY (id);
ALTER TABLE personel ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 2: tambah user_id untuk link ke auth.users (opsional)
ALTER TABLE personel ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 3: salin id ke user_id untuk personel existing yang terhubung auth
UPDATE personel SET user_id = id WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = personel.id);

-- Tambah kolom tambahan
ALTER TABLE personel ADD COLUMN IF NOT EXISTS kesatuan VARCHAR;
ALTER TABLE personel ADD COLUMN IF NOT EXISTS tim VARCHAR;

-- Update fungsi RLS: gunakan user_id sebagai link ke auth.users
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM personel WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Tabel wilayah/satker
CREATE TABLE IF NOT EXISTS wilayah_satker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kode VARCHAR,
  nama VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, kode)
);

-- Enable RLS
ALTER TABLE wilayah_satker ENABLE ROW LEVEL SECURITY;

-- RLS: tenant isolation
CREATE POLICY ws_tenant ON wilayah_satker
  FOR ALL USING (tenant_id = current_tenant_id());

-- RLS: only admin can manage
CREATE POLICY ws_admin ON wilayah_satker
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY ws_admin_upd ON wilayah_satker
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY ws_admin_del ON wilayah_satker
  FOR DELETE USING (current_user_role() IN ('admin_subbid', 'oversight'));

-- Personel: allow admin to insert/update (sekarang bisa karena id = gen_random_uuid)
DROP POLICY IF EXISTS personel_admin ON personel;
DROP POLICY IF EXISTS personel_admin_upd ON personel;
CREATE POLICY personel_admin ON personel
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY personel_admin_upd ON personel
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY personel_admin_del ON personel
  FOR DELETE USING (current_user_role() IN ('admin_subbid', 'oversight'));

-- Organizations: allow admin to insert/update/delete
DROP POLICY IF EXISTS org_admin ON organizations;
DROP POLICY IF EXISTS org_admin_upd ON organizations;
DROP POLICY IF EXISTS org_admin_del ON organizations;
CREATE POLICY org_admin ON organizations
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY org_admin_upd ON organizations
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY org_admin_del ON organizations
  FOR DELETE USING (current_user_role() IN ('admin_subbid', 'oversight'));
