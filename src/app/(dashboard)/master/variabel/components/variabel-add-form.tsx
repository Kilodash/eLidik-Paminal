'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface VariabelAddFormProps {
  action: (state: any, fd: FormData) => Promise<{ success?: boolean; error?: string; message?: string }>
}

export function VariabelAddForm({ action }: VariabelAddFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Variabel baru berhasil ditambahkan')
      // Reset the form on successful addition
      const form = document.getElementById('variabel-add-form') as HTMLFormElement
      if (form) form.reset()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form id="variabel-add-form" action={formAction} className="flex items-end gap-2 pt-4 border-t">
      <div className="flex-1 space-y-2">
        <Label htmlFor="key">Key baru</Label>
        <Input name="key" placeholder="nama_kasat" required />
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input name="value" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Menambah...' : <><Plus className="h-4 w-4 mr-1" />Tambah</>}
      </Button>
    </form>
  )
}
