import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// POST - Approve or Reject
export async function POST(
  request: NextRequest,
  { params }: { params: { dumas_id: string } }
) {
  try {
    const user = getCurrentUser(request)
    const { dumas_id } = params
    const body = await request.json()
    const { action, catatan_revisi } = body

    // Only kasubbid can approve/reject
    if (user.role !== 'kasubbid_paminal' && !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk menyetujui/merevisi' },
        { status: 403 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action harus approve atau reject' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'disetujui' : 'revisi'

    // Update status
    await query(
      `UPDATE tindak_lanjut SET 
        status_verifikasi = $1,
        catatan_revisi = $2,
        verified_by = $3,
        verified_at = NOW()
       WHERE dumas_id = $4`,
      [newStatus, catatan_revisi || null, user.user_id, dumas_id]
    )

    // Get dumas info for notification
    const dumasResult = await query(
      'SELECT * FROM dumas WHERE id = $1',
      [dumas_id]
    )
    const dumas = dumasResult.rows[0]

    // Create notification for unit
    if (dumas.unit_id) {
      await query(
        `INSERT INTO notifications (target_user_id, title, message, type, action_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          dumas.unit_id,
          action === 'approve' ? 'Tindak Lanjut Disetujui' : 'Tindak Lanjut Perlu Revisi',
          action === 'approve' 
            ? `Tindak lanjut untuk dumas ${dumas.no_dumas} telah disetujui`
            : `Tindak lanjut untuk dumas ${dumas.no_dumas} perlu direvisi: ${catatan_revisi || ''}`,
          action === 'approve' ? 'success' : 'warning',
          `/dumas/${dumas_id}`
        ]
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, user.email, user.role, action === 'approve' ? 'approve' : 'reject', 'tindak_lanjut', dumas_id, JSON.stringify({ catatan_revisi })]
    )

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Tindak lanjut berhasil disetujui' : 'Tindak lanjut perlu direvisi'
    })
  } catch (error: any) {
    console.error('Approve/Reject error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal memproses approval' }, { status: 500 })
  }
}
