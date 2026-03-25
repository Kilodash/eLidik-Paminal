import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Get settings by type
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ type: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    const { type } = params

    const result = await query(
      'SELECT * FROM settings WHERE type = $1',
      [type]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { data: { type, value: [] } }
      )
    }

    return NextResponse.json({ data: result.rows[0] })
  } catch (error: any) {
    console.error('Get settings error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil settings' }, { status: 500 })
  }
}

// PUT - Update settings
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ type: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    
    // Only superadmin can update settings
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengupdate settings' },
        { status: 403 }
      )
    }

    const { type } = params
    const body = await request.json()
    const { value } = body

    if (!value) {
      return NextResponse.json(
        { error: 'Value harus diisi' },
        { status: 400 }
      )
    }

    // Upsert settings
    const result = await query(
      `INSERT INTO settings (type, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (type) DO UPDATE SET
       value = $2, updated_at = NOW()
       RETURNING *`,
      [type, JSON.stringify(value)]
    )

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.user_id, user.email, user.role, 'update', 'settings', JSON.stringify({ type, value })]
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Update settings error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengupdate settings' }, { status: 500 })
  }
}
