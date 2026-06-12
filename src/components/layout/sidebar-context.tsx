'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type SidebarContextType = {
  collapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
})

export function useSidebar(): SidebarContextType {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true)
    }
  }, [])

  const toggle = (): void => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}
