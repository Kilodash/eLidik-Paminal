import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    // Only admin and superadmin can view audit logs
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk melihat audit log' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action') || ''
    const entity_type = searchParams.get('entity_type') || ''
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (action) {
      params.push(action)
      whereClause += ` AND action = $${params.length}`
    }

    if (entity_type) {
      params.push(entity_type)
      whereClause += ` AND entity_type = $${params.length}`
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM audit_log ${whereClause}`,
      params
    )

    // Get paginated data
    params.push(limit, offset)
    const result = await query(
      `SELECT * FROM audit_log ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    })
  } catch (error: any) {
    console.error('Get audit log error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil audit log' }, { status: 500 })
  }
}
