#!/usr/bin/env node
/**
 * Database Setup Script
 * Runs migration dan seeding untuk Supabase PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, 'frontend', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  console.log('🔄 Running database migration...');
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database_migration.sql'),
      'utf8'
    );
    
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function runSeeding() {
  console.log('🔄 Running database seeding...');
  
  try {
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'database_seed.sql'),
      'utf8'
    );
    
    await pool.query(seedSQL);
    console.log('✅ Seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    return false;
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    const { rows: users } = await pool.query('SELECT COUNT(*) FROM users');
    const { rows: settings } = await pool.query('SELECT COUNT(*) FROM settings');
    const { rows: anggota } = await pool.query('SELECT COUNT(*) FROM anggota');
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${users[0].count}`);
    console.log(`   Settings: ${settings[0].count}`);
    console.log(`   Anggota: ${anggota[0].count}`);
    
    console.log('\n👤 Default User Accounts (email / password):');
    console.log('   superadmin@simondu.polri.go.id / password123');
    console.log('   kasubbid@simondu.polri.go.id / password123');
    console.log('   admin@simondu.polri.go.id / password123');
    console.log('   unit1@simondu.polri.go.id / password123');
    console.log('   unit2@simondu.polri.go.id / password123');
    console.log('   unit3@simondu.polri.go.id / password123');
    console.log('   urbinpam@simondu.polri.go.id / password123');
    console.log('   urlitpers@simondu.polri.go.id / password123');
    console.log('   urprodok@simondu.polri.go.id / password123');
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Simondu Web Database Setup\n');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Run migration
    const migrationSuccess = await runMigration();
    if (!migrationSuccess) {
      console.error('\n❌ Setup failed at migration step');
      process.exit(1);
    }
    
    console.log('');
    
    // Run seeding
    const seedingSuccess = await runSeeding();
    if (!seedingSuccess) {
      console.error('\n❌ Setup failed at seeding step');
      process.exit(1);
    }
    
    console.log('');
    
    // Verify
    await verifySetup();
    
    console.log('\n✨ Database setup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
