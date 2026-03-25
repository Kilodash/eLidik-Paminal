import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT token
    const tokenPayload = getCurrentUser(request)

    // Fetch fresh user data from database
    const result = await query(
      'SELECT id, email, name, role, unit_name, is_active, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [tokenPayload.user_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        unit_name: user.unit_name,
        created_at: user.created_at
      }
    })
  } catch (error: any) {
    console.error('Get current user error:', error)
    
    if (error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah expired' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data user' },
      { status: 500 }
    )
  }
}
