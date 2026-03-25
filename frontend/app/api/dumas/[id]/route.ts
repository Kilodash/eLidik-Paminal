import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Detail Dumas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request)
    const { id } = params

    const result = await query(
      `SELECT 
        d.*,
        tl.*,
        u.name as unit_pic_name,
        u.email as unit_pic_email
       FROM dumas d
       LEFT JOIN tindak_lanjut tl ON d.id = tl.dumas_id
       LEFT JOIN users u ON d.unit_id = u.id
       WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dumas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result.rows[0] })
  } catch (error: any) {
    console.error('Get Dumas detail error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil detail dumas' }, { status: 500 })
  }
}

// PUT - Update Dumas
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request)
    const { id } = params
    const body = await request.json()

    // Check if user has permission
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengupdate dumas' },
        { status: 403 }
      )
    }

    const {
      tgl_dumas, pelapor, terlapor, satker, wujud_perbuatan,
      jenis_dumas, keterangan, disposisi_kabid, disposisi_kasubbid,
      unit_id, unit_name, status
    } = body

    const result = await query(
      `UPDATE dumas SET
        tgl_dumas = COALESCE($1, tgl_dumas),
        pelapor = COALESCE($2, pelapor),
        terlapor = COALESCE($3, terlapor),
        satker = COALESCE($4, satker),
        wujud_perbuatan = COALESCE($5, wujud_perbuatan),
        jenis_dumas = COALESCE($6, jenis_dumas),
        keterangan = COALESCE($7, keterangan),
        disposisi_kabid = COALESCE($8, disposisi_kabid),
        disposisi_kasubbid = COALESCE($9, disposisi_kasubbid),
        unit_id = COALESCE($10, unit_id),
        unit_name = COALESCE($11, unit_name),
        status = COALESCE($12, status),
        updated_at = NOW()
       WHERE id = $13 AND deleted_at IS NULL
       RETURNING *`,
      [
        tgl_dumas, pelapor, terlapor, satker, wujud_perbuatan,
        jenis_dumas, keterangan, disposisi_kabid, disposisi_kasubbid,
        unit_id, unit_name, status, id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dumas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, user.email, user.role, 'update', 'dumas', id, JSON.stringify(body)]
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Update Dumas error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengupdate dumas' }, { status: 500 })
  }
}

// DELETE - Soft delete Dumas
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request)
    const { id } = params

    // Only admin and superadmin can delete
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk menghapus dumas' },
        { status: 403 }
      )
    }

    const result = await query(
      'UPDATE dumas SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dumas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.user_id, user.email, user.role, 'delete', 'dumas', id]
    )

    return NextResponse.json({ success: true, message: 'Dumas berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete Dumas error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal menghapus dumas' }, { status: 500 })
  }
}
