import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiKey = (process.env.AI_API_KEY || '').trim()
const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const model = process.env.AI_MODEL || 'gpt-4o-mini'

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(url, key)

interface AISettings {
  provider: string
  model: string
  baseUrl: string
  apiKey: string
}

interface TenantVars {
  [key: string]: string
}

interface PengaduanRow {
  id: string
  tenant_id: string
  kronologi_lengkap: string | null
  kronologi: string | null
  satker_dilaporkan: string | null
  gajamada_id: string | null
}

async function getTenantVariables(tenantId: string): Promise<TenantVars> {
  const { data, error } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)
  if (error) throw error
  const vars: TenantVars = {}
  for (const row of data || []) {
    if (row.key && row.value != null) vars[row.key] = row.value
  }
  return vars
}

async function callAI(
  settings: AISettings,
  prompt: string,
  userContent: string,
  temperature = 0.3
): Promise<string> {
  if (!settings.apiKey) {
    throw new Error('AI API key not configured')
  }
  const res = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userContent },
      ],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI request failed: ${res.status} ${text}`)
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('AI response did not contain content')
  return content.trim()
}

function parseTerlaporJSON(raw: string): Record<string, string | null> {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    const json = JSON.parse(match ? match[0] : raw)
    return {
      nama: json.nama || null,
      pangkat: json.pangkat || null,
      nrp: json.nrp || null,
      jabatan: json.jabatan || null,
      kesatuan: json.kesatuan || null,
    }
  } catch {
    return { nama: null, pangkat: null, nrp: null, jabatan: null, kesatuan: null }
  }
}

function matchSatker(value: string, satkerList: string[]): string | null {
  const cleaned = value.replace(/^["']|["']$/g, '').trim()
  if (!cleaned || cleaned.length < 3 || cleaned.length > 80) return null
  let match = satkerList.find(
    (s) =>
      s.toLowerCase().includes(cleaned.toLowerCase()) ||
      cleaned.toLowerCase().includes(s.toLowerCase())
  )
  if (!match) {
    const tokens = cleaned
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 4)
    match = satkerList.find((s) => tokens.every((t) => s.toLowerCase().includes(t)))
  }
  return match || cleaned
}

async function getSatkerList(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('wilayah_satker')
    .select('nama')
    .eq('tenant_id', tenantId)
  if (error) throw error
  return (data || []).map((s) => s.nama).filter((n): n is string => !!n)
}

async function getTerlaporId(pengaduanId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('pengaduan_terlapor')
    .select('terlapor_id')
    .eq('pengaduan_id', pengaduanId)
    .limit(1)
  if (error) throw error
  return data?.[0]?.terlapor_id || null
}

async function createTerlapor(tenantId: string, pengaduanId: string, nama: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('terlapor')
    .insert({ tenant_id: tenantId, nama })
    .select('id')
    .single()
  if (error || !data) {
    console.error('Failed to create terlapor:', error)
    return null
  }
  const { error: linkError } = await supabase
    .from('pengaduan_terlapor')
    .insert({ pengaduan_id: pengaduanId, terlapor_id: data.id })
  if (linkError) {
    console.error('Failed to link terlapor:', linkError)
    return null
  }
  return data.id
}

async function processRow(
  row: PengaduanRow,
  satkerList: string[],
  vars: TenantVars,
  settings: AISettings,
  dryRun: boolean
) {
  const content = (row.kronologi_lengkap || row.kronologi || '').trim()
  if (!content) {
    console.log(`  [${row.id}] skipped: no content`)
    return { processed: 0, skipped: 1 }
  }

  if (dryRun) {
    console.log(`  [${row.id}] DRY RUN content=${content.slice(0, 80)}...`)
    return { processed: 1, skipped: 0 }
  }

  const promptSummary = vars['ai_prompt_summary'] || 'Ringkas dalam 1 kalimat.'
  const promptSatker = vars['ai_prompt_satker'] || 'Tentukan satker.'
  const promptTerlapor = vars['ai_prompt_terlapor'] || 'Ekstrak identitas.'
  const listText = satkerList.length > 0 ? satkerList.join('\n') : '-'

  try {
    const [summaryResult, satkerResult, terlaporResult] = await Promise.allSettled([
      callAI(settings, promptSummary, content, 0.3),
      callAI(settings, promptSatker, `Teks:\n${content}\n\nSatker:\n${listText}`, 0.1),
      callAI(settings, promptTerlapor, content, 0.1),
    ])

    let summary = summaryResult.status === 'fulfilled' ? summaryResult.value : content
    if (!summary) summary = content

    let satker: string | null = row.satker_dilaporkan
    if (satkerResult.status === 'fulfilled') {
      satker = matchSatker(satkerResult.value, satkerList) || row.satker_dilaporkan
    }

    const terlaporParsed = parseTerlaporJSON(
      terlaporResult.status === 'fulfilled' ? terlaporResult.value : ''
    )
    if (!terlaporParsed.nama || terlaporParsed.nama === 'null') {
      const parts = [terlaporParsed.jabatan, terlaporParsed.kesatuan].filter(Boolean)
      if (parts.length > 0) terlaporParsed.nama = parts.join(' ')
    }

    const { error: updateError } = await supabase
      .from('pengaduan')
      .update({
        kronologi: summary.substring(0, 5000),
        satker_dilaporkan: (satker || 'Polda Jawa Barat').substring(0, 255),
        ai_processed: true,
      })
      .eq('id', row.id)

    if (updateError) throw updateError

    let terlaporId = await getTerlaporId(row.id)
    if (!terlaporId && terlaporParsed.nama) {
      terlaporId = await createTerlapor(row.tenant_id, row.id, terlaporParsed.nama)
    }

    if (terlaporId) {
      const updateData: Record<string, string | null> = {}
      if (terlaporParsed.nama) updateData.nama = terlaporParsed.nama
      if (terlaporParsed.pangkat) updateData.pangkat = terlaporParsed.pangkat
      if (terlaporParsed.nrp) updateData.nrp = terlaporParsed.nrp
      if (terlaporParsed.jabatan) updateData.jabatan = terlaporParsed.jabatan
      if (terlaporParsed.kesatuan) updateData.kesatuan = terlaporParsed.kesatuan
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('terlapor').update(updateData).eq('id', terlaporId)
        if (error) throw error
      }
    }

    console.log(
      `  [${row.id}] OK satker=${satker || '-'} nama=${terlaporParsed.nama || '-'}`
    )
    return { processed: 1, skipped: 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  [${row.id}] ERROR ${message}`)
    await supabase.from('error_logs').insert({
      tenant_id: row.tenant_id,
      level: 'error',
      message: `Direct enrich failed: ${row.id} - ${message}`,
      source: 'direct-enrich-script',
      context: { pengaduan_id: row.id },
    })
    await supabase.from('pengaduan').update({ ai_processed: true }).eq('id', row.id)
    return { processed: 0, skipped: 0, failed: 1 }
  }
}

