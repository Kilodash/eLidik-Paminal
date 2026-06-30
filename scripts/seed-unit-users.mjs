/**
 * scripts/seed-unit-users.mjs
 *
 * Buat 7 akun unit/UR Paminal POLDA JABAR via Supabase Admin API.
 * Password default: rahasia2026
 *
 * Jalankan: node scripts/seed-unit-users.mjs
 */

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'rahasia2026';

const USERS = [
  {
    email: 'kaur_binpam_jabar',
    nama: 'Kaur Binpam',
    orgKode: 'KAUR-BINPAM',
    role: 'operator_unit',
  },
  { email: 'ur_binpam_jabar', nama: 'UR Binpam', orgKode: 'UR-BINPAM', role: 'operator_unit' },
  { email: 'ur_prodok_jabar', nama: 'UR Prodok', orgKode: 'UR-PRODOK', role: 'operator_unit' },
  { email: 'ur_litpers_jabar', nama: 'UR Litpers', orgKode: 'UR-LITPERS', role: 'operator_unit' },
  {
    email: 'unit_1_paminal_jabar',
    nama: 'Unit 1 Paminal',
    orgKode: 'UNIT-1',
    role: 'operator_unit',
  },
  {
    email: 'unit_2_paminal_jabar',
    nama: 'Unit 2 Paminal',
    orgKode: 'UNIT-2',
    role: 'operator_unit',
  },
  {
    email: 'unit_3_paminal_jabar',
    nama: 'Unit 3 Paminal',
    orgKode: 'UNIT-3',
    role: 'operator_unit',
  },
];

async function main() {
  // Get tenant
  const { data: tenants } = await supabase.from('tenants').select('id, nama').limit(1);
  if (!tenants?.length) {
    console.error('Tidak ada tenant');
    process.exit(1);
  }
  const tenant = tenants[0];
  console.log(`Tenant: ${tenant.nama} (${tenant.id})\n`);

  for (const u of USERS) {
    const email = `${u.email}@poldajabar.go.id`;
    console.log(`Membuat akun: ${email}`);

    // Cek apakah user sudah ada
    const { data: existing } = await supabase
      .from('personel')
      .select('id, nama_lengkap')
      .eq('tenant_id', tenant.id)
      .ilike('nama_lengkap', u.nama);

    if (existing?.length) {
      console.log(`  ⚠️  Personel "${u.nama}" sudah ada, skip`);
      continue;
    }

    // Cari organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, nama')
      .eq('tenant_id', tenant.id)
      .eq('kode', u.orgKode)
      .single();

    if (!org) {
      console.log(`  ❌ Organization "${u.orgKode}" tidak ditemukan — jalankan migration 020 dulu`);
      continue;
    }

    // Create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      console.log(`  ❌ Auth error: ${authErr.message}`);
      continue;
    }

    // Insert personel
    const { error: perErr } = await supabase.from('personel').insert({
      id: authUser.user.id,
      tenant_id: tenant.id,
      organization_id: org.id,
      role: u.role,
      nama_lengkap: u.nama,
      jabatan: u.nama,
    });

    if (perErr) {
      console.log(`  ❌ Personel error: ${perErr.message}`);
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      continue;
    }

    console.log(`  ✅ Created: ${email} → ${org.nama} (${u.role})`);
  }

  console.log('\nSelesai. Password semua akun: rahasia2026');
}

main().catch((e) => console.error('Fatal:', e.message));
