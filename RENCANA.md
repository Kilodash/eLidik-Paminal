# RENCANA APLIKASI e-LIDIK PAMINAL

## Aplikasi Administrasi Pengaduan Masyarakat & Monitoring Tindak Lanjut

---

## 1. GAMBARAN UMUM

| Dimensi | Keputusan |
|---|---|
| **Nama** | e-Lidik Paminal (Elektronik Penyelidikan Pengamanan Internal) |
| **Fungsi** | Manajemen pengaduan masyarakat, administrasi penyelidikan, monitoring tindak lanjut |
| **Instansi** | Polri — Bidpropam / Subbid Paminal |
| **Target User** | Internal Polri (Admin Subbid, Operator Unit, Pimpinan) |
| **Multi-Tenant** | 1 tenant = 1 Polda (masing-masing terisolasi datanya) |
| **Platform** | Web Application |

---

## 2. TECH STACK

| Layer | Pilihan |
|---|---|
| **Frontend** | Next.js 15 (App Router) |
| **UI Kit** | shadcn/ui + TailwindCSS |
| **Backend** | Next.js API Routes / Server Actions |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Realtime** | Supabase Realtime (notifikasi) |
| **PDF** | @react-pdf/renderer |
| **Deployment** | Vercel / Docker self-hosted |

---

## 3. SOP & REGULASI ACUAN

| No | Regulasi | Tentang | Digunakan Untuk |
|---|---|---|---|
| 1 | **Perkadiv Propam No 1/2015** | SOP Penyelidikan Paminal | Alur Lidik (Perencanaan → Pengumpulan → Pengolahan → Pelaporan), 9 Lampiran (A–I) |
| 2 | **Perkadiv Propam No 4/2021** | Perdamaian Garplin KEPP | Prosedur perdamaian (setiap tahap, syarat formal & material) |
| 3 | **Perkapolri No 1/2023** | Naskah Dinas & Tata Persuratan | Format, kopstuk, penomoran, susunan, jenis naskah dinas |

---

## 4. STRUKTUR ORGANISASI & MULTI-TENANT

```
┌──────────────────────────────────────────────────────┐
│                   TENANT = POLDA                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              BIDPROPAM (1)                      │  │
│  │              Oversight                         │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                               │
│  ┌────────────────────▼───────────────────────────┐  │
│  │           SUBBID PAMINAL (1)                    │  │
│  │           Admin Tenant                         │  │
│  │                                                │  │
│  │  • Kelola personel (user)                      │  │
│  │  • Kelola pejabat (penandatangan)              │  │
│  │  • Kelola variabel tenant (kop, identitas)     │  │
│  │  • Kelola template dokumen                     │  │
│  │  • Input pengaduan                             │  │
│  │  • Distribusi Dumas ke Unit                    │  │
│  └────────┬──────────┬──────────┬─────────────────┘  │
│           │          │          │                     │
│  ┌────────▼──┐ ┌─────▼────┐ ┌──▼──────────┐         │
│  │  UNIT A    │ │  UNIT B   │ │  UNIT C      │        │
│  │  Operator  │ │ Operator  │ │  Operator    │        │
│  │  (utama)   │ │ (utama)   │ │  (utama)     │        │
│  │            │ │           │ │              │        │
│  │  • Proses  │ │ • Proses  │ │ • Proses     │        │
│  │    Dumas   │ │   Dumas   │ │   Dumas      │        │
│  │  • Input   │ │ • Input   │ │ • Input      │        │
│  │    Lap Info│ │   Lap Info│ │   Lap Info   │        │
│  │  • Buat    │ │ • Buat    │ │ • Buat       │        │
│  │    berkas  │ │   berkas  │ │   berkas     │        │
│  │  • Generate│ │ • Generate│ │ • Generate   │        │
│  │    dokumen │ │   dokumen │ │   dokumen    │        │
│  └───────────┘ └───────────┘ └──────────────┘        │
└──────────────────────────────────────────────────────┘
```

### Role & Permissions

| Role | Organisasi | Tanggung Jawab |
|---|---|---|
| `oversight` | Bidpropam | Lihat semua Subbid & Unit, dashboard, laporan |
| `admin_subbid` | Subbid Paminal | Kelola tenant (personel, pejabat, variabel, template, unit), input pengaduan, distribusi, monitor |
| `operator_unit` | Unit | **Operator utama** — proses Dumas, input Laporan Informasi, gabung berkas, generate dokumen, update status |

---

## 5. ALUR SOP

### 5.1 Siklus Penuh Pengaduan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ALUR e-LIDIK PAMINAL                              │
│              (SOP 1/2015 + Perdamaian 4/2021 + Perkap 1/2023)           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. PENERIMAAN (Admin Subbid)                                            │
│     • Input pengaduan (formal)                                          │
│     • Generate nomor register: REG/{kode_polda}/{tahun}/{bulan}/{urut}  │
│     • Tanda Terima Pengaduan                                             │
│     └──→ DAMAI? → (Ya) → Perdamaian → Closed                           │
│                                                                          │
│  2. REGISTRASI                                                           │
│     • Klasifikasi (Disiplin / KEPP / Pidana)                            │
│     • Cek duplikasi                                                      │
│     └──→ DAMAI? → (Ya) → Perdamaian → Closed                           │
│                                                                          │
│  3. VERIFIKASI                                                           │
│     • Telaah kronologi & bukti                                          │
│     • Keputusan: Lanjut / Tidak Lanjut                                  │
│     └──→ Tidak Lanjut → Closed + Notifikasi                            │
│     └──→ DAMAI? → (Ya) → Perdamaian → Closed                           │
│                                                                          │
│  4. DISTRIBUSI KE UNIT (Admin → Unit)                                   │
│     • Tunjuk unit penanganan                                            │
│     • Operator unit dapat menambah Laporan Informasi                    │
│       (register khusus: LI/{kode_polda}/{tahun}/{bulan}/{urut})         │
│     • Operator dapat menggabung beberapa Dumas → 1 Berkas              │
│     └──→ DAMAI? → (Ya) → Perdamaian → Closed                           │
│                                                                          │
│  5. PENYELIDIKAN [CAKUPAN SOP 1/2015]                                   │
│     ┌─────────────────────────────────────────────┐                     │
│     │ a. PERENCANAAN (Pasal 10-15)                 │                     │
│     │    • UUK (Unsur Utama Keterangan) [Lamp B]   │                     │
│     │    • Surat Perintah Penyelidikan             │                     │
│     │    • Rencana Kebutuhan Anggaran (API DIPA)   │                     │
│     │                                              │                     │
│     │ b. PENGUMPULAN (Pasal 16-21)                 │                     │
│     │    • Taktik: penyamaran, penyesatan          │                     │
│     │    • Teknik: penelitian, wawancara,          │                     │
│     │      interogasi, pengamatan, perekaman       │                     │
│     │    • Klarifikasi (undang pelapor/terlapor)   │                     │
│     │                                              │                     │
│     │ c. PENGOLAHAN (Pasal 22-26)                  │                     │
│     │    • Pencatatan → Penilaian → Penafsiran     │                     │
│     │    • Penyimpulan (min 2 alat bukti)          │                     │
│     │                                              │                     │
│     │ d. PELAPORAN (Pasal 27)                      │                     │
│     │    • LHP (Laporan Hasil Penyelidikan)        │                     │
│     │    • Nota Dinas / Surat penyampaian LHP      │                     │
│     └─────────────────────────────────────────────┘                     │
│     └──→ DAMAI? → (Ya) → Perdamaian → Closed                           │
│                                                                          │
│  6. GELAR PENYELIDIKAN (Pasal 30-31)                                    │
│     • Paparan, diskusi, kesimpulan                                      │
│     • Notulen Gelar Penyelidikan                                        │
│     └──→ DAMAI? → (Ya) → Perdamaian → Closed                           │
│                                                                          │
│  7. PASCAGELAR                                                           │
│     ┌──→ TERBUKTI:                                                      │
│     │   • Pelimpahan (Nota Dinas/Surat)                                 │
│     └──→ TIDAK TERBUKTI:                                                │
│         • Sprin Henti Lidik                                             │
│         • Pemberitahuan ke Ankum                                        │
│                                                                          │
│  8. PENUTUPAN                                                            │
│     • Surat Pemberitahuan ke Pelapor                                    │
│     • Laporan ke Mabes Polri (per kasus)                                │
│     • Jukrah ke Jajaran (per kasus)                                     │
│     • Berkas Akhir (bundle semua dokumen)                               │
│     → CLOSED                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Perdamaian — Disederhanakan

