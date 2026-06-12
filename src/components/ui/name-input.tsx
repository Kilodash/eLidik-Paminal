'use client'
import { Input } from '@/components/ui/input'
import { formatNameCase } from '@/lib/utils'
import { ComponentProps } from 'react'

export function NameInput(props: ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      onBlur={(e) => {
        if (props.onBlur) props.onBlur(e)
        e.target.value = formatNameCase(e.target.value)
      }}
    />
  )
}
