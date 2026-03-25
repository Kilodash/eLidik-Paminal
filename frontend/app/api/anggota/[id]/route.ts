import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// PUT - Update anggota
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengupdate anggota' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { nama, pangkat, nrp, jabatan, unit, no_hp, is_active } = body

    const result = await query(
      `UPDATE anggota SET
        nama = COALESCE($1, nama),
        pangkat = COALESCE($2, pangkat),
        nrp = COALESCE($3, nrp),
        jabatan = COALESCE($4, jabatan),
        unit = COALESCE($5, unit),
        no_hp = COALESCE($6, no_hp),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [nama, pangkat, nrp, jabatan, unit, no_hp, is_active, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, user.email, user.role, 'update', 'anggota', id, JSON.stringify(body)]
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Update anggota error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengupdate anggota' }, { status: 500 })
  }
}

// DELETE - Soft delete anggota
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk menghapus anggota' },
        { status: 403 }
      )
    }

    const { id } = params

    const result = await query(
      'UPDATE anggota SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.user_id, user.email, user.role, 'delete', 'anggota', id]
    )

    return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete anggota error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal menghapus anggota' }, { status: 500 })
  }
}