- **Trigger**: Tombol "Ajukan Perdamaian" di setiap tahap
- **Form**: Tanggal, pihak hadir, kronologi damai, upload file (opsional)
- **Efek**: Status → `perdamaian` → `closed`
- **Tidak perlu validasi ketat**

---

## 6. REGISTER NUMBERING

| Jenis | Format | Contoh |
|---|---|---|
| **Pengaduan** (Admin input) | `REG/{kode_polda}/{tahun}/{bulan}/{urut}` | `REG/METRO/2025/06/001` |
| **Laporan Informasi** (Operator input) | `LI/{kode_polda}/{tahun}/{bulan}/{urut}` | `LI/METRO/2025/06/001` |
| **Berkas** (gabungan Dumas) | `BERKAS/{kode_polda}/{tahun}/{urut}` | `BERKAS/METRO/2025/001` |

---

## 7. DAFTAR DOKUMEN — 24 DOKUMEN

| # | Tahap | Dokumen | Lamp SOP 1/2015 | Jenis Naskah (Perkap 1/2023) | Acuan Pasal |
|---|---|---|---|---|---|
| 1 | Penerimaan | **Tanda Terima Pengaduan** | - | Surat Keterangan | Ps. 33 |
| 2 | Penerimaan | **Laporan Informasi / Info Khusus** | A | Laporan | Ps. 30 |
| 3 | Perencanaan | **UUK** (Unsur Utama Keterangan) | B | Telaahan Staf | Ps. 30 |
| 4 | Perencanaan | **Surat Perintah Penyelidikan** | - | Surat Perintah | Ps. 13 |
| 5 | Perencanaan | **Rencana Kebutuhan Anggaran** | - | Telaahan Staf (API DIPA) | - |
| 6 | Pengumpulan | **Surat Undangan Klarifikasi** | D | Undangan Cetak | Ps. 30 |
| 7 | Pengumpulan | **Tanda Bukti Serah Terima** | E | Surat Keterangan | Ps. 33 |
| 8 | Pengumpulan | **Berita Acara Interogasi (BAI)** | C | Berita Acara | Ps. 32 |
| 9 | Pengumpulan | **Berita Acara Pemeriksaan (BAP)** | - | Berita Acara | Ps. 32 |
| 10 | Pengolahan | **Lembar Kerja Penyelidik** | - | Laporan | Ps. 30 |
| 11 | Pelaporan | **Laporan Hasil Penyelidikan (LHP)** | F | Laporan | Ps. 30 |
| 12 | Pelaporan | **Nota Dinas Penyampaian LHP** | G | Nota Dinas | Ps. 18 |
| 13 | Pelaporan | **Surat Penyampaian LHP** | H | Surat Dinas | Ps. 21 |
| 14 | Gelar | **Notulen Gelar Penyelidikan** | I | Notula | Ps. 30 |
| 15 | Pasca Gelar | **Pelimpahan** (Nota Dinas/Surat) | - | Nota Dinas / Surat Dinas | Ps. 18/21 |
| 16 | Pasca Gelar | **Sprin Henti Lidik** | - | Surat Perintah | Ps. 13 |
| 17 | Pasca Gelar | **Pemberitahuan ke Ankum** | - | Nota Dinas | Ps. 18 |
| 18 | Perdamaian | **Surat Permohonan Damai** | - | Surat Pernyataan | Ps. 30 |
| 19 | Perdamaian | **Surat Pernyataan Damai** | - | Surat Pernyataan | Ps. 30 |
| 20 | Perdamaian | **Berita Acara Perdamaian** | - | Berita Acara | Ps. 32 |
| 21 | Penutupan | **Surat Pemberitahuan ke Pelapor** | - | Surat Dinas | Ps. 21 |
| 22 | Penutupan | **Laporan ke Mabes Polri** | - | Laporan | Ps. 30 |
| 23 | Penutupan | **Jukrah ke Jajaran** | - | Nota Dinas / Surat Edaran | Ps. 18/10 |
| 24 | Penutupan | **Berkas Akhir** (bundle) | - | Kompilasi | - |

> **Extensible**: Admin dapat menambah jenis dokumen baru via tabel `document_types`

---

## 8. FORMAT NASKAH DINAS (Perkap 1/2023)

### 8.1 Struktur Umum

| Bagian | Elemen | Keterangan |
|---|---|---|
| **Kepala** | Kopstuk | Jabatan (Tribrata kuning/hitam) atau Instansi (nama satuan) |
| | Nomor | Sesuai format penomoran Perkap Ps. 45 |
| | Klasifikasi | Kode Klasifikasi Arsip (KKA) |
| | Lampiran | Jumlah lampiran |
| | Perihal | Hal / pokok surat |
| **Batang Tubuh** | Isi | Konten utama sesuai jenis naskah |
| **Kaki** | Tajuk Tanda Tangan | Jabatan, nama, pangkat, NIP |
| | Tembusan | Penerima tembusan |

### 8.2 Jenis Kopstuk

