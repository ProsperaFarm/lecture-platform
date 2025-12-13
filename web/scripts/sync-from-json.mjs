#!/usr/bin/env node

/**
 * Database Sync Script
 * Synchronizes database with course-metadata.json
 * Run this after YouTube uploader updates the JSON with new video URLs
 * 
 * Usage: node scripts/sync-from-json.mjs [path-to-json]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
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

// Get JSON path from command line or use default
const jsonPath = process.argv[2] 
  ? resolve(process.argv[2])
  : join(__dirname, '..', '..', 'uploader', 'course-metadata.json');

console.log('🔄 Starting database sync from JSON...\n');
console.log(`📦 Connecting to database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
console.log(`📖 Reading course data from: ${jsonPath}\n`);

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function syncDatabase() {
  const client = await pool.connect();
  
  try {
    // Read course metadata JSON
    const rawData = readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(rawData);
    const course = data.course;
    
    console.log(`✅ Loaded course: ${course.title}`);
    console.log(`   - Acronym: ${course.acronym}`);
    console.log(`   - Total Videos: ${course.totalVideos}`);
    console.log(`   - Modules: ${course.modules.length}\n`);

    // Start transaction
    await client.query('BEGIN');

    // 1. Upsert course
    console.log('📝 Syncing course...');
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
    
    console.log(`✅ Course synced (ID: ${courseResult.rows[0].id})\n`);

    // 2. Sync lessons - track changes
    console.log('📝 Syncing lessons...');
    let totalLessons = 0;
    let newLessons = 0;
    let updatedLessons = 0;
    let newYouTubeUrls = 0;
    let newDurations = 0;

    for (const module of course.modules) {
      for (const section of module.sections) {
        for (const lesson of section.lessons) {
          // Check if lesson exists and what changed
          const existingLesson = await client.query(
            `SELECT "lessonId", "youtubeUrl", duration FROM lessons WHERE "lessonId" = $1`,
            [lesson.id]
          );

          const isNew = existingLesson.rows.length === 0;
          const hadNoUrl = existingLesson.rows.length > 0 && !existingLesson.rows[0].youtubeUrl;
          const hasNewUrl = lesson.youtubeUrl && hadNoUrl;
          const hadNoDuration = existingLesson.rows.length > 0 && !existingLesson.rows[0].duration;
          const hasNewDuration = lesson.duration && hadNoDuration;

          // Prepare duration - only update if it's a valid number
          const durationValue = (typeof lesson.duration === 'number' && lesson.duration > 0) 
            ? lesson.duration 
            : null;

          // Upsert lesson (preserves existing data, only updates what's provided)
          // Note: Schema is normalized, so moduleName and sectionName are in modules/sections tables, not here
          await client.query(
            `INSERT INTO lessons (
              "lessonId", "courseId", "moduleId", 
              "sectionId", title, "youtubeUrl", 
              type, duration, "order", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT ("lessonId")
            DO UPDATE SET
              "courseId" = EXCLUDED."courseId",
              "moduleId" = EXCLUDED."moduleId",
              "sectionId" = EXCLUDED."sectionId",
              title = EXCLUDED.title,
              "youtubeUrl" = COALESCE(EXCLUDED."youtubeUrl", lessons."youtubeUrl"),
              type = EXCLUDED.type,
              duration = COALESCE(EXCLUDED.duration, lessons.duration),
              "order" = EXCLUDED."order",
              "updatedAt" = NOW()`,
            [
              lesson.id,
              course.id,
              module.id,
              section.id,
              lesson.title,
              lesson.youtubeUrl || null,
              lesson.type || 'video',
              durationValue,
              lesson.order
            ]
          );

          totalLessons++;
          
          if (isNew) {
            newLessons++;
          } else {
            updatedLessons++;
          }

          if (hasNewUrl) {
            newYouTubeUrls++;
            console.log(`   ✨ New YouTube URL: ${lesson.title.substring(0, 50)}...`);
          }

          if (hasNewDuration) {
            newDurations++;
            const minutes = Math.floor(lesson.duration / 60);
            const seconds = lesson.duration % 60;
            console.log(`   ⏱️  New duration: ${lesson.title.substring(0, 50)}... (${minutes}m${seconds}s)`);
          }
        }
      }
    }

    // 3. Sync modules and sections (ensure they exist before calculating durations)
    console.log('\n📝 Syncing modules and sections...');
    
    for (const module of course.modules) {
      // Upsert module
      await client.query(
        `INSERT INTO modules ("moduleId", "courseId", title, "order", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT ("moduleId")
         DO UPDATE SET
           "courseId" = EXCLUDED."courseId",
           title = EXCLUDED.title,
           "order" = EXCLUDED."order",
           "updatedAt" = NOW()`,
        [module.id, course.id, module.title, module.order]
      );

      for (const section of module.sections) {
        // Upsert section
        await client.query(
          `INSERT INTO sections ("sectionId", "moduleId", "courseId", title, "order", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT ("sectionId")
           DO UPDATE SET
             "moduleId" = EXCLUDED."moduleId",
             "courseId" = EXCLUDED."courseId",
             title = EXCLUDED.title,
             "order" = EXCLUDED."order",
             "updatedAt" = NOW()`,
          [section.id, module.id, course.id, section.title, section.order]
        );
      }
    }

    // 4. Calculate and update aggregated durations
    console.log('⏱️  Calculating aggregated durations...');

    // Calculate section durations (sum of all lesson durations in each section)
    const sectionDurations = await client.query(
      `UPDATE sections s
       SET "totalDuration" = COALESCE((
         SELECT SUM(COALESCE(duration, 0))
         FROM lessons l
         WHERE l."sectionId" = s."sectionId"
       ), 0),
       "updatedAt" = NOW()
       WHERE s."courseId" = $1
       RETURNING s."sectionId", s."totalDuration"`,
      [course.id]
    );

    // Calculate module durations (sum of all section durations in each module)
    const moduleDurations = await client.query(
      `UPDATE modules m
       SET "totalDuration" = COALESCE((
         SELECT SUM(COALESCE("totalDuration", 0))
         FROM sections s
         WHERE s."moduleId" = m."moduleId"
       ), 0),
       "updatedAt" = NOW()
       WHERE m."courseId" = $1
       RETURNING m."moduleId", m."totalDuration"`,
      [course.id]
    );

    // Calculate course duration (sum of all module durations)
    const courseDurationResult = await client.query(
      `UPDATE courses c
       SET "totalDuration" = COALESCE((
         SELECT SUM(COALESCE("totalDuration", 0))
         FROM modules m
         WHERE m."courseId" = c."courseId"
       ), 0),
       "updatedAt" = NOW()
       WHERE c."courseId" = $1
       RETURNING "totalDuration"`,
      [course.id]
    );

    const courseTotalDuration = courseDurationResult.rows[0]?.totalDuration || 0;
    const hours = Math.floor(courseTotalDuration / 3600);
    const minutes = Math.floor((courseTotalDuration % 3600) / 60);
    
    console.log(`✅ Aggregated durations calculated:`);
    console.log(`   - Sections: ${sectionDurations.rows.length} updated`);
    console.log(`   - Modules: ${moduleDurations.rows.length} updated`);
    console.log(`   - Course total duration: ${hours}h${minutes}m`);

    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`\n✅ Database synced successfully!`);
    console.log(`   - Total lessons processed: ${totalLessons}`);
    console.log(`   - New lessons added: ${newLessons}`);
    console.log(`   - Existing lessons updated: ${updatedLessons}`);
    console.log(`   - New YouTube URLs added: ${newYouTubeUrls}`);
    console.log(`   - New durations added: ${newDurations}`);
    
    if (newYouTubeUrls > 0 || newDurations > 0) {
      if (newYouTubeUrls > 0) {
        console.log(`\n🎉 ${newYouTubeUrls} new video(s) are now available to watch!`);
      }
      if (newDurations > 0) {
        console.log(`⏱️  ${newDurations} video duration(s) have been updated!`);
      }
      console.log();
    } else {
      console.log(`\n💡 No new YouTube URLs or durations found. Run this script after uploading videos or fetching durations.\n`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error syncing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run sync
syncDatabase()
  .then(() => {
    console.log('🎉 Sync completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sync failed:', error.message);
    process.exit(1);
  });
