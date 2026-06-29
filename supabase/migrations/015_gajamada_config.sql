-- 015: Konfigurasi Gajamada (connectionId, dashboardId, dll.)

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM tenants LOOP
    INSERT INTO tenant_variables (tenant_id, key, value) VALUES
      (t.id, 'gajamada_connection_id', '245b8fd7c4a763019d5172fad5ec0086'),
      (t.id, 'gajamada_database', 'divpropam'),
      (t.id, 'gajamada_table', 'gold.report'),
      (t.id, 'gajamada_dashboard_id', '1769155096865'),
      (t.id, 'gajamada_menu_id', 'ce64015a07578d9195a0e589de1108c8'),
      (t.id, 'gajamada_widget_id', '8533ca87b75e04b1f39d19d98dabc0ef'),
      (t.id, 'gajamada_mdm_id', 'ca44e3fd8f252225954a7d2bafa376d4'),
      (t.id, 'gajamada_user_id', 'a07611b17f063f8b5460f2eaa5c7deda'),
      (t.id, 'gajamada_domain', 'gajamada-propam.polri.go.id'),
      (t.id, 'gajamada_status_exclude', '["Tolak","Laporan Ditolak Polda","Laporan ditolak"]'),
      (t.id, 'gajamada_disposisi_polda_template', 'POLDA {KODE}'),
      (t.id, 'gajamada_disposisi_case_position_template', 'KASUBBID PAMINAL POLDA {NAMA}')
    ON CONFLICT (tenant_id, key) DO NOTHING;
  END LOOP;
END $$;
