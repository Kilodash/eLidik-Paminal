'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/20">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 page-transition">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
