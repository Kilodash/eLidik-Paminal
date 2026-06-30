-- 019: Ganti filter intake Gajamada dari disposisi_case_position ke disposisi_polda
-- Value format: "POLDA JAWA BARAT" (uppercase, tanpa prefix "Polda")

DO $$
DECLARE
  t RECORD;
  polda_value TEXT;
BEGIN
  FOR t IN SELECT id, kode, nama FROM tenants LOOP
    -- Derive value: "POLDA JAWA BARAT" dari "Polda Jawa Barat"
    polda_value := 'POLDA ' || UPPER(REPLACE(t.nama, 'Polda ', ''));

    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'gajamada_disposisi_polda', polda_value)
    ON CONFLICT (tenant_id, key) DO UPDATE
      SET value = EXCLUDED.value
      WHERE tenant_variables.value IS NULL OR tenant_variables.value = '';
  END LOOP;
END $$;

-- Update function initialize_tenant_master_data() untuk include key baru
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
    (NEW.id, 'subbid', 'SUBBID-PAMINAL', 'Subbid Paminal ' || NEW.nama),
    (NEW.id, 'unit', 'UNIT-A', 'Unit A'),
    (NEW.id, 'unit', 'UNIT-B', 'Unit B'),
    (NEW.id, 'unit', 'UNIT-C', 'Unit C')
  ON CONFLICT (tenant_id, kode) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
