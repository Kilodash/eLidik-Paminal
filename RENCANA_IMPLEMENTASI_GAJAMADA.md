# Rencana Implementasi Integrasi Gajamada — Subbid Paminal

Dokumen ini merangkum kesepakatan flow, perubahan data model, backend, dan frontend untuk integrasi Gajamada Propam fase pertama (Subbid Paminal). Dibuat agar dapat dilanjutkan di sesi berikutnya tanpa kehilangan konteks.

---

## 1. Tujuan Fase 1

Memungkinkan Kasubbid Paminal di e-Lidik untuk:
1. Melihat seluruh laporan Pengaduan Cepat Propam yang sudah sampai ke **Subbid Paminal** pada Polda tenant-nya.
2. Menerima dan mendistribusikan laporan dalam satu aksi (**Terima & Distribusikan**) ke unit/UR Paminal di Gajamada.
3. Menyimpan data distribusi ke database e-Lidik secara sinkron.
4. Membatasi `operator_unit` agar hanya melihat laporan yang didistribusikan ke unitnya.

---

## 2. Prinsip Dasar

- **Tenant = Polda**. Setiap tenant hanya sync data yang `disposisi_polda`-nya sesuai.
- **Subbid Paminal = fokus awal**. Subbid/instansi lain (Yanduan, Provos, Wabprof, Korbrimob) ditangguhkan ke fase berikutnya, tetapi arsitektur dibuat extensible.
- **Unit/UR nama-nya harus identik dengan Gajamada**.
- **Distribusi di e-Lidik langsung update Gajamada** via gateway `api/v1/apps/api/gateway/execute`.

---

## 3. Flow Kerja

```
Gajamada (Polda)
       │
       ▼
Sync intake ──filter disposisi_polda──► e-Lidik (tabel pengaduan)
       │
       ▼
Tabel Dumas (admin_subbid/oversight)
- Semua laporan yang sudah sampai Subbid Paminal
- Quick filter: Semua / Menunggu Distribusi / Per Unit
       │
       ▼
Klik baris ──► Detail Panel + Tab Distribusi
       │
       ▼
Tab Distribusi
- Informasi Dasar, Pelapor, Terlapor, Timeline
- Form: Tanggal Disposisi, Isi Disposisi, Pilih Unit/UR
- Tombol: Terima & Distribusikan
       │
       ▼
Gateway Gajamada ──► case_position = "<UNIT> <POLDA>"
       │
       ▼
e-Lidik update unit_id, tgl disposisi, catatan
       │
       ▼
operator_unit melihat laporan di unit-nya
```

---

## 4. Perubahan Database

### 4.1 Kolom baru di `pengaduan`

Migration baru (`021_subbid_paminal_distribution.sql`):

```sql
ALTER TABLE pengaduan
  ADD COLUMN IF NOT EXISTS gajamada_polda VARCHAR,
  ADD COLUMN IF NOT EXISTS gajamada_sub_function VARCHAR,
  ADD COLUMN IF NOT EXISTS gajamada_unit_tujuan VARCHAR,
  ADD COLUMN IF NOT EXISTS tgl_disposisi_kasubbid DATE,
  ADD COLUMN IF NOT EXISTS disposisi_kasubbid_catatan TEXT;
```

Kolom yang sudah ada dan tetap dipakai:
- `gajamada_id`
- `gajamada_p_id`
- `gajamada_status`
- `gajamada_case_position`
- `gajamada_synced_at`
- `unit_id`
- `disposisi_kabid`, `disposisi_kasubbid`, `disposisi_tambahan`

### 4.2 Mapping Unit/Organization

Nama `organizations.nama` disamakan dengan Gajamada. Update existing:

| kode lama / tipe | nama baru (identik Gajamada) |
|---|---|
| UNIT-1 / unit | `UNIT 1 SUBBID PAMINAL` |
| UNIT-2 / unit | `UNIT 2 SUBBID PAMINAL` |
| UNIT-3 / unit | `UNIT 3 SUBBID PAMINAL` |
| UR-BINPAM / unit | `UR BINPAM SUBBID PAMINAL` |
| UR-LITPERS / unit | `UR LITPERS SUBBID PAMINAL` |
| UR-PRODOK / unit | `UR PRODOK SUBBID PAMINAL` |
| KAUR-BINPAM / unit | `KAUR BINPAM SUBBID PAMINAL` |
| SUBBID-PAMINAL / subbid | `KASUBBID PAMINAL <NAMA POLDA>` (opsional) |

---

## 5. Perubahan Backend

### 5.1 `src/lib/gajamada/client.ts`