| Penandatangan | Kopstuk | Untuk |
|---|---|---|
| Kapolri / Kapolda / Pati | Tribrata **kuning emas** + bintang + nama jabatan | Sprin Lidik, Sprin Henti |
| Pamen (non-Pati) | Tribrata **hitam** + nama jabatan | BAP, BAI, Nota Dinas |
| Instansi / Satker | Nama satuan (max 3 baris) | Surat Dinas, Undangan, LHP |

### 8.3 Penomoran

| Jenis Naskah | Format | Contoh |
|---|---|---|
| Surat Perintah | `Sprin/{nomor}/{bulan_romawi}/{tahun}` | `Sprin/12/VI/2025` |
| Nota Dinas | `ND/{nomor}/{bulan_romawi}/{tahun}` | `ND/45/VI/2025` |
| Surat Dinas | `B/{nomor}/{kode_satker}/{bulan_romawi}/{tahun}` | `B/89/PAMINAL/VI/2025` |
| Laporan | `Lap/{nomor}/{bulan_romawi}/{tahun}` | `Lap/3/VI/2025` |
| Berita Acara | `BA/{nomor}/{bulan_romawi}/{tahun}` | `BA/7/VI/2025` |
| Surat Keterangan | `SKET/{nomor}/{bulan_romawi}/{tahun}` | `SKET/2/VI/2025` |
| Surat Undangan | `UND/{nomor}/{bulan_romawi}/{tahun}` | `UND/15/VI/2025` |
| Undangan Cetak | `UND/{nomor}/{bulan_romawi}/{tahun}` | `UND/15/VI/2025` |
| Notula | `NOT/{nomor}/{bulan_romawi}/{tahun}` | `NOT/2/VI/2025` |
| Telaahan Staf | `TS/{nomor}/{bulan_romawi}/{tahun}` | `TS/5/VI/2025` |
| Surat Pernyataan | `SP/{nomor}/{bulan_romawi}/{tahun}` | `SP/8/VI/2025` |

---

## 9. STRUKTUR DATABASE (FINAL — Hasil Diskusi)

### 9.1 Entitas Tenant, Organisasi & User

```sql
-- Tenant = 1 Polda
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR UNIQUE NOT NULL,          -- METRO, JABAR, JATENG
  nama VARCHAR NOT NULL,                 -- Polda Metro Jaya
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Organisasi: recursive, 3 tipe, admin bebas tambah unit
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID REFERENCES organizations(id),
  tipe VARCHAR CHECK (tipe IN ('bidpropam','subbid','unit')),
  kode VARCHAR,
  nama VARCHAR NOT NULL,
  UNIQUE(tenant_id, kode)
);

-- User login + data personel
CREATE TABLE personel (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR CHECK (role IN ('oversight','admin_subbid','operator_unit')),
  nip VARCHAR,
  nama_lengkap VARCHAR,
  pangkat VARCHAR,
  jabatan VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pejabat (penandatangan) cukup di tenant_variables
-- Contoh: nama_kabid, pangkat_kabid, nip_kabid, ttd_kabid
CREATE TABLE tenant_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key VARCHAR NOT NULL,
  value TEXT,
  UNIQUE(tenant_id, key)
);
```

### 9.2 Entitas Klasifikasi, Terlapor, Pengaduan

```sql
-- Klasifikasi pengaduan — editable admin per tenant
CREATE TABLE klasifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kode VARCHAR,
  nama VARCHAR NOT NULL,
  UNIQUE(tenant_id, kode)
);

-- Terlapor (identitas terduga pelanggar)
-- Satu Dumas bisa punya banyak terlapor (many-to-many)
CREATE TABLE terlapor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nama VARCHAR,                         -- wajib (bisa diisi "tidak diketahui")
  nrp VARCHAR,                          -- opsional
  nip VARCHAR,                          -- opsional → trigger auto-lookup personel
  pangkat VARCHAR,                      -- auto dari lookup, atau manual
  jabatan VARCHAR,
  kesatuan VARCHAR,
  personel_id UUID REFERENCES personel(id),  -- set jika NIP cocok
  status_identitas VARCHAR DEFAULT 'diketahui',  -- diketahui / tidak_diketahui / terkonfirmasi
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pengaduan_terlapor (
  pengaduan_id UUID REFERENCES pengaduan(id) ON DELETE CASCADE,
  terlapor_id UUID REFERENCES terlapor(id),
  PRIMARY KEY (pengaduan_id, terlapor_id)
);

-- Pengaduan (input oleh Admin Subbid)
CREATE TABLE pengaduan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_id UUID REFERENCES organizations(id),
  berkas_id UUID REFERENCES berkas(id),       -- NULL = belum digabung ke berkas
  nomor_register VARCHAR,
  jenis VARCHAR CHECK (jenis IN ('pengaduan','laporan_informasi')),
  tgl_pengaduan DATE,
  pelapor_nama VARCHAR,                       -- wajib (bisa "Anonim")
  pelapor_kontak VARCHAR,                     -- wajib (validasi: angka utk telp)
  satker_dilaporkan VARCHAR,                  -- satker yg dilaporkan, untuk Anev
  klasifikasi_id UUID REFERENCES klasifikasi(id),
  kronologi VARCHAR(5000),                    -- dibatasi 5000 karakter
  atensi BOOLEAN DEFAULT false,              -- percepat target waktu (SLA x0.5)
  status VARCHAR DEFAULT 'diterima',
  created_by UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 9.3 Entitas Berkas, Perdamaian, Tindak Lanjut

```sql
-- Berkas = wadah penggabungan Dumas + alur tindak lanjut
CREATE TABLE berkas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_id UUID REFERENCES organizations(id),   -- satu unit per berkas
  nomor_berkas VARCHAR,
  judul VARCHAR,
  tahun INTEGER NOT NULL,                       -- kelompok per tahun
  status VARCHAR DEFAULT 'open',
  tahap VARCHAR,
  tgl_target DATE,                              -- SLA pasif (notifikasi dashboard)
  operator_id UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Perdamaian — form sederhana
