#!/usr/bin/env node

/**
 * Database Seed Script (Normalized Schema with Next/Prev)
 * Populates courses, modules, sections, and lessons tables from course-metadata.json
 * Automatically calculates and sets nextLessonId and prevLessonId for navigation
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

console.log('🌱 Starting database seed (normalized schema with next/prev)...\n');
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

    // 1. Calculate course total duration
    const courseTotalDuration = course.modules.reduce((courseSum, module) => {
      const moduleDuration = module.sections.reduce((moduleSum, section) => {
        const sectionDuration = section.lessons.reduce((sectionSum, lesson) => {
          return sectionSum + (lesson.duration || 0);
        }, 0);
        return moduleSum + sectionDuration;
      }, 0);
      return courseSum + moduleDuration;
    }, 0);
    
    // Insert or update course with totalDuration
    console.log('📝 Inserting course...');
    const courseResult = await client.query(
      `INSERT INTO courses ("courseId", acronym, title, description, thumbnail, "totalVideos", "totalDuration", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT ("courseId") 
       DO UPDATE SET 
         acronym = EXCLUDED.acronym,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         thumbnail = EXCLUDED.thumbnail,
         "totalVideos" = EXCLUDED."totalVideos",
         "totalDuration" = EXCLUDED."totalDuration",
         "updatedAt" = NOW()
       RETURNING id`,
      [course.id, course.acronym, course.title, course.description, course.thumbnail, course.totalVideos, courseTotalDuration]
    );
    
    console.log(`✅ Course inserted/updated (ID: ${courseResult.rows[0].id})`);
    console.log(`   - Total duration: ${Math.floor(courseTotalDuration / 3600)}h ${Math.floor((courseTotalDuration % 3600) / 60)}min\n`);

    // 2. Insert modules
    console.log('📝 Inserting modules...');
    let totalModules = 0;

    // Calculate module durations first
    const moduleDurations = new Map();
    for (const module of course.modules) {
      const moduleTotalDuration = module.sections.reduce((moduleSum, section) => {
        const sectionDuration = section.lessons.reduce((sectionSum, lesson) => {
          return sectionSum + (lesson.duration || 0);
        }, 0);
        return moduleSum + sectionDuration;
      }, 0);
      moduleDurations.set(module.id, moduleTotalDuration);
    }
    
    for (const module of course.modules) {
      const moduleTotalDuration = moduleDurations.get(module.id);
      await client.query(
        `INSERT INTO modules ("moduleId", "courseId", title, "order", "totalDuration", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT ("moduleId")
         DO UPDATE SET
           title = EXCLUDED.title,
           "order" = EXCLUDED."order",
           "totalDuration" = EXCLUDED."totalDuration",
           "updatedAt" = NOW()`,
        [module.id, course.id, module.title, module.order, moduleTotalDuration]
      );
      totalModules++;
      console.log(`   ✓ Module ${module.order}: ${module.title} (${Math.floor(moduleTotalDuration / 60)}min)`);
    }

    console.log(`\n✅ Inserted/updated ${totalModules} modules\n`);

    // 3. Build flat list of all lessons with their order in the course
    console.log('📝 Building lesson sequence...');
    const allLessons = [];
    
    for (const module of course.modules) {
      for (const section of module.sections) {
        for (const lesson of section.lessons) {
          allLessons.push({
            lessonId: lesson.id,
            sectionId: section.id,
            moduleId: module.id,
            courseId: course.id,
            title: lesson.title,
            youtubeUrl: lesson.youtubeUrl || null,
            type: lesson.type,
            order: lesson.order,
          });
        }
      }
    }

    console.log(`✅ Found ${allLessons.length} lessons in sequence\n`);

    // 4. Calculate next/prev for each lesson
    console.log('🔗 Calculating next/prev references...');
    for (let i = 0; i < allLessons.length; i++) {
      const lesson = allLessons[i];
      lesson.nextLessonId = i < allLessons.length - 1 ? allLessons[i + 1].lessonId : null;
      lesson.prevLessonId = i > 0 ? allLessons[i - 1].lessonId : null;
    }
    console.log(`✅ Calculated next/prev for all lessons\n`);

    // 5. Insert sections and lessons
    console.log('📝 Inserting sections and lessons...');
    let totalSections = 0;
    let totalLessons = 0;
    let lessonsWithYouTube = 0;

    for (const module of course.modules) {
      let moduleTotalDuration = 0;
      
      for (const section of module.sections) {
        // Calculate section total duration
        const sectionTotalDuration = section.lessons.reduce((sum, lesson) => {
          return sum + (lesson.duration || 0);
        }, 0);
        
        moduleTotalDuration += sectionTotalDuration;
        
        // Insert section with totalDuration
        await client.query(
          `INSERT INTO sections ("sectionId", "moduleId", "courseId", title, "order", "totalDuration", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           ON CONFLICT ("sectionId")
           DO UPDATE SET
             title = EXCLUDED.title,
             "order" = EXCLUDED."order",
             "totalDuration" = EXCLUDED."totalDuration",
             "updatedAt" = NOW()`,
          [section.id, module.id, course.id, section.title, section.order, sectionTotalDuration]
        );
        totalSections++;
        console.log(`   ✓ Section ${section.order}: ${section.title} (${Math.floor(sectionTotalDuration / 60)}min)`);

        // Insert lessons for this section with next/prev
        for (const lesson of section.lessons) {
          // Find this lesson in allLessons to get next/prev
          const lessonWithNav = allLessons.find(l => l.lessonId === lesson.id);
          
          await client.query(
            `INSERT INTO lessons ("lessonId", "sectionId", "moduleId", "courseId", title, "youtubeUrl", type, duration, "order", "nextLessonId", "prevLessonId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
             ON CONFLICT ("lessonId")
             DO UPDATE SET
               title = EXCLUDED.title,
               "youtubeUrl" = EXCLUDED."youtubeUrl",
               type = EXCLUDED.type,
               duration = EXCLUDED.duration,
               "order" = EXCLUDED."order",
               "nextLessonId" = EXCLUDED."nextLessonId",
               "prevLessonId" = EXCLUDED."prevLessonId",
               "updatedAt" = NOW()`,
            [
              lesson.id, 
              section.id, 
              module.id, 
              course.id, 
              lesson.title, 
              lesson.youtubeUrl || null, 
              lesson.type,
              lesson.duration || null,
              lesson.order,
              lessonWithNav.nextLessonId,
              lessonWithNav.prevLessonId
            ]
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
    console.log(`   - Pending upload: ${totalLessons - lessonsWithYouTube}`);
    console.log(`   - All lessons have next/prev references calculated\n`);

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