Tambah method:

1. `fetchUnitOptions(subFunction: string, search?: string)`
   - Endpoint: `POST /api/v1/apps/data/management/get-all`
   - Payload: connectionId, database `divpropam`, table `dimension.catalog_unit_name`, filter `sub_function = 'SUBBID PAMINAL'`, optional search by `unit`.
   - Return: array `{ unit, sub_function }`.

2. `terimaDanDistribusikan(params)`
   - Memanggil `executeAction` dengan:
     - `status: 'Laporan Diterima'`
     - `casePosition: '<UNIT> <POLDA>'`
     - `reportId`, `note`, `createdBy`
   - Metadata gateway dari `tenant_variables` (sudah ada):
     - `gajamada_gateway_id`
     - `gajamada_action_widget_id`
     - `gajamada_action_menu_id`
     - `gajamada_action_user_id`

### 5.2 `src/lib/gajamada/sync.ts`

Update `syncGajamadaIntake`:
- Filter intake: `disposisi_polda = tenantVariables.gajamada_disposisi_polda`.
- Simpan field baru:
  - `gajamada_polda = report.disposisi_polda || report.polda`
  - `gajamada_sub_function = report.sub_function` (jika tersedia di `gold.report`)
  - `gajamada_case_position = report.disposisi_case_position`
- Saat update existing row, update juga `unit_id` berdasarkan `gajamada_case_position` ↔ mapping unit (handle perubahan langsung di Gajamada).

### 5.3 `src/lib/data/pengaduan.ts`

Update `getPengaduanList`:
- Default filter untuk admin_subbid/oversight:
  - `gajamada_polda = <tenant polda>`
  - `gajamada_case_position ILIKE '%SUBBID PAMINAL%'` OR `'%KASUBBID PAMINAL%'` OR `'%KAUR BINPAM%'` OR `'%UNIT%SUBBID PAMINAL%'` OR `'%UR%SUBBID PAMINAL%'`
- Tambah filter query param:
  - `gajamadaStage = 'subbid_menunggu'` → `unit_id IS NULL`
  - `gajamadaStage = 'subbid_distributed'` → `unit_id IS NOT NULL`
  - `gajamadaStage = 'subbid_all'` → default
- Untuk `operator_unit`, selalu filter `unit_id = personel.organization_id`.

### 5.4 `src/app/(dashboard)/pengaduan/actions.ts`

Tambah server action:

```ts
export async function terimaDanDistribusikanGajamadaAction(
  pengaduanId: string,
  unitName: string,          // contoh: "UNIT 2 SUBBID PAMINAL"
  note: string,
  tglDisposisi: string       // ISO date
)
```

Langkah:
1. Validasi role `admin_subbid` / `oversight`.
2. Ambil data `pengaduan` (termasuk `gajamada_id`, `tenant_id`).
3. Ambil `tenant.nama` untuk membuat `poldaName = 'POLDA ' + upper(tenant.nama tanpa prefix Polda)`.
4. Panggil `GajamadaClient.terimaDanDistribusikan(...)`.
5. Cari `organization_id` dari `organizations.nama = unitName`.
6. Update `pengaduan`:
   - `unit_id = organization_id`
   - `gajamada_unit_tujuan = unitName`
   - `gajamada_case_position = "${unitName} ${poldaName}"`
   - `tgl_disposisi_kasubbid = tglDisposisi`
   - `disposisi_kasubbid_catatan = note`
   - `disposisi_kasubbid` bisa diisi array default `["TINDAKLANJUTI"]` atau sesuai input.
7. Insert audit log.
8. Revalidate path `/pengaduan`.

---

## 6. Perubahan Frontend

### 6.1 `PengaduanTable` / `PengaduanTableLayout`

Tambah:
- Badge status Gajamada (`gajamada_status`).
- Badge unit tujuan (`gajamada_unit_tujuan` atau `unit.nama`).
- Quick filter chips di atas tabel:
  - Semua Subbid
  - Menunggu Distribusi
  - Per Unit (dropdown)
- Kolom baru: **Distribusi** (ikon/aksi buka tab Distribusi).

### 6.2 Panel kiri (Detail / Form)

Ubah `ResizableFormTableLayout` / form panel:
- Jika ada `editData`, default tampil **mode baca**:
  - Status Gajamada
  - Tombol **Terima & Distribusikan** (jika belum distribusi)
  - Tanggal Disposisi, Isi Disposisi, Unit/UR Tujuan
  - Tombol **Edit Dumas** untuk beralih ke form edit
