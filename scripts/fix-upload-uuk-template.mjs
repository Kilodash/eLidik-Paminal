import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import JSZip from 'jszip'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const templatePath = join(__dirname, '..', 'public', 'template', 'template UUK.docx')
  const buffer = readFileSync(templatePath)

  console.log('Reading template from:', templatePath)
  console.log('Template size:', buffer.length, 'bytes')

  const zip = await JSZip.loadAsync(buffer)

  const documentXmlPath = 'word/document.xml'
  let docXml = await zip.file(documentXmlPath)?.async('string')

  if (!docXml) {
    console.error('word/document.xml not found in template')
    process.exit(1)
  }

  const broken = '{{list_sumber_baket}'
  const fixed = '{{list_sumber_baket}}'

  if (docXml.includes(broken)) {
    docXml = docXml.replace(new RegExp(broken.replace(/[{}]/g, '\\$&'), 'g'), fixed)
    zip.file(documentXmlPath, docXml)
    console.log(`Fixed broken placeholder: ${broken} → ${fixed}`)
  } else {
    console.log('No broken placeholder found in document.xml')
  }

  const fixedBuffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }))
  console.log('Fixed template size:', fixedBuffer.length, 'bytes')

  const storagePath = `master/UNSUR-KETERANGAN.docx`
  console.log('Uploading to storage:', storagePath)

  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(storagePath, fixedBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError.message)
    process.exit(1)
  }

  console.log('Uploaded to storage:', storagePath)

  const { data: existing } = await supabase
    .from('master_templates')
    .select('id')
    .eq('document_type_kode', 'UNSUR-KETERANGAN')
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await supabase
      .from('master_templates')
      .update({
        template_docx_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('Update master_templates error:', updateError.message)
    } else {
      console.log('Updated master_templates with docx path')
    }
  } else {
    console.log('No master_template entry for UNSUR-KETERANGAN, creating one')
    const { error: insertError } = await supabase
      .from('master_templates')
      .insert({
        document_type_kode: 'UNSUR-KETERANGAN',
        template_docx_path: storagePath,
        content: '',
      })

    if (insertError) {
      console.error('Insert master_templates error:', insertError.message)
    } else {
      console.log('Created master_templates entry')
    }
  }

  const { data: tenantTemplates } = await supabase
    .from('templates')
    .select('id, tenant_id')
    .eq('template_docx_path', 'like', '%UNSUR-KETERANGAN%')

  console.log(`Found ${tenantTemplates?.length || 0} tenant templates with old docx path`)
  for (const tpl of tenantTemplates || []) {
    console.log(`  Tenant: ${tpl.tenant_id}, removing old docx path`)
    await supabase
      .from('templates')
      .update({ template_docx_path: null })
      .eq('id', tpl.id)
  }

  console.log('\nDone! Template DOCX UUK diperbaiki dan diupload.')
  console.log('Silakan refresh halaman editor dokumen.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
