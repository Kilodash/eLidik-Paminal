-- 021: Distribusi Subbid Paminal ke unit/UR Gajamada

-- 1. Tambah kolom pengaduan untuk distribusi
ALTER TABLE pengaduan
  ADD COLUMN IF NOT EXISTS gajamada_polda VARCHAR,
  ADD COLUMN IF NOT EXISTS gajamada_sub_function VARCHAR,
  ADD COLUMN IF NOT EXISTS gajamada_unit_tujuan VARCHAR,
  ADD COLUMN IF NOT EXISTS tgl_disposisi_kasubbid DATE,
  ADD COLUMN IF NOT EXISTS disposisi_kasubbid_catatan TEXT;

-- 2. Rename organizations agar identik dengan nama unit/UR Gajamada
UPDATE organizations SET nama = 'UNIT 1 SUBBID PAMINAL', kode = 'UNIT-1' WHERE kode = 'UNIT-1';
UPDATE organizations SET nama = 'UNIT 2 SUBBID PAMINAL', kode = 'UNIT-2' WHERE kode = 'UNIT-2';
UPDATE organizations SET nama = 'UNIT 3 SUBBID PAMINAL', kode = 'UNIT-3' WHERE kode = 'UNIT-3';
UPDATE organizations SET nama = 'UR BINPAM SUBBID PAMINAL', kode = 'UR-BINPAM' WHERE kode = 'UR-BINPAM';
UPDATE organizations SET nama = 'UR LITPERS SUBBID PAMINAL', kode = 'UR-LITPERS' WHERE kode = 'UR-LITPERS';
UPDATE organizations SET nama = 'UR PRODOK SUBBID PAMINAL', kode = 'UR-PRODOK' WHERE kode = 'UR-PRODOK';
UPDATE organizations SET nama = 'KAUR BINPAM SUBBID PAMINAL', kode = 'KAUR-BINPAM' WHERE kode = 'KAUR-BINPAM';
UPDATE organizations SET nama = 'KASUBBID PAMINAL', tipe = 'subbid' WHERE kode = 'SUBBID-PAMINAL';

-- 3. Tambah key gajamada_polda di tenant_variables untuk filter intake
DO $$
DECLARE
  t RECORD;
  polda_value TEXT;
BEGIN
  FOR t IN SELECT id, kode, nama FROM tenants LOOP
    polda_value := 'POLDA ' || UPPER(REPLACE(t.nama, 'Polda ', ''));

    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'gajamada_polda_filter', polda_value)
    ON CONFLICT (tenant_id, key) DO NOTHING;
  END LOOP;
END $$;

