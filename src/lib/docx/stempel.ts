export function generateStempelXml(base64String: string): string {
  // Placeholder jika implementasi asli hilang
  // Menyisipkan gambar via rawxml di DOCX membutuhkan struktur XML khusus (w:drawing) 
  // dan relationship ID, untuk sementara kita berikan teks w:r standar.
  return `<w:r><w:t>[Stempel Terlampir]</w:t></w:r>`
}
