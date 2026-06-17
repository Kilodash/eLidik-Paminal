# AGENTS.md — e-Lidik Paminal

## 1. IDENTITAS PROYEK

Aplikasi **manajemen pengaduan masyarakat & monitoring tindak lanjut** di lingkungan Polri.
Instansi: **Bidpropam / Subbid Paminal**.

SOP Acuan:
- **Perkadiv Propam No 1/2015** — SOP Penyelidikan Paminal
- **Perkadiv Propam No 4/2021** — Perdamaian Garplin KEPP
- **Perkapolri No 1/2023** — Naskah Dinas & Tata Persuratan

---

## 2. 6 PRINSIP PENYELIDIKAN (Pasal 3 SOP 1/2015)

| Prinsip | Implementasi Wajib |
|---|---|
| **Legalitas** | Semua fitur, dokumen, dan alur sesuai ketentuan perundangan. Format naskah dinas mengacu Perkap 1/2023 |
| **Profesionalisme** | Prosedur mengikuti teknis & taktis Kepolisian. Tahap penyelidikan TIDAK BOLEH dipotong |
| **Akuntabel** | Setiap aksi user tercatat di `audit_logs`. Setiap perubahan status di `status_history` |
| **Tidak diskriminatif** | UI tidak membedakan pangkat/jabatan. Semua personel setara di sistem |
| **Kepastian hukum** | Prosedur eksplisit per tahap. Hasil penyelidikan mengikuti format yg bisa dipertanggungjawabkan yuridis |
| **Rahasia** | ⛔ TIDAK BOLEH kirim data ke API eksternal apapun. Data hanya di server & database internal |

---

## 3. TECH STACK

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + TailwindCSS |
| Backend | Next.js API Routes / Server Actions |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| PDF | @react-pdf/renderer + browser print |
| AI (opsional) | Ollama local LLM + fallback rule-based |

---

## 4. ATURAN KERJA

1. **Keamanan nomor satu** — jangan pernah kirim data keluar, jangan pakai cloud AI
2. **Ikuti SOP** — setiap alur, dokumen, dan format harus sesuai SOP & prinsip Pasal 3
3. **Jangan mengubah komponen** di luar yang diminta user
4. **Jangan mengarang** — jika tidak tahu, tanya; jika data tidak ada di SOP, konfirmasi
5. **Output singkat, padat, jelas** — tidak perlu penjelasan panjang kecuali diminta
6. **Keputusan bercabang → WAJIB tanya user** — jangan membuat asumsi
7. **Jelaskan sebelum eksekusi** — untuk perintah non-trivial, jelaskan dulu

---

## 5. KONVENSI KODE

| Aspek | Aturan |
|---|---|
| TypeScript | Strict mode, explicit return types |
| Variabel/fungsi | camelCase |
| Komponen React | PascalCase |
| Database (SQL) | snake_case |
| Server vs Client | Default server component, `'use client'` hanya untuk interaktivitas |
| Impor | alias `@/` |
| Async | async/await, error handling pakai try/catch + `captureError()` |

---

## 6. SUPABASE & MULTI-TENANT

- Setiap tabel WAJIB: kolom `tenant_id NOT NULL`, RLS enabled, policy tenant isolation
- Setiap query WAJIB: `WHERE tenant_id = current_tenant`
- User context dari `auth.uid()` — jangan hardcode
- Jangan query `auth.users` langsung — pakai tabel `personel`
- `oversight`: lihat semua tenant. `admin_subbid` & `operator_unit`: terbatas tenant masing-masing

---

## 7. DOKUMEN & TEMPLATE

- 24 jenis dokumen (lihat `RENCANA.md` section 7)
- Format mengacu Perkap 1/2023: kopstuk, penomoran, susunan (kepala–batang tubuh–kaki)
- Placeholder `{{...}}` dari database: tenant_variables, personel, pengaduan, berkas
- Generate via browser print; simpan PDF ke Supabase Storage hanya jika perlu
- Auto-generate nomor via `document_registers`, bisa override manual

---

## 8. ALUR KERJA AGEN

1. Baca `RENCANA.md` untuk konteks lengkap
2. Pahami modul & tabel terkait sebelum coding
3. Jika ada ambiguitas → **WAJIB tanya user**
4. Selesai → verifikasi typecheck/lint
5. **JANGAN commit** kecuali diminta