CREATE TABLE perdamaian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id UUID REFERENCES pengaduan(id),
  berkas_id UUID REFERENCES berkas(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tahap_saat_damai VARCHAR,
  tgl_perdamaian DATE,
  kronologi TEXT,
  pihak_hadir TEXT,
  created_by UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tindak Lanjut — 1 record per berkas
CREATE TABLE tindak_lanjut (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  berkas_id UUID REFERENCES berkas(id),
  deskripsi TEXT,
  status_tl VARCHAR DEFAULT 'open',
  tgl_target DATE,
  tgl_selesai DATE,
  catatan TEXT,
  created_by UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 9.4 Entitas Template & Dokumen

```sql
-- Jenis dokumen — extensible, admin bisa tambah
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kode VARCHAR,                            -- SP-01, BAP-01, LHP-01
  nama VARCHAR,
  tahap VARCHAR,
  jenis_naskah VARCHAR,                   -- surat_perintah, nota_dinas, berita_acara, laporan, dll
  kopstuk_tipe VARCHAR,                   -- jabatan / instansi
  tribrata VARCHAR,                       -- kuning_emas / hitam / none
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Template dokumen (HTML + placeholder {{...}})
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_type_id UUID REFERENCES document_types(id),
  content TEXT NOT NULL,                   -- HTML body
  header_html TEXT,                        -- kop + header
  footer_html TEXT,                        -- ttd + tembusan
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pengaturan editor per user
CREATE TABLE template_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES personel(id),
  template_id UUID NOT NULL REFERENCES templates(id),
  editor_prefs JSONB,                     -- layout, font size, panel width, etc
  UNIQUE(user_id, template_id)
);

-- Register nomor surat (auto-generate + override manual)
CREATE TABLE document_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_type_kode VARCHAR NOT NULL,     -- SPRIN, ND, LHP, BA, UND, dll
  tahun INTEGER NOT NULL,
  bulan INTEGER,                           -- NULL untuk register tahunan (BERKAS)
  nomor_terakhir INTEGER DEFAULT 0,
  UNIQUE(tenant_id, document_type_kode, tahun, bulan)
);

-- Dokumen yang sudah di-generate
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_id UUID REFERENCES templates(id),
  pengaduan_id UUID REFERENCES pengaduan(id),
  berkas_id UUID REFERENCES berkas(id),
  tahap VARCHAR,
  nomor_surat VARCHAR,
  tgl_dokumen DATE,
  content_rendered TEXT,                   -- HTML hasil render
  file_pdf TEXT,                            -- URL file PDF (opsional, simpan jika perlu)
  status VARCHAR DEFAULT 'draft',           -- draft / final / printed
  created_by UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 9.5 Entitas Status History & Notifikasi

```sql
-- Tracking perubahan status (bebas, tidak divalidasi)
CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ref_type VARCHAR,                        -- pengaduan / berkas
  ref_id UUID,
  status_lama VARCHAR,
  status_baru VARCHAR,
  catatan TEXT,
  user_id UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifikasi in-app (bell icon)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES personel(id),
  judul VARCHAR,
  isi TEXT,
  link VARCHAR,                            -- /pengaduan/[id] atau /berkas/[id]
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);
```

### 9.6 Entity Relationship Diagram

```
┌───────────┐       ┌───────────────┐       ┌──────────────┐
│  tenants  │       │ organizations │       │   personel   │
└─────┬─────┘       └───────┬───────┘       └──────┬───────┘
      │                     │                      │
      │    ┌────────────────┤                      │
      │    │                │                      │
      ▼    ▼                ▼                      ▼
┌──────────┐  ┌──────────┐  ┌──────────────────────┐
│ pengaduan│  │  berkas  │  │  tenant_variables    │
│          │  │          │  │  (pejabat, kop, dll)   │
│ n:1 ────►│  │ 1:n ────►│  └──────────────────────┘
│ berkas   │  │ documents│            │
│          │  │          │            │ (placeholder)
│ n:n ────►│  │ n:1 ────►│            ▼
│ terlapor │  │ tndk_lanj│  ┌──────────────────────┐
└──────────┘  └──────────┘  │  templates + vars     │
                              │  → documents (PDF)   │
┌──────────┐                 └──────────────────────┘
│klasifikasi│
│(lookup)   │
└──────────┘
```

---

## 10. TEMPLATE & VARIABEL SYSTEM

### 10.1 Cara Kerja

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ TEMPLATE (HTML)   │     │ VARIABEL (Database)  │     │ DOKUMEN PDF      │
│                   │     │                      │     │                  │
│ {{kop}}           │     │ tenant_variables     │     │ "POLDA METRO     │
│ {{nomor}}         │  +  │ personel             │  =  │  JAYA"           │
│ {{pejabat}}       │     │ pejabat              │     │ Nomor: Sprin/... │
│ {{pelapor}}       │     │ pengaduan            │     │ ...              │
│ {{isi}}           │     │ organizations        │     │                  │
└──────────────────┘     └─────────────────────┘     └──────────────────┘
```

### 10.2 Sumber Variabel

| Sumber | Contoh Placeholder |
|---|---|
| `tenant_variables` | `{{kop_surat}}`, `{{nama_polda}}`, `{{alamat}}`, `{{kode_polda}}` |
| `organizations` | `{{unit_penanganan}}`, `{{kode_unit}}`, `{{nama_subbid}}` |
| `pejabat` | `{{nama_kabid}}`, `{{pangkat_kabid}}`, `{{nip_kabid}}`, `{{jabatan_penandatangan}}` |
| `personel` | `{{nama_operator}}`, `{{pangkat_operator}}`, `{{nip_operator}}` |
| `pengaduan` | `{{nomor_register}}`, `{{pelapor}}`, `{{terlapor}}`, `{{kronologi}}` |
| `system` | `{{tgl_sekarang}}`, `{{nomor_otomatis}}`, `{{bulan_romawi}}` |

---

## 11. SUPABASE RLS POLICIES

```sql
-- Setiap tabel punya tenant_id + RLS enabled

-- Contoh: pengaduan
ALTER TABLE pengaduan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON pengaduan
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM personel WHERE id = auth.uid()));

-- Operator unit hanya lihat Dumas di unitnya
CREATE POLICY "operator_unit_scope" ON pengaduan
  FOR SELECT
  USING (
    (SELECT role FROM personel WHERE id = auth.uid()) = 'oversight'
    OR unit_id = (SELECT organization_id FROM personel WHERE id = auth.uid())
  );

-- Admin subbid: full access di tenantnya
CREATE POLICY "admin_subbid_manage" ON pengaduan
  FOR ALL
  USING (
    (SELECT role FROM personel WHERE id = auth.uid()) IN ('admin_subbid', 'oversight')
  );
```

---

## 12. STRUKTUR FOLDER PROYEK

```
e-lidik-paminal/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + header
│   │   ├── page.tsx            # Dashboard
│   │   ├── pengaduan/
│   │   ├── berkas/
│   │   ├── dokumen/
│   │   ├── master/
│   │   │   ├── organisasi/
│   │   │   ├── personel/
│   │   │   ├── pejabat/
│   │   │   ├── variabel/
│   │   │   └── template/
│   │   └── laporan/
│   └── api/
│       ├── pengaduan/
│       ├── berkas/
│       ├── dokumen/
│       └── template/
├── components/
│   ├── ui/                      # shadcn/ui
│   ├── forms/
│   ├── documents/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth.ts
│   ├── pdf-generator.ts
│   └── utils.ts
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 13. AUDIT LOG

### 13.1 Prinsip

Setiap aksi tercatat **otomatis** — bukan manual. Dua lapis: database trigger (INSERT/UPDATE/DELETE) + application wrapper (LOGIN/LOGOUT/EXPORT/GENERATE).

### 13.2 Struktur Tabel

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR NOT NULL,        -- INSERT / UPDATE / DELETE / LOGIN / LOGOUT / EXPORT / GENERATE / VIEW
  entity_type VARCHAR NOT NULL,   -- pengaduan / berkas / dokumen / personel / pejabat / template / tenant_variables
  entity_id UUID,
  summary VARCHAR,                 -- ringkasan aksi: "Status berubah: diterima → registrasi"
  old_values JSONB,               -- snapshot sebelum (null jika INSERT)
  new_values JSONB,               -- snapshot setelah (null jika DELETE)
  ip_address VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
```

### 13.3 Trigger Otomatis (Supabase)

```sql
CREATE OR REPLACE FUNCTION log_pengaduan_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, summary, new_values)
    VALUES (v_tenant_id, v_user_id, 'INSERT', 'pengaduan', NEW.id,
            'Pengaduan baru: ' || NEW.nomor_register, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Hanya log jika ada perubahan status (hindari noise)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, summary, old_values, new_values)
      VALUES (v_tenant_id, v_user_id, 'UPDATE', 'pengaduan', NEW.id,
              'Status: ' || OLD.status || ' → ' || NEW.status,
              jsonb_build_object('status', OLD.status),
              jsonb_build_object('status', NEW.status));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, summary, old_values)
    VALUES (v_tenant_id, v_user_id, 'DELETE', 'pengaduan', OLD.id,
            'Hapus pengaduan ' || OLD.nomor_register, to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Terapkan trigger ke semua tabel kunci
CREATE TRIGGER audit_pengaduan AFTER INSERT OR UPDATE OR DELETE ON pengaduan
  FOR EACH ROW EXECUTE FUNCTION log_pengaduan_changes();
CREATE TRIGGER audit_berkas AFTER INSERT OR UPDATE OR DELETE ON berkas
  FOR EACH ROW EXECUTE FUNCTION log_berkas_changes();
CREATE TRIGGER audit_personel AFTER INSERT OR UPDATE OR DELETE ON personel
  FOR EACH ROW EXECUTE FUNCTION log_personel_changes();
CREATE TRIGGER audit_pejabat AFTER INSERT OR UPDATE OR DELETE ON pejabat
  FOR EACH ROW EXECUTE FUNCTION log_pejabat_changes();
CREATE TRIGGER audit_templates AFTER INSERT OR UPDATE OR DELETE ON templates
  FOR EACH ROW EXECUTE FUNCTION log_templates_changes();
```

### 13.4 Application-Level Logging

```typescript
// lib/audit.ts
export async function logAction(
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  metadata?: Record<string, any>
) {
  await supabase.from('audit_logs').insert({
    tenant_id: getCurrentTenant(),
    user_id: getCurrentUser().id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    new_values: metadata || null,
    ip_address: headers().get('x-forwarded-for') || 'unknown',
  });
}

// Penggunaan: login/logout/export/generate
await logAction('LOGIN', 'auth', user.id, 'User login');
await logAction('GENERATE', 'dokumen', doc.id, 'Generate BAP untuk berkas #' + berkasId);
```

---

## 14. MONITORING & ERROR TRACKING

### 14.1 Keputusan

| Opsi | Keputusan |
|---|---|
| Sentry Cloud | ❌ Tidak — data keluar network |
| Sentry Self-Hosted | ✅ Opsional nanti — open source, deploy di server internal |
| Custom Error Logs | ✅ **Mulai dari sini** — cukup untuk skala kecil |

### 14.2 Struktur Tabel

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  level VARCHAR DEFAULT 'error',     -- error / warning / info
  message TEXT,
  stack_trace TEXT,
  context JSONB,                      -- request URL, params, headers (tanpa secrets)
  source VARCHAR,                     -- client / server
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_error_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_level ON error_logs(level, created_at DESC);
```

### 14.3 Server-Side Error Handler

```typescript
// lib/error-handler.ts
export function captureError(
  error: Error,
  context?: { url?: string; method?: string; userId?: string }
) {
  if (process.env.NODE_ENV === 'production') {
    supabase.from('error_logs').insert({
      tenant_id: getCurrentTenant(),
      user_id: context?.userId,
      level: 'error',
      message: error.message,
      stack_trace: error.stack,
      context: {
        url: context?.url,
        method: context?.method,
        timestamp: new Date().toISOString(),
      },
      source: 'server',
    });
  } else {
    console.error('[DEV]', error);
  }
}
```

### 14.4 Client-Side Error Boundary

```tsx
// app/error.tsx
'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({ message: error.message, stack: error.stack, source: 'client' }),
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-destructive">Terjadi kesalahan</p>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  );
}
```

### 14.5 Dashboard Monitoring (Admin)

Halaman `/admin/monitoring` menampilkan:
- Error rate (24 jam / 7 hari)
- Error terbaru (tabel + filter level)
- API response time (average, p95)
- Audit log terkini

---

## 15. REUSABLE COMPONENTS

### 15.1 Library Dasar

**shadcn/ui** menyediakan: Button, Input, Select, Dialog, DropdownMenu, Popover, Tooltip, Badge, Card, Tabs, Table, Form, Textarea, Calendar, Command, Sheet, Toast, Avatar, Skeleton, Separator, ScrollArea

### 15.2 Komponen Kustom

```
components/
└── ui/
    ├── data-table.tsx              # TanStack Table + search + pagination + sort + row select
    ├── data-table-toolbar.tsx      # Search bar + filter chips + export button
    ├── status-badge.tsx            # Badge warna sesuai status
    ├── status-timeline.tsx         # Visual timeline tahapan kasus (stepper)
    ├── page-header.tsx             # Judul halaman + breadcrumb + action button(s)
    ├── confirm-dialog.tsx          # Konfirmasi sebelum aksi destruktif
    ├── file-upload.tsx             # Upload ke Supabase Storage + drag-drop + preview
    ├── file-preview.tsx            # Preview PDF / gambar dalam dialog
    ├── document-preview.tsx        # Preview dokumen hasil render template → PDF
    ├── entity-audit-log.tsx        # Tampilkan audit log per entity (timeline)
    ├── empty-state.tsx             # Placeholder saat data kosong
    ├── loading-skeleton.tsx        # Skeleton loading (table, card, form)
    ├── register-number-input.tsx   # Input dengan format REG/.../.../...
    ├── personel-select.tsx         # Combobox pilih personel (searchable)
    ├── unit-select.tsx             # Combobox pilih unit
    └── template-variable-picker.tsx # Picker placeholder {{...}} untuk editor template
