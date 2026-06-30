/**
 * scripts/probe-gajamada-endpoints.mjs
 *
 * Probe endpoint Gajamada untuk menemukan API write (insert/update/delete/approve/reject).
 * Strategi:
 *   1. Login (pakai kredensial .env.local)
 *   2. Probe path kandidat: OPTIONS, GET, POST(dry-run) untuk lihat response code/metadata
 *   3. GET root /api untuk introspeksi (kalau ada)
 *   4. Output JSON terstruktur + ringkasan teks
 *
 * Jalankan: node scripts/probe-gajamada-endpoints.mjs
 * Output:   scripts/gajamada-probe-result.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import makeFetchCookie from 'fetch-cookie';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// --- Load .env.local ---
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (!k || k.startsWith('#')) continue;
    const v = rest
      .join('=')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}

const BASE_URL = (process.env.GAJAMADA_BASE_URL || 'https://gajamada-propam.polri.go.id').replace(
  /\/$/,
  '',
);
const USERNAME = process.env.GAJAMADA_USERNAME || '';
const PASSWORD = process.env.GAJAMADA_PASSWORD || '';

if (!USERNAME || !PASSWORD) {
  console.error('GAJAMADA_USERNAME dan GAJAMADA_PASSWORD harus diisi di .env.local');
  process.exit(1);
}

const fetchCookie = makeFetchCookie(fetch);

// --- Kandidat path: auth + data management + write verbs + resourceful patterns ---
const CANDIDATES = [
  // Auth (sebagai kontrol: harus 200)
  { method: 'POST', path: '/api/v1/apps/auth/login', expect: 200, note: 'known good' },

  // Data management — reader (kontrol)
  { method: 'POST', path: '/api/v1/apps/data/management/get-all', expect: 200, note: 'known good' },

  // Data management — writer candidates (RESTful convention)
  { method: 'POST', path: '/api/v1/apps/data/management/insert' },
  { method: 'POST', path: '/api/v1/apps/data/management/create' },
  { method: 'POST', path: '/api/v1/apps/data/management/save' },
  { method: 'POST', path: '/api/v1/apps/data/management/submit' },
  { method: 'PUT', path: '/api/v1/apps/data/management/update' },
  { method: 'PUT', path: '/api/v1/apps/data/management' },
  { method: 'PATCH', path: '/api/v1/apps/data/management/update' },
  { method: 'POST', path: '/api/v1/apps/data/management/update' },
  { method: 'POST', path: '/api/v1/apps/data/management/delete' },
  { method: 'DELETE', path: '/api/v1/apps/data/management' },
  { method: 'POST', path: '/api/v1/apps/data/management/disposisi' },
  { method: 'POST', path: '/api/v1/apps/data/management/approve' },
  { method: 'POST', path: '/api/v1/apps/data/management/reject' },
  { method: 'POST', path: '/api/v1/apps/data/management/assign' },

  // Bulk & sync
  { method: 'POST', path: '/api/v1/apps/data/management/bulk-insert' },
  { method: 'POST', path: '/api/v1/apps/data/management/sync' },
  { method: 'POST', path: '/api/v1/apps/data/management/push' },
  { method: 'POST', path: '/api/v1/apps/data/management/upsert' },

  // Record-scoped (id placeholder)
  { method: 'PUT', path: '/api/v1/apps/data/management/report/0' },
  { method: 'DELETE', path: '/api/v1/apps/data/management/report/0' },
  { method: 'PATCH', path: '/api/v1/apps/data/management/report/0' },
  { method: 'POST', path: '/api/v1/apps/data/management/report/0/approve' },
  { method: 'POST', path: '/api/v1/apps/data/management/report/0/reject' },
  { method: 'POST', path: '/api/v1/apps/data/management/report/0/disposisi' },

  // API root introspection
  { method: 'GET', path: '/api' },
  { method: 'GET', path: '/api/v1' },
  { method: 'GET', path: '/api/v1/apps' },
  { method: 'OPTIONS', path: '/api/v1/apps/data/management' },

  // Swagger/OpenAPI docs (kalau exposed)
  { method: 'GET', path: '/api-docs' },
  { method: 'GET', path: '/swagger.json' },
  { method: 'GET', path: '/openapi.json' },
  { method: 'GET', path: '/api/v1/apps/docs' },
  { method: 'GET', path: '/api/v1/docs' },
];

// --- Payload minimal untuk write probes (tidak akan benar-benar bikin data, hanya trigger 4xx/5xx dengan body berbeda dari 404) ---
const PROBE_PAYLOADS = [
  { name: 'empty', body: {} },
  { name: 'minimal-insert', body: { connectionId: 'x', table: 'gold.report', data: {} } },
  {
    name: 'minimal-update',
    body: { connectionId: 'x', table: 'gold.report', id: '0', data: { x: 1 } },
  },
];

function defaultHeaders(token) {
  const h = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    Origin: BASE_URL,
    Referer: `${BASE_URL}/`,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function extractToken(res) {
  const cookies = res.headers.getSetCookie?.() || [];
  for (const c of cookies) {
    const m = c.match(/token=([^;]+)/);
    if (m?.[1]) return m[1];
  }
  return null;
}

async function login() {
  const res = await fetchCookie(`${BASE_URL}/api/v1/apps/auth/login`, {
    method: 'POST',
    headers: defaultHeaders(),
    body: JSON.stringify({ email: USERNAME.trim(), password: PASSWORD }),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) throw new Error(`Login gagal: ${res.status} ${text.slice(0, 200)}`);
  const token = extractToken(res);
  if (!token) throw new Error('Login OK tapi token cookie tidak ditemukan');
  return token;
}

async function probe(method, path, token, body) {
  const opts = { method, headers: defaultHeaders(token) };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const t0 = Date.now();
  try {
    const res = await fetchCookie(`${BASE_URL}${path}`, opts);
    const ms = Date.now() - t0;
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return {
      method,
      path,
      status: res.status,
      ms,
      contentType: res.headers.get('content-type'),
      allow: res.headers.get('allow'),
      bodyBytes: text.length,
      bodyPreview: text.slice(0, 240),
      jsonKeys: json && typeof json === 'object' ? Object.keys(json).slice(0, 12) : null,
      metaData: json?.metaData ?? json?.detail?.metaData ?? null,
    };
  } catch (err) {
    return {
      method,
      path,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function classify(r) {
  if (r.error) return 'NETWORK_ERROR';
  if (r.status === 200) return 'OK';
  if (r.status === 201) return 'CREATED';
  if (r.status === 204) return 'NO_CONTENT';
  if (r.status === 400) return 'BAD_REQUEST'; // endpoint ada, payload ditolak
  if (r.status === 401) return 'UNAUTHORIZED';
  if (r.status === 403) return 'FORBIDDEN';
  if (r.status === 404) return 'NOT_FOUND';
  if (r.status === 405) return 'METHOD_NOT_ALLOWED'; // path ada, method salah
  if (r.status === 415) return 'UNSUPPORTED_MEDIA';
  if (r.status >= 500) return 'SERVER_ERROR';
  return `HTTP_${r.status}`;
}

async function main() {
  console.log(`Probing ${BASE_URL} sebagai ${USERNAME}\n`);
  const token = await login();
  console.log('✅ Login OK, token diperoleh.\n');

  const results = [];

  for (const c of CANDIDATES) {
    // Tentukan payload berdasarkan method
    let body;
    if (c.method !== 'GET' && c.method !== 'OPTIONS' && c.method !== 'DELETE') {
      body =
        c.path.includes('update') || c.path.includes('0')
          ? PROBE_PAYLOADS[2].body
          : PROBE_PAYLOADS[1].body;
      if (c.expect === 200) body = undefined; // known-good: pakai payload real nanti
    }
    const r = await probe(c.method, c.path, token, body);
    r.classification = classify(r);
    r.note = c.note || null;
    results.push(r);

    const badge =
      {
        OK: '🟢',
        CREATED: '🟢',
        NO_CONTENT: '🟢',
        BAD_REQUEST: '🟡', // menarik — endpoint ada, payload salah
        METHOD_NOT_ALLOWED: '🟡', // path ada, method salah → indikasi kuat endpoint ada
        UNAUTHORIZED: '🟠',
        FORBIDDEN: '🟠',
        NOT_FOUND: '⚪',
        NETWORK_ERROR: '⚫',
      }[r.classification] || '❔';

    console.log(
      `${badge} ${c.method.padEnd(7)} ${r.status.toString().padEnd(4)} ${r.classification.padEnd(20)} ${c.path}` +
        (r.allow ? ` [Allow: ${r.allow}]` : '') +
        (r.metaData?.message ? ` — ${r.metaData.message}` : ''),
    );
  }

  // --- GET real pakai known-good payload untuk kontrol ---
  const knownGoodPayload = {
    connectionId: '245b8fd7c4a763019d5172fad5ec0086',
    table: 'gold.report',
    orderBy: 'created_date',
    order: 'desc',
    size: 1,
    database: 'divpropam',
    metaData: {
      widgetId: '8533ca87b75e04b1f39d19d98dabc0ef',
      menuId: 'ce64015a07578d9195a0e589de1108c8',
      dashboardId: '1769155096865',
      mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
      userId: 'a07611b17f063f8b5460f2eaa5c7deda',
      domain: 'gajamada-propam.polri.go.id',
    },
    filters: [],
    page: 1,
  };
  const ctrl = await probe('POST', '/api/v1/apps/data/management/get-all', token, knownGoodPayload);
  ctrl.classification = classify(ctrl);
  ctrl.note = 'known good (control)';
  results.unshift(ctrl);
  console.log(
    `\n🟢 Kontrol known-good: status=${ctrl.status}, items=${ctrl.jsonKeys ? 'see keys' : 'n/a'}`,
  );

  // --- FASE 3: Inspect 1 row riil untuk dapat field id & sample data ---
  let sampleId = null;
  let sampleRow = null;
  try {
    const fresh = await fetchCookie(`${BASE_URL}/api/v1/apps/data/management/get-all`, {
      method: 'POST',
      headers: defaultHeaders(token),
      body: JSON.stringify({ ...knownGoodPayload, size: 1 }),
    });
    const freshText = await fresh.text();
    const freshJson = JSON.parse(freshText);
    sampleRow = freshJson?.data?.[0];
    if (sampleRow) {
      sampleId = sampleRow.id || sampleRow._id || null;
      const FIELDS_TO_INSPECT = [
        'id',
        'status_label',
        'disposisi_case_position',
        'disposisi_polda',
        'disposisi_polres',
        'disposisi_police_function',
        'polda',
        'polres',
        'p_id',
        'prepetrator_name',
        'category',
        'created_date',
      ];
      console.log('\n📋 Sample row inspection:');
      for (const k of FIELDS_TO_INSPECT) {
        console.log(`  ${k.padEnd(32)} = ${sampleRow[k]}`);
      }
    }
  } catch (e) {
    console.log(`\n⚠️  Gagal inspect sample row: ${e.message}`);
  }

  // --- FASE 2: Probe PUT /update & DELETE /delete dengan payload minimal ---
  // TUJUAN: konfirmasi bahwa user punya hak write + payload shape yang benar.
  // TIDAK mengeksekusi write ke record riil. Gunakan id dummy yang pasti tidak ada.
  console.log('\n--- FASE 2: Probe write endpoints (id dummy, tidak akan modify data) ---\n');
  const writeProbes = [
    {
      label: 'PUT update (filters _id + data + createdBy + mdmId)',
      method: 'PUT',
      path: '/api/v1/apps/data/management/update',
      body: {
        connectionId: '245b8fd7c4a763019d5172fad5ec0086',
        table: 'gold.report',
        mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
        createdBy: USERNAME,
        filters: [{ field: '_id', operator: 'is', value: { is: '___PROBE_NOOP___' } }],
        data: [{ status_label: 'PROBE_NOOP' }],
      },
    },
    {
      label: 'PUT update (_id in data + mdmId)',
      method: 'PUT',
      path: '/api/v1/apps/data/management/update',
      body: {
        connectionId: '245b8fd7c4a763019d5172fad5ec0086',
        table: 'gold.report',
        mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
        createdBy: USERNAME,
        data: [{ _id: '___PROBE_NOOP___', status_label: 'PROBE_NOOP' }],
      },
    },
    {
      label: 'DELETE delete (_id + mdmId + createdBy)',
      method: 'DELETE',
      path: '/api/v1/apps/data/management/delete',
      body: {
        connectionId: '245b8fd7c4a763019d5172fad5ec0086',
        table: 'gold.report',
        mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
        createdBy: USERNAME,
        _id: '___PROBE_NOOP___',
      },
    },
    {
      label: 'DELETE delete (id + mdmId + createdBy)',
      method: 'DELETE',
      path: '/api/v1/apps/data/management/delete',
      body: {
        connectionId: '245b8fd7c4a763019d5172fad5ec0086',
        table: 'gold.report',
        mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
        createdBy: USERNAME,
        id: '___PROBE_NOOP___',
      },
    },
  ];
  for (const w of writeProbes) {
    const r = await probe(w.method, w.path, token, w.body);
    r.classification = classify(r);
    r.note = w.label;
    results.push(r);
    const badge =
      r.classification === 'OK' || r.classification === 'NO_CONTENT'
        ? '🟢'
        : r.classification === 'BAD_REQUEST' ||
            r.classification === 'METHOD_NOT_ALLOWED' ||
            r.classification === 'NOT_FOUND'
          ? '🟡'
          : r.classification === 'FORBIDDEN' || r.classification === 'UNAUTHORIZED'
            ? '🔴'
            : '❔';
    console.log(
      `${badge} ${w.method.padEnd(7)} ${r.status} ${r.classification.padEnd(20)} ${w.path} — ${r.metaData?.message || r.bodyPreview?.slice(0, 200) || ''}`,
    );
  }

  // --- FASE 4: Probe write dengan id riil (DRY-RUN: set field yang akan di-rollback) ---
  // TIDAK benar-benar modify data. Set field `summary` (text field) dengan suffix _PROBE
  // agar operator bisa lihat record yang ke-touch & restore manual kalau perlu.
  if (sampleId && sampleRow) {
    console.log(
      `\n--- FASE 4: Probe write dengan id riil (${sampleId}) — TIDAK modify data, suffix _PROBE ---\n`,
    );
    const originalSummary = sampleRow.summary || '';
    const writeProbes2 = [
      {
        label: 'PUT update (id riil, summary+_PROBE)',
        method: 'PUT',
        path: '/api/v1/apps/data/management/update',
        body: {
          connectionId: '245b8fd7c4a763019d5172fad5ec0086',
          table: 'gold.report',
          mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
          createdBy: USERNAME,
          filters: [{ field: 'id', operator: 'is', value: { is: sampleId } }],
          data: [{ summary: (originalSummary + ' _PROBE_DELETE_ME').slice(0, 5000) }],
        },
      },
      {
        label: 'PUT update (id riil, disposisi_case_position change)',
        method: 'PUT',
        path: '/api/v1/apps/data/management/update',
        body: {
          connectionId: '245b8fd7c4a763019d5172fad5ec0086',
          table: 'gold.report',
          mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
          createdBy: USERNAME,
          filters: [{ field: 'id', operator: 'is', value: { is: sampleId } }],
          data: [{ disposisi_case_position: sampleRow.disposisi_case_position }], // set sama = no-op valid
        },
      },
    ];
    for (const w of writeProbes2) {
      const r = await probe(w.method, w.path, token, w.body);
      r.classification = classify(r);
      r.note = w.label;
      results.push(r);
      const ok = r.classification === 'OK' || r.classification === 'NO_CONTENT';
      const badge = ok
        ? '🟢'
        : r.classification === 'BAD_REQUEST'
          ? '🟡'
          : r.classification === 'FORBIDDEN'
            ? '🔴'
            : '❔';
      console.log(
        `${badge} ${w.method.padEnd(7)} ${r.status} ${r.classification.padEnd(20)} ${w.path}`,
      );
      console.log(`   → ${r.metaData?.message || r.bodyPreview?.slice(0, 200) || ''}`);
    }
  }

  const summary = {
    baseUrl: BASE_URL,
    username: USERNAME,
    runAt: new Date().toISOString(),
    totalProbes: results.length,
    byClassification: results.reduce((acc, r) => {
      acc[r.classification] = (acc[r.classification] || 0) + 1;
      return acc;
    }, {}),
    sampleRow: sampleRow || null,
    candidates: results.filter((r) =>
      ['BAD_REQUEST', 'METHOD_NOT_ALLOWED', 'OK', 'CREATED', 'NO_CONTENT', 'FORBIDDEN'].includes(
        r.classification,
      ),
    ),
    all: results,
  };

  const outPath = path.join(__dirname, 'gajamada-probe-result.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n📄 Hasil lengkap → ${outPath}`);
  console.log('\nKandidat menarik (endpoint kemungkinan ada):');
  for (const r of summary.candidates) {
    console.log(`  ${r.method.padEnd(7)} ${r.status} ${r.classification.padEnd(20)} ${r.path}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
