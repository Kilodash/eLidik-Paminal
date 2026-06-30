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

  // Ambil 30 row tanpa filter, lihat distribusi field disposisi
  const p = {
    ...META,
    orderBy: 'created_date',
    order: 'desc',
    size: 30,
    filters: [],
    page: 1,
  };
  const r = await fc(`${BASE}/api/v1/apps/data/management/get-all`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(p),
  });
  const j = await r.json();
  const rows = j.data || [];
  console.log(`Total rows: ${rows.length}\n`);

  // Distribusi disposisi_polda
  const distPolda = {};
  const distCasePos = {};
  const distStatus = {};
  for (const d of rows) {
    const dp = d.disposisi_polda || '(null)';
    const dc = d.disposisi_case_position || '(null)';
    const st = d.status_label || '(null)';
    distPolda[dp] = (distPolda[dp] || 0) + 1;
    distCasePos[dc] = (distCasePos[dc] || 0) + 1;
    distStatus[st] = (distStatus[st] || 0) + 1;
  }

  console.log('Distribusi disposisi_polda:');
  for (const [k, v] of Object.entries(distPolda)) console.log(`  ${k}: ${v}`);
  console.log('\nDistribusi disposisi_case_position:');
  for (const [k, v] of Object.entries(distCasePos)) console.log(`  ${k}: ${v}`);
  console.log('\nDistribusi status_label:');
  for (const [k, v] of Object.entries(distStatus)) console.log(`  ${k}: ${v}`);

  // Cari row yang disposisi_polda-nya tidak null
  const withPolda = rows.filter((d) => d.disposisi_polda);
  console.log(`\nRow dengan disposisi_polda tidak null: ${withPolda.length}`);
  for (const d of withPolda.slice(0, 5)) {
    console.log(
      `  id=${d.id} | disposisi_polda=${JSON.stringify(d.disposisi_polda)} | polda=${JSON.stringify(d.polda)} | disposisi_case_position=${JSON.stringify(d.disposisi_case_position)} | status=${d.status_label}`,
    );
  }

  // Cari row yang polda-nya tidak null
  const withPoldaField = rows.filter((d) => d.polda);
  console.log(`\nRow dengan polda tidak null: ${withPoldaField.length}`);
  for (const d of withPoldaField.slice(0, 5)) {
    console.log(
      `  id=${d.id} | polda=${JSON.stringify(d.polda)} | polda_code=${d.polda_code} | disposisi_polda=${JSON.stringify(d.disposisi_polda)} | disposisi_case_position=${JSON.stringify(d.disposisi_case_position)}`,
    );
  }

  // --- Tes filter exact "POLDA JAWA BARAT" ---
  console.log('\n--- Tes filter disposisi_polda is "POLDA JAWA BARAT" ---');
  const p2 = {
    ...META,
    orderBy: 'created_date',
    order: 'desc',
    size: 10,
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
  const r2 = await fc(`${BASE}/api/v1/apps/data/management/get-all`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(p2),
  });
  const j2 = await r2.json();
  const rows2 = j2.data || [];
  console.log(`Rows: ${rows2.length}`);
  for (const d of rows2.slice(0, 5)) {
    console.log(
      `  id=${d.id} | disposisi_polda=${JSON.stringify(d.disposisi_polda)} | disposisi_case_position=${JSON.stringify(d.disposisi_case_position)} | status=${d.status_label}`,
    );
  }

  // --- Tes filter isOneOf ["POLDA JAWA BARAT"] ---
  console.log('\n--- Tes filter disposisi_polda isOneOf ["POLDA JAWA BARAT"] ---');
  const p3 = {
    ...META,
    orderBy: 'created_date',
    order: 'desc',
    size: 10,
    filters: [
      {
        field: 'disposisi_polda',
        fieldType: 'string',
        operator: 'is one of',
        table: 'gold.report',
        value: { is: '', isOneOf: ['POLDA JAWA BARAT'], gte: 0, lte: 0 },
      },
    ],
    page: 1,
  };
  const r3 = await fc(`${BASE}/api/v1/apps/data/management/get-all`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(p3),
  });
  const j3 = await r3.json();
  const rows3 = j3.data || [];
  console.log(`Rows: ${rows3.length}`);
  for (const d of rows3.slice(0, 5)) {
    console.log(
      `  id=${d.id} | disposisi_polda=${JSON.stringify(d.disposisi_polda)} | disposisi_case_position=${JSON.stringify(d.disposisi_case_position)} | status=${d.status_label}`,
    );
  }

  // --- Tes write dengan filter _id (bukan id) ---
  console.log('\n--- Tes PUT update variasi ---');
  if (rows2.length > 0) {
    const sample = rows2[0];
    const variants = [
      {
        label: 'filter id + data[+_id]',
        body: {
          ...META,
          createdBy: process.env.GAJAMADA_USERNAME.trim(),
          filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
          data: [{ _id: sample.id, status_label: sample.status_label }],
        },
      },
      {
        label: 'table=report (no schema) + filter id',
        body: {
          ...META,
          table: 'report',
          createdBy: process.env.GAJAMADA_USERNAME.trim(),
          filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
          data: [{ status_label: sample.status_label }],
        },
      },
      {
        label: 'table=gold.report + database=divpropam + filter id',
        body: {
          ...META,
          database: 'divpropam',
          createdBy: process.env.GAJAMADA_USERNAME.trim(),
          filters: [{ field: 'id', operator: 'is', value: { is: sample.id } }],
          data: [{ status_label: sample.status_label }],
        },
      },
      {
        label: 'no filters + data[+_id]',
        body: {
          ...META,
          createdBy: process.env.GAJAMADA_USERNAME.trim(),
          data: [{ _id: sample.id, status_label: sample.status_label }],
        },
      },
      {
        label: 'table=gold.report + id field (not filters)',
        body: {
          ...META,
          createdBy: process.env.GAJAMADA_USERNAME.trim(),
          id: sample.id,
          data: [{ status_label: sample.status_label }],
        },
      },
    ];

    for (const v of variants) {
      const wr = await fc(`${BASE}/api/v1/apps/data/management/update`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify(v.body),
      });
      const wt = await wr.text();
      const ok = wr.status >= 200 && wr.status < 300;
      const icon = ok ? '✅' : '🟡';
      console.log(`  ${icon} ${v.label.padEnd(45)} HTTP ${wr.status}: ${wt.slice(0, 200)}`);
    }
  }
}

main().catch((e) => console.error(e.message));
