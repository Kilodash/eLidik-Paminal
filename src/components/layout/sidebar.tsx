'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/sidebar-context'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  FileCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  MapPin,
  Tags,
  Variable,
  Wrench,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const mainItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pengaduan', label: 'Pengaduan', icon: FileText },
  { href: '/berkas', label: 'Berkas', icon: FolderOpen },
  { href: '/dokumen', label: 'Dokumen', icon: FileCheck },
]

const pengaturanItems = [
  { href: '/pengaturan/organisasi', label: 'Organisasi', icon: Building2 },
  { href: '/pengaturan/personel', label: 'Personel', icon: Users },
  { href: '/pengaturan/wilayah', label: 'Wilayah / Satker', icon: MapPin },
  { href: '/pengaturan/jenis-pengaduan', label: 'Jenis Pengaduan', icon: Tags },
  { href: '/pengaturan/klasifikasi', label: 'Klasifikasi', icon: Tags },
  { href: '/pengaturan/variabel', label: 'Variabel Dokumen', icon: Variable },
  { href: '/pengaturan/sistem', label: 'Sistem Lain', icon: Wrench },
]

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()
  const [pengaturanOpen, setPengaturanOpen] = useState(true)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isPengaturanActive = pengaturanItems.some((item) => isActive(item.href))

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300 ease-in-out h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center h-14 px-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-primary leading-tight tracking-tight">e-Lidik Paminal</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Bidpropam / Subbid Paminal</p>
          </div>
        )}
        <button
          onClick={toggle}
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground transition-colors shrink-0"
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <Separator />

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {mainItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg transition-all duration-200',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-foreground')} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {!collapsed && <Separator className="my-2" />}

        {!collapsed ? (
          <div>
            <button
              onClick={() => setPengaturanOpen(!pengaturanOpen)}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm transition-all duration-200',
                isPengaturanActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">Pengaturan</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', pengaturanOpen && 'rotate-180')} />
            </button>
            {pengaturanOpen && (
              <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
                {pengaturanItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-[13px]">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/pengaturan/organisasi"
            title="Pengaturan"
            className={cn(
              'flex items-center justify-center gap-3 rounded-lg py-2.5 transition-all duration-200',
              isPengaturanActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Settings className={cn('h-5 w-5 shrink-0', isPengaturanActive && 'text-primary-foreground')} />
          </Link>
        )}
      </nav>

      <Separator />

      <div className={cn('p-2', collapsed && 'flex justify-center')}>
        <button
          onClick={onLogout}
          title="Keluar"
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && 'Keluar'}
        </button>
      </div>
    </aside>
  )
}
