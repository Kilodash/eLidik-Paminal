import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://kzekrzdyyhedstoaihlt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZWtyemR5eWhlZHN0b2FpaGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk5MDExOCwiZXhwIjoyMDk2NTY2MTE4fQ.q56-ix-aw7DUNQRUG3cBgX-L3JAuWIfu3OAXqrx7ZYg"
)

const PASSWORD = "polri123!"

async function seed() {
  // 1. Create tenant
  const { data: tenant } = await supabase.from("tenants").insert({ kode: "METRO", nama: "Polda Metro Jaya" }).select().single()
  console.log("Tenant:", tenant?.id)

  // 2. Create organizations
  const { data: orgs } = await supabase.from("organizations").insert([
    { tenant_id: tenant.id, tipe: "subbid", kode: "SUBBID-PAMINAL", nama: "Subbid Paminal Polda Metro Jaya" },
    { tenant_id: tenant.id, tipe: "unit", kode: "UNIT-A", nama: "Unit A" },
    { tenant_id: tenant.id, tipe: "unit", kode: "UNIT-B", nama: "Unit B" },
  ]).select()
  console.log("Orgs:", orgs?.length)

  const subbid = orgs?.find(o => o.tipe === "subbid")
  const unitA = orgs?.find(o => o.kode === "UNIT-A")
  const unitB = orgs?.find(o => o.kode === "UNIT-B")

  // 3. Create auth users
  const users = [
    { email: "admin@polri.go.id", role: "admin_subbid", org: subbid?.id, nama: "Kompol Admin", nip: "78001234", pangkat: "Kompol", jabatan: "Kasubbid Paminal" },
    { email: "operator@polri.go.id", role: "operator_unit", org: unitA?.id, nama: "Aiptu Operator", nip: "82005678", pangkat: "Aiptu", jabatan: "Operator Unit A" },
    { email: "operator2@polri.go.id", role: "operator_unit", org: unitB?.id, nama: "Bripka Operator", nip: "84009012", pangkat: "Bripka", jabatan: "Operator Unit B" },
    { email: "oversight@polri.go.id", role: "oversight", org: null, nama: "Kombes Oversight", nip: "76004567", pangkat: "Kombes Pol", jabatan: "Kabidpropam" },
  ]

  for (const u of users) {
    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    })
    if (error) { console.error("Auth error:", u.email, error.message); continue }

    await supabase.from("personel").insert({
      id: authUser.user.id,
      tenant_id: tenant.id,
      organization_id: u.org,
      role: u.role,
      nip: u.nip,
      nama_lengkap: u.nama,
      pangkat: u.pangkat,
      jabatan: u.jabatan,
    })
    console.log(`  User: ${u.email} / ${PASSWORD} [${u.role}]`)
  }

  // 4. Tenant variables
  await supabase.from("tenant_variables").insert([
    { tenant_id: tenant.id, key: "nama_polda", value: "Polda Metro Jaya" },
    { tenant_id: tenant.id, key: "kode_polda", value: "METRO" },
    { tenant_id: tenant.id, key: "alamat", value: "Jl. Jenderal Sudirman No. 55, Jakarta Selatan" },
    { tenant_id: tenant.id, key: "nama_kabid", value: "Kombes Pol. Dr. ANDI PRATAMA, S.I.K., M.H." },
    { tenant_id: tenant.id, key: "pangkat_kabid", value: "Kombes Pol." },
    { tenant_id: tenant.id, key: "nip_kabid", value: "76004567" },
    { tenant_id: tenant.id, key: "nama_kasi", value: "Kompol BUDI SANTOSO, S.H." },
    { tenant_id: tenant.id, key: "pangkat_kasi", value: "Kompol" },
    { tenant_id: tenant.id, key: "nip_kasi", value: "78001234" },
  ])
  console.log("Variables created")

  // 5. Default klasifikasi
  await supabase.from("klasifikasi").insert([
    { tenant_id: tenant.id, kode: "DISIPLIN", nama: "Pelanggaran Disiplin" },
    { tenant_id: tenant.id, kode: "KEPP", nama: "Pelanggaran Kode Etik Profesi Polri" },
    { tenant_id: tenant.id, kode: "PIDANA", nama: "Tindak Pidana" },
  ])
  console.log("Klasifikasi created")

  // 6. Base tenant (for oversight)
  const { data: tenant2 } = await supabase.from("tenants").insert({ kode: "JABAR", nama: "Polda Jawa Barat" }).select().single()
  await supabase.from("organizations").insert([
    { tenant_id: tenant2.id, tipe: "subbid", kode: "SUBBID-PAMINAL", nama: "Subbid Paminal Polda Jabar" },
    { tenant_id: tenant2.id, tipe: "unit", kode: "UNIT-C", nama: "Unit C" },
  ])
  // Create personel for tenant2 (oversight can also see this)
  const { data: au } = await supabase.auth.admin.createUser({
    email: "operator3@polri.go.id", password: PASSWORD, email_confirm: true,
  })
  await supabase.from("personel").insert({
    id: au.user.id, tenant_id: tenant2.id, role: "operator_unit",
    nip: "85003456", nama_lengkap: "Brigadir Satu", pangkat: "Brigadir", jabatan: "Operator Unit C",
  })
  console.log(`  User: operator3@polri.go.id / ${PASSWORD} [operator_unit]`)

  console.log("\n=== SEED COMPLETE ===")
  console.log(`Password semua user: ${PASSWORD}`)
}

seed()
