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

const META = {
  connectionId: '245b8fd7c4a763019d5172fad5ec0086',
  table: 'gold.report',
  database: 'divpropam',
  metaData: {
    widgetId: '8533ca87b75e04b1f39d19d98dabc0ef',
    menuId: 'ce64015a07578d9195a0e589de1108c8',
    dashboardId: '1769155096865',
    mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
    userId: 'a07611b17f063f8b5460f2eaa5c7deda',
    domain: 'gajamada-propam.polri.go.id',
  },
};

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

  // Ambil 1 row JABAR yang posisinya sudah di kasubbid
  const p = {
    ...META,
    orderBy: 'created_date',
    order: 'desc',
    size: 5,
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
  const sample = rows.find((d) => d.disposisi_case_position?.includes('KASUBBID')) || rows[0];
  if (!sample) {
    console.log('No sample found');
    return;
  }
  console.log(
    `Sample: id=${sample.id} p_id=${sample.p_id} pos=${sample.disposisi_case_position} status=${sample.status_label}`,
  );

  // Daftar variasi probe untuk update disposisi_case_position
  const variants = [
    {
      label: 'filter id + primaryKey=id',
      body: {
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        primaryKey: 'id',
        filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
        data: [{ disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'filter p_id',
      body: {
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        filters: [{ field: 'p_id', operator: 'is', value: { is: sample.p_id } }],
        data: [{ disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'idField=id',
      body: {
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        idField: 'id',
        filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
        data: [{ disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'data with id field (no filters)',
      body: {
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        data: [{ id: sample.id, disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'data with p_id (no filters)',
      body: {
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        data: [{ p_id: sample.p_id, disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'filter id + data with id',
      body: {
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
        data: [{ id: sample.id, disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'database + schema in table',
      body: {
        ...META,
        database: 'divpropam',
        table: 'report',
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
        data: [{ disposisi_case_position: sample.disposisi_case_position }],
      },
    },
    {
      label: 'schema field',
      body: {
        ...META,
        schema: 'gold',
        table: 'report',
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
        data: [{ disposisi_case_position: sample.disposisi_case_position }],
      },
    },
  ];

  console.log('\n--- Probe update disposisi_case_position ---\n');
  for (const v of variants) {
    const wr = await fc(`${BASE}/api/v1/apps/data/management/update`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify(v.body),
    });
    const wt = await wr.text();
    const ok = wr.status >= 200 && wr.status < 300;
    const icon = ok ? '✅' : '🟡';
    console.log(`${icon} ${v.label.padEnd(45)} HTTP ${wr.status}: ${wt.slice(0, 250)}`);
  }

  // Coba endpoint alternatif: /api/v1/apps/data/management/disposisi
  console.log('\n--- Endpoint alternatif ---\n');
  const altPaths = [
    { method: 'POST', path: '/api/v1/apps/data/management/disposisi' },
    { method: 'POST', path: '/api/v1/apps/data/management/forward' },
    { method: 'POST', path: '/api/v1/apps/data/management/assign' },
    { method: 'POST', path: '/api/v1/apps/data/management/move' },
    { method: 'POST', path: '/api/v1/apps/data/management/transfer' },
    { method: 'POST', path: '/api/v1/apps/data/management/change-position' },
    { method: 'POST', path: '/api/v1/apps/data/management/update-position' },
    { method: 'PUT', path: '/api/v1/apps/data/management/disposisi' },
  ];
  for (const alt of altPaths) {
    const wr = await fc(`${BASE}${alt.path}`, {
      method: alt.method,
      headers: h,
      body: JSON.stringify({
        ...META,
        createdBy: process.env.GAJAMADA_USERNAME.trim(),
        id: sample.id,
        disposisi_case_position: 'KABAG BINPAM BIRO PAMINAL',
      }),
    });
    const wt = await wr.text();
    const icon = wr.status === 404 ? '⚪' : wr.status === 405 ? '🟡' : '❔';
    console.log(
      `${icon} ${alt.method.padEnd(7)} ${wr.status.toString().padEnd(4)} ${alt.path} — ${wt.slice(0, 150)}`,
    );
  }
}

main().catch((e) => console.error(e.message));
