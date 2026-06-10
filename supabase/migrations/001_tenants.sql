-- 001: Core tables — tenants, organizations, personel, tenant_variables

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR UNIQUE NOT NULL,
  nama VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID REFERENCES organizations(id),
  tipe VARCHAR CHECK (tipe IN ('bidpropam','subbid','unit')),
  kode VARCHAR,
  nama VARCHAR NOT NULL,
  UNIQUE(tenant_id, kode)
);

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

CREATE TABLE tenant_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key VARCHAR NOT NULL,
  value TEXT,
  UNIQUE(tenant_id, key)
);

-- Insert default tenant variables per tenant
-- key examples: kop_surat, nama_polda, alamat, kode_polda,
--   nama_kabid, pangkat_kabid, nip_kabid, ttd_kabid,
--   nama_kasi, pangkat_kasi, nip_kasi
