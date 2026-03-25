import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// POST - Bulk actions (merge, delete)
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ids, parent_id } = body

    if (!action || !ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Action dan IDs harus diisi' },
        { status: 400 }
      )
    }

    if (action === 'delete') {
      // Bulk soft delete
      await query(
        `UPDATE dumas SET deleted_at = NOW() WHERE id = ANY($1::uuid[])`,
        [ids]
      )

      // Audit log
      await query(
        `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, user.email, user.role, 'bulk_delete', 'dumas', JSON.stringify({ count: ids.length, ids })]
      )

      return NextResponse.json({
        success: true,
        message: `${ids.length} dumas berhasil dihapus`
      })
    } else if (action === 'merge') {
      if (!parent_id) {
        return NextResponse.json(
          { error: 'Parent ID harus diisi untuk merge' },
          { status: 400 }
        )
      }

      // Update child dumas to set parent
      const childIds = ids.filter((id: string) => id !== parent_id)
      
      await query(
        `UPDATE dumas SET parent_dumas_id = $1 WHERE id = ANY($2::uuid[])`,
        [parent_id, childIds]
      )

      // Audit log
      await query(
        `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, user.email, user.role, 'merge', 'dumas', JSON.stringify({ parent_id, child_ids: childIds })]
      )

      return NextResponse.json({
        success: true,
        message: `${childIds.length} dumas berhasil digabung`
      })
    } else {
      return NextResponse.json(
        { error: 'Action tidak valid' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Bulk action error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal melakukan bulk action' }, { status: 500 })
  }
}
