import { Pool } from 'pg'

// Connection pool untuk PostgreSQL
const globalForPg = global as unknown as { pool: Pool }

export function getPool(): Pool {
  if (!globalForPg.pool) {
    globalForPg.pool = new Pool({
      connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('?sslmode=require', '') : '',
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10, // Reduce max connections per pool logic
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }
  return globalForPg.pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Query executed', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}
