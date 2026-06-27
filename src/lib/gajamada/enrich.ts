import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'
import type { AISettings } from '@/lib/ai/client'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) return (err as { message: string }).message
  return String(err)
}

async function getTenantVariables(tenantId: string): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId)
  if (error) throw error
  const vars: Record<string, string> = {}
  for (const row of data || []) {
    if (row.key && row.value !== null && row.value !== undefined) vars[row.key] = row.value
  }
  return vars
}

function getAISettings(vars: Record<string, string>): AISettings {
  return {
    provider: vars['ai_provider'] || 'openai',
    model: vars['ai_model'] || 'gpt-4o-mini',
    baseUrl: vars['ai_base_url'] || null,
    apiKey: null,
  }
}

function parseTerlaporJSON(raw: string): Record<string, string | null> {
  try {
    const json = JSON.parse(raw)
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

export async function enrichGajamadaPengaduan({
  tenantId,
  maxItems,
  orderBy = 'created_at',
  orderDir = 'desc',
}: {
  tenantId: string
  maxItems?: number
  orderBy?: string
  orderDir?: string
}): Promise<{ success: true; processed: number; errors: number; remaining: number } | { success: false; error: string }> {
  try {
    const admin = createAdminClient()
    const vars = await getTenantVariables(tenantId)
    const aiSettings = getAISettings(vars)
    const hasAI = !!process.env.AI_API_KEY

    const { data: pengaduanRows } = await admin
      .from('pengaduan')
      .select('id, gajamada_id, kronologi_lengkap, kronologi, satker_dilaporkan')
      .eq('tenant_id', tenantId)
      .eq('ai_processed', false)
      .not('gajamada_id', 'is', null)
      .order(orderBy, { ascending: orderDir === 'asc' })

    if (!pengaduanRows || pengaduanRows.length === 0) {
      return { success: true, processed: 0, errors: 0, remaining: 0 }
    }

    const { data: satkers } = await admin.from('wilayah_satker').select('nama').eq('tenant_id', tenantId)
    const satkerList = (satkers || []).map((s) => s.nama).filter(Boolean) as string[]

    let processed = 0
    let errors = 0
    const batchSize = 5

    for (let i = 0; i < pengaduanRows.length; i++) {
      // Stop early if maxItems reached
      if (maxItems !== undefined && processed >= maxItems) break

      const row = pengaduanRows[i]
      const content = row.kronologi_lengkap

      try {
        let summary = content || '-'
        let satker: string | null = row.satker_dilaporkan
        let terlaporParsed: Record<string, string | null> = {}

    if (hasAI && content) {
      // Run all 3 AI calls concurrently (not sequentially)
      const [summaryResult, satkerResult, tlResult] = await Promise.allSettled([
        callAI({ settings: aiSettings, prompt: vars['ai_prompt_summary'] || 'Ringkas dalam 1 kalimat.', userContent: content, temperature: 0.3 }),
        (async () => {
          const listText = satkerList.length > 0 ? satkerList.join('\n') : '-'
          return callAI({ settings: aiSettings, prompt: vars['ai_prompt_satker'] || 'Tentukan satker.', userContent: 'Teks:\n' + content + '\n\nSatker:\n' + listText, temperature: 0.1 })
        })(),
        (async () => {
          return callAI({ settings: aiSettings, prompt: vars['ai_prompt_terlapor'] || 'Ekstrak identitas.', userContent: content, temperature: 0.1 })
        })(),
      ])

      if (summaryResult.status === 'fulfilled') {
        summary = summaryResult.value || content
      }

      if (satkerResult.status === 'fulfilled') {
        const cleaned = satkerResult.value.replace(/^["']|["']$/g, '').trim()
        if (cleaned && cleaned.length >= 3 && cleaned.length <= 80) {
          let match = satkerList.find((s) => s.toLowerCase().includes(cleaned.toLowerCase()) || cleaned.toLowerCase().includes(s.toLowerCase()))
          if (!match) { const tokens = cleaned.toLowerCase().split(/\s+/).filter((t) => t.length >= 4); match = satkerList.find((s) => tokens.every((t) => s.toLowerCase().includes(t))) }
          satker = match || cleaned
        }
      }

      if (tlResult.status === 'fulfilled') {
        const jsonMatch = tlResult.value.match(/\{[\s\S]*\}/)
        const parsed = parseTerlaporJSON(jsonMatch ? jsonMatch[0] : tlResult.value)
        Object.assign(terlaporParsed, parsed)
        if (!terlaporParsed.nama || terlaporParsed.nama === 'null') {
          const parts = [terlaporParsed.jabatan, terlaporParsed.kesatuan].filter(Boolean)
          if (parts.length > 0) terlaporParsed.nama = parts.join(' ')
        }
      }
    }

        // Update pengaduan
        await admin.from('pengaduan').update({
          kronologi: (summary || '').substring(0, 5000),
          satker_dilaporkan: (satker || 'Polda Jawa Barat').substring(0, 255),
          ai_processed: true,
        }).eq('id', row.id)

        // Update terlapor if data extracted
        const { data: terlaporLinks } = await admin
          .from('pengaduan_terlapor')
          .select('terlapor_id')
          .eq('pengaduan_id', row.id)
          .limit(1)

        const terlaporId = terlaporLinks?.[0]?.terlapor_id
        if (terlaporId) {
          const updateData: Record<string, string | null> = {}
          // Always use AI-extracted nama (may be descriptive like "KBO Satresnarkoba Polres X")
          if (terlaporParsed.nama) updateData.nama = terlaporParsed.nama
          if (terlaporParsed.pangkat) updateData.pangkat = terlaporParsed.pangkat
          if (terlaporParsed.nrp) updateData.nrp = terlaporParsed.nrp
          if (terlaporParsed.jabatan) updateData.jabatan = terlaporParsed.jabatan
          if (terlaporParsed.kesatuan) updateData.kesatuan = terlaporParsed.kesatuan
          if (Object.keys(updateData).length > 0) {
            await admin.from('terlapor').update(updateData).eq('id', terlaporId)
          }
        }

        processed++
      } catch (err: unknown) {
        errors++
        await admin.from('error_logs').insert({
          tenant_id: tenantId,
          level: 'error',
          message: `AI enrich failed: ${row.gajamada_id} - ${getErrorMessage(err)}`,
          source: 'gajamada-enrich',
          context: { gajamada_id: row.gajamada_id },
        })
        await admin.from('pengaduan').update({ ai_processed: true }).eq('id', row.id)
      }

      if (hasAI && (i + 1) % batchSize === 0 && i + 1 < pengaduanRows.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    const remaining = (pengaduanRows?.length || 0) - processed - errors
    return { success: true, processed, errors, remaining: Math.max(0, remaining) }
  } catch (err: unknown) {
    console.error('enrichGajamadaPengaduan error:', err)
    return { success: false, error: getErrorMessage(err) || 'Gagal memperkaya AI' }
  }
}

export async function enrichSinglePengaduan({
  tenantId,
  pengaduanId,
}: {
  tenantId: string
  pengaduanId: string
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const admin = createAdminClient()
    const vars = await getTenantVariables(tenantId)
    const aiSettings = getAISettings(vars)
    const hasAI = !!process.env.AI_API_KEY

    const { data: row } = await admin
      .from('pengaduan')
      .select('id, gajamada_id, kronologi_lengkap, satker_dilaporkan, ai_processed')
      .eq('id', pengaduanId)
      .eq('tenant_id', tenantId)
      .single()

    if (!row) return { success: false, error: 'Pengaduan tidak ditemukan' }
    if (row.ai_processed) return { success: false, error: 'Pengaduan ini sudah diproses AI sebelumnya' }

    const content = row.kronologi_lengkap
    if (!content) return { success: false, error: 'Tidak ada kronologi untuk diproses' }

    const { data: satkers } = await admin.from('wilayah_satker').select('nama').eq('tenant_id', tenantId)
    const satkerList = (satkers || []).map((s) => s.nama).filter(Boolean) as string[]

    let summary = content || '-'
    let satker: string | null = row.satker_dilaporkan
    const terlaporParsed: Record<string, string | null> = {}

    if (hasAI && content) {
      // Run all 3 AI calls concurrently
      const [summaryResult, satkerResult, tlResult] = await Promise.allSettled([
        callAI({ settings: aiSettings, prompt: vars['ai_prompt_summary'] || 'Ringkas dalam 1 kalimat.', userContent: content, temperature: 0.3 }),
        (async () => {
          const listText = satkerList.length > 0 ? satkerList.join('\n') : '-'
          return callAI({ settings: aiSettings, prompt: vars['ai_prompt_satker'] || 'Tentukan satker.', userContent: 'Teks:\n' + content + '\n\nSatker:\n' + listText, temperature: 0.1 })
        })(),
        (async () => {
          return callAI({ settings: aiSettings, prompt: vars['ai_prompt_terlapor'] || 'Ekstrak identitas.', userContent: content, temperature: 0.1 })
        })(),
      ])

      if (summaryResult.status === 'fulfilled') {
        summary = summaryResult.value || content
      }

      if (satkerResult.status === 'fulfilled') {
        const cleaned = satkerResult.value.replace(/^["']|["']$/g, '').trim()
        if (cleaned && cleaned.length >= 3 && cleaned.length <= 80) {
          let match = satkerList.find((s) => s.toLowerCase().includes(cleaned.toLowerCase()) || cleaned.toLowerCase().includes(s.toLowerCase()))
          if (!match) { const tokens = cleaned.toLowerCase().split(/\s+/).filter((t) => t.length >= 4); match = satkerList.find((s) => tokens.every((t) => s.toLowerCase().includes(t))) }
          satker = match || cleaned
        }
      }

      if (tlResult.status === 'fulfilled') {
        const jsonMatch = tlResult.value.match(/\{[\s\S]*\}/)
        const parsed = parseTerlaporJSON(jsonMatch ? jsonMatch[0] : tlResult.value)
        Object.assign(terlaporParsed, parsed)
        if (!terlaporParsed.nama || terlaporParsed.nama === 'null') {
          const parts = [terlaporParsed.jabatan, terlaporParsed.kesatuan].filter(Boolean)
          if (parts.length > 0) terlaporParsed.nama = parts.join(' ')
        }
      }
    }

    await admin.from('pengaduan').update({
      kronologi: (summary || '').substring(0, 5000),
      satker_dilaporkan: (satker || 'Polda Jawa Barat').substring(0, 255),
      ai_processed: true,
    }).eq('id', pengaduanId)

    const { data: tlLink } = await admin.from('pengaduan_terlapor').select('terlapor_id').eq('pengaduan_id', pengaduanId).limit(1)
    const tlId = tlLink?.[0]?.terlapor_id
    if (tlId) {
      const updateData: Record<string, string | null> = {}
      if (terlaporParsed.nama) updateData.nama = terlaporParsed.nama
      if (terlaporParsed.pangkat) updateData.pangkat = terlaporParsed.pangkat
      if (terlaporParsed.nrp) updateData.nrp = terlaporParsed.nrp
      if (terlaporParsed.jabatan) updateData.jabatan = terlaporParsed.jabatan
      if (terlaporParsed.kesatuan) updateData.kesatuan = terlaporParsed.kesatuan
      if (Object.keys(updateData).length > 0) {
        await admin.from('terlapor').update(updateData).eq('id', tlId)
      }
    }

    return { success: true }
  } catch (err: unknown) {
    console.error('enrichSinglePengaduan error:', err)
    return { success: false, error: getErrorMessage(err) || 'Gagal memperkaya AI' }
  }
}
