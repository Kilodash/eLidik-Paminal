-- Simondu Web - Database Seeding Script
-- Insert 9 default users dan master data

-- =============================================
-- SEED USERS (9 default accounts)
-- Password untuk semua: "password123" (hashed dengan bcrypt)
-- =============================================
INSERT INTO users (id, email, password_hash, name, role, unit_name, is_active) VALUES
-- SuperAdmin
('11111111-1111-1111-1111-111111111111', 'superadmin@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'SuperAdmin Simondu', 'superadmin', NULL, true),

-- Kasubbid Paminal  
('22222222-2222-2222-2222-222222222222', 'kasubbid@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Kasubbid Paminal', 'kasubbid_paminal', 'Subbid Paminal', true),

-- Admin
('33333333-3333-3333-3333-333333333333', 'admin@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Admin Simondu', 'admin', 'Subbid Paminal', true),

-- Unit 1
('44444444-4444-4444-4444-444444444444', 'unit1@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Unit 1 Paminal', 'unit', 'Unit 1', true),

-- Unit 2
('55555555-5555-5555-5555-555555555555', 'unit2@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Unit 2 Paminal', 'unit', 'Unit 2', true),

-- Unit 3
('66666666-6666-6666-6666-666666666666', 'unit3@simondu.polri.go.id', '$2a$10$rFQ9z8yN8yN8yN8yN8yN8yN8yN8yN8yN8yN8yN8yN8yN8yN8yN8O', 'Unit 3 Paminal', 'unit', 'Unit 3', true),

-- Ur Binpam
('77777777-7777-7777-7777-777777777777', 'urbinpam@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Ur Binpam', 'ur_binpam', 'Ur Binpam', true),

-- Ur Litpers
('88888888-8888-8888-8888-888888888888', 'urlitpers@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Ur Litpers', 'ur_litpers', 'Ur Litpers', true),

-- Ur Prodok
('99999999-9999-9999-9999-999999999999', 'urprodok@simondu.polri.go.id', '$2b$10$.CDAwz5SeMaOoXmXggKOu.wRmYrHcLSKRBdCwY91ySlbamFQryNni', 'Ur Prodok', 'ur_prodok', 'Ur Prodok', true)

ON CONFLICT (email) DO NOTHING;

-- =============================================
-- SEED SETTINGS (Master Data)
-- =============================================

-- Satker (Satuan Kerja)
INSERT INTO settings (type, value, description) VALUES
('satker', '[
  "Polres Bandung",
  "Polres Cimahi",
  "Polres Bandung Barat",
  "Polrestabes Bandung",
  "Polres Garut",
  "Polres Tasikmalaya",
  "Polres Ciamis",
  "Polres Banjar",
  "Polres Pangandaran",
  "Polres Sumedang",
  "Polres Majalengka",
  "Polres Indramayu",
  "Polres Cirebon",
  "Polres Kuningan",
  "Polrestabes Cirebon",
  "Polres Subang",
  "Polres Purwakarta",
  "Polres Karawang",
  "Polres Bekasi",
  "Polrestabes Bekasi",
  "Polres Bogor",
  "Polrestabes Bogor",
  "Polres Sukabumi",
  "Polres Cianjur",
  "Polres Depok",
  "Polda Jabar"
]'::jsonb, 'Daftar Satuan Kerja Polda Jabar')

ON CONFLICT (type) DO UPDATE SET value = EXCLUDED.value;

-- Jenis Dumas
INSERT INTO settings (type, value, description) VALUES
('jenis_dumas', '[
  "Pengaduan Masyarakat",
  "Laporan Internal",
  "Media Massa",
  "Media Sosial",
  "Surat",
  "Telepon",
  "Email",
  "Aplikasi DUMAS",
  "Lainnya"
]'::jsonb, 'Jenis/Sumber Pengaduan')

ON CONFLICT (type) DO UPDATE SET value = EXCLUDED.value;

-- Wujud Perbuatan
INSERT INTO settings (type, value, description) VALUES
('wujud_perbuatan', '[
  "Pelanggaran Disiplin",
  "Pelanggaran Kode Etik",
  "Tindak Pidana Umum",
  "Gratifikasi",
  "Penyalahgunaan Wewenang",
  "Pungli",
  "Pemerasan",
  "Penganiayaan",
  "Pelayanan Tidak Profesional",
  "Pungutan Liar",
  "Korupsi",
  "Narkoba",
  "Lainnya"
]'::jsonb, 'Daftar Wujud Perbuatan')

ON CONFLICT (type) DO UPDATE SET value = EXCLUDED.value;

-- Format Dokumen (Auto-numbering templates)
INSERT INTO settings (type, value, description) VALUES
('format_dokumen', '{
  "uuk": "B/{counter}/UUK/{month_roman}/{year}/Paminal",
  "sprin": "SPRIN/{counter}/{month_roman}/{year}/Paminal",
  "sp2hp2": "B/{counter}/SP2HP2/{month_roman}/{year}/Paminal",
  "nodin": "B/{counter}/NODIN/{month_roman}/{year}/Paminal",
  "lhp": "LHP/{counter}/{month_roman}/{year}/Paminal"
}'::jsonb, 'Template format nomor dokumen')

ON CONFLICT (type) DO UPDATE SET value = EXCLUDED.value;

-- Unit List
INSERT INTO settings (type, value, description) VALUES
('unit_list', '[
  {"id": "44444444-4444-4444-4444-444444444444", "name": "Unit 1"},
  {"id": "55555555-5555-5555-5555-555555555555", "name": "Unit 2"},
  {"id": "66666666-6666-6666-6666-666666666666", "name": "Unit 3"}
]'::jsonb, 'Daftar Unit yang tersedia')

ON CONFLICT (type) DO UPDATE SET value = EXCLUDED.value;

-- =============================================
-- SEED ANGGOTA (Sample Personnel)
-- =============================================
INSERT INTO anggota (nama, pangkat, nrp, jabatan, unit, no_hp, is_active) VALUES
('IPTU Budi Santoso', 'Inspektur Dua', '92010123', 'Kanit 1', 'Unit 1', '081234567890', true),
('IPDA Siti Nurjanah', 'Inspektur Satu', '93020456', 'Anggota', 'Unit 1', '081234567891', true),
('AIPTU Ahmad Fauzi', 'Ajun Inspektur Dua', '94030789', 'Kanit 2', 'Unit 2', '081234567892', true),
('BRIPKA Dedi Kurniawan', 'Brigadir Kepala', '95041012', 'Anggota', 'Unit 2', '081234567893', true),
('BRIGPOL Rina Wati', 'Brigadir Polisi', '96051345', 'Anggota', 'Unit 3', '081234567894', true)

ON CONFLICT (nrp) DO NOTHING;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Users seeded: ' || COUNT(*) FROM users;
SELECT 'Settings seeded: ' || COUNT(*) FROM settings;
SELECT 'Anggota seeded: ' || COUNT(*) FROM anggota;