```

### 15.3 DataTable — Komponen Utama

```tsx
// Penggunaan:
<DataTable
  columns={columns}
  data={pengaduan}
  searchKey="nomor_register"
  filters={[
    { column: 'status', title: 'Status', options: STATUS_OPTIONS },
    { column: 'klasifikasi', title: 'Klasifikasi', options: KLASIFIKASI_OPTIONS },
    { column: 'unit_id', title: 'Unit', options: unitOptions },
  ]}
  onRowClick={(row) => router.push(`/pengaduan/${row.id}`)}
  actions={[
    { label: 'Tambah Aduan', onClick: () => setOpen(true), icon: Plus },
    { label: 'Export', onClick: handleExport, icon: Download, variant: 'outline' },
  ]}
  emptyState={<EmptyState title="Belum ada pengaduan" description="Input aduan pertama" />}
/>
```

### 15.4 Status Timeline

```tsx
<StatusTimeline
  current="lidik_berjalan"
  stages={[
    { key: 'diterima', label: 'Diterima', date: '2025-06-01', done: true },
    { key: 'registrasi', label: 'Registrasi', date: '2025-06-02', done: true },
    { key: 'verifikasi', label: 'Verifikasi', date: '2025-06-03', done: true },
    { key: 'lidik_berjalan', label: 'Penyelidikan', date: '2025-06-05', done: false, current: true },
    { key: 'gelar', label: 'Gelar Perkara', done: false },
    { key: 'closed', label: 'Selesai', done: false },
  ]}
