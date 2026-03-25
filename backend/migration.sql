-- Simondu Web - Database Migration
-- Run this in Supabase Dashboard > SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'unit', 'pimpinan')),
    unit_name VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dumas table
CREATE TABLE IF NOT EXISTS dumas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_dumas VARCHAR(100),
    tgl_dumas DATE,
    pelapor TEXT,
    terlapor TEXT,
    satker VARCHAR(255),
    wujud_perbuatan TEXT,
    jenis_dumas VARCHAR(255),
    keterangan TEXT,
    disposisi_kabid TEXT,
    disposisi_kasubbid TEXT,
    unit_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'dalam_proses' CHECK (status IN ('dalam_proses', 'terbukti', 'tidak_terbukti')),
    parent_dumas_id UUID REFERENCES dumas(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tindak Lanjut table
CREATE TABLE IF NOT EXISTS tindak_lanjut (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumas_id UUID REFERENCES dumas(id) NOT NULL,
    status_verifikasi VARCHAR(50) DEFAULT 'draft' CHECK (status_verifikasi IN ('draft', 'menunggu_verifikasi', 'revisi', 'disetujui')),
    catatan_revisi TEXT,
    tgl_uuk DATE,
    tgl_sprin_lidik DATE,
    no_sprin VARCHAR(255),
    tgl_gelar DATE,
    tgl_lhp DATE,
    no_lhp VARCHAR(255),
    hasil_lidik TEXT,
    tgl_nodin DATE,
    no_nodin VARCHAR(255),
    no_berkas VARCHAR(255),
    tgl_sp2hp2 DATE,
    no_sp2hp2 VARCHAR(255),
    tgl_ke_ankum DATE,
    tgl_ke_mabes DATE,
    no_mabes VARCHAR(255),
    tgl_st_arahan DATE,
    file_dokumen_url JSONB DEFAULT '[]'::jsonb,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tim Lidik table
CREATE TABLE IF NOT EXISTS tim_lidik (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumas_id UUID REFERENCES dumas(id) NOT NULL,
    anggota_id UUID REFERENCES users(id),
    no_hp_penyelidik VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Penyelesaian table
CREATE TABLE IF NOT EXISTS penyelesaian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumas_id UUID REFERENCES dumas(id) NOT NULL,
    jenis VARCHAR(50) CHECK (jenis IN ('pelimpahan', 'henti_lidik')),
    tanggal DATE,
    nomor VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES users(id),
    target_role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dumas_deleted_at ON dumas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_dumas_status ON dumas(status);
CREATE INDEX IF NOT EXISTS idx_dumas_unit_id ON dumas(unit_id);
CREATE INDEX IF NOT EXISTS idx_tindak_lanjut_dumas_id ON tindak_lanjut(dumas_id);
CREATE INDEX IF NOT EXISTS idx_tindak_lanjut_status ON tindak_lanjut(status_verifikasi);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role, is_read);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security (but allow all for now - we use API-level auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tindak_lanjut ENABLE ROW LEVEL SECURITY;
ALTER TABLE tim_lidik ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyelesaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anon key access (our auth is at API level)
CREATE POLICY "Allow all access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON dumas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON tindak_lanjut FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON tim_lidik FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON penyelesaian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
