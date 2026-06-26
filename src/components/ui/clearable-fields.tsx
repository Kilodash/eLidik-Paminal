'use client'

import React, { useState, useEffect } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function ClearableDatePicker(props: React.ComponentProps<typeof DatePicker>) {
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    const handleClear = () => setResetKey(k => k + 1)
    window.addEventListener('clear-pengaduan-fields', handleClear)
    return () => window.removeEventListener('clear-pengaduan-fields', handleClear)
  }, [])

  // When resetKey changes, DatePicker remounts with value=undefined (or whatever props specify, but we can override it)
  // The user wants it to be 'kosong' (empty) upon failure.
  return <DatePicker {...props} key={resetKey} value={resetKey > 0 ? undefined : props.value} />
}

export function ClearableSelect({ options, defaultValue, ...props }: any) {
  const [resetKey, setResetKey] = useState(0)
  const [val, setVal] = useState(defaultValue)

  useEffect(() => {
    const handleClear = () => {
      setResetKey(k => k + 1)
      setVal('--') // Reset to default placeholder '--'
    }
    window.addEventListener('clear-pengaduan-fields', handleClear)
    return () => window.removeEventListener('clear-pengaduan-fields', handleClear)
  }, [])

  return (
    <Select {...props} key={resetKey} value={val} onValueChange={(v) => {
      setVal(v)
      if (props.onValueChange) props.onValueChange(v)
    }}>
      <SelectTrigger key="trigger" className="h-8 text-xs w-full">
        <SelectValue placeholder="Pilih..." />
      </SelectTrigger>
      <SelectContent key="content">
        {options.map((opt: any, index: number) => (
          <SelectItem key={opt.value ? String(opt.value) : `opt-${index}`} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
