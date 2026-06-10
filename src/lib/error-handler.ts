import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth'

export async function captureError(
  error: Error,
  context?: { url?: string; method?: string; userId?: string }
) {
  const tenantId = await getTenantId().catch(() => null)

  if (process.env.NODE_ENV === 'production') {
    const supabase = await createClient()
    await supabase.from('error_logs').insert({
      tenant_id: tenantId,
      user_id: context?.userId,
      level: 'error',
      message: error.message,
      stack_trace: error.stack,
      context: {
        url: context?.url,
        method: context?.method,
        timestamp: new Date().toISOString(),
      },
      source: 'server',
    })
  } else {
    console.error('[DEV ERROR]', error.message, context)
  }
}
