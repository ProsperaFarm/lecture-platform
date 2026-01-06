-- SQL Script: Update nextLessonId and prevLessonId for all lessons
-- This script sets up navigation links between consecutive lessons across the entire course
-- 
-- Rules:
-- - First lesson of the course: only has nextLessonId (no prevLessonId)
-- - Last lesson of the course: only has prevLessonId (no nextLessonId)
-- - All other lessons: have both nextLessonId and prevLessonId
--
-- Lessons are ordered by: module.order -> section.order -> lesson.order
--
-- WARNING: Review before executing!
-- Backup your database before running this script.

BEGIN;

-- First, clear all existing navigation links
UPDATE lessons SET "nextLessonId" = NULL, "prevLessonId" = NULL, "updatedAt" = NOW();

-- Update nextLessonId and prevLessonId for all lessons in the course
-- Order by: module.order, section.order, lesson.order
WITH ordered_lessons AS (
  SELECT 
    l."lessonId",
    l."courseId",
    LEAD(l."lessonId") OVER (
      PARTITION BY l."courseId" 
      ORDER BY m."order", s."order", l."order"
    ) AS next_lesson_id,
    LAG(l."lessonId") OVER (
      PARTITION BY l."courseId" 
      ORDER BY m."order", s."order", l."order"
    ) AS prev_lesson_id
  FROM lessons l
  INNER JOIN sections s ON s."sectionId" = l."sectionId"
  INNER JOIN modules m ON m."moduleId" = l."moduleId"
)
UPDATE lessons l
SET 
  "nextLessonId" = ol.next_lesson_id,
  "prevLessonId" = ol.prev_lesson_id,
  "updatedAt" = NOW()
FROM ordered_lessons ol
WHERE l."lessonId" = ol."lessonId";

COMMIT;

-- Verify the results for a specific course:
-- SELECT 
--   m."order" AS module_order,
--   s."order" AS section_order,
--   l."order" AS lesson_order,
--   l."lessonId",
--   l.title,
--   l."prevLessonId",
--   l."nextLessonId"
-- FROM lessons l
-- INNER JOIN sections s ON s."sectionId" = l."sectionId"
-- INNER JOIN modules m ON m."moduleId" = l."moduleId"
-- WHERE l."courseId" = 'gestao-fazendas-gado-leite'
-- ORDER BY m."order", s."order", l."order"
-- LIMIT 50;

-- Check first and last lessons of the course:
-- WITH ordered_lessons AS (
--   SELECT 
--     l."lessonId",
--     l.title,
--     m."order" AS module_order,
--     s."order" AS section_order,
--     l."order" AS lesson_order,
--     ROW_NUMBER() OVER (PARTITION BY l."courseId" ORDER BY m."order", s."order", l."order") AS seq_num,
--     COUNT(*) OVER (PARTITION BY l."courseId") AS total_lessons
--   FROM lessons l
--   INNER JOIN sections s ON s."sectionId" = l."sectionId"
--   INNER JOIN modules m ON m."moduleId" = l."moduleId"
--   WHERE l."courseId" = 'gestao-fazendas-gado-leite'
-- )
-- SELECT 
--   "lessonId",
--   title,
--   module_order,
--   section_order,
--   lesson_order,
--   seq_num,
--   total_lessons,
--   CASE WHEN seq_num = 1 THEN 'FIRST' WHEN seq_num = total_lessons THEN 'LAST' ELSE 'MIDDLE' END AS position
-- FROM ordered_lessons
-- WHERE seq_num = 1 OR seq_num = total_lessons
-- ORDER BY seq_num;

