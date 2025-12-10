#!/usr/bin/env node

/**
 * Database Seed Script
 * Populates courses and lessons tables from course-metadata.json
 * 
 * Usage: node scripts/seed-database.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prospera_academy';

console.log('🌱 Starting database seed...\n');
console.log(`📦 Connecting to database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    // Read course metadata JSON
    const jsonPath = join(__dirname, '..', '..', 'uploader', 'course-metadata.json');
    console.log(`📖 Reading course data from: ${jsonPath}`);
    
    const rawData = readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(rawData);
    const course = data.course;
    
    console.log(`\n✅ Loaded course: ${course.title}`);
    console.log(`   - Acronym: ${course.acronym}`);
    console.log(`   - Total Videos: ${course.totalVideos}`);
    console.log(`   - Modules: ${course.modules.length}\n`);

    // Start transaction
    await client.query('BEGIN');

    // 1. Insert or update course
    console.log('📝 Inserting course...');
    const courseResult = await client.query(
      `INSERT INTO courses ("courseId", acronym, title, description, "totalVideos", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("courseId") 
       DO UPDATE SET 
         acronym = EXCLUDED.acronym,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         "totalVideos" = EXCLUDED."totalVideos",
         "updatedAt" = NOW()
       RETURNING id`,
      [course.id, course.acronym, course.title, course.description, course.totalVideos]
    );
    
    console.log(`✅ Course inserted/updated (ID: ${courseResult.rows[0].id})\n`);

    // 2. Insert lessons from all modules and sections
    console.log('📝 Inserting lessons...');
    let totalLessons = 0;
    let lessonsWithYouTube = 0;

    for (const module of course.modules) {
      console.log(`   Module ${module.order}: ${module.title}`);
      
      for (const section of module.sections) {
        console.log(`      Section ${section.order}: ${section.title} (${section.lessons.length} lessons)`);
        
        for (const lesson of section.lessons) {
          await client.query(
            `INSERT INTO lessons (
              "lessonId", "courseId", "moduleId", "moduleName", 
              "sectionId", "sectionName", title, "youtubeUrl", 
              type, "order", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            ON CONFLICT ("lessonId")
            DO UPDATE SET
              "courseId" = EXCLUDED."courseId",
              "moduleId" = EXCLUDED."moduleId",
              "moduleName" = EXCLUDED."moduleName",
              "sectionId" = EXCLUDED."sectionId",
              "sectionName" = EXCLUDED."sectionName",
              title = EXCLUDED.title,
              "youtubeUrl" = EXCLUDED."youtubeUrl",
              type = EXCLUDED.type,
              "order" = EXCLUDED."order",
              "updatedAt" = NOW()`,
            [
              lesson.id,
              course.id,
              module.id,
              module.title,
              section.id,
              section.title,
              lesson.title,
              lesson.youtubeUrl || null,
              lesson.type || 'video',
              lesson.order
            ]
          );
          
          totalLessons++;
          if (lesson.youtubeUrl) {
            lessonsWithYouTube++;
          }
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`\n✅ Database seeded successfully!`);
    console.log(`   - Total lessons inserted: ${totalLessons}`);
    console.log(`   - Lessons with YouTube URLs: ${lessonsWithYouTube}`);
    console.log(`   - Lessons pending upload: ${totalLessons - lessonsWithYouTube}\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seedDatabase()
  .then(() => {
    console.log('🎉 Seed completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error.message);
    process.exit(1);
  });