/>
```

---

## 16. AI — LOCAL LLM (OLLAMA)

### 16.1 Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                  SERVER INTERNAL POLRI                    │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌────────────────────┐   │
│  │ Next.js   │   │ Supabase │   │ OLLAMA (Local LLM) │   │
│  │           │◄──┤          │──►│ localhost:11434    │   │
│  │           │   │ pgvector │   │ • llama3.2         │   │
│  │           │   │          │   │ • mistral          │   │
│  │           │   │          │   │ • nomic-embed-text │   │
│  └──────────┘   └──────────┘   └────────────────────┘   │
│                                                          │
│  ⛔ TIDAK ADA DATA KELUAR SERVER                          │
└─────────────────────────────────────────────────────────┘
```

### 16.2 Setup

```bash
# Install Ollama di server Ubuntu
curl -fsSL https://ollama.com/install.sh | sh

# Download model (pilih salah satu)
ollama pull llama3.2          # ringan, cepat
ollama pull mistral           # seimbang
ollama pull nomic-embed-text  # untuk embedding/vector

# Verifikasi
ollama list
```

### 16.3 Konfigurasi di Aplikasi

```bash
# .env.local
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
AI_ENABLED=true                # false = fallback ke rule-based
```

### 16.4 Fitur AI dengan Local LLM

| # | Fitur | Endpoint API | Trigger | Model |
|---|---|---|---|---|
| 1 | **Auto-klasifikasi** | `POST /api/ai/classify` | Input kronologi | LLM |
| 2 | **Deteksi duplikasi** | `POST /api/ai/similar` | Registrasi | Embedding + pgvector |
| 3 | **Ringkasan otomatis** | `POST /api/ai/summarize` | Buat LHP | LLM |
| 4 | **Ekstraksi entitas** | `POST /api/ai/extract` | Input kronologi | LLM |
| 5 | **Smart search** | `POST /api/ai/search` | Search bar | Embedding + pgvector |
| 6 | **Auto-complete isian** | `POST /api/ai/autofill` | Form dokumen | LLM |
| 7 | **Anomali detection** | - (SQL) | Background job | PostgreSQL |
| 8 | **Prediksi SLA** | - (SQL) | Dashboard | PostgreSQL |

### 16.5 Fallback: Rule-Based (Tanpa LLM)

```typescript
// lib/ai.ts — wrapper dengan fallback
export async function classify(kronologi: string): Promise<string> {
  if (process.env.AI_ENABLED === 'true') {
    try {
      return await ollamaClassify(kronologi);
    } catch {
      console.warn('[AI] Ollama unavailable, using rule-based');
    }
  }
  return ruleBasedClassify(kronologi);  // keyword scoring
}

export async function search(query: string, tenantId: string): Promise<SearchResult[]> {
  if (process.env.AI_ENABLED === 'true') {
    try {
      return await pgvectorSearch(query, tenantId);
    } catch {
      console.warn('[AI] Embedding unavailable, using trigram');
    }
  }
  return pgTrgmSearch(query, tenantId); // pg_trgm fallback
}
```

### 16.6 API Route Example

```typescript
// app/api/ai/classify/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { kronologi } = await req.json();

  const response = await fetch(`${process.env.OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      prompt: `Klasifikasikan teks pengaduan berikut sebagai "disiplin", "KEPP", atau "pidana". 
               Jawab hanya satu kata.\n\nTeks: ${kronologi}\n\nKlasifikasi:`,
      stream: false,
    }),
  });

  const data = await response.json();
  return NextResponse.json({ klasifikasi: data.response.trim().toLowerCase() });
}
```

### 16.7 pgvector Setup

```sql
CREATE EXTENSION vector;

CREATE TABLE pengaduan_embeddings (
  id UUID PRIMARY KEY REFERENCES pengaduan(id) ON DELETE CASCADE,
  embedding vector(768)   -- nomic-embed-text = 768 dimensi
);

