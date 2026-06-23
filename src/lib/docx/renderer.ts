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

const templateCache = new Map<string, { buffer: Buffer; ts: number }>()
const TEMPLATE_CACHE_TTL = 30_000

export async function loadTemplateFromStorage(path: string): Promise<Buffer | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('templates')
    .download(path)

  if (error || !data) return null

  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  templateCache.set(path, { buffer, ts: Date.now() })
  return buffer
}

export async function loadTemplateFromStorageCached(path: string): Promise<Buffer | null> {
  const cached = templateCache.get(path)
  if (cached && Date.now() - cached.ts < TEMPLATE_CACHE_TTL) {
    return cached.buffer
  }
  return loadTemplateFromStorage(path)
}

export function invalidateTemplateCache(path?: string) {
  if (path) {
    templateCache.delete(path)
  } else {
    templateCache.clear()
  }
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

// Placeholder "list" yang sering ditulis sebagai blok loop docxtemplater yang salah
// di dalam satu sel tabel (mis. "{{list_baket {{baket1}}{{baket2}} /list_baket}}").
// Dinormalkan menjadi satu placeholder multiline: "{{list_baket}}".
const LIST_PLACEHOLDER_KEYS = ['list_baket', 'list_sumber_baket', 'list_taktik_baket']

// Gabungkan teks placeholder yang terbelah antar-run (run-splitting Word) dalam satu paragraf.
function mergeSplitRunsInParagraph(para: string): string {
  if (para.indexOf('{') === -1) return para
  const texts: string[] = []
  para.replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g, (m, t) => { texts.push(t); return m })
  if (texts.length <= 1) return para
  const joined = texts.join('')
  if (joined.indexOf('{') === -1) return para
  let idx = 0
  return para.replace(/(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g, (_m, open: string, _t: string, close: string) => {
    if (idx++ === 0) {
      const openFixed = /xml:space=/.test(open) ? open : open.replace(/^<w:t/, '<w:t xml:space="preserve"')
      return openFixed + joined + close
    }
    return '<w:t xml:space="preserve"></w:t>'
  })
}

// Untuk sel tabel yang berisi blok list rusak, kembalikan placeholder tunggal yang valid.
function repairListCells(xml: string): string {
  return xml.replace(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g, (tc) => {
    const clean = tc.replace(/<[^>]+>/g, '')
    const key = LIST_PLACEHOLDER_KEYS.find((k) => clean.indexOf('{{' + k) !== -1)
    if (!key) return tc
    const firstParaMatch = tc.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/)
    if (!firstParaMatch) return tc
    const firstPara = firstParaMatch[0]
    const pPr = (firstPara.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0]
    const rPr = (firstPara.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0]
    const tcPr = (tc.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/) || [''])[0]
    const tcOpen = (tc.match(/^<w:tc\b[^>]*>/) || ['<w:tc>'])[0]
    const newPara = '<w:p>' + pPr + '<w:r>' + rPr + '<w:t xml:space="preserve">{{' + key + '}}</w:t></w:r></w:p>'
    return tcOpen + tcPr + newPara + '</w:tc>'
  })
}

// Normalisasi/perbaikan template DOCX agar placeholder yang ter-split atau salah-tulis
// tetap bisa dirender docxtemplater. Aman dijalankan pada template yang sudah benar (idempoten).
export function repairTemplateXml(xml: string): string {
  let out = xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, mergeSplitRunsInParagraph)
  out = repairListCells(out)
  return out
}

function applyTemplateRepair(zip: any): void {
  const candidates = ['word/document.xml']
  // Sertakan semua header & footer.
  for (const name of Object.keys(zip.files)) {
    if (/^word\/(header|footer)\d*\.xml$/.test(name)) candidates.push(name)
  }
  for (const name of candidates) {
    const file = zip.file(name)
    if (!file) continue
    const xml = file.asText()
    if (xml.indexOf('{{') === -1) continue
    const repaired = repairTemplateXml(xml)
    if (repaired !== xml) zip.file(name, repaired)
  }
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

  // Perbaiki placeholder yang ter-split/salah-tulis sebelum compile docxtemplater.
  applyTemplateRepair(zip)

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
    useCache?: boolean
  } = {},
): Promise<DocxRenderResult> {
  await ensureModules()

  const loader = options.useCache ? loadTemplateFromStorageCached : loadTemplateFromStorage
  const templateBuffer = await loader(templatePath)
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
