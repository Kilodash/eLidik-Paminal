"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'default' | 'sm'
}

function Switch({ className, size = 'default', ...props }: SwitchProps) {
  return (
    <label
      className={cn(
        "relative inline-flex items-center cursor-pointer",
        size === 'sm' ? 'h-4 w-8' : 'h-5 w-9',
        className
      )}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        {...props}
      />
      <span
        className={cn(
          "w-full h-full bg-muted rounded-full border border-input",
          "peer-checked:bg-primary",
          "after:content-[''] after:absolute after:top-[2px] after:start-[2px]",
          "after:bg-background after:rounded-full after:transition-all",
          "peer-checked:after:translate-x-full",
          size === 'sm' ? 'after:h-3 after:w-3' : 'after:h-4 after:w-4'
        )}
      />
    </label>
  )
}

export { Switch }
export type { SwitchProps }
