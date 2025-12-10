-- Reset Schema Script
-- Drops all tables and recreates them with normalized structure

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS video_transcripts CASCADE;
DROP TABLE IF EXISTS course_materials CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
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

-- Modules table (NEW)
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  "moduleId" VARCHAR(128) NOT NULL UNIQUE,
  "courseId" VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX modules_courseId_idx ON modules("courseId");
CREATE INDEX modules_course_order_idx ON modules("courseId", "order");

-- Sections table (NEW)
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  "sectionId" VARCHAR(128) NOT NULL UNIQUE,
  "moduleId" VARCHAR(128) NOT NULL,
  "courseId" VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX sections_moduleId_idx ON sections("moduleId");
CREATE INDEX sections_module_order_idx ON sections("moduleId", "order");
CREATE INDEX sections_courseId_idx ON sections("courseId");

-- Lessons table (UPDATED - normalized with next/prev references)
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  "lessonId" VARCHAR(128) NOT NULL UNIQUE,
  "sectionId" VARCHAR(128) NOT NULL,
  "moduleId" VARCHAR(128) NOT NULL,
  "courseId" VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  "youtubeUrl" TEXT,
  type VARCHAR(16) DEFAULT 'video',
  "order" INTEGER NOT NULL,
  "nextLessonId" VARCHAR(128),
  "prevLessonId" VARCHAR(128),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX lessons_sectionId_idx ON lessons("sectionId");
CREATE INDEX lessons_section_order_idx ON lessons("sectionId", "order");
CREATE INDEX lessons_moduleId_idx ON lessons("moduleId");
CREATE INDEX lessons_courseId_idx ON lessons("courseId");
CREATE INDEX lessons_nextLessonId_idx ON lessons("nextLessonId");
CREATE INDEX lessons_prevLessonId_idx ON lessons("prevLessonId");

-- User progress table
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "lessonId" VARCHAR(128) NOT NULL,
  "courseId" VARCHAR(128) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  "lastWatchedPosition" INTEGER DEFAULT 0,
  "watchedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "lessonId")
);

CREATE INDEX userId_idx ON user_progress("userId");
CREATE INDEX user_progress_courseId_idx ON user_progress("courseId");

-- User notes table
CREATE TABLE user_notes (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "lessonId" VARCHAR(128) NOT NULL,
  timestamp INTEGER NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX user_notes_user_lesson_idx ON user_notes("userId", "lessonId");

-- Ratings table
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "targetType" VARCHAR(16) NOT NULL,
  "targetId" VARCHAR(128) NOT NULL,
  "ratingType" VARCHAR(16) NOT NULL,
  stars INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "targetType", "targetId")
);

CREATE INDEX target_idx ON ratings("targetType", "targetId");

-- Course materials table
CREATE TABLE course_materials (
  id SERIAL PRIMARY KEY,
  "courseId" VARCHAR(128) NOT NULL,
  "lessonId" VARCHAR(128),
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(16) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(128),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX course_materials_courseId_idx ON course_materials("courseId");
CREATE INDEX lessonId_idx ON course_materials("lessonId");

-- Video transcripts table
CREATE TABLE video_transcripts (
  id SERIAL PRIMARY KEY,
  "lessonId" VARCHAR(128) NOT NULL UNIQUE,
  transcript TEXT NOT NULL,
  summary TEXT,
  keywords TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
