import type { ComponentType } from 'react'
import type { VariableDef } from './types'

export interface GenericFormProps {
  pengaduanId?: string
  variableDefs: VariableDef[]
  values: Record<string, string>
  onChange: (allVars: Record<string, string>) => void
  onSave?: () => void
}

export type FormRegistry = Record<string, ComponentType<GenericFormProps>>

const registry: FormRegistry = {}

export function registerForm(kode: string, component: ComponentType<GenericFormProps>) {
  registry[kode] = component
}

export function getFormComponent(kode: string): ComponentType<GenericFormProps> | null {
  return registry[kode] || null
}

export function hasFormComponent(kode: string): boolean {
  return kode in registry
}

export { registry as formRegistry }
