-- Initialize Database Schema for Prospera Academy
-- PostgreSQL version
-- Run this script to create all tables in your local database

-- Drop existing tables (optional - comment out if you want to preserve data)
-- DROP TABLE IF EXISTS user_progress CASCADE;
-- DROP TABLE IF EXISTS user_notes CASCADE;
-- DROP TABLE IF EXISTS ratings CASCADE;
-- DROP TABLE IF EXISTS video_transcripts CASCADE;
-- DROP TABLE IF EXISTS course_materials CASCADE;
-- DROP TABLE IF EXISTS lessons CASCADE;
-- DROP TABLE IF EXISTS sections CASCADE;
-- DROP TABLE IF EXISTS modules CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  "courseId" VARCHAR(128) NOT NULL UNIQUE,
  acronym VARCHAR(16) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  "totalVideos" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  "moduleId" VARCHAR(128) NOT NULL UNIQUE,
  "courseId" VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS modules_courseId_idx ON modules("courseId");
CREATE INDEX IF NOT EXISTS modules_course_order_idx ON modules("courseId", "order");

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  "sectionId" VARCHAR(128) NOT NULL UNIQUE,
  "moduleId" VARCHAR(128) NOT NULL,
  "courseId" VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sections_moduleId_idx ON sections("moduleId");
CREATE INDEX IF NOT EXISTS sections_module_order_idx ON sections("moduleId", "order");
CREATE INDEX IF NOT EXISTS sections_courseId_idx ON sections("courseId");

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  "lessonId" VARCHAR(128) NOT NULL UNIQUE,
  "sectionId" VARCHAR(128) NOT NULL,
  "moduleId" VARCHAR(128) NOT NULL,
  "courseId" VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  "youtubeUrl" TEXT,
  type VARCHAR(16) DEFAULT 'video',
  duration INTEGER, -- Duration in seconds
  "order" INTEGER NOT NULL,
  "nextLessonId" VARCHAR(128),
  "prevLessonId" VARCHAR(128),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lessons_sectionId_idx ON lessons("sectionId");
CREATE INDEX IF NOT EXISTS lessons_section_order_idx ON lessons("sectionId", "order");
CREATE INDEX IF NOT EXISTS lessons_moduleId_idx ON lessons("moduleId");
CREATE INDEX IF NOT EXISTS lessons_courseId_idx ON lessons("courseId");
CREATE INDEX IF NOT EXISTS lessons_nextLessonId_idx ON lessons("nextLessonId");
CREATE INDEX IF NOT EXISTS lessons_prevLessonId_idx ON lessons("prevLessonId");

-- User Progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "lessonId" VARCHAR(128) NOT NULL,
  "courseId" VARCHAR(128) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  "lastWatchedPosition" INTEGER DEFAULT 0,
  "watchedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT user_lesson_idx UNIQUE("userId", "lessonId")
);

CREATE INDEX IF NOT EXISTS user_progress_userId_idx ON user_progress("userId");
CREATE INDEX IF NOT EXISTS user_progress_courseId_idx ON user_progress("courseId");

-- User Notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "lessonId" VARCHAR(128) NOT NULL,
  timestamp INTEGER NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_notes_user_lesson_idx ON user_notes("userId", "lessonId");

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "targetType" VARCHAR(16) NOT NULL,
  "targetId" VARCHAR(128) NOT NULL,
  "ratingType" VARCHAR(16) NOT NULL,
  stars INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT user_target_idx UNIQUE("userId", "targetType", "targetId")
);

CREATE INDEX IF NOT EXISTS ratings_target_idx ON ratings("targetType", "targetId");

-- Video Transcripts table
CREATE TABLE IF NOT EXISTS video_transcripts (
  id SERIAL PRIMARY KEY,
  "lessonId" VARCHAR(128) NOT NULL UNIQUE,
  transcript TEXT NOT NULL,
  summary TEXT,
  keywords TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Course Materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id SERIAL PRIMARY KEY,
  "courseId" VARCHAR(128) NOT NULL,
  "lessonId" VARCHAR(128),
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(32) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(128),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_materials_courseId_idx ON course_materials("courseId");
CREATE INDEX IF NOT EXISTS course_materials_lessonId_idx ON course_materials("lessonId");

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema initialized successfully!';
  RAISE NOTICE '📋 Tables created: courses, modules, sections, lessons, user_progress, user_notes, ratings, video_transcripts, course_materials';
  RAISE NOTICE '🚀 Next step: Run npm run db:seed:normalized to populate with course data';
END $$;
