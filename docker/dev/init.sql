-- Prospera Academy Database Initialization Script
-- PostgreSQL DDL (Data Definition Language)
-- This script creates all tables required for the platform

-- Enable UUID extension for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- Core user table backing auth flow
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    "loginMethod" VARCHAR(64),
    role VARCHAR(16) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSignedIn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS users_openid_idx ON users("openId");
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- ============================================================================
-- COURSES TABLE
-- Stores course metadata (synced from JSON or managed via admin panel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    "courseId" VARCHAR(128) NOT NULL UNIQUE,
    acronym VARCHAR(16) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    "totalVideos" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS courses_courseid_idx ON courses("courseId");

-- ============================================================================
-- LESSONS TABLE
-- Individual lesson metadata linked to courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    "lessonId" VARCHAR(128) NOT NULL UNIQUE,
    "courseId" VARCHAR(128) NOT NULL,
    "moduleId" VARCHAR(128) NOT NULL,
    "moduleName" TEXT,
    "sectionId" VARCHAR(128) NOT NULL,
    "sectionName" TEXT,
    title TEXT NOT NULL,
    "youtubeUrl" TEXT,
    type VARCHAR(16) DEFAULT 'video',
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("courseId") REFERENCES courses("courseId") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS lessons_courseid_idx ON lessons("courseId");
CREATE INDEX IF NOT EXISTS lessons_moduleid_idx ON lessons("moduleId");
CREATE INDEX IF NOT EXISTS lessons_sectionid_idx ON lessons("sectionId");

-- ============================================================================
-- USER PROGRESS TABLE
-- Tracks which lessons users have watched and their progress
-- Supports multi-device sync
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "lessonId" VARCHAR(128) NOT NULL,
    "courseId" VARCHAR(128) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    "lastWatchedPosition" INTEGER DEFAULT 0,
    "watchedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("lessonId") REFERENCES lessons("lessonId") ON DELETE CASCADE,
    FOREIGN KEY ("courseId") REFERENCES courses("courseId") ON DELETE CASCADE,
    UNIQUE ("userId", "lessonId")
);

CREATE INDEX IF NOT EXISTS user_progress_userid_idx ON user_progress("userId");
CREATE INDEX IF NOT EXISTS user_progress_courseid_idx ON user_progress("courseId");
CREATE INDEX IF NOT EXISTS user_progress_lessonid_idx ON user_progress("lessonId");

-- ============================================================================
-- USER NOTES TABLE
-- Personal annotations on specific timestamps of videos
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notes (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "lessonId" VARCHAR(128) NOT NULL,
    timestamp INTEGER NOT NULL,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("lessonId") REFERENCES lessons("lessonId") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_notes_user_lesson_idx ON user_notes("userId", "lessonId");
CREATE INDEX IF NOT EXISTS user_notes_lessonid_idx ON user_notes("lessonId");

-- ============================================================================
-- RATINGS TABLE
-- User ratings for lessons or courses (like/dislike or star ratings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "targetType" VARCHAR(16) NOT NULL,
    "targetId" VARCHAR(128) NOT NULL,
    "ratingType" VARCHAR(16) NOT NULL,
    stars INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE ("userId", "targetType", "targetId")
);

CREATE INDEX IF NOT EXISTS ratings_target_idx ON ratings("targetType", "targetId");
CREATE INDEX IF NOT EXISTS ratings_userid_idx ON ratings("userId");

-- ============================================================================
-- COURSE MATERIALS TABLE
-- PDFs, slides, and other downloadable resources
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_materials (
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("courseId") REFERENCES courses("courseId") ON DELETE CASCADE,
    FOREIGN KEY ("lessonId") REFERENCES lessons("lessonId") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS course_materials_courseid_idx ON course_materials("courseId");
CREATE INDEX IF NOT EXISTS course_materials_lessonid_idx ON course_materials("lessonId");

-- ============================================================================
-- VIDEO TRANSCRIPTS TABLE
-- AI-generated text summaries for context/search
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_transcripts (
    id SERIAL PRIMARY KEY,
    "lessonId" VARCHAR(128) NOT NULL UNIQUE,
    transcript TEXT NOT NULL,
    summary TEXT,
    keywords TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("lessonId") REFERENCES lessons("lessonId") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS video_transcripts_lessonid_idx ON video_transcripts("lessonId");

-- ============================================================================
-- TRIGGERS
-- Automatically update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updatedAt column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_materials_updated_at BEFORE UPDATE ON course_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_transcripts_updated_at BEFORE UPDATE ON video_transcripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LOG SUCCESSFUL INITIALIZATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Prospera Academy database initialized successfully';
    RAISE NOTICE 'Tables created: users, courses, lessons, user_progress, user_notes, ratings, course_materials, video_transcripts';
END $$;
