export interface DisposisiItem {
  id: string
  label: string
  tipe: 'kabidpropam' | 'kasubbidpaminal'
  is_active: boolean
  urutan: number
}

export const disposisiData: DisposisiItem[] = [
  { id: 'k1', label: 'WAKILI/HADIRI', tipe: 'kabidpropam', is_active: true, urutan: 1 },
  { id: 'k2', label: 'ACC/MAKLUM', tipe: 'kabidpropam', is_active: true, urutan: 2 },
  { id: 'k3', label: 'GUNAKAN SEBAGAI PEDOMAN', tipe: 'kabidpropam', is_active: true, urutan: 3 },
  { id: 'k4', label: 'TELITI/PELAJARI', tipe: 'kabidpropam', is_active: true, urutan: 4 },
  { id: 'k5', label: 'SARAN', tipe: 'kabidpropam', is_active: true, urutan: 5 },
  { id: 'k6', label: 'PROSES SESUAI PROSEDUR', tipe: 'kabidpropam', is_active: true, urutan: 6 },
  { id: 'k7', label: 'JADWALKAN/AGENDAKAN', tipe: 'kabidpropam', is_active: true, urutan: 7 },
  { id: 'k8', label: 'TINDAKLANJUTI', tipe: 'kabidpropam', is_active: true, urutan: 8 },
  { id: 'k9', label: 'TUNTASKAN', tipe: 'kabidpropam', is_active: true, urutan: 9 },
  { id: 'k10', label: 'LAPORKAN PERKEMBANGANYA', tipe: 'kabidpropam', is_active: true, urutan: 10 },
  { id: 'k11', label: 'BICARAKAN DENGAN SAYA', tipe: 'kabidpropam', is_active: true, urutan: 11 },
  { id: 'k12', label: 'CATAT/DATAKAN/FILE', tipe: 'kabidpropam', is_active: true, urutan: 12 },
  { id: 'k13', label: 'PERTIMBANGKAN', tipe: 'kabidpropam', is_active: true, urutan: 13 },
  { id: 'k14', label: 'AKOMODIR', tipe: 'kabidpropam', is_active: true, urutan: 14 },
  { id: 'k15', label: 'RAPATKAN', tipe: 'kabidpropam', is_active: true, urutan: 15 },
  { id: 'k16', label: 'UDK', tipe: 'kabidpropam', is_active: true, urutan: 16 },
  { id: 's1', label: 'WAKILI/HADIRI', tipe: 'kasubbidpaminal', is_active: true, urutan: 1 },
  { id: 's2', label: 'ACC/MAKLUM', tipe: 'kasubbidpaminal', is_active: true, urutan: 2 },
  { id: 's3', label: 'GUNAKAN SEBAGAI PEDOMAN', tipe: 'kasubbidpaminal', is_active: true, urutan: 3 },
  { id: 's4', label: 'TELITI/PELAJARI', tipe: 'kasubbidpaminal', is_active: true, urutan: 4 },
  { id: 's5', label: 'SARAN', tipe: 'kasubbidpaminal', is_active: true, urutan: 5 },
  { id: 's6', label: 'PROSES SESUAI PROSEDUR', tipe: 'kasubbidpaminal', is_active: true, urutan: 6 },
  { id: 's7', label: 'JADWALKAN/AGENDAKAN', tipe: 'kasubbidpaminal', is_active: true, urutan: 7 },
  { id: 's8', label: 'TINDAKLANJUTI', tipe: 'kasubbidpaminal', is_active: true, urutan: 8 },
  { id: 's9', label: 'TUNTASKAN', tipe: 'kasubbidpaminal', is_active: true, urutan: 9 },
  { id: 's10', label: 'LAPORKAN PERKEMBANGANYA', tipe: 'kasubbidpaminal', is_active: true, urutan: 10 },
  { id: 's11', label: 'BICARAKAN DENGAN SAYA', tipe: 'kasubbidpaminal', is_active: true, urutan: 11 },
  { id: 's12', label: 'CATAT/DATAKAN/FILE', tipe: 'kasubbidpaminal', is_active: true, urutan: 12 },
  { id: 's13', label: 'PERTIMBANGKAN', tipe: 'kasubbidpaminal', is_active: true, urutan: 13 },
  { id: 's14', label: 'AKOMODIR', tipe: 'kasubbidpaminal', is_active: true, urutan: 14 },
  { id: 's15', label: 'RAPATKAN', tipe: 'kasubbidpaminal', is_active: true, urutan: 15 },
  { id: 's16', label: 'UDK', tipe: 'kasubbidpaminal', is_active: true, urutan: 16 },
]
