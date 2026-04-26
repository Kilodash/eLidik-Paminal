'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal')
      }

      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      toast.success('Login berhasil!')
      
      // Redirect to dashboard using window.location to ensure fresh mount and localStorage read
      window.location.href = '/'
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Hero Section (Left on Desktop, Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400 rounded-full blur-[120px] opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-heading font-bold text-2xl tracking-tight">
            <Image
              src="/logo.ico"
              alt="Logo Polri"
              width={40}
              height={40}
              className="drop-shadow-md"
            />
            Simondu Web
          </div>
        </div>

        <div className="relative z-10 max-w-[480px]">
          <h1 className="text-4xl lg:text-5xl font-extrabold font-heading mb-6 leading-tight tracking-tight">Sistem Monitoring Dumas Terintegrasi</h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">Platform digital Subbid Paminal Bidpropam Polda Jabar untuk pengelolaan pengaduan masyarakat yang cepat, transparan, dan akuntabel.</p>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-600">© 2024 Polda Jabar. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Login Form Section (Right) */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative w-full lg:w-4/5 max-w-lg mx-auto h-screen lg:h-auto">
        <div className="w-full">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden text-center mb-10">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.ico"
                alt="Logo Polri"
                width={70}
                height={70}
                className="drop-shadow-md"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-heading tracking-tight">Simondu Web</h1>
            <p className="text-sm font-medium text-slate-500">Paminal Bidpropam Polda Jabar</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Selamat Datang</h2>
            <p className="text-slate-500 font-medium">Masuk untuk melanjutkan ke dashboard monitoring.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" data-testid="login-email-label" className="text-sm font-bold text-slate-700">Email Akses</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@simondu.polri.go.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="login-email-input"
                className="h-12 bg-white text-slate-900 border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm font-medium px-4"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" data-testid="login-password-label" className="text-sm font-bold text-slate-700">Kata Sandi</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="login-password-input"
                className="h-12 bg-white text-slate-900 border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm font-medium px-4"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-[0_4px_14px_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all duration-200 mt-4"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Memverifikasi...</span>
                </div>
              ) : 'Masuk ke Sistem'}
            </Button>
          </form>

          <div className="mt-8 p-5 bg-slate-100/60 rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Kredensial Demo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-400">Superadmin:</span>
                <span className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 truncate shadow-sm">superadmin@simondu.polri.go.id</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-400">Admin/Unit:</span>
                <span className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 truncate shadow-sm">admin@... / unit1@...</span>
              </div>
              <div className="sm:col-span-2 mt-1.5 bg-slate-200/50 p-2.5 rounded-lg flex items-center justify-between border border-slate-200">
                <span className="text-slate-500 font-bold">Kata Sandi Bersama:</span>
                <span className="font-mono bg-white border border-slate-300 px-3 py-1 rounded text-slate-800 font-bold shadow-sm">password123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
