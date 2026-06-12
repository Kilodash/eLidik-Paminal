'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deletePersonelAction } from '@/app/(dashboard)/pengaturan/personel/actions'

export function ConfirmDeletePersonel({ id, nama }: { id: string, nama: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      await deletePersonelAction(id)
      setIsOpen(false)
      router.refresh()
    } catch (e: any) {
      alert(`Gagal hapus: ${e.message}`)
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Hapus Personel"
        description={`Anda yakin ingin menghapus data personel "${nama}"? Tindakan ini tidak dapat dibatalkan.`}
        variant="destructive"
        confirmLabel="Hapus"
        onConfirm={handleDelete}
      />
    </>
  )
}
