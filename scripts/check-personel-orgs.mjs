import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

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
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
async function main() {
  const { data } = await s
    .from('personel')
    .select('id, nama_lengkap, organization:organizations(kode, nama)')
    .not('organization_id', 'is', null);
  for (const p of data || []) {
    const org = p.organization;
    console.log(`${p.nama_lengkap?.padEnd(30)} → ${org?.kode} (${org?.nama})`);
  }
}
main().catch((e) => console.error(e.message));
