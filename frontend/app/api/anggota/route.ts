import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - List all anggota
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let whereClause = 'WHERE deleted_at IS NULL'
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      whereClause += ` AND (nama ILIKE $1 OR nrp ILIKE $1 OR pangkat ILIKE $1)`
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM anggota ${whereClause}`,
      params
    )

    // Get paginated data
    params.push(limit, offset)
    const result = await query(
      `SELECT * FROM anggota ${whereClause} ORDER BY nama ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Get anggota list error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Gagal mengambil data anggota' }, { status: 500 })
  }
}

// POST - Create new anggota
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk menambah anggota' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nama, pangkat, nrp, jabatan, unit, no_hp } = body

    if (!nama || !pangkat || !nrp) {
      return NextResponse.json(
        { error: 'Nama, pangkat, dan NRP harus diisi' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO anggota (nama, pangkat, nrp, jabatan, unit, no_hp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nama, pangkat, nrp, jabatan, unit, no_hp]
    )

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, user_name, user_role, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, user.email, user.role, 'create', 'anggota', result.rows[0].id, JSON.stringify({ nama, nrp })]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Create anggota error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: 'NRP sudah terdaftar' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Gagal menambah anggota' }, { status: 500 })
  }
}
