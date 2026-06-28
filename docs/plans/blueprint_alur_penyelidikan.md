# Blueprint Alur Penyelidikan eLidik-Paminal

## 1. Alur Tindak Lanjut (Fase)
1. **Penerimaan:** Registrasi (manual/Gajamada) -> Gabung Berkas/Baru.
2. **Disposisi (Kasubbid):** Lidik Unit / Limpah / Arsip.
3. **Penyelidikan Unit:**
   - Perencanaan (UUK, Sprin Lidik).
   - Pulbaket (Undangan, BA Wawancara/Interogasi).
   - Pengolahan (Matriks Alat Bukti, Notulen Gelar).
   - Pelaporan (LHP, Nota Dinas LHP).
4. **Putusan Pimpinan (Kabid/Kapolda):** Terbukti (Limpah Disiplin/KEPP/Reskrim) / Tidak Terbukti (Henti Lidik).
5. **Penutupan:** Pemberitahuan Pelapor, Ankum, Mabes.

## 2. Fitur Bypass (Restorative Justice / Cabut Aduan)
- Tombol global 'Cabut/Damai' di Dashboard Berkas.
- Bypass checklist normal -> Gelar Khusus -> SP3.

## 3. Register Surat (Penomoran)
- Tabel egister_surat terpusat. Buku terpisah (Min Paminal vs Bidpropam).
- Mendukung fitur reservasi 'Nomor Nyelip' (backdate).

## 4. Penggunaan AI Aman & UI/UX Constraints
- **Local LLM / Anonymizer:** Wajib untuk prinsip rahasia (SOP Pasal 3f).
- **Tinjau Prompt:** Modal pratinjau data tersamar sebelum dikirim ke AI.
- **AI Cross-Check & Ringkas:** Ekstrak kesesuaian/pertentangan saksi agar LHP padat (SOP Pasal 24-25).
- **Pembatasan Form:** Max karakter untuk narasi Kesimpulan guna paksa penalaran taktis.

## 5. Matriks Alat Bukti
Visualisasi matriks 6 alat bukti sah (SOP Pasal 1 angka 11 & Pasal 27 ayat 2):
1. Keterangan Saksi
2. Surat
3. Keterangan Ahli
4. Petunjuk
5. Bukti Elektronik
6. Keterangan Terlapor
