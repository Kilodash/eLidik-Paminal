'use client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatSentenceCase } from '@/lib/utils'
import { ComponentProps, useCallback } from 'react'

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype,
    'value'
  )?.set
  if (nativeSetter) {
    nativeSetter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function UppercaseInput(props: ComponentProps<typeof Input>) {
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) props.onBlur(e)
    const formatted = e.target.value.toUpperCase()
    if (formatted !== e.target.value) setNativeValue(e.target, formatted)
  }, [props.onBlur])

  return <Input {...props} onBlur={handleBlur} />
}

export function SentenceCaseTextarea(props: ComponentProps<typeof Textarea>) {
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (props.onBlur) props.onBlur(e)
    const formatted = formatSentenceCase(e.target.value)
    if (formatted !== e.target.value) setNativeValue(e.target, formatted)
  }, [props.onBlur])

  return <Textarea {...props} onBlur={handleBlur} />
}
