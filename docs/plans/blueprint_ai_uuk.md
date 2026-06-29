# Blueprint AI untuk Tahap Perencanaan (Pembuatan UUK)

## 1. Lingkup
Fokus: Tahap awal (Step 1-5) sejak Dumas masuk sampai UUK jadi.
Dasar: SOP Perkadiv Propam No. 1 Tahun 2015, Pasal 10-15.

## 2. Titik Aplikasi AI di Tahap Perencanaan
### Step 1 - Sumber Lidik
- Klasifikasi Dumas otomatis (Disiplin / KEPP / Pidana).
- Deteksi Dumas duplikat.
- Ringkasan kronologi panjang.

### Step 2 - Disposisi
- Saran keputusan Kasubbid (Lidik / Limpah / Arsip).
- Highlight kekurangan formil/materiil.

### Step 3 - Disposisi Internal
- Saran unit tujuan berdasarkan klasifikasi Dumas.

### Step 4 - Bentuk Tim
- Saran komposisi tim (ketua/anggota) berdasarkan kompetensi & beban kerja.

### Step 5 - UUK (Fokus Utama)
- Auto-draft UUK sesuai 5 komponen Pasal 11.
- Retrieval kasus serupa untuk referensi.
- Validasi kelengkapan sesuai SOP.

## 3. Penerapan AI di Pembuatan UUK

### Sumber Data
- Dumas: kronologi, klasifikasi, terlapor, saksi.
- Kasus serupa (vector search di database internal).
- SOP Pasal 11 sebagai guardrail prompt.

### Prompt AI
Input: Dumas + kasus serupa + Pasal 11.
Output JSON:
```json
{
  "indikasi_permasalahan": "...",
  "baket_dicari": ["...", "..."],
  "sumber": ["...", "..."],
  "teknik": "terbuka|tertutup|campuran",
  "taktik": "penyamaran|penyesatan|netral",
  "jangka_waktu": {"mulai": "YYYY-MM-DD", "selesai": "YYYY-MM-DD"},
  "tempat_laporan": "..."
}
```

### Mode AI
- **Auto-Draft:** Klik tombol, AI generate seluruh komponen.
- **Semi-Auto:** AI prefill, personel edit.
- **Manual:** Personel isi sendiri (default fallback).

## 4. UI/UX Flow

### Lokasi
Tab Perencanaan > Step 5 "UUK".

### Alur
1. Kanit pilih Dumas di Step 1.
2. Tombol "AI: Saran UUK" muncul.
3. Modal Tinjau Prompt: data Dumas + retrieval kasus serupa + prompt ke AI.
4. AI output JSON dirender ke form UUK terstruktur.
5. Personel review/edit manual.
6. Auto-save tiap 30 detik.
7. Audit log: hash prompt & output AI.

### Tampilan
- Header: Dumas ringkasan + tombol "AI Saran UUK".
- Form terstruktur (5 field sesuai Pasal 11):
  - Indikasi Permasalahan
  - Baket Dicari (multi-input baris)
  - Sumber (multi-input)
  - Teknik & Taktik (radio/checkbox)
  - Jangka Waktu + Tempat Lapor

## 5. Aturan Privasi & Kepatuhan SOP

### Prinsip Rahasia (Pasal 3f)
- **Local LLM (Ollama/Qwen 8B)** diprioritaskan untuk kerahasiaan.
- **Cloud AI + Anonymizer** fallback dengan peringatan eksplisit.
- NRP/nama asli tidak boleh terkirim langsung tanpa Anonymizer.

### Audit Log
- Simpan hash prompt, hash output, model AI, timestamp.
- Retensi 1 tahun.

### Pembatasan AI
- AI penuntun, bukan penetap.
- Personel wajib validasi manual sebelum konfirmasi.
- AI tidak boleh output di luar komponen Pasal 11.

## 7. Best Practice Pembuatan Dokumen (Umum)
- WYSIWYG editor inline (pakai `@eigenpal/docx-editor-react`).
- Live outline sidebar.
- Variable Inspector (status real-time per field).
- Validasi real-time (block generate jika wajib kosong).
- Auto-save + version history.
- QR Code + SHA-256 untuk verifikasi keaslian.
- Template lock pasca konfirmasi.
- Tanda tangan digital bertingkat (Kanit -> Pejabat).

## 8. Library yang Tersedia (Sudah Di-install)
- `docxtemplater` + `pizzip` (generate DOCX dari template).
- `@eigenpal/docx-editor-react` (editor inline browser).
- `@tiptap/react` + ekstensi (rich text narasi).
- `mammoth` (baca template DOCX).
- `pdf-lib` (manipulasi PDF).
- `qrcode` (QR Code verifikasi).
- `zod` (validasi variabel).
- `zustand` (state management).

## 9. Gap vs Aplikasi Saat Ini
- Editor inline: sudah ada (eigenpal), perlu integrasi optimal.
- Sidebar outline: belum.
- Variable Inspector panel: belum.
- Validasi real-time: parsial.
- Auto-save: belum.
- TTD digital & QR Code: parsial (perlu diperluas).
- Template lock pasca konfirmasi: belum.
- AI auto-draft UUK: belum diimplementasi.

## 10. Status
- Mode: Build (eksekusi diizinkan).
- Dokumen: Tahap Perencanaan (Step 5 UUK fokus).
- Belum ada kode ditulis.
- Tahap berikutnya: implementasi.
