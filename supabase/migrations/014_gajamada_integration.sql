-- 014: Integrasi Gajamada Propam — kolom pengaduan, jenis pengaduan, AI settings

-- 1. Tambah kolom pengaduan untuk data Gajamada
ALTER TABLE pengaduan
  ADD COLUMN IF NOT EXISTS gajamada_id VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS gajamada_status VARCHAR,
  ADD COLUMN IF NOT EXISTS gajamada_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pelapor_email VARCHAR,
  ADD COLUMN IF NOT EXISTS pelapor_nik VARCHAR,
  ADD COLUMN IF NOT EXISTS pelapor_total_report INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kronologi_lengkap TEXT,
  ADD COLUMN IF NOT EXISTS tgl_kejadian DATE;

-- 2. Tambah jenis pengaduan "Pengaduan Cepat Propam" untuk tenant existing
INSERT INTO jenis_pengaduan (tenant_id, kode, nama)
SELECT id, 'CEPAT_PROPAM', 'Pengaduan Cepat Propam'
FROM tenants
ON CONFLICT (tenant_id, kode) DO NOTHING;

-- 3. Update function init tenant agar auto-insert jenis pengaduan Cepat Propam
CREATE OR REPLACE FUNCTION initialize_tenant_master_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default tenant variables
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
    (NEW.id, 'ai_provider', 'openai'),
    (NEW.id, 'ai_model', 'gpt-4o-mini'),
    (NEW.id, 'ai_base_url', ''),
    (NEW.id, 'ai_prompt_summary', 'Ringkas kronologi pengaduan berikut dalam Bahasa Indonesia yang formal, singkat, dan padat. Maksimal 3 paragraf.'),
    (NEW.id, 'ai_prompt_satker', 'Dari teks pengaduan berikut, tentukan satker/polda/polres/polsek yang paling relevan. Hanya jawab dengan nama satker tersebut, tanpa penjelasan.'),
    (NEW.id, 'ai_prompt_klasifikasi', 'Pilih klasifikasi yang paling sesuai dari daftar berikut untuk kategori pengaduan ini. Hanya jawab dengan nama klasifikasi yang tepat.'),
    (NEW.id, 'ai_sync_interval_minutes', '30')
  ON CONFLICT (tenant_id, key) DO NOTHING;

  -- Insert default jenis_pengaduan
  INSERT INTO jenis_pengaduan (tenant_id, kode, nama) VALUES
    (NEW.id, 'PENGADUAN', 'Pengaduan'),
    (NEW.id, 'LAPORAN_INFORMASI', 'Laporan Informasi'),
    (NEW.id, 'CEPAT_PROPAM', 'Pengaduan Cepat Propam')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  -- Insert default klasifikasi
  INSERT INTO klasifikasi (tenant_id, kode, nama) VALUES
    (NEW.id, 'DISIPLIN', 'Pelanggaran Disiplin'),
    (NEW.id, 'KEPP', 'Pelanggaran Kode Etik Profesi Polri'),
    (NEW.id, 'PIDANA', 'Tindak Pidana')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  -- Insert default organizations
  INSERT INTO organizations (tenant_id, tipe, kode, nama) VALUES
    (NEW.id, 'subbid', 'SUBBID-PAMINAL', 'Subbid Paminal ' || NEW.nama),
    (NEW.id, 'unit', 'UNIT-A', 'Unit A'),
    (NEW.id, 'unit', 'UNIT-B', 'Unit B'),
    (NEW.id, 'unit', 'UNIT-C', 'Unit C')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Backfill tenant variables untuk tenant existing yang belum punya
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id, kode, nama, alamat FROM tenants LOOP
    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'disposisi_kasubbid', 'KASUBBID PAMINAL ' || t.nama),
      (t.id, 'ai_provider', 'openai'),
      (t.id, 'ai_model', 'gpt-4o-mini'),
      (t.id, 'ai_base_url', ''),
      (t.id, 'ai_prompt_summary', 'Ringkas kronologi pengaduan berikut dalam Bahasa Indonesia yang formal, singkat, dan padat. Maksimal 3 paragraf.'),
      (t.id, 'ai_prompt_satker', 'Dari teks pengaduan berikut, tentukan satker/polda/polres/polsek yang paling relevan. Hanya jawab dengan nama satker tersebut, tanpa penjelasan.'),
      (t.id, 'ai_prompt_klasifikasi', 'Pilih klasifikasi yang paling sesuai dari daftar berikut untuk kategori pengaduan ini. Hanya jawab dengan nama klasifikasi yang tepat.'),
      (t.id, 'ai_sync_interval_minutes', '30')
    ON CONFLICT (tenant_id, key) DO NOTHING;
  END LOOP;
END $$;
