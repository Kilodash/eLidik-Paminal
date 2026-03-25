import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Plus, ClipboardCheck, Settings,
  Trash2, LogOut, Menu, X, ChevronRight, Shield, Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const NAV_ITEMS = {
  superadmin: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dumas', icon: FileText, label: 'Daftar Dumas' },
    { path: '/dumas/create', icon: Plus, label: 'Registrasi Dumas' },
    { path: '/approval', icon: ClipboardCheck, label: 'Verifikasi' },
    { path: '/settings', icon: Settings, label: 'Pengaturan' },
    { path: '/archive', icon: Trash2, label: 'Arsip / Trash' },
    { path: '/users', icon: Users, label: 'Pengguna' },
  ],
  admin: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dumas', icon: FileText, label: 'Daftar Dumas' },
    { path: '/dumas/create', icon: Plus, label: 'Registrasi Dumas' },
  ],
  unit: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dumas', icon: FileText, label: 'Dumas Saya' },
  ],
  pimpinan: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dumas', icon: FileText, label: 'Daftar Dumas' },
    { path: '/approval', icon: ClipboardCheck, label: 'Verifikasi' },
  ],
};

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  unit: 'Unit',
  pimpinan: 'Pimpinan',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.unit;
  const mobileNavItems = navItems.slice(0, 4);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-30">
        <div className="flex flex-col flex-grow bg-slate-900 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">SIMONDU</h1>
              <p className="text-slate-400 text-[10px] leading-tight">Sistem Monitoring Dumas</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.path.replace(/\//g, '-').replace(/^-/, '')}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {item.label}
                  {active && <ChevronRight className="h-4 w-4 ml-auto text-blue-400" />}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="mobile-menu-toggle">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-slate-900 border-none">
              <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-sm">SIMONDU</h1>
                  <p className="text-slate-400 text-[10px]">Sistem Monitoring Dumas</p>
                </div>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-slate-400 text-xs">{ROLE_LABELS[user?.role]}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400 hover:text-red-400" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-800" />
            <span className="font-bold text-sm text-slate-900">SIMONDU</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>
      </header>

      {/* Desktop Header */}
      <div className="hidden lg:block lg:pl-64">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role]}{user?.unit_name ? ` - ${user.unit_name}` : ''}</p>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pb-24 lg:pb-6">
        <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white/90 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                active ? 'text-blue-700' : 'text-slate-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-blue-700' : ''}`} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
