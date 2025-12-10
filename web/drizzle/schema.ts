import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, index, unique, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16 }).default("user").notNull(), // "user" or "admin"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Courses table - stores course metadata
 * Synced from courses-data.json initially, but can be managed via admin panel
 */
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseId: varchar("courseId", { length: 128 }).notNull().unique(), // e.g., "gestao-fazendas-gado-leite"
  acronym: varchar("acronym", { length: 16 }).notNull(), // e.g., "GFGL"
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  totalVideos: integer("totalVideos").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Modules table - course modules (e.g., "Módulo 1: Introdução")
 * Normalized structure for better organization and navigation
 */
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  moduleId: varchar("moduleId", { length: 128 }).notNull().unique(), // e.g., "module-01"
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId
  title: text("title").notNull(),
  order: integer("order").notNull(), // Sequential order within course
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  courseIdIdx: index("modules_courseId_idx").on(table.courseId),
  courseOrderIdx: index("modules_course_order_idx").on(table.courseId, table.order),
}));

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

/**
 * Sections table - module sections (e.g., "Seção 1.1: Conceitos Básicos")
 * Normalized structure for better organization and navigation
 */
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  sectionId: varchar("sectionId", { length: 128 }).notNull().unique(), // e.g., "section-01-01"
  moduleId: varchar("moduleId", { length: 128 }).notNull(), // FK to modules.moduleId
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId (denormalized for easier queries)
  title: text("title").notNull(),
  order: integer("order").notNull(), // Sequential order within module
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  moduleIdIdx: index("sections_moduleId_idx").on(table.moduleId),
  moduleOrderIdx: index("sections_module_order_idx").on(table.moduleId, table.order),
  courseIdIdx: index("sections_courseId_idx").on(table.courseId),
}));

export type Section = typeof sections.$inferSelect;
export type InsertSection = typeof sections.$inferInsert;

/**
 * Lessons table - stores individual lesson metadata
 * Now properly normalized with references to sections
 */
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  lessonId: varchar("lessonId", { length: 128 }).notNull().unique(), // e.g., "lesson-01-01-01"
  sectionId: varchar("sectionId", { length: 128 }).notNull(), // FK to sections.sectionId
  moduleId: varchar("moduleId", { length: 128 }).notNull(), // FK to modules.moduleId (denormalized)
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId (denormalized)
  title: text("title").notNull(),
  youtubeUrl: text("youtubeUrl"),
  type: varchar("type", { length: 16 }).default("video"), // "video" or "live"
  order: integer("order").notNull(), // Sequential order within section
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  sectionIdIdx: index("lessons_sectionId_idx").on(table.sectionId),
  sectionOrderIdx: index("lessons_section_order_idx").on(table.sectionId, table.order),
  moduleIdIdx: index("lessons_moduleId_idx").on(table.moduleId),
  courseIdIdx: index("lessons_courseId_idx").on(table.courseId),
}));

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

/**
 * User progress tracking - which lessons a user has watched and how far
 * Supports multi-device sync via database
 */
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // FK to users.id
  lessonId: varchar("lessonId", { length: 128 }).notNull(), // FK to lessons.lessonId
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId
  completed: boolean("completed").default(false),
  lastWatchedPosition: integer("lastWatchedPosition").default(0), // in seconds
  watchedAt: timestamp("watchedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userLessonIdx: unique("user_lesson_idx").on(table.userId, table.lessonId),
  userIdIdx: index("userId_idx").on(table.userId),
  courseIdIdx: index("user_progress_courseId_idx").on(table.courseId),
}));

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * User notes - personal annotations on specific timestamps of videos
 */
export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // FK to users.id
  lessonId: varchar("lessonId", { length: 128 }).notNull(), // FK to lessons.lessonId
  timestamp: integer("timestamp").notNull(), // in seconds
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userLessonIdx: index("user_notes_user_lesson_idx").on(table.userId, table.lessonId),
}));

export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;

/**
 * Ratings - user ratings for lessons or courses
 * Supports both like/dislike and star ratings
 */
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // FK to users.id
  targetType: varchar("targetType", { length: 16 }).notNull(), // "lesson" or "course"
  targetId: varchar("targetId", { length: 128 }).notNull(), // lessonId or courseId
  ratingType: varchar("ratingType", { length: 16 }).notNull(), // "like", "dislike", or "stars"
  stars: integer("stars"), // 1-5 stars (null if ratingType is like/dislike)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userTargetIdx: unique("user_target_idx").on(table.userId, table.targetType, table.targetId),
  targetIdx: index("target_idx").on(table.targetType, table.targetId),
}));

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Course materials - PDFs, slides, and other downloadable resources
 */
export const courseMaterials = pgTable("course_materials", {
  id: serial("id").primaryKey(),
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId
  lessonId: varchar("lessonId", { length: 128 }), // Optional: link to specific lesson
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type", { length: 16 }).notNull(), // "pdf", "slide", "document", "other"
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: text("fileKey").notNull(), // S3 key for deletion
  fileSize: integer("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  courseIdIdx: index("course_materials_courseId_idx").on(table.courseId),
  lessonIdIdx: index("lessonId_idx").on(table.lessonId),
}));

export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type InsertCourseMaterial = typeof courseMaterials.$inferInsert;

/**
 * Video transcripts - AI-generated text summaries for context/search
 */
export const videoTranscripts = pgTable("video_transcripts", {
  id: serial("id").primaryKey(),
  lessonId: varchar("lessonId", { length: 128 }).notNull().unique(), // FK to lessons.lessonId
  transcript: text("transcript").notNull(), // Full transcript text
  summary: text("summary"), // AI-generated summary
  keywords: text("keywords"), // Comma-separated keywords for search
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VideoTranscript = typeof videoTranscripts.$inferSelect;
export type InsertVideoTranscript = typeof videoTranscripts.$inferInsert;
