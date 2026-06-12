'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VariabelFormProps {
  id: string
  varKey: string
  initialValue: string
  action: (state: any, fd: FormData) => Promise<{ success?: boolean; error?: string; message?: string }>
}

export function VariabelForm({ id, varKey, initialValue, action }: VariabelFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Variabel berhasil disimpan')
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label className="text-xs font-mono">{varKey}</Label>
        <Input 
          key={initialValue}
          name="value" 
          defaultValue={initialValue} 
        />
      </div>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </form>
  )
}