-- 4. Update organization default di initialize_tenant_master_data() 
CREATE OR REPLACE FUNCTION initialize_tenant_master_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_variables (tenant_id, key, value) VALUES
    (NEW.id, 'nama_polda', NEW.nama),
    (NEW.id, 'kode_polda', NEW.kode),
    (NEW.id, 'alamat', COALESCE(NEW.alamat, 'Jl. Jenderal Sudirman')),
    (NEW.id, 'nama_kabid', 'Kombes Pol. Dr. ANDI PRATAMA, S.I.K., M.H.'),
    (NEW.id, 'pangkat_kabid', 'Kombes Pol.'),
    (NEW.id, 'nip_kabid', '76004567'),
    (NEW.id, 'ttd_kabid', ''),
    (NEW.id, 'nama_kasi', 'Kompol BUDI SANTOSO, S.H.'),
    (NEW.id, 'pangkat_kasi', 'Kompol'),
    (NEW.id, 'nip_kasi', '78001234'),
    (NEW.id, 'disposisi_kasubbid', 'KASUBBID PAMINAL ' || NEW.nama),
    (NEW.id, 'gajamada_disposisi_polda', 'POLDA ' || UPPER(REPLACE(NEW.nama, 'Polda ', ''))),
    (NEW.id, 'gajamada_polda_filter', 'POLDA ' || UPPER(REPLACE(NEW.nama, 'Polda ', ''))),
    (NEW.id, 'gajamada_gateway_id', 'aa6159ec4d7847e8282943f7dfe87c29'),
    (NEW.id, 'gajamada_action_widget_id', '6f2cfeabd19ddafce8fc98f5c9d9ad63'),
    (NEW.id, 'gajamada_action_menu_id', '01f63e60376afe827638ed614e1cea76'),
    (NEW.id, 'gajamada_action_user_id', 'a07611b17f063f8b5460f2eaa5c7deda'),
    (NEW.id, 'ai_provider', 'openai'),
    (NEW.id, 'ai_model', 'gpt-4o-mini'),
    (NEW.id, 'ai_base_url', ''),
    (NEW.id, 'ai_prompt_summary', 'Ringkas kronologi pengaduan berikut dalam Bahasa Indonesia yang formal, singkat, dan padat. Maksimal 3 paragraf.'),
    (NEW.id, 'ai_prompt_satker', 'Dari teks pengaduan berikut, tentukan satker/polda/polres/polsek yang paling relevan. Hanya jawab dengan nama satker tersebut, tanpa penjelasan.'),
    (NEW.id, 'ai_prompt_klasifikasi', 'Pilih klasifikasi yang paling sesuai dari daftar berikut untuk kategori pengaduan ini. Hanya jawab dengan nama klasifikasi yang tepat.'),
    (NEW.id, 'ai_sync_interval_minutes', '30')
  ON CONFLICT (tenant_id, key) DO NOTHING;

  INSERT INTO jenis_pengaduan (tenant_id, kode, nama) VALUES
    (NEW.id, 'PENGADUAN', 'Pengaduan'),
    (NEW.id, 'LAPORAN_INFORMASI', 'Laporan Informasi'),
    (NEW.id, 'CEPAT_PROPAM', 'Pengaduan Cepat Propam')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  INSERT INTO klasifikasi (tenant_id, kode, nama) VALUES
    (NEW.id, 'DISIPLIN', 'Pelanggaran Disiplin'),
    (NEW.id, 'KEPP', 'Pelanggaran Kode Etik Profesi Polri'),
    (NEW.id, 'PIDANA', 'Tindak Pidana')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  INSERT INTO organizations (tenant_id, tipe, kode, nama) VALUES
    (NEW.id, 'subbid', 'SUBBID-PAMINAL', 'KASUBBID PAMINAL'),
    (NEW.id, 'unit', 'UNIT-1', 'UNIT 1 SUBBID PAMINAL'),
    (NEW.id, 'unit', 'UNIT-2', 'UNIT 2 SUBBID PAMINAL'),
    (NEW.id, 'unit', 'UNIT-3', 'UNIT 3 SUBBID PAMINAL'),
    (NEW.id, 'unit', 'UR-BINPAM', 'UR BINPAM SUBBID PAMINAL'),
    (NEW.id, 'unit', 'UR-LITPERS', 'UR LITPERS SUBBID PAMINAL'),
    (NEW.id, 'unit', 'UR-PRODOK', 'UR PRODOK SUBBID PAMINAL'),
    (NEW.id, 'unit', 'KAUR-BINPAM', 'KAUR BINPAM SUBBID PAMINAL')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Backfill gateway config untuk tenant existing yang belum punya
DO $$
DECLARE
  t RECORD;
  polda_value TEXT;
BEGIN
  FOR t IN SELECT id, kode, nama FROM tenants LOOP
    polda_value := 'POLDA ' || UPPER(REPLACE(t.nama, 'Polda ', ''));

    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'gajamada_gateway_id', 'aa6159ec4d7847e8282943f7dfe87c29'),
      (t.id, 'gajamada_action_widget_id', '6f2cfeabd19ddafce8fc98f5c9d9ad63'),
      (t.id, 'gajamada_action_menu_id', '01f63e60376afe827638ed614e1cea76'),
      (t.id, 'gajamada_action_user_id', 'a07611b17f063f8b5460f2eaa5c7deda'),
      (t.id, 'gajamada_polda_filter', polda_value)
    ON CONFLICT (tenant_id, key) DO NOTHING;
  END LOOP;
END $$;
