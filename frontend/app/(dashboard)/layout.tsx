'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-slate-950 border-r border-slate-800 text-slate-100",
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.1)]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
            {sidebarOpen && (
              <div className="flex-1">
                <h2 className="text-xl font-bold font-heading tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">Simondu Web</h2>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">Paminal Propam</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              data-testid="sidebar-toggle"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 mx-auto" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-2">
            {filteredMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-250 group",
                  pathname === item.href
                    ? "bg-blue-600/15 text-blue-400 font-semibold shadow-[0_0_12px_rgba(37,99,235,0.1)]"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
                data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-250 group-hover:scale-110",
                  pathname === item.href ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                )} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 m-4 rounded-2xl bg-slate-900 border border-slate-800/80">
            {sidebarOpen && (
              <div className="mb-4">
                <p className="text-sm font-bold text-white tracking-wide">{user.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                {user.unit_name && (
                  <Badge className="mt-2 text-[10px] bg-slate-800 text-slate-300 pointer-events-none hover:bg-slate-800 border-none">
                    {user.unit_name}
                  </Badge>
                )}
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="destructive"
              size={sidebarOpen ? "default" : "icon"}
              className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-none rounded-xl"
              data-testid="logout-button"
            >
              {sidebarOpen ? 'Keluar Log' : 'X'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 bg-slate-50/50",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent font-heading tracking-tight">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid="notification-bell"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
