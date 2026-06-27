'use client'
import { Input } from '@/components/ui/input'
import { formatNameCase } from '@/lib/utils'
import { ComponentProps, useRef, useCallback } from 'react'

export function NameInput(props: ComponentProps<typeof Input>) {
  const ref = useRef<HTMLInputElement>(null)

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) props.onBlur(e)
    const formatted = formatNameCase(e.target.value)
    if (formatted !== e.target.value) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(e.target, formatted)
        e.target.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  }, [props.onBlur])

  return (
    <Input
      {...props}
      ref={ref}
      onBlur={handleBlur}
    />
  )
}
