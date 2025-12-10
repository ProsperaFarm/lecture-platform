#!/usr/bin/env node

/**
 * Database Seed Script (Normalized Schema)
 * Populates courses, modules, sections, and lessons tables from course-metadata.json
 * 
 * Usage: node scripts/seed-database-normalized.mjs
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

console.log('🌱 Starting database seed (normalized schema)...\n');
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
      `INSERT INTO courses ("courseId", acronym, title, description, thumbnail, "totalVideos", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("courseId") 
       DO UPDATE SET 
         acronym = EXCLUDED.acronym,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         thumbnail = EXCLUDED.thumbnail,
         "totalVideos" = EXCLUDED."totalVideos",
         "updatedAt" = NOW()
       RETURNING id`,
      [course.id, course.acronym, course.title, course.description, course.thumbnail, course.totalVideos]
    );
    
    console.log(`✅ Course inserted/updated (ID: ${courseResult.rows[0].id})\n`);

    // 2. Insert modules
    console.log('📝 Inserting modules...');
    let totalModules = 0;

    for (const module of course.modules) {
      await client.query(
        `INSERT INTO modules ("moduleId", "courseId", title, "order", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT ("moduleId")
         DO UPDATE SET
           title = EXCLUDED.title,
           "order" = EXCLUDED."order",
           "updatedAt" = NOW()`,
        [module.id, course.id, module.title, module.order]
      );
      totalModules++;
      console.log(`   ✓ Module ${module.order}: ${module.title}`);
    }

    console.log(`\n✅ Inserted/updated ${totalModules} modules\n`);

    // 3. Insert sections and lessons
    console.log('📝 Inserting sections and lessons...');
    let totalSections = 0;
    let totalLessons = 0;
    let lessonsWithYouTube = 0;

    for (const module of course.modules) {
      for (const section of module.sections) {
        // Insert section
        await client.query(
          `INSERT INTO sections ("sectionId", "moduleId", "courseId", title, "order", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT ("sectionId")
           DO UPDATE SET
             title = EXCLUDED.title,
             "order" = EXCLUDED."order",
             "updatedAt" = NOW()`,
          [section.id, module.id, course.id, section.title, section.order]
        );
        totalSections++;
        console.log(`   ✓ Section ${section.order}: ${section.title}`);

        // Insert lessons for this section
        for (const lesson of section.lessons) {
          await client.query(
            `INSERT INTO lessons ("lessonId", "sectionId", "moduleId", "courseId", title, "youtubeUrl", type, "order", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             ON CONFLICT ("lessonId")
             DO UPDATE SET
               title = EXCLUDED.title,
               "youtubeUrl" = EXCLUDED."youtubeUrl",
               type = EXCLUDED.type,
               "order" = EXCLUDED."order",
               "updatedAt" = NOW()`,
            [lesson.id, section.id, module.id, course.id, lesson.title, lesson.youtubeUrl, lesson.type, lesson.order]
          );
          
          totalLessons++;
          if (lesson.youtubeUrl) {
            lessonsWithYouTube++;
          }
        }
      }
    }

    console.log(`\n✅ Inserted/updated ${totalSections} sections`);
    console.log(`✅ Inserted/updated ${totalLessons} lessons`);
    console.log(`   - With YouTube URLs: ${lessonsWithYouTube}`);
    console.log(`   - Pending upload: ${totalLessons - lessonsWithYouTube}\n`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('✨ Database seed completed successfully!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seedDatabase()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
