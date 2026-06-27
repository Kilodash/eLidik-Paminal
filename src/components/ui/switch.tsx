"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({
  className,
  onChange,
  ...props
}: Omit<SwitchPrimitive.Root.Props, "onCheckedChange"> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.15rem] w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-checked:bg-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 bg-input",
        className
      )}
      onCheckedChange={(checked) => {
        if (onChange) {
          onChange({ target: { checked } } as React.ChangeEvent<HTMLInputElement>)
        }
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-3 w-3 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-3.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