async function runForTenant(tenantId: string, dryRun: boolean, limit?: number) {
  console.log(`\nTenant ${tenantId} ${dryRun ? '(DRY RUN)' : ''}`)

  const vars = await getTenantVariables(tenantId)
  const settings: AISettings = {
    provider: vars['ai_provider'] || 'openai-compatible',
    model: vars['ai_model'] || model,
    baseUrl: (vars['ai_base_url'] || baseUrl).replace(/\/$/, ''),
    apiKey: apiKey,
  }
  const satkerList = await getSatkerList(tenantId)

  let query = supabase
    .from('pengaduan')
    .select('id, tenant_id, kronologi_lengkap, kronologi, satker_dilaporkan, gajamada_id')
    .eq('tenant_id', tenantId)
    .eq('ai_processed', false)

  if (limit) query = query.limit(limit)

  const { data: rows, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  if (!rows || rows.length === 0) {
    console.log('No unprocessed pengaduan.')
    return { processed: 0, skipped: 0, failed: 0 }
  }

  console.log(`Rows to process: ${rows.length}`)

  let processed = 0
  let skipped = 0
  let failed = 0
  const concurrency = Number(process.env.CONCURRENCY || '3')

  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency)
    const results = await Promise.all(
      chunk.map((row) => processRow(row as PengaduanRow, satkerList, vars, settings, dryRun))
    )
    for (const r of results) {
      processed += r.processed || 0
      skipped += r.skipped || 0
      failed += (r as { failed?: number }).failed || 0
    }
    console.log(`Progress: ${processed}/${rows.length} (skipped ${skipped}, failed ${failed})`)
    if (i + concurrency < rows.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log(`Done: processed=${processed} skipped=${skipped} failed=${failed}`)
  return { processed, skipped, failed }
}

async function main() {
  const dryRun = process.env.DRY_RUN === 'true'
  const tenantId = process.env.TENANT_ID
  const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined

  if (!apiKey) {
    console.warn('AI_API_KEY not set; falling back to no-AI extraction is not implemented.')
    process.exit(1)
  }

  if (tenantId) {
    await runForTenant(tenantId, dryRun, limit)
    return
  }

  const { data: tenants, error } = await supabase.from('tenants').select('id')
  if (error) throw error
  for (const tenant of tenants || []) {
    await runForTenant(tenant.id, dryRun, limit)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
