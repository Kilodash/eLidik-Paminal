import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNameCase(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatSentenceCase(text: string | null | undefined): string {
  if (!text) return ''
  const trimmed = text.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function formatNomorDokumen(template: string, date: Date): string {
  let result = template
  result = result.replace(/\{\{bulan_romawi\}\}/g, ROMAWI[date.getMonth() + 1] || '')
  result = result.replace(/\{\{tahun\}\}/g, String(date.getFullYear()))
  return result
}
