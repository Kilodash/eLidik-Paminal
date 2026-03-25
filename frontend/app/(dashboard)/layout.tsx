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
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-primary text-primary-foreground",
          sidebarOpen ? "w-64" : "w-0 lg:w-16"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
            {sidebarOpen && (
              <div>
                <h2 className="text-xl font-bold font-heading">Simondu Web</h2>
                <p className="text-xs text-primary-foreground/70">Paminal Propam</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              data-testid="sidebar-toggle"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-primary-foreground/20 text-primary-foreground font-medium"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
                data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-primary-foreground/20">
            {sidebarOpen && (
              <div className="mb-3">
                <p className="text-sm font-medium text-primary-foreground">{user.name}</p>
                <p className="text-xs text-primary-foreground/70">{user.email}</p>
                {user.unit_name && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {user.unit_name}
                  </Badge>
                )}
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="secondary"
              size={sidebarOpen ? "default" : "icon"}
              className="w-full"
              data-testid="logout-button"
            >
              {sidebarOpen ? 'Logout' : 'X'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-background border-b shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-heading">Dashboard</h1>
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
