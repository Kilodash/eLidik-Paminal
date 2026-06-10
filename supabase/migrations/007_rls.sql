-- 007: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE klasifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE terlapor ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaduan_terlapor ENABLE ROW LEVEL SECURITY;
ALTER TABLE berkas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perdamaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE tindak_lanjut ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE berkas_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's tenant_id
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM personel WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM personel WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION current_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM personel WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- TENANT ISOLATION POLICIES
-- ============================================

-- Organizations: tenant scoped
CREATE POLICY org_tenant ON organizations
  FOR ALL USING (tenant_id = current_tenant_id());

-- Personel: tenant scoped
CREATE POLICY personel_tenant ON personel
  FOR ALL USING (tenant_id = current_tenant_id());

-- Tenant variables: tenant scoped
CREATE POLICY tv_tenant ON tenant_variables
  FOR ALL USING (tenant_id = current_tenant_id());

-- Klasifikasi: tenant scoped
CREATE POLICY klas_tenant ON klasifikasi
  FOR ALL USING (tenant_id = current_tenant_id());

-- Terlapor: tenant scoped
CREATE POLICY terlapor_tenant ON terlapor
  FOR ALL USING (tenant_id = current_tenant_id());

-- Pengaduan: tenant scoped
CREATE POLICY pengaduan_tenant ON pengaduan
  FOR ALL USING (tenant_id = current_tenant_id());

-- Pengaduan_terlapor: inherit from pengaduan
CREATE POLICY pt_tenant ON pengaduan_terlapor
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pengaduan p
      WHERE p.id = pengaduan_id AND p.tenant_id = current_tenant_id()
    )
  );

-- Berkas: tenant scoped
CREATE POLICY berkas_tenant ON berkas
  FOR ALL USING (tenant_id = current_tenant_id());

-- Perdamaian: tenant scoped
CREATE POLICY damai_tenant ON perdamaian
  FOR ALL USING (tenant_id = current_tenant_id());

-- Tindak Lanjut: tenant scoped
CREATE POLICY tl_tenant ON tindak_lanjut
  FOR ALL USING (tenant_id = current_tenant_id());

-- Document types: tenant scoped
CREATE POLICY dt_tenant ON document_types
  FOR ALL USING (tenant_id = current_tenant_id());

-- Templates: tenant scoped
CREATE POLICY tmpl_tenant ON templates
  FOR ALL USING (tenant_id = current_tenant_id());

-- Template user settings: own data
CREATE POLICY tus_own ON template_user_settings
  FOR ALL USING (user_id = auth.uid());

-- Document registers: tenant scoped
CREATE POLICY dr_tenant ON document_registers
  FOR ALL USING (tenant_id = current_tenant_id());

-- Documents: tenant scoped
CREATE POLICY docs_tenant ON documents
  FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================
-- ROLE-BASED POLICIES
-- ============================================

-- Personel: only admin_subbid + oversight can insert/update
CREATE POLICY personel_admin ON personel
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY personel_admin_upd ON personel
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));

-- Tenant_variables: only admin_subbid + oversight can manage
CREATE POLICY tv_admin ON tenant_variables
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY tv_admin_upd ON tenant_variables
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY tv_admin_del ON tenant_variables
  FOR DELETE USING (current_user_role() IN ('admin_subbid', 'oversight'));

-- Klasifikasi: only admin can manage
CREATE POLICY klas_admin ON klasifikasi
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY klas_admin_upd ON klasifikasi
  FOR UPDATE USING (current_user_role() IN ('admin_subbid', 'oversight'));
CREATE POLICY klas_admin_del ON klasifikasi
  FOR DELETE USING (current_user_role() IN ('admin_subbid', 'oversight'));

-- Pengaduan: operator can only see their unit's data
CREATE POLICY pengaduan_unit ON pengaduan
  FOR SELECT USING (
    current_user_role() = 'oversight'
    OR current_user_role() = 'admin_subbid'
    OR (current_user_role() = 'operator_unit' AND unit_id = current_user_org())
  );

-- Pengaduan: only admin can insert
CREATE POLICY pengaduan_insert ON pengaduan
  FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid', 'oversight'));

-- Pengaduan: operator can update their unit's data
CREATE POLICY pengaduan_upd ON pengaduan
  FOR UPDATE USING (
    current_user_role() IN ('oversight', 'admin_subbid')
    OR (current_user_role() = 'operator_unit' AND unit_id = current_user_org())
  );

-- Berkas: operator can see their unit's berkas
CREATE POLICY berkas_unit ON berkas
  FOR SELECT USING (
    current_user_role() IN ('oversight', 'admin_subbid')
    OR (current_user_role() = 'operator_unit' AND unit_id = current_user_org())
  );

-- Berkas: operator can manage their unit's berkas
CREATE POLICY berkas_insert ON berkas
  FOR INSERT WITH CHECK (current_user_role() IN ('oversight', 'admin_subbid', 'operator_unit'));
CREATE POLICY berkas_upd ON berkas
  FOR UPDATE USING (
    current_user_role() IN ('oversight', 'admin_subbid')
    OR (current_user_role() = 'operator_unit' AND unit_id = current_user_org())
  );

-- Documents: operator can see and manage their berkas documents
CREATE POLICY docs_access ON documents
  FOR SELECT USING (
    current_user_role() IN ('oversight', 'admin_subbid')
    OR (current_user_role() = 'operator_unit' AND EXISTS (
      SELECT 1 FROM berkas b WHERE b.id = documents.berkas_id AND b.unit_id = current_user_org()
    ))
  );
CREATE POLICY docs_insert ON documents
  FOR INSERT WITH CHECK (current_user_role() IN ('oversight', 'admin_subbid', 'operator_unit'));

-- Notifications: user can only see their own
CREATE POLICY notif_own ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Berkas notes: operator can manage their berkas' notes
CREATE POLICY notes_access ON berkas_notes
  FOR ALL USING (
    current_user_role() IN ('oversight', 'admin_subbid')
    OR (current_user_role() = 'operator_unit' AND EXISTS (
      SELECT 1 FROM berkas b WHERE b.id = berkas_notes.berkas_id AND b.unit_id = current_user_org()
    ))
  );

-- Saved searches: user's own
CREATE POLICY ss_own ON saved_searches
  FOR ALL USING (user_id = auth.uid());

-- Audit logs: tenant-scoped read only
CREATE POLICY audit_read ON audit_logs
  FOR SELECT USING (tenant_id = current_tenant_id());

-- Oversight: can see across all tenants
CREATE POLICY oversight_tenants ON tenants
  FOR SELECT USING (
    current_user_role() = 'oversight'
    OR id = current_tenant_id()
  );
