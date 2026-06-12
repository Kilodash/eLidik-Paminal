'use client'

import * as React from 'react'
import { useFontSize } from '@/components/font-provider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useFontSize()

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="font-size" className="text-sm font-medium">Ukuran Tampilan (UI Scale)</Label>
      <Select value={fontSize} onValueChange={(val: string | null) => {
        if (val) setFontSize(val as any)
      }}>
        <SelectTrigger id="font-size" className="w-[200px]">
          <SelectValue placeholder="Pilih Ukuran" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="xs">Sangat Kecil (XS)</SelectItem>
          <SelectItem value="sm">Kecil (SM)</SelectItem>
          <SelectItem value="base">Sedang (Base)</SelectItem>
          <SelectItem value="lg">Besar (LG)</SelectItem>
          <SelectItem value="xl">Sangat Besar (XL)</SelectItem>
          <SelectItem value="xxl">Ekstra Besar (XXL)</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        Perubahan ini akan memperbesar atau memperkecil seluruh elemen antarmuka.
      </p>
    </div>
  )
}
