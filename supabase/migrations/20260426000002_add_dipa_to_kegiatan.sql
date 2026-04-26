-- Migration: Add DIPA relation to Kegiatan Induk
ALTER TABLE kegiatan_induk ADD COLUMN id_dipa UUID REFERENCES master_dipa(id);

-- Update RPC to support DIPA ID
CREATE OR REPLACE FUNCTION upsert_kegiatan_with_personel(
  p_id UUID,
  p_jenis_giat VARCHAR,
  p_lokasi VARCHAR,
  p_tgl_mulai DATE,
  p_tgl_selesai DATE,
  p_tgl_sprin DATE,
  p_nomor_sprin VARCHAR,
  p_tempat_tujuan TEXT,
  p_tujuan TEXT,
  p_dasar_giat TEXT,
  p_status VARCHAR,
  p_personel_list JSONB, -- [{"id_personel": "uuid", "is_ketua_tim": boolean}]
  p_dumas_id UUID DEFAULT NULL,
  p_id_dipa UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_kegiatan_id UUID;
  v_personel JSONB;
BEGIN
  -- Insert or Update Kegiatan Induk
  IF p_id IS NULL THEN
    INSERT INTO kegiatan_induk (
      jenis_giat, lokasi, tgl_mulai, tgl_selesai, tgl_sprin, nomor_sprin,
      tempat_tujuan, tujuan, dasar_giat, status, dumas_id, id_dipa
    ) VALUES (
      p_jenis_giat, p_lokasi, p_tgl_mulai, p_tgl_selesai, p_tgl_sprin, p_nomor_sprin,
      p_tempat_tujuan, p_tujuan, p_dasar_giat, p_status, p_dumas_id, p_id_dipa
    ) RETURNING id INTO v_kegiatan_id;
  ELSE
    UPDATE kegiatan_induk SET
      jenis_giat = p_jenis_giat,
      lokasi = p_lokasi,
      tgl_mulai = p_tgl_mulai,
      tgl_selesai = p_tgl_selesai,
      tgl_sprin = p_tgl_sprin,
      nomor_sprin = p_nomor_sprin,
      tempat_tujuan = p_tempat_tujuan,
      tujuan = p_tujuan,
      dasar_giat = p_dasar_giat,
      status = p_status,
      dumas_id = p_dumas_id,
      id_dipa = p_id_dipa,
      updated_at = NOW()
    WHERE id = p_id;
    v_kegiatan_id := p_id;
  END IF;

  -- Refresh Personel list
  DELETE FROM kegiatan_personel WHERE id_kegiatan = v_kegiatan_id;
  
  FOR v_personel IN SELECT * FROM jsonb_array_elements(p_personel_list)
  LOOP
    INSERT INTO kegiatan_personel (id_kegiatan, id_personel, is_ketua_tim)
    VALUES (v_kegiatan_id, (v_personel->>'id_personel')::UUID, (v_personel->>'is_ketua_tim')::BOOLEAN);
  END LOOP;

  RETURN v_kegiatan_id;
END;
$$ LANGUAGE plpgsql;
