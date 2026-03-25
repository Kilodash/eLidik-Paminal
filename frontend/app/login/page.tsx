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
      
      // Redirect to dashboard
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.ico"
              alt="Logo Polri"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-heading">Simondu Web</h1>
          <p className="text-slate-300">Sistem Monitoring Dumas - Subbid Paminal Bidpropam Polda Jabar</p>
        </div>

        <Card className="shadow-2xl bg-white border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-slate-900">Login</CardTitle>
            <CardDescription className="text-slate-600">
              Masuk dengan akun yang telah terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" data-testid="login-email-label" className="text-slate-800 font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@simondu.polri.go.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="login-email-input"
                  className="bg-slate-50 text-slate-900 border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" data-testid="login-password-label" className="text-slate-800 font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="login-password-input"
                  className="bg-slate-50 text-slate-900 border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Akun Demo:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• superadmin@simondu.polri.go.id</li>
                <li>• admin@simondu.polri.go.id</li>
                <li>• unit1@simondu.polri.go.id</li>
                <li className="mt-2 text-xs"><strong>Password:</strong> password123</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-300">
          © 2024 Polda Jabar. All rights reserved.
        </div>
      </div>
    </div>
  )
}
