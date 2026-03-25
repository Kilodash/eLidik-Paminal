import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Email dan password harus diisi'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Shield className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-3">SIMONDU Web</h1>
            <p className="text-blue-200 text-lg mb-2">Sistem Monitoring Dumas</p>
            <p className="text-slate-400 text-sm max-w-md">
              Subbidpaminal Bidpropam Polda Jabar
            </p>
            <div className="mt-12 flex items-center gap-6 text-slate-400 text-xs">
              <div className="text-center"><div className="text-2xl font-bold text-white mb-1">24/7</div>Monitoring</div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center"><div className="text-2xl font-bold text-white mb-1">Real-time</div>Notifikasi</div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center"><div className="text-2xl font-bold text-white mb-1">Secure</div>Terenkripsi</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">SIMONDU Web</h1>
            <p className="text-slate-500 text-sm">Sistem Monitoring Dumas</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Masuk ke Akun</h2>
            <p className="text-sm text-slate-500 mb-6">Gunakan kredensial yang telah diberikan</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@simondu.polri.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-11 focus:ring-2 focus:ring-blue-500"
                  data-testid="login-email"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10 focus:ring-2 focus:ring-blue-500"
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-blue-800 hover:bg-blue-900 text-white font-medium"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Bidpropam Polda Jawa Barat &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
