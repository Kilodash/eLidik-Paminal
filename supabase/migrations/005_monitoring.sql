-- 005: Notification, Status History, Audit Logs, Error Logs, Berkas Notes, Saved Searches

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES personel(id),
  judul VARCHAR,
  isi TEXT,
  link VARCHAR,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ref_type VARCHAR,
  ref_id UUID,
  status_lama VARCHAR,
  status_baru VARCHAR,
  catatan TEXT,
  user_id UUID REFERENCES personel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID,
  summary VARCHAR,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  level VARCHAR DEFAULT 'error',
  message TEXT,
  stack_trace TEXT,
  context JSONB,
  source VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE berkas_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  berkas_id UUID NOT NULL REFERENCES berkas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES personel(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES personel(id),
  nama VARCHAR NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
