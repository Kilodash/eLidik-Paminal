-- 010: Auto-initialize tenant master data (variables, klasifikasi, jenis_pengaduan, organizations) on tenant creation

CREATE OR REPLACE FUNCTION initialize_tenant_master_data()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert default tenant variables
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
    (NEW.id, 'nip_kasi', '78001234')
  ON CONFLICT (tenant_id, key) DO NOTHING;

  -- 2. Insert default jenis_pengaduan
  INSERT INTO jenis_pengaduan (tenant_id, kode, nama) VALUES
    (NEW.id, 'PENGADUAN', 'Pengaduan'),
    (NEW.id, 'LAPORAN_INFORMASI', 'Laporan Informasi')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  -- 3. Insert default klasifikasi
  INSERT INTO klasifikasi (tenant_id, kode, nama) VALUES
    (NEW.id, 'DISIPLIN', 'Pelanggaran Disiplin'),
    (NEW.id, 'KEPP', 'Pelanggaran Kode Etik Profesi Polri'),
    (NEW.id, 'PIDANA', 'Tindak Pidana')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  -- 4. Insert default organizations
  INSERT INTO organizations (tenant_id, tipe, kode, nama) VALUES
    (NEW.id, 'subbid', 'SUBBID-PAMINAL', 'Subbid Paminal ' || NEW.nama),
    (NEW.id, 'unit', 'UNIT-A', 'Unit A'),
    (NEW.id, 'unit', 'UNIT-B', 'Unit B'),
    (NEW.id, 'unit', 'UNIT-C', 'Unit C')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_initialize_tenant_master_data ON tenants;
CREATE TRIGGER trg_initialize_tenant_master_data
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION initialize_tenant_master_data();

-- Initialize existing tenants that might be missing some master data
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id, kode, nama, alamat FROM tenants LOOP
    -- Insert default variables
    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'nama_polda', t.nama),
      (t.id, 'kode_polda', t.kode),
      (t.id, 'alamat', COALESCE(t.alamat, CASE WHEN t.kode = 'JABAR' THEN 'Jl. Soekarno-Hatta No. 748, Bandung' ELSE 'Jl. Jenderal Sudirman No. 55, Jakarta Selatan' END)),
      (t.id, 'nama_kabid', 'Kombes Pol. Dr. ANDI PRATAMA, S.I.K., M.H.'),
      (t.id, 'pangkat_kabid', 'Kombes Pol.'),
      (t.id, 'nip_kabid', '76004567'),
      (t.id, 'ttd_kabid', ''),
      (t.id, 'nama_kasi', 'Kompol BUDI SANTOSO, S.H.'),
      (t.id, 'pangkat_kasi', 'Kompol'),
      (t.id, 'nip_kasi', '78001234')
    ON CONFLICT (tenant_id, key) DO NOTHING;

    -- Insert default jenis_pengaduan
    INSERT INTO jenis_pengaduan (tenant_id, kode, nama) VALUES
      (t.id, 'PENGADUAN', 'Pengaduan'),
      (t.id, 'LAPORAN_INFORMASI', 'Laporan Informasi')
    ON CONFLICT (tenant_id, kode) DO NOTHING;

    -- Insert default klasifikasi
    INSERT INTO klasifikasi (tenant_id, kode, nama) VALUES
      (t.id, 'DISIPLIN', 'Pelanggaran Disiplin'),
      (t.id, 'KEPP', 'Pelanggaran Kode Etik Profesi Polri'),
      (t.id, 'PIDANA', 'Tindak Pidana')
    ON CONFLICT (tenant_id, kode) DO NOTHING;

    -- Insert default organizations
    INSERT INTO organizations (tenant_id, tipe, kode, nama) VALUES
      (t.id, 'subbid', 'SUBBID-PAMINAL', 'Subbid Paminal ' || t.nama),
      (t.id, 'unit', 'UNIT-A', 'Unit A'),
      (t.id, 'unit', 'UNIT-B', 'Unit B'),
      (t.id, 'unit', 'UNIT-C', 'Unit C')
    ON CONFLICT (tenant_id, kode) DO NOTHING;
  END LOOP;
END $$;
