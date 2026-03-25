'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image' // Added next/image import
import { Home, FileText, PlusCircle, Settings, Archive, Menu, X, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  unit_name?: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))

    // Fetch notification count
    fetchNotificationCount(token)
  }, [])

  const fetchNotificationCount = async (token: string) => {
    try {
      const response = await fetch('/api/notifications?unread_only=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setNotificationCount(data.unread_count || 0)
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const menuItems = [
    { href: '/', icon: Home, label: 'Dashboard', roles: ['all'] },
    { href: '/dumas', icon: FileText, label: 'Daftar Dumas', roles: ['all'] },
    { href: '/dumas/create', icon: PlusCircle, label: 'Registrasi Dumas', roles: ['admin', 'superadmin'] },
    { href: '/pengaturan', icon: Settings, label: 'Pengaturan', roles: ['admin', 'superadmin'] },
    { href: '/arsip', icon: Archive, label: 'Arsip', roles: ['admin', 'superadmin'] },
  ]

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes('all') || item.roles.includes(user?.role || '')
  )

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col relative font-sans">
      {/* Apple VisionOS Global Background Blur Orbs (Optional aesthetic) */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-indigo-300/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Top Navbar (Apple Glass) */}
      <header className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-4 sm:px-8 py-2 apple-glass rounded-[2rem] shadow-sm transform transition-all duration-300 ease-in-out">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 group cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => router.push('/')}>
          <div className="bg-transparent rounded-full flex items-center justify-center p-0.5">
            <Image src="/logo.png" alt="Logo" width={34} height={34} className="object-contain drop-shadow-sm" priority />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent font-heading tracking-tight leading-none">Simondu</h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold leading-none mt-0.5">Polda Jabar</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-200/40 rounded-full border border-white/50 backdrop-blur-md">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-100/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                )}
                data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className={cn("h-4 w-4 transition-transform duration-300", isActive ? "scale-110 text-blue-600" : "")} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Actions: User & Notifications */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2 rounded-full hover:bg-slate-200/50 text-slate-600 transition-colors" data-testid="notification-bell">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-none shadow-sm animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-3 pl-3 pr-1 py-1 bg-white/60 border border-white/40 rounded-full shadow-sm hover:bg-white transition-colors cursor-pointer group">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-tight">{user.role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-inner font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            title="Keluar"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-slate-600 hover:bg-slate-200/50 rounded-full"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown (Apple Glass) */}
      {sidebarOpen && (
        <div className="md:hidden fixed top-20 left-4 right-4 z-40 apple-glass rounded-2xl shadow-xl border border-white/40 p-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col space-y-1">
            {filteredMenu.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-blue-600/10 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-12 z-10 transition-all duration-300" data-testid="main-content">
        {children}
      </main>
    </div>
  )
}
