import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// POST - Submit for verification
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ dumas_id: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    const { dumas_id } = params

    // Check if user is assigned to this dumas
    const dumasResult = await query(
      'SELECT * FROM dumas WHERE id = $1 AND deleted_at IS NULL',
      [dumas_id]
    )

    if (dumasResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dumas tidak ditemukan' },
        { status: 404 }
      )
    }

    const dumas = dumasResult.rows[0]

    if (user.role === 'unit' && dumas.unit_name !== user.unit_id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      )
    }

    // Update status to menunggu_verifikasi
    await query(
      "UPDATE tindak_lanjut SET status_verifikasi = 'menunggu_verifikasi', catatan_revisi = NULL WHERE dumas_id = $1",
      [dumas_id]
    )

    // Create notification for pimpinan (kasubbid)
    await query(
      `INSERT INTO notifications (target_role, title, message, type, action_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'kasubbid_paminal',
        'Tindak Lanjut Perlu Verifikasi',
        `Dumas ${dumas.no_dumas} telah diajukan untuk verifikasi`,
        'info',
        `/dumas/${dumas_id}`
      ]
    )

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.user_id, user.email, user.role, 'submit_verification', 'tindak_lanjut', dumas_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Tindak lanjut berhasil diajukan untuk verifikasi'
    })
  } catch (error: any) {
    console.error('Submit verification error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengajukan verifikasi' }, { status: 500 })
  }
}
