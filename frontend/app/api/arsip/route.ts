import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Get archived/deleted dumas
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    // Only admin and superadmin can access archive
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke arsip' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM dumas WHERE deleted_at IS NOT NULL'
    )

    // Get paginated data
    const result = await query(
      `SELECT d.*, u.name as unit_pic_name FROM dumas d
       LEFT JOIN users u ON d.unit_id = u.id
       WHERE d.deleted_at IS NOT NULL
       ORDER BY d.deleted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
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
    console.error('Get archive error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil data arsip' }, { status: 500 })
  }
}

// POST - Restore or permanently delete
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Hanya superadmin yang dapat restore atau menghapus permanen' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ids } = body

    if (!action || !ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Action dan IDs harus diisi' },
        { status: 400 }
      )
    }

    if (action === 'restore') {
      await query(
        'UPDATE dumas SET deleted_at = NULL WHERE id = ANY($1::uuid[])',
        [ids]
      )

      // Audit log
      await query(
        `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, user.email, user.role, 'restore', 'dumas', JSON.stringify({ count: ids.length, ids })]
      )

      return NextResponse.json({
        success: true,
        message: `${ids.length} dumas berhasil di-restore`
      })
    } else if (action === 'permanent_delete') {
      // Delete related records first
      await query(
        'DELETE FROM tindak_lanjut WHERE dumas_id = ANY($1::uuid[])',
        [ids]
      )
      await query(
        'DELETE FROM tim_lidik WHERE dumas_id = ANY($1::uuid[])',
        [ids]
      )
      await query(
        'DELETE FROM penyelesaian WHERE dumas_id = ANY($1::uuid[])',
        [ids]
      )
      
      // Permanently delete dumas
      await query(
        'DELETE FROM dumas WHERE id = ANY($1::uuid[])',
        [ids]
      )

      // Audit log
      await query(
        `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, user.email, user.role, 'permanent_delete', 'dumas', JSON.stringify({ count: ids.length, ids })]
      )

      return NextResponse.json({
        success: true,
        message: `${ids.length} dumas berhasil dihapus permanen`
      })
    } else {
      return NextResponse.json(
        { error: 'Action tidak valid' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Archive action error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal melakukan action' }, { status: 500 })
  }
}
