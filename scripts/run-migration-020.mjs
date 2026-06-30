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
  // 1. Rename existing units
  const renames = [
    { kode: 'UNIT-1', nama: 'Unit 1 Paminal' },
    { kode: 'UNIT-2', nama: 'Unit 2 Paminal' },
    { kode: 'UNIT-3', nama: 'Unit 3 Paminal' },
    { kode: 'UR-BINPAM', nama: 'UR Binpam' },
    { kode: 'UR-PRODOK', nama: 'UR Prodok' },
    { kode: 'UR-LITPERS', nama: 'UR Litpers' },
  ];
  for (const r of renames) {
    const { error } = await s
      .from('organizations')
      .update({ nama: r.nama })
      .eq('tipe', 'unit')
      .eq('kode', r.kode);
    console.log(`Rename ${r.kode} → ${r.nama}: ${error ? error.message : 'OK'}`);
  }

  // 2. Add KAUR-BINPAM
  const { data: tenants } = await s.from('tenants').select('id');
  for (const t of tenants || []) {
    const { error } = await s
      .from('organizations')
      .insert({ tenant_id: t.id, tipe: 'unit', kode: 'KAUR-BINPAM', nama: 'Kaur Binpam' })
      .select()
      .single();
    if (error?.code !== '23505') console.log(`Add KAUR-BINPAM: ${error ? error.message : 'OK'}`);
    else console.log('Add KAUR-BINPAM: already exists');
  }

  // 3. Delete old defaults
  const { error: delErr } = await s
    .from('organizations')
    .delete()
    .eq('tipe', 'unit')
    .in('kode', ['UNIT-A', 'UNIT-B', 'UNIT-C']);
  console.log(`Delete old units: ${delErr ? delErr.message : 'OK'}`);

  // 4. Add gajamada_p_id column — via raw SQL not available, skip (user run migration manually)
  console.log(
    '\n⚠️  Untuk ALTER TABLE pengaduan ADD COLUMN gajamada_p_id, jalankan migration SQL manual via Supabase dashboard',
  );

  // 5. Gateway config
  for (const t of tenants || []) {
    const vars = [
      { key: 'gajamada_gateway_id', value: 'aa6159ec4d7847e8282943f7dfe87c29' },
      { key: 'gajamada_action_widget_id', value: '6f2cfeabd19ddafce8fc98f5c9d9ad63' },
      { key: 'gajamada_action_menu_id', value: '01f63e60376afe827638ed614e1cea76' },
      { key: 'gajamada_action_user_id', value: 'a07611b17f063f8b5460f2eaa5c7deda' },
    ];
    for (const v of vars) {
      await s
        .from('tenant_variables')
        .upsert({ tenant_id: t.id, key: v.key, value: v.value }, { onConflict: 'tenant_id,key' });
    }
  }
  console.log('Gateway config: OK');
}

main().catch((e) => console.error(e.message));
