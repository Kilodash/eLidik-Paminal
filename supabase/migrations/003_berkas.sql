-- 003: Berkas, Perdamaian, Tindak Lanjut

CREATE TABLE berkas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_id UUID REFERENCES organizations(id),
  nomor_berkas VARCHAR,
  judul VARCHAR,
  tahun INTEGER NOT NULL,
  status VARCHAR DEFAULT 'open',
  tahap VARCHAR,
  tgl_target DATE,
  operator_id UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from pengaduan to berkas (deferred)
ALTER TABLE pengaduan
  ADD CONSTRAINT fk_pengaduan_berkas
  FOREIGN KEY (berkas_id) REFERENCES berkas(id);

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
