'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTenant, requireRole } from '@/lib/auth'
import { testAI } from '@/lib/ai/client'
import type { AISettings } from '@/lib/ai/client'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

const AI_KEYS = [
  'ai_provider',
  'ai_model',
  'ai_base_url',
  'ai_prompt_summary',
  'ai_prompt_satker',
  'ai_prompt_klasifikasi',
  'ai_prompt_terlapor',
  'ai_sync_interval_minutes',
]

export async function getAISettingsAction() {
  try {
    const tenantId = await requireTenant()
    await requireRole('admin_subbid', 'oversight')

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tenant_variables')
      .select('key, value')
      .eq('tenant_id', tenantId)
      .in('key', AI_KEYS)

    if (error) throw error

    const vars: Record<string, string> = {}
    for (const row of data || []) {
      if (row.key) vars[row.key] = row.value || ''
    }

    return { data: vars }
  } catch (err: unknown) {
    console.error('getAISettingsAction error:', err)
    return { error: getErrorMessage(err) || 'Gagal memuat pengaturan AI' }
  }
}

export async function saveAISettingsAction(formData: FormData) {
  try {
    const tenantId = await requireTenant()
    await requireRole('admin_subbid', 'oversight')

    const supabase = await createClient()

    const rows = AI_KEYS.map((key) => ({
      tenant_id: tenantId,
      key,
      value: (formData.get(key) as string) || '',
    }))

    const { error } = await supabase.from('tenant_variables').upsert(rows, {
      onConflict: 'tenant_id,key',
    })

    if (error) throw error

    revalidatePath('/pengaturan/ai')
    return { success: true }
  } catch (err: unknown) {
    console.error('saveAISettingsAction error:', err)
    return { error: getErrorMessage(err) || 'Gagal menyimpan pengaturan AI' }
  }
}

export async function testAIAction(settings: AISettings) {
  try {
    await requireRole('admin_subbid', 'oversight')
    const reply = await testAI(settings)
    return { success: true, reply }
  } catch (err: unknown) {
    console.error('testAIAction error:', err)
    return { error: getErrorMessage(err) || 'Tes AI gagal' }
  }
}
