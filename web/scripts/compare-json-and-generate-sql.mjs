#!/usr/bin/env node

/**
 * Compare two JSON files and generate SQL UPDATE statements
 * Usage: node scripts/compare-json-and-generate-sql.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read both JSON files
const referenceJsonPath = join(__dirname, '..', '..', 'course-metadata_copy.json');
const currentJsonPath = join(__dirname, '..', 'client', 'src', 'lib', 'course-data.json');

console.log('📖 Reading reference JSON:', referenceJsonPath);
console.log('📖 Reading current JSON:', currentJsonPath);

const referenceData = JSON.parse(readFileSync(referenceJsonPath, 'utf-8'));
const currentData = JSON.parse(readFileSync(currentJsonPath, 'utf-8'));

const referenceCourse = referenceData.course;
const currentCourse = currentData.course;

console.log('\n🔍 Comparing all modules...\n');

// Build SQL statements and changes arrays
const sqlStatements = [];
const allChanges = [];

// Create maps for modules
const refModuleMap = new Map(referenceCourse.modules.map(m => [m.id, m]));
const currModuleMap = new Map(currentCourse.modules.map(m => [m.id, m]));

// Compare all modules
for (const refModule of referenceCourse.modules) {
  const currModule = currModuleMap.get(refModule.id);
  
  if (!currModule) {
    console.log(`⚠️  Module ${refModule.id} not found in current JSON`);
    continue;
  }

  console.log(`📦 Comparing module: ${refModule.id} (${refModule.title})`);

  // Compare sections
  const refSections = refModule.sections.sort((a, b) => a.order - b.order);
  const currSections = currModule.sections.sort((a, b) => a.order - b.order);

  // Map sections by ID for comparison
  const refSectionMap = new Map(refSections.map(s => [s.id, s]));
  const currSectionMap = new Map(currSections.map(s => [s.id, s]));

  // Compare section titles and orders
  for (const refSection of refSections) {
    const currSection = currSectionMap.get(refSection.id);
    
    if (!currSection) {
      console.log(`  ⚠️  Section ${refSection.id} not found in current JSON`);
      continue;
    }

    // Check title differences
    if (refSection.title !== currSection.title) {
      allChanges.push({
        moduleId: refModule.id,
        type: 'section_title',
        sectionId: refSection.id,
        old: currSection.title,
        new: refSection.title
      });
    }

    // Check order differences
    if (refSection.order !== currSection.order) {
      allChanges.push({
        moduleId: refModule.id,
        type: 'section_order',
        sectionId: refSection.id,
        old: currSection.order,
        new: refSection.order
      });
    }
  }

  // Compare lessons - focus on section assignments and orders
  const refLessons = [];
  const currLessons = [];

  refModule.sections.forEach(section => {
    section.lessons.forEach(lesson => {
      refLessons.push({ ...lesson, sectionId: section.id, sectionOrder: section.order, moduleId: refModule.id });
    });
  });

  currModule.sections.forEach(section => {
    section.lessons.forEach(lesson => {
      currLessons.push({ ...lesson, sectionId: section.id, sectionOrder: section.order, moduleId: currModule.id });
    });
  });

  const refLessonMap = new Map(refLessons.map(l => [l.id, l]));
  const currLessonMap = new Map(currLessons.map(l => [l.id, l]));

  // Find lessons that are in different sections
  for (const refLesson of refLessons) {
    const currLesson = currLessonMap.get(refLesson.id);
    
    if (!currLesson) {
      console.log(`  ⚠️  Lesson ${refLesson.id} not found in current JSON`);
      continue;
    }

    // Check if lesson is in the correct section
    if (refLesson.sectionId !== currLesson.sectionId) {
      allChanges.push({
        moduleId: refModule.id,
        type: 'lesson_section',
        lessonId: refLesson.id,
        title: refLesson.title.substring(0, 50),
        oldSection: currLesson.sectionId,
        newSection: refLesson.sectionId
      });
    }

    // Check order within section (only if in same section)
    if (refLesson.sectionId === currLesson.sectionId && refLesson.order !== currLesson.order) {
      allChanges.push({
        moduleId: refModule.id,
        type: 'lesson_order',
        lessonId: refLesson.id,
        title: refLesson.title.substring(0, 50),
        sectionId: refLesson.sectionId,
        old: currLesson.order,
        new: refLesson.order
      });
    }
  }
}

// Generate SQL
console.log('\n📝 Generating SQL UPDATE statements...\n');

// Build section maps for all modules to get section titles
const allRefSections = new Map();
const allCurrSections = new Map();

for (const refModule of referenceCourse.modules) {
  refModule.sections.forEach(section => {
    allRefSections.set(section.id, section);
  });
}

for (const currModule of currentCourse.modules) {
  currModule.sections.forEach(section => {
    allCurrSections.set(section.id, section);
  });
}

// Update section titles and orders
for (const change of allChanges.filter(c => c.type === 'section_title')) {
  sqlStatements.push(
    `-- Update section title: ${change.sectionId} (Module: ${change.moduleId})\n` +
    `UPDATE sections SET title = '${change.new.replace(/'/g, "''")}', "updatedAt" = NOW() WHERE "sectionId" = '${change.sectionId}';`
  );
}

for (const change of allChanges.filter(c => c.type === 'section_order')) {
  sqlStatements.push(
    `-- Update section order: ${change.sectionId} (Module: ${change.moduleId})\n` +
    `UPDATE sections SET "order" = ${change.new}, "updatedAt" = NOW() WHERE "sectionId" = '${change.sectionId}';`
  );
}

// Update lesson section assignments and orders
for (const change of allChanges.filter(c => c.type === 'lesson_section')) {
  const refSection = allRefSections.get(change.newSection);
  if (!refSection) {
    console.log(`⚠️  Warning: Section ${change.newSection} not found in reference, skipping lesson ${change.lessonId}`);
    continue;
  }
  sqlStatements.push(
    `-- Move lesson to correct section: ${change.lessonId} (${change.title}) (Module: ${change.moduleId})\n` +
    `UPDATE lessons SET "sectionId" = '${change.newSection}', "updatedAt" = NOW() WHERE "lessonId" = '${change.lessonId}';`
  );
}

for (const change of allChanges.filter(c => c.type === 'lesson_order')) {
  sqlStatements.push(
    `-- Update lesson order: ${change.lessonId} (${change.title}) (Module: ${change.moduleId})\n` +
    `UPDATE lessons SET "order" = ${change.new}, "updatedAt" = NOW() WHERE "lessonId" = '${change.lessonId}';`
  );
}

// Print summary by module
console.log('📊 Summary of changes by module:');
const changesByModule = new Map();
for (const change of allChanges) {
  if (!changesByModule.has(change.moduleId)) {
    changesByModule.set(change.moduleId, {
      sectionTitle: 0,
      sectionOrder: 0,
      lessonSection: 0,
      lessonOrder: 0
    });
  }
  const moduleChanges = changesByModule.get(change.moduleId);
  if (change.type === 'section_title') moduleChanges.sectionTitle++;
  else if (change.type === 'section_order') moduleChanges.sectionOrder++;
  else if (change.type === 'lesson_section') moduleChanges.lessonSection++;
  else if (change.type === 'lesson_order') moduleChanges.lessonOrder++;
}

for (const [moduleId, counts] of changesByModule) {
  const total = counts.sectionTitle + counts.sectionOrder + counts.lessonSection + counts.lessonOrder;
  if (total > 0) {
    const module = refModuleMap.get(moduleId);
    console.log(`   ${moduleId} (${module?.title || 'Unknown'}):`);
    if (counts.sectionTitle > 0) console.log(`      - Section titles: ${counts.sectionTitle}`);
    if (counts.sectionOrder > 0) console.log(`      - Section orders: ${counts.sectionOrder}`);
    if (counts.lessonSection > 0) console.log(`      - Lesson sections: ${counts.lessonSection}`);
    if (counts.lessonOrder > 0) console.log(`      - Lesson orders: ${counts.lessonOrder}`);
  }
}

console.log(`\n📊 Total changes: ${allChanges.length}`);
console.log(`   - Section title changes: ${allChanges.filter(c => c.type === 'section_title').length}`);
console.log(`   - Section order changes: ${allChanges.filter(c => c.type === 'section_order').length}`);
console.log(`   - Lesson section changes: ${allChanges.filter(c => c.type === 'lesson_section').length}`);
console.log(`   - Lesson order changes: ${allChanges.filter(c => c.type === 'lesson_order').length}`);
console.log(`   - Total SQL statements: ${sqlStatements.length}\n`);

// Write SQL file
const sqlContent = `-- SQL Update Script: All Modules - Sections and Lessons
-- Generated by compare-json-and-generate-sql.mjs
-- Date: ${new Date().toISOString()}
--
-- This script updates sections and lessons in all modules to match
-- the reference JSON structure (course-metadata_copy.json)
--
-- WARNING: Review all changes before executing!
-- Backup your database before running this script.
--
-- Total changes: ${allChanges.length}
--   - Section title changes: ${allChanges.filter(c => c.type === 'section_title').length}
--   - Section order changes: ${allChanges.filter(c => c.type === 'section_order').length}
--   - Lesson section changes: ${allChanges.filter(c => c.type === 'lesson_section').length}
--   - Lesson order changes: ${allChanges.filter(c => c.type === 'lesson_order').length}

BEGIN;

${sqlStatements.length > 0 ? sqlStatements.join('\n\n') : '-- No changes detected. All data is already synchronized.'}

COMMIT;

-- Verify changes by module:
-- SELECT "moduleId", "sectionId", title, "order" FROM sections WHERE "moduleId" = 'module-XX' ORDER BY "order";
-- SELECT "moduleId", "lessonId", title, "sectionId", "order" FROM lessons WHERE "moduleId" = 'module-XX' ORDER BY "sectionId", "order";
`;

const outputPath = join(__dirname, 'update-all-modules-sections.sql');
writeFileSync(outputPath, sqlContent, 'utf-8');

if (sqlStatements.length > 0) {
  console.log(`✅ SQL script generated: ${outputPath}`);
  console.log(`\n⚠️  Please review the SQL file before executing!`);
  console.log(`   Consider backing up your database first.\n`);
} else {
  console.log(`✅ No differences found! The database is already synchronized.\n`);
}