CREATE INDEX idx_pengaduan_embedding ON pengaduan_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger: auto-generate embedding saat INSERT
-- (di-handle application-side via Ollama API)
```

---

## 17. STRUKTUR FOLDER LENGKAP (REVISI)

```
e-lidik-paminal/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar + header
│   │   ├── page.tsx                  # Dashboard overview
│   │   ├── pengaduan/
│   │   │   ├── page.tsx              # List
│   │   │   ├── [id]/page.tsx         # Detail
│   │   │   └── new/page.tsx          # Form input
│   │   ├── berkas/
│   │   │   ├── page.tsx              # List
│   │   │   ├── [id]/page.tsx         # Detail + timeline
│   │   │   └── new/page.tsx          # Buat berkas (gabung aduan)
│   │   ├── dokumen/
│   │   │   ├── page.tsx              # List dokumen
│   │   │   ├── [id]/page.tsx         # Preview + download
│   │   │   └── generate/page.tsx     # Generate dari template
│   │   ├── master/
│   │   │   ├── organisasi/page.tsx
│   │   │   ├── personel/page.tsx
│   │   │   ├── pejabat/page.tsx
│   │   │   ├── variabel/page.tsx
│   │   │   └── template/
│   │   │       ├── page.tsx          # List template
│   │   │       ├── [id]/page.tsx     # Edit template
│   │   │       └── types/page.tsx    # Kelola document_types
│   │   ├── laporan/page.tsx          # Laporan & statistik
│   │   ├── audit/page.tsx            # Audit log viewer
│   │   └── monitoring/page.tsx       # Error logs + health
│   ├── api/
│   │   ├── ai/
│   │   │   ├── classify/route.ts
│   │   │   ├── summarize/route.ts
│   │   │   ├── extract/route.ts
│   │   │   ├── search/route.ts
│   │   │   └── autofill/route.ts
│   │   ├── pengaduan/route.ts
│   │   ├── berkas/route.ts
│   │   ├── dokumen/
│   │   │   ├── route.ts
│   │   │   └── generate/route.ts
│   │   ├── template/
│   │   │   ├── route.ts
│   │   │   └── preview/route.ts
│   │   └── log-error/route.ts
│   ├── error.tsx                     # Client error boundary
│   ├── global-error.tsx              # Global error fallback
│   └── layout.tsx                    # Root layout + Supabase provider
├── components/
│   ├── ui/                           # shadcn/ui + kustom
│   │   ├── data-table.tsx
│   │   ├── data-table-toolbar.tsx
│   │   ├── status-badge.tsx
│   │   ├── status-timeline.tsx
│   │   ├── page-header.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── file-upload.tsx
│   │   ├── file-preview.tsx
│   │   ├── document-preview.tsx
│   │   ├── entity-audit-log.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── register-number-input.tsx
│   │   ├── personel-select.tsx
│   │   ├── unit-select.tsx
│   │   └── template-variable-picker.tsx
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── tenant-switcher.tsx      # Untuk oversight (pilih Polda)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai.ts                        # Wrapper LLM + fallback rule-based
│   ├── audit.ts                     # logAction()
│   ├── auth.ts                      # getUser, getTenant, requireRole
│   ├── error-handler.ts             # captureError()
│   ├── pdf-generator.ts             # Template → PDF
│   ├── summarizer.ts                # TF-IDF extractive summary
│   ├── entity-extractor.ts          # Regex Polri NER
│   ├── classifier.ts                # Rule-based keyword scoring
│   └── utils.ts                     # formatDate, romanMonth, etc.
├── hooks/
│   ├── use-audit-log.ts
│   └── use-file-upload.ts
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/
│       ├── 001_tenants.sql
│       ├── 002_organizations.sql
│       ├── 003_personel_pejabat.sql
│       ├── 004_pengaduan.sql
│       ├── 005_berkas.sql
│       ├── 006_documents.sql
│       ├── 007_audit_logs.sql
│       ├── 008_error_logs.sql
│       └── 009_rls_policies.sql
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── components.json                  # shadcn/ui config
└── package.json
```

---

## 18. DASHBOARD — ADMIN vs OPERATOR

### 18.1 Dashboard Admin (Subbid / Oversight)

```
┌──────────────────────────────────────────────────────────────────┐
│ DASHBOARD — Admin Subbid                                          │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  TOTAL   │  PROSES  │ SELESAI  │ TERBUKTI │ TDK BUKTI│ SLA LEWAT│
│   127    │    34    │    89    │    62    │    27    │    5     │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┤
│                                                                  │
│  ⚠ Kelengkapan Berkas (12 belum lengkap)  [Unit: ▼ Semua]       │
│  ┌─────────┬──────────┬────────────────┬────────────────────────┐│
│  │ Unit    │ Berkas   │ Status         │ Dokumen Kurang         ││
│  ├─────────┼──────────┼────────────────┼────────────────────────┤│
│  │ Unit A  │ 001/2025 │ tidak terbukti │ Sprin Henti, Ankum     ││
│  │ Unit B  │ 002/2025 │ lidik_selesai  │ LHP                    ││
│  └─────────┴──────────┴────────────────┴────────────────────────┘│
│                                                                  │
│  📊 Tabel Anev Jenis Dumas                                       │
│  ┌──────────┬────────┬────────┬─────────┬──────────┬──────────┐ │
│  │Klasifikasi│ Jumlah │ Proses │ Selesai │ Terbukti │% Selesai │ │
│  │ Disiplin │   55   │   15   │   40    │    30    │   73%    │ │
│  │ KEPP     │   48   │   14   │   32    │    22    │   67%    │ │
│  │ Pidana   │   24   │    5   │   17    │    10    │   71%    │ │
│  └──────────┴────────┴────────┴─────────┴──────────┴──────────┘ │
│                                                                  │
│  📊 Tabel Anev Kinerja Unit                                      │
│  ┌──────┬────────┬────────┬─────────┬──────────┬──────────────┐ │
│  │ Unit │ Jumlah │ Proses │ Selesai │ Terbukti │% Selesai     │ │
│  │  A   │   35   │   10   │   23    │    18    │    66%       │ │
│  │  B   │   42   │   14   │   28    │    20    │    67%       │ │
│  │  C   │   30   │    8   │   22    │    16    │    73%       │ │
│  └──────┴────────┴────────┴─────────┴──────────┴──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 18.2 Dashboard Operator (Unit)

```
┌──────────────────────────────────────────────────────────────────┐
│ DASHBOARD — Unit A                                                │
├──────────┬──────────┬──────────┬─────────────────────────────────┤
│  DUMAS   │  PROSES  │ SELESAI  │ ⚠ SLA DEKAT (2)                 │
│   25     │    8     │   15     │                                  │
├──────────┴──────────┴──────────┴─────────────────────────────────┤
│                                                                  │
│  ⚠ Kelengkapan Berkas (3 belum lengkap)                          │
│  ┌──────────┬────────────────┬──────────────────────────────────┐│
│  │ Berkas   │ Status         │ Dokumen Kurang                   ││
│  │ 001/2025 │ tidak terbukti │ Sprin Henti, Pemberitahuan Ankum ││
│  │ 003/2025 │ terbukti       │ Pelimpahan                       ││
│  │ 007/2025 │ lidik_selesai  │ LHP                              ││
│  └──────────┴────────────────┴──────────────────────────────────┘│
│                                                                  │
│  📊 Anev Jenis Dumas (Unit ini)                                   │
│  ┌──────────┬────────┬────────┬─────────┬──────────┬──────────┐ │
│  │Klasifikasi│ Jumlah │ Proses │ Selesai │ Terbukti │% Selesai │ │
│  │ Disiplin │   12   │    4   │    8    │     6    │   67%    │ │
│  │ KEPP     │    8   │    3   │    5    │     4    │   63%    │ │
│  └──────────┴────────┴────────┴─────────┴──────────┴──────────┘ │
│                                                                  │
│  📋 Dumas Sedang Diproses                                        │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────────────┐ │
│  │ Register │ Terlapor │Klasifikasi│ Status  │ Deadline        │ │
│  │ REG/001  │ Andi     │ KEPP     │ Lidik   │ 15/06 ⚠         │ │
│  │ REG/005  │ Budi     │ Disiplin │ Gelar   │ 20/06           │ │
│  └──────────┴──────────┴──────────┴──────────┴─────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

> ⚠️ Operator hanya lihat data unit sendiri. Tidak ada cross-unit, tidak ada total global.

### 18.3 Clickable Cards → Filtered Data

Semua card dan row tabel Anev **clickable** — navigasi ke halaman list dengan filter:

| Card / Row | Target |
|---|---|
| Card "TOTAL 127" | `/pengaduan` |
| Card "PROSES 34" | `/pengaduan?status=lidik_berjalan,gelar` |
| Card "SLA LEWAT 5" | `/pengaduan?overdue=true` |
| Row "Unit A" | `/pengaduan?unit=unit-a` |
| Row "Disiplin" | `/pengaduan?klasifikasi=disiplin` |

### 18.4 Kelengkapan Berkas — Mapping

```typescript
const STATUS_DOC_REQUIREMENTS: Record<string, string[]> = {
  lidik_selesai:      ['LHP'],
  gelar:              ['LHP', 'NOTULEN_GELAR'],
  terbukti:           ['LHP', 'NOTULEN_GELAR', 'PELIMPAHAN'],
  tidak_terbukti:     ['LHP', 'NOTULEN_GELAR', 'SPRIN_HENTI', 'PEMBERITAHUAN_ANKUM'],
  closed:             ['SURAT_PELAPOR', 'LAPORAN_MABES', 'JUKRAH', 'BERKAS_AKHIR'],
};
```

---

## 19. OPTIMASI — INDEXES, CACHING, PAGINATION

### 19.1 Database Indexes

```sql
-- PENGADUAN
CREATE INDEX idx_pengaduan_tenant_status ON pengaduan(tenant_id, status);
CREATE INDEX idx_pengaduan_tenant_unit_status ON pengaduan(tenant_id, unit_id, status);
CREATE INDEX idx_pengaduan_tenant_tgl ON pengaduan(tenant_id, tgl_pengaduan DESC);
CREATE INDEX idx_pengaduan_tenant_unit_target ON pengaduan(tenant_id, unit_id, tgl_target)
  WHERE status NOT IN ('closed', 'perdamaian');
