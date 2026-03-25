import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)

    // Total Dumas
    const totalDumas = await query(
      'SELECT COUNT(*) as count FROM dumas WHERE deleted_at IS NULL'
    )

    // Dalam Proses
    const dalamProses = await query(
      "SELECT COUNT(*) as count FROM dumas WHERE status = 'dalam_proses' AND deleted_at IS NULL"
    )

    // Terbukti
    const terbukti = await query(
      "SELECT COUNT(*) as count FROM dumas WHERE status = 'terbukti' AND deleted_at IS NULL"
    )

    // Tidak Terbukti
    const tidakTerbukti = await query(
      "SELECT COUNT(*) as count FROM dumas WHERE status = 'tidak_terbukti' AND deleted_at IS NULL"
    )

    // SLA Warning (> 14 days)
    const slaWarning = await query(
      "SELECT COUNT(*) as count FROM dumas WHERE sla_days > 14 AND status = 'dalam_proses' AND deleted_at IS NULL"
    )

    // SLA Critical (> 30 days)
    const slaCritical = await query(
      "SELECT COUNT(*) as count FROM dumas WHERE sla_days > 30 AND status = 'dalam_proses' AND deleted_at IS NULL"
    )

    // Recent Dumas (last 7 days trend)
    const trendData = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM dumas 
       WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    )

    // Dumas by Satker (top 10)
    const bySatker = await query(
      `SELECT 
        satker,
        COUNT(*) as count
       FROM dumas 
       WHERE deleted_at IS NULL
       GROUP BY satker
       ORDER BY count DESC
       LIMIT 10`
    )

    // SLA List (cases with warning)
    const slaList = await query(
      `SELECT 
        d.id, d.no_dumas, d.pelapor, d.terlapor, d.satker, 
        d.status, d.sla_days, d.tgl_dumas, d.unit_name
       FROM dumas d
       WHERE d.sla_days > 14 AND d.status = 'dalam_proses' AND d.deleted_at IS NULL
       ORDER BY d.sla_days DESC
       LIMIT 20`
    )

    return NextResponse.json({
      stats: {
        total: parseInt(totalDumas.rows[0].count),
        dalam_proses: parseInt(dalamProses.rows[0].count),
        terbukti: parseInt(terbukti.rows[0].count),
        tidak_terbukti: parseInt(tidakTerbukti.rows[0].count),
        sla_warning: parseInt(slaWarning.rows[0].count),
        sla_critical: parseInt(slaCritical.rows[0].count)
      },
      trend: trendData.rows,
      by_satker: bySatker.rows,
      sla_list: slaList.rows
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    
    if (error.message?.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Gagal mengambil data dashboard' },
      { status: 500 }
    )
  }
}
