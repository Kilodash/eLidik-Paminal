'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  name?: string
  required?: boolean
  disableFuture?: boolean
  variant?: 'default' | 'split'
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Pilih tanggal',
  name,
  required = false,
  disableFuture = false,
  variant = 'default'
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value)
  const [open, setOpen] = React.useState(false)

  // Use the controlled value if provided, otherwise fallback to internal state
  const isControlled = value !== undefined
  const date = isControlled ? value : internalDate

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!isControlled) {
      setInternalDate(selectedDate)
    }
    if (onChange) {
      onChange(selectedDate)
    }
    setOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={cn(
            "flex w-full rounded-md border border-input bg-transparent text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left overflow-hidden",
            variant === 'split' ? "p-0 items-stretch h-9" : "px-3 py-2 items-center h-9",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {variant === 'split' ? (
            <>
              <span className="px-3 truncate flex-1 flex items-center h-full">
                {date ? format(date, "dd MMMM yyyy", { locale: idLocale }) : <span>{placeholder}</span>}
              </span>
              <span className="flex items-center justify-center border-l border-input h-full px-3 text-muted-foreground bg-muted/20 hover:bg-muted/40 transition-colors shrink-0">
                <CalendarIcon className="h-4 w-4" />
              </span>
            </>
          ) : (
            <>
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {date ? format(date, "dd MMMM yyyy", { locale: idLocale }) : <span>{placeholder}</span>}
              </span>
            </>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            locale={idLocale}
            disabled={disableFuture ? { after: new Date() } : disabled}
          />
        </PopoverContent>
      </Popover>
      {/* Hidden input to ensure native form submission works if needed */}
      <input 
        type="hidden" 
        name={name} 
        value={date ? format(date, 'yyyy-MM-dd') : ''} 
        required={required} 
      />
    </div>
  )
}
