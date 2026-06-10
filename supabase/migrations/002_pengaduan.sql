-- 002: Klasifikasi, Terlapor, Pengaduan

CREATE TABLE klasifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kode VARCHAR,
  nama VARCHAR NOT NULL,
  UNIQUE(tenant_id, kode)
);

CREATE TABLE terlapor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nama VARCHAR,
  nrp VARCHAR,
  nip VARCHAR,
  pangkat VARCHAR,
  jabatan VARCHAR,
  kesatuan VARCHAR,
  personel_id UUID REFERENCES personel(id),
  status_identitas VARCHAR DEFAULT 'diketahui',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pengaduan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_id UUID REFERENCES organizations(id),
  berkas_id UUID REFERENCES berkas(id) DEFERRABLE INITIALLY DEFERRED,
  nomor_register VARCHAR,
  jenis VARCHAR CHECK (jenis IN ('pengaduan','laporan_informasi')),
  tgl_pengaduan DATE DEFAULT CURRENT_DATE,
  pelapor_nama VARCHAR,
  pelapor_kontak VARCHAR,
  satker_dilaporkan VARCHAR,
  klasifikasi_id UUID REFERENCES klasifikasi(id),
  kronologi VARCHAR(5000),
  atensi BOOLEAN DEFAULT false,
  status VARCHAR DEFAULT 'diterima',
  search_vector tsvector,
  created_by UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pengaduan_terlapor (
  pengaduan_id UUID REFERENCES pengaduan(id) ON DELETE CASCADE,
  terlapor_id UUID REFERENCES terlapor(id),
  PRIMARY KEY (pengaduan_id, terlapor_id)
);

CREATE INDEX idx_pengaduan_search ON pengaduan USING gin(search_vector);

CREATE FUNCTION update_pengaduan_search() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('indonesian', COALESCE(NEW.nomor_register, '')), 'A') ||
    setweight(to_tsvector('indonesian', COALESCE(NEW.pelapor_nama, '')), 'B') ||
    setweight(to_tsvector('indonesian', COALESCE(NEW.satker_dilaporkan, '')), 'B') ||
    setweight(to_tsvector('indonesian', COALESCE(NEW.kronologi, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pengaduan_search_update
  BEFORE INSERT OR UPDATE OF nomor_register, pelapor_nama, satker_dilaporkan, kronologi
  ON pengaduan
  FOR EACH ROW EXECUTE FUNCTION update_pengaduan_search();
