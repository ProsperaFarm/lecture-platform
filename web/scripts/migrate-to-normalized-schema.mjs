#!/usr/bin/env node
/**
 * Migration script to normalize existing lessons data into modules and sections tables
 * 
 * This script:
 * 1. Reads existing lessons from the database
 * 2. Extracts unique modules and sections
 * 3. Creates modules and sections tables with proper ordering
 * 4. Updates lessons to remove denormalized fields
 * 
 * Run with: node scripts/migrate-to-normalized-schema.mjs
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema.ts';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function migrate() {
  console.log('🔄 Starting migration to normalized schema...\n');

  try {
    // Step 1: Fetch all existing lessons
    console.log('📖 Reading existing lessons...');
    const existingLessons = await db.query.lessons.findMany({
      orderBy: (lessons, { asc }) => [asc(lessons.courseId), asc(lessons.order)],
    });

    if (existingLessons.length === 0) {
      console.log('⚠️  No lessons found in database. Nothing to migrate.');
      return;
    }

    console.log(`✅ Found ${existingLessons.length} lessons\n`);

    // Step 2: Extract unique modules
    console.log('🔍 Extracting modules...');
    const modulesMap = new Map();
    
    for (const lesson of existingLessons) {
      const key = `${lesson.courseId}|${lesson.moduleId}`;
      if (!modulesMap.has(key)) {
        modulesMap.set(key, {
          moduleId: lesson.moduleId,
          courseId: lesson.courseId,
          title: lesson.moduleName || `Módulo ${lesson.moduleId}`,
          order: modulesMap.size + 1, // Sequential order
        });
      }
    }

    const modulesToInsert = Array.from(modulesMap.values());
    console.log(`✅ Found ${modulesToInsert.length} unique modules\n`);

    // Step 3: Extract unique sections
    console.log('🔍 Extracting sections...');
    const sectionsMap = new Map();
    
    for (const lesson of existingLessons) {
      const key = `${lesson.courseId}|${lesson.moduleId}|${lesson.sectionId}`;
      if (!sectionsMap.has(key)) {
        // Calculate order within module
        const sectionsInModule = Array.from(sectionsMap.values())
          .filter(s => s.moduleId === lesson.moduleId);
        
        sectionsMap.set(key, {
          sectionId: lesson.sectionId,
          moduleId: lesson.moduleId,
          courseId: lesson.courseId,
          title: lesson.sectionName || `Seção ${lesson.sectionId}`,
          order: sectionsInModule.length + 1,
        });
      }
    }

    const sectionsToInsert = Array.from(sectionsMap.values());
    console.log(`✅ Found ${sectionsToInsert.length} unique sections\n`);

    // Step 4: Insert modules (with conflict handling)
    console.log('💾 Inserting modules...');
    for (const module of modulesToInsert) {
      await db.insert(schema.modules)
        .values(module)
        .onConflictDoUpdate({
          target: schema.modules.moduleId,
          set: {
            title: module.title,
            order: module.order,
            updatedAt: new Date(),
          },
        });
    }
    console.log(`✅ Inserted ${modulesToInsert.length} modules\n`);

    // Step 5: Insert sections (with conflict handling)
    console.log('💾 Inserting sections...');
    for (const section of sectionsToInsert) {
      await db.insert(schema.sections)
        .values(section)
        .onConflictDoUpdate({
          target: schema.sections.sectionId,
          set: {
            title: section.title,
            order: section.order,
            updatedAt: new Date(),
          },
        });
    }
    console.log(`✅ Inserted ${sectionsToInsert.length} sections\n`);

    // Step 6: Update lessons to ensure proper ordering within sections
    console.log('🔄 Updating lesson ordering...');
    const lessonsBySectionMap = new Map();
    
    for (const lesson of existingLessons) {
      const sectionKey = lesson.sectionId;
      if (!lessonsBySectionMap.has(sectionKey)) {
        lessonsBySectionMap.set(sectionKey, []);
      }
      lessonsBySectionMap.get(sectionKey).push(lesson);
    }

    let updatedCount = 0;
    for (const [sectionId, lessons] of lessonsBySectionMap.entries()) {
      // Sort lessons by their current order
      lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Update each lesson with sequential order
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const newOrder = i + 1;
        
        if (lesson.order !== newOrder) {
          await db.update(schema.lessons)
            .set({ 
              order: newOrder,
              updatedAt: new Date(),
            })
            .where(eq(schema.lessons.lessonId, lesson.lessonId));
          updatedCount++;
        }
      }
    }
    
    console.log(`✅ Updated ordering for ${updatedCount} lessons\n`);

    console.log('✨ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Modules: ${modulesToInsert.length}`);
    console.log(`   - Sections: ${sectionsToInsert.length}`);
    console.log(`   - Lessons: ${existingLessons.length}`);
    console.log(`   - Lessons reordered: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
