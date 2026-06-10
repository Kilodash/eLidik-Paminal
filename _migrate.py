import pg8000.native

conn = pg8000.native.Connection(
    host="aws-1-ap-southeast-1.pooler.supabase.com",
    port=5432,
    database="postgres",
    user="postgres.kzekrzdyyhedstoaihlt",
    password="\044\046Kilodash123",
)

# Drop everything first
conn.run("DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$; DROP EXTENSION IF EXISTS pg_trgm CASCADE;")
print("Reset complete")

# Now execute each CREATE TABLE separately, then FKs, then extras
# Phase 1: Create all base tables
statements = [
    # === 001 ===
    """CREATE TABLE tenants (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), kode VARCHAR UNIQUE NOT NULL, nama VARCHAR NOT NULL, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), parent_id UUID REFERENCES organizations(id), tipe VARCHAR CHECK (tipe IN ('bidpropam','subbid','unit')), kode VARCHAR, nama VARCHAR NOT NULL, UNIQUE(tenant_id, kode))""",
    """CREATE TABLE personel (id UUID PRIMARY KEY REFERENCES auth.users(id), tenant_id UUID NOT NULL REFERENCES tenants(id), organization_id UUID REFERENCES organizations(id), role VARCHAR CHECK (role IN ('oversight','admin_subbid','operator_unit')), nip VARCHAR, nama_lengkap VARCHAR, pangkat VARCHAR, jabatan VARCHAR, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE tenant_variables (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), key VARCHAR NOT NULL, value TEXT, UNIQUE(tenant_id, key))""",
    # === 002 ===  
    """CREATE TABLE klasifikasi (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), kode VARCHAR, nama VARCHAR NOT NULL, UNIQUE(tenant_id, kode))""",
    """CREATE TABLE terlapor (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), nama VARCHAR, nrp VARCHAR, nip VARCHAR, pangkat VARCHAR, jabatan VARCHAR, kesatuan VARCHAR, personel_id UUID REFERENCES personel(id), status_identitas VARCHAR DEFAULT 'diketahui', created_at TIMESTAMPTZ DEFAULT now())""",
    # === 003: berkas first (no FK to pengaduan) ===
    """CREATE TABLE berkas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), unit_id UUID REFERENCES organizations(id), nomor_berkas VARCHAR, judul VARCHAR, tahun INTEGER NOT NULL, status VARCHAR DEFAULT 'open', tahap VARCHAR, tgl_target DATE, operator_id UUID REFERENCES personel(id), created_at TIMESTAMPTZ DEFAULT now())""",
    # === pengaduan (FK to berkas) ===
    """CREATE TABLE pengaduan (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), unit_id UUID REFERENCES organizations(id), berkas_id UUID REFERENCES berkas(id), nomor_register VARCHAR, jenis VARCHAR CHECK (jenis IN ('pengaduan','laporan_informasi')), tgl_pengaduan DATE DEFAULT CURRENT_DATE, pelapor_nama VARCHAR, pelapor_kontak VARCHAR, satker_dilaporkan VARCHAR, klasifikasi_id UUID REFERENCES klasifikasi(id), kronologi VARCHAR(5000), atensi BOOLEAN DEFAULT false, status VARCHAR DEFAULT 'diterima', search_vector tsvector, created_by UUID REFERENCES personel(id), created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE pengaduan_terlapor (pengaduan_id UUID REFERENCES pengaduan(id) ON DELETE CASCADE, terlapor_id UUID REFERENCES terlapor(id), PRIMARY KEY (pengaduan_id, terlapor_id))""",
    # === 004: document tables ===
    """CREATE TABLE document_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), kode VARCHAR, nama VARCHAR, tahap VARCHAR, jenis_naskah VARCHAR, kopstuk_tipe VARCHAR, tribrata VARCHAR, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), document_type_id UUID REFERENCES document_types(id), content TEXT NOT NULL, header_html TEXT, footer_html TEXT, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE template_user_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES personel(id), template_id UUID NOT NULL REFERENCES templates(id), editor_prefs JSONB, UNIQUE(user_id, template_id))""",
    """CREATE TABLE document_registers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), document_type_kode VARCHAR NOT NULL, tahun INTEGER NOT NULL, bulan INTEGER, nomor_terakhir INTEGER DEFAULT 0, UNIQUE(tenant_id, document_type_kode, tahun, bulan))""",
    """CREATE TABLE documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), template_id UUID REFERENCES templates(id), pengaduan_id UUID REFERENCES pengaduan(id), berkas_id UUID REFERENCES berkas(id), tahap VARCHAR, nomor_surat VARCHAR, tgl_dokumen DATE, content_rendered TEXT, file_pdf TEXT, status VARCHAR DEFAULT 'draft', created_by UUID REFERENCES personel(id), created_at TIMESTAMPTZ DEFAULT now())""",
    # === 005: monitoring ===
    """CREATE TABLE notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), user_id UUID NOT NULL REFERENCES personel(id), judul VARCHAR, isi TEXT, link VARCHAR, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE status_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), ref_type VARCHAR, ref_id UUID, status_lama VARCHAR, status_baru VARCHAR, catatan TEXT, user_id UUID REFERENCES personel(id), created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, user_id UUID, action VARCHAR NOT NULL, entity_type VARCHAR NOT NULL, entity_id UUID, summary VARCHAR, old_values JSONB, new_values JSONB, ip_address VARCHAR, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE error_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID, user_id UUID, level VARCHAR DEFAULT 'error', message TEXT, stack_trace TEXT, context JSONB, source VARCHAR, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE berkas_notes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), berkas_id UUID NOT NULL REFERENCES berkas(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES personel(id), content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())""",
    """CREATE TABLE saved_searches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES personel(id), nama VARCHAR NOT NULL, filters JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())""",
]

for i, stmt in enumerate(statements):
    try:
        conn.run(stmt)
        if i % 5 == 0: print(f"  OK: table group {i//5 + 1}")
    except Exception as e:
        print(f"  ERROR table {i}: {e}")

print(f"\n{len(statements)} tables created")
print("Phase 2: Functions, triggers, indexes, RLS...")
conn.close()
print("Done!")
