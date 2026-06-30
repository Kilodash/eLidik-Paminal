import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import makeFetchCookie from 'fetch-cookie';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [k, ...r] = line.split('=');
    if (k && !k.startsWith('#'))
      process.env[k] = r
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
  }
}
const BASE = 'https://gajamada-propam.polri.go.id';
const fc = makeFetchCookie(fetch);

const GATEWAY_ID = 'aa6159ec4d7847e8282943f7dfe87c29';
const WIDGET_ID = '6f2cfeabd19ddafce8fc98f5c9d9ad63';
const MENU_ID = '01f63e60376afe827638ed614e1cea76';
const DASHBOARD_ID = '1769155096865';
const USER_ID = 'a07611b17f063f8b5460f2eaa5c7deda';

async function main() {
  const lr = await fc(`${BASE}/api/v1/apps/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.GAJAMADA_USERNAME.trim(),
      password: process.env.GAJAMADA_PASSWORD,
    }),
  });
  const tok = (lr.headers.getSetCookie?.() || [])
    .map((c) => c.match(/token=([^;]+)/)?.[1])
    .find(Boolean);
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` };
  console.log('Login OK');

  // Ambil 1 row JABAR untuk test
  const p = {
    connectionId: '245b8fd7c4a763019d5172fad5ec0086',
    table: 'gold.report',
    database: 'divpropam',
    orderBy: 'created_date',
    order: 'desc',
    size: 3,
    metaData: {
      widgetId: '8533ca87b75e04b1f39d19d98dabc0ef',
      menuId: 'ce64015a07578d9195a0e589de1108c8',
      dashboardId: DASHBOARD_ID,
      mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
      userId: USER_ID,
      domain: 'gajamada-propam.polri.go.id',
    },
    filters: [
      {
        field: 'disposisi_polda',
        fieldType: 'string',
        operator: 'is',
        table: 'gold.report',
        value: { is: 'POLDA JAWA BARAT' },
      },
    ],
    page: 1,
  };
  const r = await fc(`${BASE}/api/v1/apps/data/management/get-all`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(p),
  });
  const j = await r.json();
  const rows = j.data || [];
  console.log(`Rows: ${rows.length}`);
  if (!rows.length) {
    console.log('No rows');
    return;
  }

  // Cari row yang case_position-nya belum di kasubbid (untuk test terima)
  const sample = rows.find((d) => !d.disposisi_case_position?.includes('KASUBBID')) || rows[0];
  console.log(`Sample: id=${sample.id} p_id=${sample.p_id}`);
  console.log(`  case_position=${sample.disposisi_case_position}`);
  console.log(`  status=${sample.status_label}`);

  // PROBE 1: Aksi "terima laporan" — set case_position ke KASUBBID PAMINAL
  console.log('\n--- PROBE: Terima laporan (set ke KASUBBID PAMINAL POLDA JAWA BARAT) ---\n');
  const actionPayload = {
    client: 'Propam Polri',
    gatewayId: GATEWAY_ID,
    params: {
      report_id: sample.p_id,
      note: 'PROBE: test terima laporan dari app eLidik-Paminal',
      createdBy: 'KASUBBID PAMINAL POLDA JAWA BARAT',
      case_handover: 'POLDA JAWA BARAT',
      status: 'Laporan Diterima',
      case_position: 'KASUBBID PAMINAL POLDA JAWA BARAT',
    },
    body: {},
    headers: {},
    additionalPath: '',
    additionalParams: {},
    additionalFileParams: {},
    tags: ['Propam Polri'],
    createdBy: USER_ID,
    startDate: '',
    endDate: '',
    dashboardId: DASHBOARD_ID,
    sessionId: '',
    logging: false,
    appendedLog: false,
    metaData: {
      widgetId: WIDGET_ID,
      widgetName: 'Widget Aksi',
      menuId: MENU_ID,
      menuName: 'Detail Laporan',
      dashboardId: DASHBOARD_ID,
      dashboardName: 'Propam Aduan',
      userId: USER_ID,
      domain: '',
    },
  };

  const ar = await fc(`${BASE}/api/v1/apps/api/gateway/execute`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(actionPayload),
  });
  const at = await ar.text();
  console.log(`HTTP ${ar.status}`);
  try {
    const aj = JSON.parse(at);
    console.log('Status:', aj.metaData?.status);
    console.log('Message:', aj.metaData?.message);
    console.log('Execution:', aj.data?.executionStatus);
    console.log('Response:', JSON.stringify(aj.data?.response, null, 2));
  } catch {
    console.log('Raw:', at.slice(0, 500));
  }
}

main().catch((e) => console.error(e.message));
