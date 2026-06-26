import { resolveDocumentVariables } from '@/lib/template/resolver'

export async function buildDocxData(pengaduanId: string, documentTypeKode: string): Promise<Record<string, unknown>> {
  // Menggunakan resolver yang sudah ada sebagai basis data DOCX
  const { variables } = await resolveDocumentVariables(pengaduanId, documentTypeKode)
  return variables
}
