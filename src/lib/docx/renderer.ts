import { createAdminClient } from '@/lib/supabase/admin'

let Docxtemplater: any
let PizZip: any
let createRawXmlModule: any

async function ensureModules() {
  if (!Docxtemplater) {
    Docxtemplater = (await import('docxtemplater')).default
  }
  if (!PizZip) {
    PizZip = (await import('pizzip')).default
  }
  if (!createRawXmlModule) {
    const mod = await import('docxtemplater/js/modules/rawxml.js')
    createRawXmlModule = mod.default ?? mod
  }
}

export interface DocxRenderResult {
  buffer: Buffer | null
  error: string | null
}

export async function loadTemplateFromStorage(path: string): Promise<Buffer | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('templates')
    .download(path)

  if (error || !data) return null

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function uploadTemplateToStorage(
  path: string,
  buffer: Buffer,
  contentType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
): Promise<{ path: string } | { error: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from('templates')
    .upload(path, buffer, {
      contentType,
      upsert: true,
    })

  if (error) return { error: error.message }
  return { path }
}

export async function downloadTemplateAsBlob(path: string): Promise<Blob | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('templates')
    .download(path)

  if (error || !data) return null
  return data
}

export function renderDocx(
  templateBuffer: Buffer,
  data: Record<string, unknown>,
  options: {
    stempelXml?: string
  } = {},
): Buffer {
  if (!PizZip || !Docxtemplater) {
    throw new Error('docxtemplater modules not loaded. Call ensureModules() first.')
  }

  const zip = new PizZip(templateBuffer)

  const modules: any[] = []
  if (options.stempelXml && createRawXmlModule) {
    modules.push(createRawXmlModule())
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    modules,
  })

  if (options.stempelXml) {
    data.stempel = options.stempelXml
  }

  doc.render(data)

  const generated = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  })

  return generated
}

export async function renderDocxFromTemplatePath(
  templatePath: string,
  data: Record<string, unknown>,
  options: {
    stempelXml?: string
  } = {},
): Promise<DocxRenderResult> {
  await ensureModules()

  const templateBuffer = await loadTemplateFromStorage(templatePath)
  if (!templateBuffer) {
    return { buffer: null, error: 'Template .docx tidak ditemukan di storage' }
  }

  try {
    const buffer = renderDocx(templateBuffer, data, options)
    return { buffer, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal render dokumen'
    console.error('[docx renderer]', err)
    if (err && typeof err === 'object' && 'properties' in err) {
      const multiErr = err as any
      console.error('[docx renderer] Properties:', multiErr.properties)
      if (multiErr.properties?.errors) {
        for (const e of multiErr.properties.errors) {
          console.error('[docx renderer] Sub-error:', e.message || e)
        }
      }
    }
    return { buffer: null, error: message }
  }
}
