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
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Pilih tanggal',
  name,
  required = false
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value)

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
  }

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger className={cn(
            "flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMMM yyyy", { locale: idLocale }) : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            locale={idLocale}
            disabled={disabled}
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
