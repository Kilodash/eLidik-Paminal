import pg8000.native
conn = pg8000.native.Connection(host="aws-1-ap-southeast-1.pooler.supabase.com", port=5432, database="postgres", user="postgres.kzekrzdyyhedstoaihlt", password="\044\046Kilodash123")

conn.run("CREATE TABLE IF NOT EXISTS perdamaian (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pengaduan_id UUID REFERENCES pengaduan(id), berkas_id UUID REFERENCES berkas(id), tenant_id UUID NOT NULL REFERENCES tenants(id), tahap_saat_damai VARCHAR, tgl_perdamaian DATE, kronologi TEXT, pihak_hadir TEXT, created_by UUID REFERENCES personel(id), created_at TIMESTAMPTZ DEFAULT now())")
conn.run("CREATE TABLE IF NOT EXISTS tindak_lanjut (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id), berkas_id UUID REFERENCES berkas(id), deskripsi TEXT, status_tl VARCHAR DEFAULT 'open', tgl_target DATE, tgl_selesai DATE, catatan TEXT, created_by UUID REFERENCES personel(id), created_at TIMESTAMPTZ DEFAULT now())")
conn.run("ALTER TABLE perdamaian ENABLE ROW LEVEL SECURITY")
conn.run("ALTER TABLE tindak_lanjut ENABLE ROW LEVEL SECURITY")
conn.run("CREATE POLICY perdamaian_tenant ON perdamaian FOR ALL USING (tenant_id = current_tenant_id())")
conn.run("CREATE POLICY tl_tenant ON tindak_lanjut FOR ALL USING (tenant_id = current_tenant_id())")

rows = conn.run("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
print(f"TABLES: {len(rows)}")
for r in rows: print(f"  {r[0]}")
conn.close()
print("Done!")
