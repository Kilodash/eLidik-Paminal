'use client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatSentenceCase } from '@/lib/utils'
import { ComponentProps } from 'react'

export function UppercaseInput(props: ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      onBlur={(e) => {
        if (props.onBlur) props.onBlur(e)
        e.target.value = e.target.value.toUpperCase()
      }}
    />
  )
}

export function SentenceCaseTextarea(props: ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      onBlur={(e) => {
        if (props.onBlur) props.onBlur(e)
        e.target.value = formatSentenceCase(e.target.value)
      }}
    />
  )
}
