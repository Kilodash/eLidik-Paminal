'use client'

import * as React from 'react'

type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl'

interface FontContextType {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

const FontContext = React.createContext<FontContextType | undefined>(undefined)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = React.useState<FontSize>('base')

  React.useEffect(() => {
    const stored = localStorage.getItem('app-font-size') as FontSize
    if (stored && ['xs', 'sm', 'base', 'lg', 'xl', 'xxl'].includes(stored)) {
      setFontSizeState(stored)
    }
  }, [])

  const setFontSize = React.useCallback((size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem('app-font-size', size)
    
    document.documentElement.classList.remove('font-xs', 'font-sm', 'font-base', 'font-lg', 'font-xl', 'font-xxl')
    document.documentElement.classList.add(`font-${size}`)
  }, [])

  return (
    <FontContext.Provider value={{ fontSize, setFontSize }}>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var stored = localStorage.getItem('app-font-size');
              if (!stored) stored = 'base';
              document.documentElement.classList.add('font-' + stored);
            } catch (e) {}
          `,
        }}
      />
      {children}
    </FontContext.Provider>
  )
}

export function useFontSize() {
  const context = React.useContext(FontContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontProvider')
  }
  return context
}
