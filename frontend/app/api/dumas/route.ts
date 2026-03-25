import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - List all Dumas
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const satker = searchParams.get('satker') || ''
    const unit = searchParams.get('unit') || ''
    const offset = (page - 1) * limit

    let whereClause = 'WHERE d.deleted_at IS NULL'
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (d.no_dumas ILIKE $${paramCount} OR d.pelapor ILIKE $${paramCount} OR d.terlapor ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (status) {
      paramCount++
      whereClause += ` AND d.status = $${paramCount}`
      params.push(status)
    }

    if (satker) {
      paramCount++
      whereClause += ` AND d.satker = $${paramCount}`
      params.push(satker)
    }

    if (unit) {
      paramCount++
      whereClause += ` AND d.unit_name = $${paramCount}`
      params.push(unit)
    }

    // Role-based filtering
    if (user.role === 'unit') {
      paramCount++
      whereClause += ` AND d.unit_name = $${paramCount}`
      params.push(user.unit_id)
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM dumas d ${whereClause}`,
      params
    )

    // Get paginated data
    params.push(limit, offset)
    const result = await query(
      `SELECT 
        d.*,
        tl.status_verifikasi,
        u.name as unit_pic_name
       FROM dumas d
       LEFT JOIN tindak_lanjut tl ON d.id = tl.dumas_id
       LEFT JOIN users u ON d.unit_id = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
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
    console.error('Get Dumas list error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil data dumas' }, { status: 500 })
  }
}

// POST - Create new Dumas
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    // Only admin and superadmin can create
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk membuat dumas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      tgl_dumas, pelapor, terlapor, satker, wujud_perbuatan,
      jenis_dumas, keterangan, disposisi_kabid, disposisi_kasubbid,
      unit_id, unit_name
    } = body

    // Validation
    if (!tgl_dumas || !pelapor || !terlapor || !satker || !wujud_perbuatan || !jenis_dumas) {
      return NextResponse.json(
        { error: 'Field wajib harus diisi' },
        { status: 400 }
      )
    }

    // Generate no_dumas (format: DUMAS/YYYY/MM/counter)
    const year = new Date(tgl_dumas).getFullYear()
    const month = String(new Date(tgl_dumas).getMonth() + 1).padStart(2, '0')
    
    const counterResult = await query(
      `SELECT COUNT(*) as count FROM dumas WHERE EXTRACT(YEAR FROM tgl_dumas) = $1 AND EXTRACT(MONTH FROM tgl_dumas) = $2`,
      [year, month]
    )
    
    const counter = String(parseInt(counterResult.rows[0].count) + 1).padStart(4, '0')
    const no_dumas = `DUMAS/${year}/${month}/${counter}`

    // Insert dumas
    const result = await query(
      `INSERT INTO dumas (
        no_dumas, tgl_dumas, pelapor, terlapor, satker, wujud_perbuatan,
        jenis_dumas, keterangan, disposisi_kabid, disposisi_kasubbid,
        unit_id, unit_name, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        no_dumas, tgl_dumas, pelapor, terlapor, satker, wujud_perbuatan,
        jenis_dumas, keterangan, disposisi_kabid, disposisi_kasubbid,
        unit_id, unit_name, 'dalam_proses', user.user_id
      ]
    )

    const newDumas = result.rows[0]

    // Create empty tindak_lanjut record
    await query(
      'INSERT INTO tindak_lanjut (dumas_id, status_verifikasi) VALUES ($1, $2)',
      [newDumas.id, 'draft']
    )

    // Create notification for assigned unit
    if (unit_id) {
      await query(
        `INSERT INTO notifications (target_user_id, title, message, type, action_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          unit_id,
          'Dumas Baru Ditugaskan',
          `Anda mendapat penugasan dumas baru: ${no_dumas}`,
          'info',
          `/dumas/${newDumas.id}`
        ]
      )
    }

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, user.email, user.role, 'create', 'dumas', newDumas.id, JSON.stringify({ no_dumas })]
    )

    return NextResponse.json({ success: true, data: newDumas }, { status: 201 })
  } catch (error: any) {
    console.error('Create Dumas error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal membuat dumas' }, { status: 500 })
  }
}
