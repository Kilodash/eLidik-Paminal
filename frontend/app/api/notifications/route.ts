import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    const { searchParams } = new URL(request.url)
    const unread_only = searchParams.get('unread_only') === 'true'

    let whereClause = 'WHERE (target_user_id = $1 OR target_role = $2)'
    const params = [user.user_id, user.role]

    if (unread_only) {
      whereClause += ' AND is_read = FALSE'
    }

    const result = await query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT 50`,
      params
    )

    // Get unread count
    const unreadResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE (target_user_id = $1 OR target_role = $2) AND is_read = FALSE',
      [user.user_id, user.role]
    )

    return NextResponse.json({
      data: result.rows,
      unread_count: parseInt(unreadResult.rows[0].count)
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 })
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    const body = await request.json()
    const { ids, mark_all } = body

    if (mark_all) {
      // Mark all notifications as read for this user
      await query(
        'UPDATE notifications SET is_read = TRUE WHERE (target_user_id = $1 OR target_role = $2) AND is_read = FALSE',
        [user.user_id, user.role]
      )
    } else if (ids && ids.length > 0) {
      // Mark specific notifications as read
      await query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ANY($1::uuid[]) AND (target_user_id = $2 OR target_role = $3)',
        [ids, user.user_id, user.role]
      )
    } else {
      return NextResponse.json(
        { error: 'IDs atau mark_all harus diisi' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Notifikasi berhasil ditandai sebagai dibaca' })
  } catch (error: any) {
    console.error('Mark notifications as read error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal menandai notifikasi' }, { status: 500 })
  }
}
