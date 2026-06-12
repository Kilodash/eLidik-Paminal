import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  if (!children) return null
  
  return (
    <div className={cn('flex items-center justify-end mb-6', className)}>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
