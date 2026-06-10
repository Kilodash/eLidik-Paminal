export type TenantRole = 'oversight' | 'admin_subbid' | 'operator_unit'

export type OrganizationType = 'bidpropam' | 'subbid' | 'unit'

export type PengaduanJenis = 'pengaduan' | 'laporan_informasi'

export type IdentitasStatus = 'diketahui' | 'tidak_diketahui' | 'terkonfirmasi'

export type DocumentStatus = 'draft' | 'final' | 'printed'

export interface Tenant {
  id: string
  kode: string
  nama: string
  alamat: string | null
  created_at: string
}

export interface Organization {
  id: string
  tenant_id: string
  parent_id: string | null
  tipe: OrganizationType
  kode: string | null
  nama: string
}

export interface WilayahSatker {
  id: string
  tenant_id: string
  kode: string | null
  nama: string
  created_at: string
}

export interface Personel {
  id: string
  tenant_id: string
  organization_id: string | null
  user_id: string | null
  role: TenantRole
  nip: string | null
  nama_lengkap: string | null
  pangkat: string | null
  jabatan: string | null
  kesatuan: string | null
  tim: string | null
  created_at: string
}

export interface Klasifikasi {
  id: string
  tenant_id: string
  kode: string | null
  nama: string
}

export interface Terlapor {
  id: string
  tenant_id: string
  nama: string | null
  nrp: string | null
  nip: string | null
  pangkat: string | null
  jabatan: string | null
  kesatuan: string | null
  personel_id: string | null
  status_identitas: IdentitasStatus
  created_at: string
}

export interface Pengaduan {
  id: string
  tenant_id: string
  unit_id: string | null
  berkas_id: string | null
  nomor_register: string | null
  jenis: PengaduanJenis
  tgl_pengaduan: string
  pelapor_nama: string | null
  pelapor_kontak: string | null
  satker_dilaporkan: string | null
  klasifikasi_id: string | null
  kronologi: string | null
  atensi: boolean
  status: string
  nomor_surat?: string | null
  tgl_surat?: string | null
  keterangan?: string | null
  created_by: string | null
  created_at: string
  // joined
  klasifikasi?: Klasifikasi | null
  unit?: Organization | null
  terlapor_list?: Terlapor[]
}

export interface Berkas {
  id: string
  tenant_id: string
  unit_id: string | null
  nomor_berkas: string | null
  judul: string | null
  tahun: number
  status: string
  tahap: string | null
  tgl_target: string | null
  operator_id: string | null
  created_at: string
  // joined
  unit?: Organization | null
  pengaduan_list?: Pengaduan[]
}

export interface DocumentType {
  id: string
  tenant_id: string
  kode: string | null
  nama: string | null
  tahap: string | null
  jenis_naskah: string | null
  kopstuk_tipe: string | null
  tribrata: string | null
  is_active: boolean
}

export interface Template {
  id: string
  tenant_id: string
  document_type_id: string | null
  content: string
  header_html: string | null
  footer_html: string | null
  created_at: string
}

export interface Document {
  id: string
  tenant_id: string
  template_id: string | null
  pengaduan_id: string | null
  berkas_id: string | null
  tahap: string | null
  nomor_surat: string | null
  tgl_dokumen: string | null
  content_rendered: string | null
  file_pdf: string | null
  status: DocumentStatus
  created_by: string | null
  created_at: string
}

export interface TindakLanjut {
  id: string
  tenant_id: string
  berkas_id: string | null
  deskripsi: string | null
  status_tl: string
  tgl_target: string | null
  tgl_selesai: string | null
  catatan: string | null
  created_by: string | null
  created_at: string
}

export interface Perdamaian {
  id: string
  pengaduan_id: string | null
  berkas_id: string | null
  tenant_id: string
  tahap_saat_damai: string | null
  tgl_perdamaian: string | null
  kronologi: string | null
  pihak_hadir: string | null
  created_by: string | null
  created_at: string
}

export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  judul: string | null
  isi: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  summary: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface SearchFilters {
  query?: string
  status?: string[]
  unitId?: string
  klasifikasiId?: string
  tglFrom?: string
  tglTo?: string
  overdue?: boolean
  atensi?: boolean
  page?: number
  limit?: number
}

export interface DashboardStats {
  total: number
  proses: number
  selesai: number
  terbukti: number
  tidak_terbukti: number
  sla_lewat: number
}

export interface AnevJenisRow {
  klasifikasi: string
  jumlah: number
  proses: number
  selesai: number
  terbukti: number
  tidak_terbukti: number
  persen_selesai: number
}

export interface AnevUnitRow {
  unit: string
  unit_id: string
  jumlah: number
  proses: number
  selesai: number
  terbukti: number
  tidak_terbukti: number
  persen_selesai: number
}

export interface BerkasCompleteness {
  berkas_id: string
  nomor_berkas: string
  status: string
  unit_nama: string
  missing_docs: string[]
}
