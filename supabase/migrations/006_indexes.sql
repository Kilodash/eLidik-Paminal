-- 006: Indexes for performance

-- Pengaduan
CREATE INDEX idx_pengaduan_tenant_status ON pengaduan(tenant_id, status);
CREATE INDEX idx_pengaduan_tenant_unit ON pengaduan(tenant_id, unit_id);
CREATE INDEX idx_pengaduan_tenant_tgl ON pengaduan(tenant_id, tgl_pengaduan DESC);
CREATE INDEX idx_pengaduan_tenant_klasifikasi ON pengaduan(tenant_id, klasifikasi_id);
CREATE INDEX idx_pengaduan_overdue ON pengaduan(tenant_id, tgl_target)
  WHERE status NOT IN ('closed', 'perdamaian');

-- Berkas
CREATE INDEX idx_berkas_tenant_unit ON berkas(tenant_id, unit_id);
CREATE INDEX idx_berkas_tenant_tahun ON berkas(tenant_id, tahun);
CREATE INDEX idx_berkas_tenant_status ON berkas(tenant_id, status);

-- Notifications (partial — unread only)
CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Audit logs (recent 90 days)
CREATE INDEX idx_audit_recent ON audit_logs(tenant_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '90 days';

-- Berkas notes
CREATE INDEX idx_notes_berkas ON berkas_notes(berkas_id, created_at);

-- Document registers
CREATE INDEX idx_doc_reg ON document_registers(tenant_id, document_type_kode, tahun);

-- Full-text search (Indonesian)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_pengaduan_kronologi_trgm ON pengaduan USING gin(kronologi gin_trgm_ops);
