import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Clearing HTML templates...')

  const { error: tErr } = await supabase
    .from('templates')
    .update({ content: null, header_html: null, footer_html: null, output_format: 'docx' })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (tErr) console.error('templates update error:', tErr.message)
  else console.log('templates: HTML content cleared')

  const { error: mtErr } = await supabase
    .from('master_templates')
    .update({ content: null, header_html: null, footer_html: null })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (mtErr) console.error('master_templates update error:', mtErr.message)
  else console.log('master_templates: HTML content cleared')

  console.log('Done!')
}

main().catch(e => { console.error(e); process.exit(1) })
