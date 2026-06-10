-- 004: Templates, Document Types, Document Registers, Documents

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kode VARCHAR,
  nama VARCHAR,
  tahap VARCHAR,
  jenis_naskah VARCHAR,
  kopstuk_tipe VARCHAR,
  tribrata VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_type_id UUID REFERENCES document_types(id),
  content TEXT NOT NULL,
  header_html TEXT,
  footer_html TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE template_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES personel(id),
  template_id UUID NOT NULL REFERENCES templates(id),
  editor_prefs JSONB,
  UNIQUE(user_id, template_id)
);

CREATE TABLE document_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_type_kode VARCHAR NOT NULL,
  tahun INTEGER NOT NULL,
  bulan INTEGER,
  nomor_terakhir INTEGER DEFAULT 0,
  UNIQUE(tenant_id, document_type_kode, tahun, bulan)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_id UUID REFERENCES templates(id),
  pengaduan_id UUID REFERENCES pengaduan(id),
  berkas_id UUID REFERENCES berkas(id),
  tahap VARCHAR,
  nomor_surat VARCHAR,
  tgl_dokumen DATE,
  content_rendered TEXT,
  file_pdf TEXT,
  status VARCHAR DEFAULT 'draft',
  created_by UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
