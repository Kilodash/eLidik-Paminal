-- 010: Tindak lanjut disposisi
ALTER TABLE pengaduan ADD COLUMN disposisi_kabid TEXT[];
ALTER TABLE pengaduan ADD COLUMN disposisi_kasubbid TEXT[];
ALTER TABLE pengaduan ADD COLUMN disposisi_tambahan TEXT;
