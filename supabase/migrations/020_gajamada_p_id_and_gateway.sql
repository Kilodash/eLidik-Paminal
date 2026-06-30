-- 020: Sesuaikan unit/UR Paminal + gajamada_p_id + gateway config

-- 1. Tambah kolom gajamada_p_id di pengaduan
ALTER TABLE pengaduan
  ADD COLUMN IF NOT EXISTS gajamada_p_id VARCHAR,
  ADD COLUMN IF NOT EXISTS gajamada_case_position VARCHAR;

UPDATE pengaduan
  SET gajamada_p_id = gajamada_id || '-00001'
  WHERE gajamada_id IS NOT NULL AND gajamada_p_id IS NULL;

-- 2. Rename existing units + update nama
UPDATE organizations SET nama = 'Unit 1 Paminal' WHERE tipe = 'unit' AND kode = 'UNIT-1';
UPDATE organizations SET nama = 'Unit 2 Paminal' WHERE tipe = 'unit' AND kode = 'UNIT-2';
UPDATE organizations SET nama = 'Unit 3 Paminal' WHERE tipe = 'unit' AND kode = 'UNIT-3';
UPDATE organizations SET nama = 'UR Binpam' WHERE tipe = 'unit' AND kode = 'UR-BINPAM';
UPDATE organizations SET nama = 'UR Prodok' WHERE tipe = 'unit' AND kode = 'UR-PRODOK';
UPDATE organizations SET nama = 'UR Litpers' WHERE tipe = 'unit' AND kode = 'UR-LITPERS';

-- 3. Tambah KAUR-BINPAM (baru)
INSERT INTO organizations (tenant_id, tipe, kode, nama)
  SELECT t.id, 'unit', 'KAUR-BINPAM', 'Kaur Binpam'
  FROM tenants t
  WHERE NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.tenant_id = t.id AND o.kode = 'KAUR-BINPAM'
  );

-- 4. Hapus unit default lama yang tidak dipakai
DELETE FROM organizations WHERE tipe = 'unit' AND kode IN ('UNIT-A', 'UNIT-B', 'UNIT-C');

-- 5. Gateway config untuk aksi Gajamada
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM tenants LOOP
    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'gajamada_gateway_id', 'aa6159ec4d7847e8282943f7dfe87c29'),
      (t.id, 'gajamada_action_widget_id', '6f2cfeabd19ddafce8fc98f5c9d9ad63'),
      (t.id, 'gajamada_action_menu_id', '01f63e60376afe827638ed614e1cea76'),
      (t.id, 'gajamada_action_user_id', 'a07611b17f063f8b5460f2eaa5c7deda')
    ON CONFLICT (tenant_id, key) DO NOTHING;
  END LOOP;
END $$;
