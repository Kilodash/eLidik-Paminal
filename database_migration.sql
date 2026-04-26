-- Simondu Web - Fresh Database Schema (Phase 3 Complete)
-- PostgreSQL / Supabase Migration Script

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Drop existing tables if fresh install
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS anggota CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS penyelesaian CASCADE;
DROP TABLE IF EXISTS tim_lidik CASCADE;
DROP TABLE IF EXISTS tindak_lanjut CASCADE;
DROP TABLE IF EXISTS dumas CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'kasubbid_paminal', 'admin', 'unit', 'ur_binpam', 'ur_litpers', 'ur_prodok')),
    unit_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- =============================================
-- SETTINGS TABLE (Master Data)
-- =============================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL UNIQUE, -- 'satker', 'jenis_dumas', 'wujud_perbuatan', 'format_dokumen', 'unit_list'
    value JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settings_type ON settings(type);

-- =============================================
-- DUMAS TABLE (Complaint Registration)
-- =============================================
CREATE TABLE dumas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_dumas VARCHAR(100) UNIQUE,
    tgl_dumas DATE NOT NULL,
    pelapor TEXT NOT NULL,
    terlapor TEXT NOT NULL,
    satker VARCHAR(255) NOT NULL,
    wujud_perbuatan TEXT NOT NULL,
    jenis_dumas VARCHAR(255) NOT NULL,
    keterangan TEXT,
    disposisi_kabid TEXT,
    disposisi_kasubbid TEXT,
    unit_id UUID REFERENCES users(id),
    unit_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'dalam_proses' CHECK (status IN ('dalam_proses', 'terbukti', 'tidak_terbukti', 'dihentikan')),
    parent_dumas_id UUID REFERENCES dumas(id), -- For merged dumas
    sla_days INTEGER DEFAULT 0, -- Auto-calculated
    is_archived BOOLEAN DEFAULT FALSE,
    context_ai JSONB DEFAULT '{}'::jsonb, -- AI SIADIDEMENBABI Extraction context
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_dumas_no_dumas ON dumas(no_dumas);
CREATE INDEX idx_dumas_status ON dumas(status);
CREATE INDEX idx_dumas_unit_id ON dumas(unit_id);
CREATE INDEX idx_dumas_deleted_at ON dumas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_dumas_parent ON dumas(parent_dumas_id);
CREATE INDEX idx_dumas_created_at ON dumas(created_at DESC);
CREATE INDEX idx_dumas_tgl_dumas ON dumas(tgl_dumas DESC);

