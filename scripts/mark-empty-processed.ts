import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(url, key)

async function main() {
  const tenantId = '7dea7bb3-e39a-44f0-ba5b-1021bde2b8e2'
  const { data: rows, error: fetchError } = await supabase
    .from('pengaduan')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('ai_processed', false)
    .is('kronologi_lengkap', null)
    .is('kronologi', null)
  if (fetchError) throw fetchError
  if (!rows || rows.length === 0) {
    console.log('No empty rows to mark.')
    return
  }
  const ids = rows.map((r) => r.id)
  const { error: updateError } = await supabase
    .from('pengaduan')
    .update({ ai_processed: true })
    .in('id', ids)
  if (updateError) throw updateError
  console.log(`Marked ${ids.length} empty rows as processed.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