- Pertahankan navigasi Next/Prev (`PengaduanFormNav`).

### 6.3 Tab Distribusi

Ganti `<DistribusiForm>` internal dengan komponen baru, misalnya `<GajamadaDistribusiPanel>`:

Tampilkan:
- **Informasi Dasar** dari `editData` + Gajamada detail.
- **Pelapor**.
- **Terlapor**.
- **Timeline** (data dari detail.har; bisa disimpan saat sync atau fetch live).
- Form **Disposisi Kasubbid**:
  - Tanggal Disposisi (date picker)
  - Isi Disposisi (textarea, wajib)
  - Pilih Unit/UR (async select, fetch dari `dimension.catalog_unit_name`)
  - Tombol **Terima & Distribusikan**

### 6.4 Halaman `/pengaduan/page.tsx`

- Teruskan data unit/UR Gajamada ke tab Distribusi.
- Atur default `activeTab` dari query param `?tab=distribusi` jika diperlukan.
- Pastikan `operator_unit` tidak melihat tab Distribusi (hanya Tabel Dumas).

---

## 7. Extensibilitas ke Subbid/Yanduan Lain

Agar Phase 2+ tidak rewrite banyak, rekomendasikan pola berikut:

1. **Generic Gateway Dispatcher**: `GajamadaClient.executeAction(config, params)` sudah cukup generic.
2. **Unit Catalog by `sub_function`**: `fetchUnitOptions(subFunction)` bisa dipakai untuk `'SUBBID PROVOS'`, `'SUBBID WABPROF'`, `'BAGYANDUAN'`, dsb.
3. **Role per Subbid**: tambahkan `TenantRole` baru:
   - `'admin_yanduan'`
   - `'admin_provos'`
   - `'admin_wabprof'`
4. **Konfigurasi Aksi per Subbid**: simpan di `tenant_variables` atau tabel baru `gajamada_action_configs`:
   - `sub_function`
   - `action_name`
   - `next_status`
   - `case_position_template`
   - `allowed_roles`

Dengan pola ini, nambah subbid baru hanya perlu:
- tambah role,
- tambah organizations,
- tambah konfigurasi aksi,
- buat UI khusus jika flow-nya beda signifikan.

---

## 8. Pertanyaan yang Sudah Dijawab

| No | Pertanyaan | Jawaban |
|---|---|---|
| 1 | Terima & Distribusikan dipisah atau digabung? | **Digabung** (satu tombol) |
| 2 | Nama unit/UR disamakan atau mapping? | **Disamakan** dengan Gajamada |
| 3 | Tabel Dumas default? | **Semua laporan sudah sampai Subbid Paminal** (termasuk yang sudah didistribusikan) |
| 4 | Detail Pelapor/Terlapor/Timeline live atau sync? | **Sync** (disimpan saat intake/sync) |
| 5 | Operator unit hanya lihat unit sendiri? | **Ya** |

---

## 9. Daftar File yang Akan Dimodifikasi / Dibuat

### Migration
- `supabase/migrations/021_subbid_paminal_distribution.sql`

### Backend
- `src/lib/gajamada/client.ts`
- `src/lib/gajamada/sync.ts`
- `src/lib/gajamada/types.ts` (jika perlu)
- `src/lib/data/pengaduan.ts`
- `src/app/(dashboard)/pengaduan/actions.ts`

### Frontend
- `src/app/(dashboard)/pengaduan/page.tsx`
- `src/components/layout/pengaduan-table.tsx`
- `src/components/layout/resizable-form-table-layout.tsx`
- `src/components/pengaduan/gajamada-distribusi-panel.tsx` (baru)
- `src/components/pengaduan/gajamada-unit-select.tsx` (baru)
- `src/components/ui/data-table.tsx` (badge kolom)

### Dokumen
- `RENCANA_IMPLEMENTASI_GAJAMADA.md` (file ini)

---

## 10. Catatan Risiko

- Gateway Gajamada mungkin memvalidasi status sebelumnya. Jika laporan belum berada di status yang diizinkan, distribusi bisa gagal. Perlu handle error dengan baik.
- `createdBy` di payload Gajamada bersifat teks; gunakan `personel.nama_lengkap`.
- Jika unit/UR dipilih tidak cocok dengan mapping `organizations`, `unit_id` bisa null. Perlu fallback dan warning.
- Jika ada perubahan langsung di Gajamada, e-Lidik perlu sync ulang agar `unit_id` dan `gajamada_case_position` tetap sinkron.

---

*Dibuat: 30 Juni 2026*  
*Fokus: Phase 1 — Subbid Paminal*
