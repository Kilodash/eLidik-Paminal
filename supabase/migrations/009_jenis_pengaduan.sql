-- 009: Jenis Pengaduan Master Data

CREATE TABLE IF NOT EXISTS jenis_pengaduan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kode VARCHAR,
  nama VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, kode)
);

-- Drop check constraint from pengaduan.jenis so it can accept any value from jenis_pengaduan
ALTER TABLE pengaduan DROP CONSTRAINT IF EXISTS pengaduan_jenis_check;

-- Optional: Insert default values for existing tenants
INSERT INTO jenis_pengaduan (tenant_id, kode, nama)
SELECT id, 'PENGADUAN', 'Pengaduan' FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO jenis_pengaduan (tenant_id, kode, nama)
SELECT id, 'LAPORAN_INFORMASI', 'Laporan Informasi' FROM tenants
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE jenis_pengaduan ENABLE ROW LEVEL SECURITY;

CREATE POLICY jp_tenant ON jenis_pengaduan
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY jp_admin ON jenis_pengaduan
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY jp_admin_upd ON jenis_pengaduan
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY jp_admin_del ON jenis_pengaduan
  FOR DELETE USING (current_user_role() IN ('admin_subbid', 'oversight'));
