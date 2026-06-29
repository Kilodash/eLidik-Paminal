'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FormEvent, useRef, useState } from 'react'

export function PengaduanClientForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<{ success?: boolean; error?: string }>
  children: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  
  // We can use a counter state to force re-render/reset of controlled custom components if needed
  // But standard way is to intercept the submit.
  const [resetKey, setResetKey] = useState(0)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    toast.promise(
      action(formData).then((res) => {
        if (res?.error) {
          throw new Error(res.error)
        }
        return res
      }),
      {
        loading: 'Menyimpan data...',
        success: () => {
          const isEdit = !!formData.get('editId')
          if (isEdit) {
            router.refresh()
            return 'Data berhasil disimpan!'
          }
          if (formRef.current) formRef.current.reset()
          window.dispatchEvent(new CustomEvent('clear-pengaduan-fields'))
          router.push('/pengaduan')
          router.refresh()
          return 'Data berhasil disimpan!'
        },
        error: (err) => {
          // On error (gagal edit), user wants to clear Tanggal and Jenis Dumas.
          // Because Jenis Dumas is a Radix Select and Tanggal is a custom DatePicker,
          // the easiest way to clear them is to manipulate the DOM or reset their keys.
          // But since they are passed as children, we can't easily change their props here unless we use Context.
          
          // An alternative is to just find the hidden inputs or buttons and clear them
          const dateButton = form.querySelector('button[name="tgl_pengaduan"]')
          if (dateButton) {
            // It might not be easy to clear it via DOM if it relies on React state
          }
          
          // Triggering a custom reset key to force re-render children might work if we wrapped them,
          // but they are passed as `children`. We can dispatch a custom event.
          window.dispatchEvent(new CustomEvent('clear-pengaduan-fields'))
          
          return err.message || 'Gagal menyimpan data'
        },
      }
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className} key={resetKey}>
      {children}
    </form>
  )
}
