#!/usr/bin/env node
/**
 * Apply Reset Schema Script
 * Drops all tables and recreates them with normalized structure
 * 
 * Usage: node scripts/apply-reset-schema.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔄 Resetting database schema...\n');
console.log(`📦 Connecting to database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function resetSchema() {
  const client = await pool.connect();
  
  try {
    // Read SQL file
    const sqlPath = join(__dirname, 'reset-schema.sql');
    console.log(`📖 Reading SQL from: ${sqlPath}\n`);
    
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Execute SQL
    console.log('🗑️  Dropping existing tables...');
    console.log('🏗️  Creating new tables with normalized structure...\n');
    
    await client.query(sql);
    
    console.log('✅ Schema reset completed successfully!\n');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - courses');
    console.log('   - modules (NEW)');
    console.log('   - sections (NEW)');
    console.log('   - lessons (UPDATED)');
    console.log('   - user_progress');
    console.log('   - user_notes');
    console.log('   - ratings');
    console.log('   - course_materials');
    console.log('   - video_transcripts\n');

  } catch (error) {
    console.error('❌ Schema reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run reset
resetSchema()
  .then(() => {
    console.log('✅ Done! Now run: npm run db:seed:normalized');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
