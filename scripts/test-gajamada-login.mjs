import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import makeFetchCookie from 'fetch-cookie'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Load .env.local
const envPath = path.join(root, '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (!key || key.startsWith('#')) continue
    const value = rest.join('=').trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
}

const BASE_URL = (process.env.GAJAMADA_BASE_URL || 'https://gajamada-propam.polri.go.id').replace(/\/$/, '')
const USERNAME = process.env.GAJAMADA_USERNAME || ''
const PASSWORD = process.env.GAJAMADA_PASSWORD || ''

if (!USERNAME || !PASSWORD) {
  console.error('GAJAMADA_USERNAME dan GAJAMADA_PASSWORD harus diisi di .env.local')
  process.exit(1)
}

const fetchCookie = makeFetchCookie(fetch)

const LOGIN_VARIANTS = [
  { label: 'username', body: { username: USERNAME, password: PASSWORD } },
  { label: 'email', body: { email: USERNAME, password: PASSWORD } },
  { label: 'userName', body: { userName: USERNAME, password: PASSWORD } },
  { label: 'username_or_email', body: { username_or_email: USERNAME, password: PASSWORD } },
]

async function tryLogin(variant) {
  const res = await fetchCookie(`${BASE_URL}/api/v1/apps/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(variant.body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json, text }
}

async function main() {
  console.log(`Testing Gajamada login at ${BASE_URL}`)
  console.log(`Username: ${USERNAME}`)
  console.log('')

  let successVariant = null

  for (const variant of LOGIN_VARIANTS) {
    console.log(`Trying field "${variant.label}"...`)
    const result = await tryLogin(variant)
    console.log(`  Status: ${result.status}`)
    console.log(`  Message: ${result.json?.metaData?.message || result.json?.detail?.metaData?.message || 'N/A'}`)

    if (result.status === 200 && (result.json?.metaData?.status || result.json?.detail?.metaData?.status)) {
      successVariant = variant
      console.log(`  ✅ Login success with field "${variant.label}"`)
      break
    }
  }

  if (!successVariant) {
    console.error('\n❌ Semua varian login gagal.')
    console.log('Coba capture payload asli dari browser DevTools dan sesuaikan skrip ini.')
    process.exit(1)
  }

  // Try fetch reports
  console.log('\nMencoba fetch data gold.report...')
  const payload = {
    connectionId: '245b8fd7c4a763019d5172fad5ec0086',
    table: 'gold.report',
    orderBy: 'created_date',
    order: 'desc',
    size: 10,
    database: 'divpropam',
    metaData: {
      widgetId: '8533ca87b75e04b1f39d19d98dabc0ef',
      menuId: 'ce64015a07578d9195a0e589de1108c8',
      dashboardId: '1769155096865',
      mdmId: 'ca44e3fd8f252225954a7d2bafa376d4',
      userId: 'a07611b17f063f8b5460f2eaa5c7deda',
      domain: 'gajamada-propam.polri.go.id',
    },
    filters: [
      {
        field: 'status_label',
        fieldType: 'string',
        field_type_origin: '',
        operator: 'is not one of',
        table: 'gold.report',
        value: { gte: 0, is: '', isOneOf: ['Tolak', 'Laporan Ditolak Polda', 'Laporan ditolak'], lte: 0 },
      },
      {
        field: 'disposisi_case_position',
        fieldType: 'string',
        field_type_origin: '',
        operator: 'is',
        table: 'gold.report',
        value: { gte: 0, lte: 0, is: 'KASUBBID PAMINAL POLDA JAWA BARAT', isOneOf: [] },
      },
    ],
    page: 1,
  }

  const res = await fetchCookie(`${BASE_URL}/api/v1/apps/data/management/get-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}

  console.log(`Fetch status: ${res.status}`)
  console.log(`Message: ${json?.metaData?.message || json?.detail?.metaData?.message || 'N/A'}`)
  console.log(`Total data: ${json?.metaData?.pagination?.totalElements ?? 'N/A'}`)
  if (json?.data?.length) {
    console.log(`First report id: ${json.data[0].id}`)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
