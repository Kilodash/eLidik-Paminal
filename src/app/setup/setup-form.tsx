'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

import { Eye, EyeOff } from 'lucide-react'

interface SetupFormProps {
  onSubmitAction: (formData: FormData) => Promise<{error?: string} | void>
}

export function SetupForm({ onSubmitAction }: SetupFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogDesc, setDialogDesc] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await onSubmitAction(formData)
      if (result && result.error) {
        setDialogTitle('Pendaftaran Gagal')
        setDialogDesc(result.error)
        setIsSuccess(false)
        setDialogOpen(true)
      } else {
        setDialogTitle('Pendaftaran Berhasil')
        setDialogDesc('Akun admin berhasil dibuat. Silakan login menggunakan email dan password yang didaftarkan.')
        setIsSuccess(true)
        setDialogOpen(true)
      }
    } catch (e: any) {
      setDialogTitle('Pendaftaran Gagal')
      setDialogDesc(e.message || 'Terjadi kesalahan sistem.')
      setIsSuccess(false)
      setDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  function handleDialogConfirm() {
    setDialogOpen(false)
    if (isSuccess) {
      router.push('/login')
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenant_nama" className="text-xs">Nama Instansi (Polda)</Label>
        <Input name="tenant_nama" placeholder="Contoh: Polda Jawa Barat" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant_kode" className="text-xs">Kode Instansi</Label>
        <Input name="tenant_kode" placeholder="Contoh: JBR" required className="w-full uppercase" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant_alamat" className="text-xs">Alamat Instansi</Label>
        <Input name="tenant_alamat" placeholder="Masukkan alamat lengkap instansi" required className="w-full" />
      </div>

      <input type="hidden" name="role" value="admin_subbid" />

      <div className="pt-4 border-t border-border/50">
        <h3 className="text-sm font-medium mb-3">Akun Administrator</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_lengkap" className="text-xs">Username / Nama Pengguna</Label>
        <Input name="nama_lengkap" placeholder="Masukkan nama pengguna" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input name="email" type="email" placeholder="email@polri.go.id" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs">Password</Label>
        <div className="relative">
          <Input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Minimal 6 karakter" 
            required 
            minLength={6} 
            className="w-full pr-10" 
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            </span>
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Memproses...' : 'Daftarkan Instansi & Akun'}
      </Button>
    </form>
    
    <ConfirmDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      title={dialogTitle}
      description={dialogDesc}
      confirmLabel={isSuccess ? 'Ke Halaman Login' : 'Tutup'}
      cancelLabel=""
      onConfirm={handleDialogConfirm}
    />
    </>
  )
}
