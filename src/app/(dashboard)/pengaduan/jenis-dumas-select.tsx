'use client'

import React, { useState } from 'react'
import { ClearableSelect } from '@/components/ui/clearable-fields'
import { PropamImportModalTrigger } from './propam-import-modal-trigger'

export function JenisDumasSelect({ options, defaultValue, ...props }: any) {
  const [openPropam, setOpenPropam] = useState(false)

  return (
    <>
      <ClearableSelect 
        options={options} 
        defaultValue={defaultValue} 
        {...props} 
        onValueChange={(v: string) => {
          if (v === 'Pengaduan Cepat Propam' || v.toLowerCase().includes('cepat propam')) {
            setOpenPropam(true)
          }
        }}
      />
      <PropamImportModalTrigger open={openPropam} onOpenChange={setOpenPropam} />
    </>
  )
}
