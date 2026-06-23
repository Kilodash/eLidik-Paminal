-- Master template_variables: definisi field form per jenis dokumen (admin-only, tanpa tenant scope).
-- Setiap dokumen punya daftar variabel dengan tipe input, validasi, dll.

CREATE TABLE IF NOT EXISTS template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_kode VARCHAR NOT NULL,
  variable_key VARCHAR NOT NULL,
  variable_label VARCHAR NOT NULL,
  source VARCHAR NOT NULL DEFAULT 'user_input'
    CHECK (source IN ('tenant','pengaduan','system','user_input','metadata')),
  input_type VARCHAR NOT NULL DEFAULT 'text'
    CHECK (input_type IN ('text','textarea','date','select','list','checkbox_group','auto')),
  display_order INTEGER NOT NULL DEFAULT 0,
  display_group VARCHAR NOT NULL DEFAULT 'Umum',
  required BOOLEAN NOT NULL DEFAULT false,
  list_config JSONB,
  validation JSONB,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_type_kode, variable_key)
);

-- Indeks untuk lookup per jenis dokumen.
CREATE INDEX IF NOT EXISTS idx_template_variables_dt_kode ON template_variables(document_type_kode);

-- Allow admin users full access; operator_unit tidak punya akses.
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_variables_admin_full"
  ON template_variables
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM personel
      WHERE personel.id = auth.uid()
      AND personel.role IN ('oversight', 'admin_subbid')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personel
      WHERE personel.id = auth.uid()
      AND personel.role IN ('oversight', 'admin_subbid')
    )
  );
