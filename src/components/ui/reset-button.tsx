'use client'

import { Button } from '@/components/ui/button'

export function ResetButton() {
  return (
    <Button 
      type="button" 
      variant="outline" 
      className="flex-1 text-xs h-8"
      onClick={(e) => {
        const form = e.currentTarget.form
        if (form) form.reset()
        window.dispatchEvent(new CustomEvent('clear-pengaduan-fields'))
      }}
    >
      Reset
    </Button>
  )
}
