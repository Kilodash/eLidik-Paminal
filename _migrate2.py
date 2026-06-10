import pg8000.native

conn = pg8000.native.Connection(
    host="aws-1-ap-southeast-1.pooler.supabase.com", port=5432,
    database="postgres", user="postgres.kzekrzdyyhedstoaihlt",
    password="\044\046Kilodash123",
)

idx_sql = """
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_pengaduan_search ON pengaduan USING gin(search_vector);
CREATE INDEX idx_pengaduan_tenant_status ON pengaduan(tenant_id, status);
CREATE INDEX idx_pengaduan_tenant_unit ON pengaduan(tenant_id, unit_id);
CREATE INDEX idx_pengaduan_tenant_tgl ON pengaduan(tenant_id, tgl_pengaduan DESC);
CREATE INDEX idx_pengaduan_tenant_klasifikasi ON pengaduan(tenant_id, klasifikasi_id);
CREATE INDEX idx_pengaduan_kronologi_trgm ON pengaduan USING gin(kronologi gin_trgm_ops);
CREATE INDEX idx_berkas_tenant_unit ON berkas(tenant_id, unit_id);
CREATE INDEX idx_berkas_tenant_tahun ON berkas(tenant_id, tahun);
CREATE INDEX idx_berkas_tenant_status ON berkas(tenant_id, status);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notes_berkas ON berkas_notes(berkas_id, created_at);
CREATE INDEX idx_doc_reg ON document_registers(tenant_id, document_type_kode, tahun);
"""

statements = [s.strip() for s in idx_sql.split(';') if s.strip()]
for s in statements:
    try:
        conn.run(s + ';')
    except Exception as e:
        print(f"  SKIP (non-fatal): {str(e)[:100]}")

print("Indexes done!")

# RLS
print("RLS enable...")
tables = [
    'tenants','organizations','personel','tenant_variables','klasifikasi','terlapor',
    'pengaduan','pengaduan_terlapor','berkas','perdamaian','tindak_lanjut',
    'document_types','templates','template_user_settings','document_registers','documents',
    'notifications','status_history','audit_logs','error_logs','berkas_notes','saved_searches'
]
for t in tables:
    try: conn.run(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY")
    except: pass

# Helpers
conn.run("""
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$ SELECT tenant_id FROM personel WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;
CREATE OR REPLACE FUNCTION current_user_role() RETURNS VARCHAR AS $$ SELECT role FROM personel WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;
CREATE OR REPLACE FUNCTION current_user_org() RETURNS UUID AS $$ SELECT organization_id FROM personel WHERE id = auth.uid(); $$ LANGUAGE sql STABLE SECURITY DEFINER;
""")
print("Helpers done!")

# Basic tenant isolation
basic_tables = ['organizations','personel','tenant_variables','klasifikasi','terlapor','pengaduan','berkas',
                'perdamaian','tindak_lanjut','document_types','templates','document_registers','documents']
for t in basic_tables:
    try: conn.run(f"CREATE POLICY {t}_tenant ON {t} FOR ALL USING (tenant_id = current_tenant_id())")
    except: pass

# Special policies
policies = [
    "CREATE POLICY pt_tenant ON pengaduan_terlapor FOR ALL USING (EXISTS (SELECT 1 FROM pengaduan p WHERE p.id = pengaduan_id AND p.tenant_id = current_tenant_id()))",
    "CREATE POLICY notif_own ON notifications FOR ALL USING (user_id = auth.uid())",
    "CREATE POLICY tus_own ON template_user_settings FOR ALL USING (user_id = auth.uid())",
    "CREATE POLICY ss_own ON saved_searches FOR ALL USING (user_id = auth.uid())",
    "CREATE POLICY audit_read ON audit_logs FOR SELECT USING (tenant_id = current_tenant_id())",
    "CREATE POLICY personel_admin ON personel FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid','oversight'))",
    "CREATE POLICY pengaduan_unit ON pengaduan FOR SELECT USING (current_user_role() = 'oversight' OR current_user_role() = 'admin_subbid' OR (current_user_role() = 'operator_unit' AND unit_id = current_user_org()))",
    "CREATE POLICY pengaduan_insert ON pengaduan FOR INSERT WITH CHECK (current_user_role() IN ('admin_subbid','oversight'))",
    "CREATE POLICY berkas_unit ON berkas FOR SELECT USING (current_user_role() IN ('oversight','admin_subbid') OR (current_user_role() = 'operator_unit' AND unit_id = current_user_org()))",
    "CREATE POLICY berkas_insert ON berkas FOR INSERT WITH CHECK (current_user_role() IN ('oversight','admin_subbid','operator_unit'))",
    "CREATE POLICY oversight_tenants ON tenants FOR SELECT USING (current_user_role() = 'oversight' OR id = current_tenant_id())",
]
for p in policies:
    try: conn.run(p)
    except Exception as e: print(f"  Policy skip: {str(e)[:80]}")

print("RLS done!")

conn.close()
print("\nCOMPLETE!")
