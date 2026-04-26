const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('?sslmode=require', '') : '',
  ssl: {
    rejectUnauthorized: false,
  },
});

async function test() {
  try {
    const users = await pool.query('SELECT id, email, is_active, role, password_hash FROM users LIMIT 3');
    console.log('Users array:');
    users.rows.forEach(u => console.log(u));
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await pool.end();
  }
}

test();
