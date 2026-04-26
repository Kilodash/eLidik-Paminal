-- =============================================
-- Migration: Update RPC upsert_kegiatan_with_personel
-- Tambah parameter p_dumas_id untuk menghubungkan kegiatan ke Dumas
-- =============================================

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
  p_personel_list JSONB,
  p_dumas_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_kegiatan_id UUID;
  v_person_record JSONB;
BEGIN
  IF p_id IS NULL THEN
    -- Insert new kegiatan
    INSERT INTO kegiatan_induk (
      dumas_id, jenis_giat, lokasi, tgl_mulai, tgl_selesai, tgl_sprin, nomor_sprin, tempat_tujuan, tujuan, dasar_giat, status
    ) VALUES (
      p_dumas_id, p_jenis_giat, p_lokasi, p_tgl_mulai, p_tgl_selesai, p_tgl_sprin, p_nomor_sprin, p_tempat_tujuan, p_tujuan, p_dasar_giat, p_status
    ) RETURNING id INTO v_kegiatan_id;
  ELSE
    -- Update existing kegiatan
    UPDATE kegiatan_induk SET
      dumas_id = p_dumas_id,
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
      updated_at = NOW()
    WHERE id = p_id;
    
    v_kegiatan_id := p_id;
    
    -- Delete existing personnel
    DELETE FROM kegiatan_personel WHERE id_kegiatan = v_kegiatan_id;
  END IF;

  -- Insert new personnel list safely
  IF p_personel_list IS NOT NULL AND jsonb_typeof(p_personel_list) = 'array' AND jsonb_array_length(p_personel_list) > 0 THEN
    FOR v_person_record IN SELECT * FROM jsonb_array_elements(p_personel_list)
    LOOP
      INSERT INTO kegiatan_personel (id_kegiatan, id_personel, is_ketua_tim)
      VALUES (
        v_kegiatan_id,
        (v_person_record->>'id_personel')::UUID,
        COALESCE((v_person_record->>'is_ketua_tim')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  RETURN v_kegiatan_id;
END;
$$ LANGUAGE plpgsql;
