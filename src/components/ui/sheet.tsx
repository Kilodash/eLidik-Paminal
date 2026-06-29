"use client"

import * as React from "react"
import { Drawer } from "@base-ui/react/drawer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

type SheetSide = "top" | "bottom" | "left" | "right"

function Sheet({
  side = "left",
  modal = true,
  children,
  ...props
}: Drawer.Root.Props & { side?: SheetSide }) {
  return (
    // @ts-expect-error base-ui drawer type mismatch for swipeDirection
    <Drawer.Root modal={modal} swipeDirection={side} data-slot="sheet" {...props}>
      {/* @ts-expect-error base-ui drawer children type mismatch */}
      <SheetContext.Provider value={{ side }}>{children}</SheetContext.Provider>
    </Drawer.Root>
  )
}

const SheetContext = React.createContext<{ side: SheetSide }>({ side: "left" })

function SheetTrigger({ ...props }: Drawer.Trigger.Props) {
  return <Drawer.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: Drawer.Close.Props) {
  return <Drawer.Close data-slot="sheet-close" {...props} />
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Drawer.Content.Props & { side?: SheetSide; showCloseButton?: boolean }) {
  const { side } = React.useContext(SheetContext)

  return (
    <Drawer.Portal>
      <Drawer.Backdrop
        className="fixed inset-0 z-50 bg-black/10 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <Drawer.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 bg-popover text-popover-foreground shadow-lg outline-none ring-1 ring-foreground/10 duration-150",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 max-w-sm data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 max-w-sm data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right",
          side === "top" &&
            "inset-x-0 top-0 data-open:animate-in data-open:slide-in-from-top data-closed:animate-out data-closed:slide-out-to-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Drawer.Close
            render={
              <Button
                variant="ghost"
                className="absolute top-2.5 right-2.5"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Drawer.Close>
        )}
      </Drawer.Popup>
    </Drawer.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 px-4 pt-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("flex flex-col-reverse gap-2 px-4 pb-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: Drawer.Title.Props) {
  return (
    <Drawer.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: Drawer.Description.Props) {
  return (
    <Drawer.Description
      data-slot="sheet-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