CREATE INDEX idx_pengaduan_tenant_klasifikasi ON pengaduan(tenant_id, klasifikasi_id);
CREATE INDEX idx_pengaduan_search ON pengaduan USING gin(search_vector);
CREATE INDEX idx_pengaduan_kronologi_trgm ON pengaduan USING gin(kronologi gin_trgm_ops);

-- BERKAS
CREATE INDEX idx_berkas_tenant_unit_status ON berkas(tenant_id, unit_id, status);
CREATE INDEX idx_berkas_tenant_tahun ON berkas(tenant_id, tahun);

-- NOTIFIKASI (partial index — hanya unread)
CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- AUDIT LOG (partial index — 90 hari terakhir)
CREATE INDEX idx_audit_recent ON audit_logs(tenant_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '90 days';
```

### 19.2 Materialized View (Dashboard)

```sql
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT tenant_id, unit_id, klasifikasi_id, status,
  COUNT(*) AS jumlah,
  COUNT(*) FILTER (WHERE status IN ('terbukti')) AS terbukti,
  COUNT(*) FILTER (WHERE status IN ('tidak_terbukti')) AS tidak_terbukti
FROM pengaduan
GROUP BY tenant_id, unit_id, klasifikasi_id, status;

CREATE UNIQUE INDEX idx_mv_dash ON mv_dashboard_stats(tenant_id, unit_id, klasifikasi_id, status);

-- Refresh setiap 5 menit via pg_cron
SELECT cron.schedule('refresh-dashboard', '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats');
```

### 19.3 Caching Strategy

| Layer | Teknologi | Untuk |
|---|---|---|
| DB | Materialized View | Dashboard aggregate |
| Server | React `cache()` | Dedup DB query per request |
| Server | Server Components | Data fetch di server, zero JS client |
| Server | `loading.tsx` + Suspense | Skeleton loading otomatis |
| Client | TanStack Query | DataTable pagination + cache + refetch |
| Client | `staleTime: 30s` | Tidak refetch tiap render |
| Client | `keepPreviousData` | Tidak flash kosong saat pagination |
| Client | `memo()` + `useMemo` | Skip re-render |
| Client | `dynamic()` + `lazy()` | Code split |
| UX | `prefetch={true}` on Link | Halaman siap sebelum klik |
| UX | Debounce search 300ms | Tidak spam query |

### 19.4 Pagination

| Use Case | Strategi |
|---|---|
| DataTable pengaduan | Server-side offset `LIMIT 20 OFFSET N` |
| Notifikasi | Cursor-based `WHERE created_at < $cursor` |
| Anev tables | No pagination (aggregate rows) |
| Kelengkapan berkas | No pagination (max ~20 rows/unit) |

---

## 20. RINGKASAN FINAL

### Perbandingan: Rencana Awal → Final

| Aspek | Awal | Final (Setelah Diskusi) |
|---|---|---|
| **Pelapor** | Inline di pengaduan | ✅ Tetap inline. Nama + kontak. Bisa anonim |
| **Terlapor** | Inline di pengaduan | ✅ Tabel terpisah + many-to-many junction. Auto-lookup NIP |
| **Pejabat** | Tabel terpisah | ✅ Cukup di tenant_variables (key-value) |
| **Klasifikasi** | Enum hardcoded | ✅ Tabel lookup, editable per tenant |
| **Kerahasiaan** | Flag `rahasia` | ✅ Diganti `atensi` — percepat SLA (×0.5) |
| **Berkas** | Tanpa tahun | ✅ +`tahun`, +`tgl_target` (SLA pasif) |
| **Tindak Lanjut** | Satu per tahap | ✅ Satu per berkas |
| **Notifikasi** | - | ✅ In-app (bell icon) via Supabase Realtime |
| **File Upload** | Direncanakan | ✅ Disabled sementara (hanya data teks) |
| **TTD** | Gambar scan | ✅ Gambar scan + mode nama jabatan saja (untuk TTE nanti) |
| **Template Editor** | Text biasa | ✅ HTML Rich Editor 2-panel + realtime preview + per-user settings |
| **Nomor Surat** | Auto-generate | ✅ Auto + override manual + tabel document_registers |
| **PDF** | Server-side save | ✅ Cetak via browser, simpan jika perlu |
| **Status** | Validasi transisi | ✅ Bebas (tidak divalidasi) |
| **AI** | Local LLM | ✅ Siap untuk Ollama, fallback rule-based |
| **Dashboard** | - | ✅ Admin: Anev Jenis + Anev Unit + Kelengkapan + Cards clickable |
| | | ✅ Operator: Unit sendiri saja + Kelengkapan + Dumas diproses |
| **Optimasi** | - | ✅ Indexes, Materialized View, Multi-layer caching, Pagination |
| **Audit** | - | ✅ Trigger PostgreSQL + application wrapper |
| **Monitoring** | - | ✅ error_logs table + error boundaries |
| **Agen Rules** | - | ✅ AGENTS.md dengan 6 Prinsip Penyelidikan |
| **Keamanan** | RLS | ✅ RLS + no external API + 6 prinsip kerahasiaan |
