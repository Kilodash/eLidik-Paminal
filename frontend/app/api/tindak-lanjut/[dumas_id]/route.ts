import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Get Tindak Lanjut
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ dumas_id: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    const { dumas_id } = params

    const result = await query(
      'SELECT * FROM tindak_lanjut WHERE dumas_id = $1 AND deleted_at IS NULL',
      [dumas_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tindak lanjut tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result.rows[0] })
  } catch (error: any) {
    console.error('Get Tindak Lanjut error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil data tindak lanjut' }, { status: 500 })
  }
}

// PUT - Update Tindak Lanjut
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ dumas_id: string }> }
) {
  const params = await props.params
  try {
    const user = getCurrentUser(request)
    const { dumas_id } = params
    const body = await request.json()

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

    // Only assigned unit or admin can update
    if (user.role === 'unit' && dumas.unit_name !== user.unit_id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengupdate tindak lanjut ini' },
        { status: 403 }
      )
    }

    const {
      tgl_uuk, no_uuk, tgl_sprin_lidik, no_sprin, tim_lidik,
      tgl_gelar, tgl_lhp, no_lhp, hasil_lidik,
      tgl_nodin, no_nodin, no_berkas,
      tgl_sp2hp2, no_sp2hp2,
      tgl_ke_ankum, tgl_ke_mabes, no_mabes, tgl_st_arahan,
      file_dokumen_url
    } = body

    // Update tindak_lanjut
    const result = await query(
      `UPDATE tindak_lanjut SET
        tgl_uuk = COALESCE($1, tgl_uuk),
        no_uuk = COALESCE($2, no_uuk),
        tgl_sprin_lidik = COALESCE($3, tgl_sprin_lidik),
        no_sprin = COALESCE($4, no_sprin),
        tim_lidik = COALESCE($5, tim_lidik),
        tgl_gelar = COALESCE($6, tgl_gelar),
        tgl_lhp = COALESCE($7, tgl_lhp),
        no_lhp = COALESCE($8, no_lhp),
        hasil_lidik = COALESCE($9, hasil_lidik),
        tgl_nodin = COALESCE($10, tgl_nodin),
        no_nodin = COALESCE($11, no_nodin),
        no_berkas = COALESCE($12, no_berkas),
        tgl_sp2hp2 = COALESCE($13, tgl_sp2hp2),
        no_sp2hp2 = COALESCE($14, no_sp2hp2),
        tgl_ke_ankum = COALESCE($15, tgl_ke_ankum),
        tgl_ke_mabes = COALESCE($16, tgl_ke_mabes),
        no_mabes = COALESCE($17, no_mabes),
        tgl_st_arahan = COALESCE($18, tgl_st_arahan),
        file_dokumen_url = COALESCE($19, file_dokumen_url),
        updated_at = NOW()
       WHERE dumas_id = $20
       RETURNING *`,
      [
        tgl_uuk, no_uuk, tgl_sprin_lidik, no_sprin, tim_lidik ? JSON.stringify(tim_lidik) : null,
        tgl_gelar, tgl_lhp, no_lhp, hasil_lidik,
        tgl_nodin, no_nodin, no_berkas,
        tgl_sp2hp2, no_sp2hp2,
        tgl_ke_ankum, tgl_ke_mabes, no_mabes, tgl_st_arahan,
        file_dokumen_url ? JSON.stringify(file_dokumen_url) : null,
        dumas_id
      ]
    )

    // Update dumas status based on hasil_lidik
    if (hasil_lidik) {
      await query(
        'UPDATE dumas SET status = $1 WHERE id = $2',
        [hasil_lidik === 'terbukti' ? 'terbukti' : hasil_lidik === 'tidak_terbukti' ? 'tidak_terbukti' : 'dalam_proses', dumas_id]
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, user.email, user.role, 'update', 'tindak_lanjut', dumas_id, JSON.stringify(body)]
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Update Tindak Lanjut error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengupdate tindak lanjut' }, { status: 500 })
  }
}