-- =============================================
-- TINDAK LANJUT TABLE (Follow-up Actions)
-- =============================================
CREATE TABLE tindak_lanjut (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumas_id UUID REFERENCES dumas(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Workflow Status
    status_verifikasi VARCHAR(50) DEFAULT 'draft' CHECK (status_verifikasi IN ('draft', 'menunggu_verifikasi', 'revisi', 'disetujui')),
    catatan_revisi TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    -- UUK (Usulan Urutan Kasus)
    tgl_uuk DATE,
    no_uuk VARCHAR(255),
    
    -- SPRIN LIDIK
    tgl_sprin_lidik DATE,
    no_sprin VARCHAR(255),
    
    -- Tim Lidik (JSON array of anggota)
    tim_lidik JSONB DEFAULT '[]'::jsonb, -- [{"nama": "...", "pangkat": "...", "nrp": "...", "jabatan": "..."}]
    
    -- Gelar Perkara
    tgl_gelar DATE,
    
    -- LHP (Laporan Hasil Penyelidikan)
    tgl_lhp DATE,
    no_lhp VARCHAR(255),
    hasil_lidik VARCHAR(100) CHECK (hasil_lidik IN ('terbukti', 'tidak_terbukti', 'dihentikan', NULL)),
    
    -- Conditional: If terbukti
    tgl_nodin DATE,
    no_nodin VARCHAR(255),
    no_berkas VARCHAR(255),
    
    -- Conditional: If tidak_terbukti
    tgl_sp2hp2 DATE,
    no_sp2hp2 VARCHAR(255),
    
    -- Pelimpahan & Henti Lidik
    tgl_ke_ankum DATE,
    tgl_ke_mabes DATE,
    no_mabes VARCHAR(255),
    tgl_st_arahan DATE,
    
    -- File attachments
    file_dokumen_url JSONB DEFAULT '[]'::jsonb, -- [{"name": "...", "url": "..."}]
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tindak_lanjut_dumas_id ON tindak_lanjut(dumas_id);
CREATE INDEX idx_tindak_lanjut_status ON tindak_lanjut(status_verifikasi);

-- =============================================
-- TIM LIDIK TABLE (Investigation Team - deprecated, now JSONB in tindak_lanjut)
-- =============================================
CREATE TABLE tim_lidik (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumas_id UUID REFERENCES dumas(id) ON DELETE CASCADE NOT NULL,
    anggota_id UUID REFERENCES users(id),
    no_hp_penyelidik VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tim_lidik_dumas_id ON tim_lidik(dumas_id);

-- =============================================
-- PENYELESAIAN TABLE (Case Closure)
-- =============================================
CREATE TABLE penyelesaian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumas_id UUID REFERENCES dumas(id) ON DELETE CASCADE NOT NULL,
    jenis VARCHAR(50) CHECK (jenis IN ('pelimpahan', 'henti_lidik')),
    tanggal DATE NOT NULL,
    nomor VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_penyelesaian_dumas_id ON penyelesaian(dumas_id);

-- =============================================
-- NOTIFICATIONS TABLE (Realtime Updates)
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES users(id),
    target_role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_target_user ON notifications(target_user_id, is_read);
CREATE INDEX idx_notifications_target_role ON notifications(target_role, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- ANGGOTA TABLE (Personnel Management)
-- =============================================
CREATE TABLE anggota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    pangkat VARCHAR(100) NOT NULL,
    nrp VARCHAR(50) UNIQUE NOT NULL,
    jabatan VARCHAR(255),
    unit VARCHAR(255),
    no_hp VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anggota_nrp ON anggota(nrp);
CREATE INDEX idx_anggota_nama ON anggota(nama);
CREATE INDEX idx_anggota_deleted_at ON anggota(deleted_at) WHERE deleted_at IS NULL;

-- =============================================
-- DOCUMENT TEMPLATES TABLE (Template Uploads)
-- =============================================
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('uuk', 'sprin', 'sp2hp2', 'nodin', 'lhp', 'other')),
    description TEXT,
    storage_path VARCHAR(500) NOT NULL, -- Supabase Storage path
    file_url VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_templates_type ON document_templates(type);
CREATE INDEX idx_document_templates_active ON document_templates(is_active);

-- =============================================
-- AUDIT LOG TABLE (Activity Tracking)
-- =============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'approve', 'reject', etc.
    entity_type VARCHAR(100), -- 'dumas', 'tindak_lanjut', 'user', 'settings', etc.
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb, -- Additional context
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tindak_lanjut ENABLE ROW LEVEL SECURITY;
ALTER TABLE tim_lidik ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyelesaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow all access policies (API-level authentication)
CREATE POLICY "Allow all access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON dumas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON tindak_lanjut FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON tim_lidik FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON penyelesaian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON anggota FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON document_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dumas_updated_at BEFORE UPDATE ON dumas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tindak_lanjut_updated_at BEFORE UPDATE ON tindak_lanjut FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anggota_updated_at BEFORE UPDATE ON anggota FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PERWABKEU MODULE TABLES (Financial Support)
-- =============================================

CREATE TABLE master_pejabat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peran VARCHAR(100) NOT NULL, -- e.g., 'KABID', 'KASUBBID'
  nama VARCHAR(255) NOT NULL,
  pangkat VARCHAR(100) NOT NULL,
  nrp_nip VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE master_dipa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jenis_giat VARCHAR(255) NOT NULL,
  pagu_anggaran NUMERIC NOT NULL DEFAULT 0,
  tarif_uh_dk NUMERIC NOT NULL DEFAULT 0,
  tarif_uh_lk NUMERIC NOT NULL DEFAULT 0,
  tarif_akomodasi_pa NUMERIC NOT NULL DEFAULT 0,
  tarif_akomodasi_ba NUMERIC NOT NULL DEFAULT 0,
  kuota_orang INTEGER NOT NULL DEFAULT 0,
  kuota_hari INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dipa_rencana_bulanan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_dipa UUID REFERENCES master_dipa(id) ON DELETE CASCADE,
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  anggaran_bulan NUMERIC NOT NULL DEFAULT 0,
  tarif_uh_dk NUMERIC NOT NULL DEFAULT 0,
  tarif_uh_lk NUMERIC NOT NULL DEFAULT 0,
  tarif_akomodasi_pa NUMERIC NOT NULL DEFAULT 0,
  tarif_akomodasi_ba NUMERIC NOT NULL DEFAULT 0,
  kuota_orang INTEGER NOT NULL DEFAULT 0,
  kuota_hari INTEGER NOT NULL DEFAULT 0,
  kuota_hari_lk INTEGER NOT NULL DEFAULT 0,
  kuota_kamar_pa INTEGER NOT NULL DEFAULT 0,
  kuota_kamar_ba INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kegiatan_induk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dumas_id UUID REFERENCES dumas(id) ON DELETE SET NULL, -- Link to Dumas if applicable
  jenis_giat VARCHAR(255) NOT NULL, 
  lokasi VARCHAR(50) NOT NULL, -- 'DK' or 'LK'
  tgl_mulai DATE NOT NULL,
  tgl_selesai DATE NOT NULL,
  tgl_sprin DATE,
  nomor_sprin VARCHAR(255),
  tempat_tujuan TEXT,
  tujuan TEXT NOT NULL,
  dasar_giat TEXT,
  status VARCHAR(100) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kegiatan_personel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_kegiatan UUID REFERENCES kegiatan_induk(id) ON DELETE CASCADE,
  id_personel UUID REFERENCES anggota(id) ON DELETE CASCADE, -- Merged with eLidik's anggota table
  is_ketua_tim BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply triggers to Perwabkeu tables
CREATE TRIGGER update_master_pejabat_updated_at BEFORE UPDATE ON master_pejabat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_dipa_updated_at BEFORE UPDATE ON master_dipa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dipa_rencana_bulanan_updated_at BEFORE UPDATE ON dipa_rencana_bulanan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kegiatan_induk_updated_at BEFORE UPDATE ON kegiatan_induk FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR PERWABKEU INTEGRATION
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
  p_personel_list JSONB
) RETURNS UUID AS $$
DECLARE
  v_kegiatan_id UUID;
  v_person_record JSONB;
BEGIN
  IF p_id IS NULL THEN
    -- Insert new kegiatan
    INSERT INTO kegiatan_induk (
      jenis_giat, lokasi, tgl_mulai, tgl_selesai, tgl_sprin, nomor_sprin, tempat_tujuan, tujuan, dasar_giat, status
    ) VALUES (
      p_jenis_giat, p_lokasi, p_tgl_mulai, p_tgl_selesai, p_tgl_sprin, p_nomor_sprin, p_tempat_tujuan, p_tujuan, p_dasar_giat, p_status
    ) RETURNING id INTO v_kegiatan_id;
  ELSE
    -- Update existing kegiatan
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

-- Final original SLA logic
-- Function to calculate SLA days
CREATE OR REPLACE FUNCTION calculate_sla_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sla_days = EXTRACT(DAY FROM (NOW() - NEW.tgl_dumas));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dumas_sla BEFORE INSERT OR UPDATE ON dumas FOR EACH ROW EXECUTE FUNCTION calculate_sla_days();
