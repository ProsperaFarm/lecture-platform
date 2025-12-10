import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, index, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Courses table - stores course metadata
 * Synced from courses-data.json initially, but can be managed via admin panel
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 128 }).notNull().unique(), // e.g., "gestao-fazendas-gado-leite"
  acronym: varchar("acronym", { length: 16 }).notNull(), // e.g., "GFGL"
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  totalVideos: int("totalVideos").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Lessons table - stores individual lesson metadata
 * Linked to courses via courseId
 */
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: varchar("lessonId", { length: 128 }).notNull().unique(), // e.g., "lesson-01-01-01"
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId
  moduleId: varchar("moduleId", { length: 128 }).notNull(),
  moduleName: text("moduleName"),
  sectionId: varchar("sectionId", { length: 128 }).notNull(),
  sectionName: text("sectionName"),
  title: text("title").notNull(),
  youtubeUrl: text("youtubeUrl"),
  type: mysqlEnum("type", ["video", "live"]).default("video"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  courseIdIdx: index("courseId_idx").on(table.courseId),
}));

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

/**
 * User progress tracking - which lessons a user has watched and how far
 * Supports multi-device sync via database
 */
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users.id
  lessonId: varchar("lessonId", { length: 128 }).notNull(), // FK to lessons.lessonId
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId
  completed: boolean("completed").default(false),
  lastWatchedPosition: int("lastWatchedPosition").default(0), // in seconds
  watchedAt: timestamp("watchedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userLessonIdx: unique("user_lesson_idx").on(table.userId, table.lessonId),
  userIdIdx: index("userId_idx").on(table.userId),
  courseIdIdx: index("courseId_idx").on(table.courseId),
}));

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * User notes - personal annotations on specific timestamps of videos
 */
export const userNotes = mysqlTable("user_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users.id
  lessonId: varchar("lessonId", { length: 128 }).notNull(), // FK to lessons.lessonId
  timestamp: int("timestamp").notNull(), // in seconds
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userLessonIdx: index("user_lesson_idx").on(table.userId, table.lessonId),
}));

export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;

/**
 * Ratings - user ratings for lessons or courses
 * Supports both like/dislike and star ratings
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users.id
  targetType: mysqlEnum("targetType", ["lesson", "course"]).notNull(),
  targetId: varchar("targetId", { length: 128 }).notNull(), // lessonId or courseId
  ratingType: mysqlEnum("ratingType", ["like", "dislike", "stars"]).notNull(),
  stars: int("stars"), // 1-5 stars (null if ratingType is like/dislike)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userTargetIdx: unique("user_target_idx").on(table.userId, table.targetType, table.targetId),
  targetIdx: index("target_idx").on(table.targetType, table.targetId),
}));

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Course materials - PDFs, slides, and other downloadable resources
 */
export const courseMaterials = mysqlTable("course_materials", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 128 }).notNull(), // FK to courses.courseId
  lessonId: varchar("lessonId", { length: 128 }), // Optional: link to specific lesson
  title: text("title").notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["pdf", "slide", "document", "other"]).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: text("fileKey").notNull(), // S3 key for deletion
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  courseIdIdx: index("courseId_idx").on(table.courseId),
  lessonIdIdx: index("lessonId_idx").on(table.lessonId),
}));

export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type InsertCourseMaterial = typeof courseMaterials.$inferInsert;

/**
 * Video transcripts - AI-generated text summaries for context/search
 */
export const videoTranscripts = mysqlTable("video_transcripts", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: varchar("lessonId", { length: 128 }).notNull().unique(), // FK to lessons.lessonId
  transcript: text("transcript").notNull(), // Full transcript text
  summary: text("summary"), // AI-generated summary
  keywords: text("keywords"), // Comma-separated keywords for search
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoTranscript = typeof videoTranscripts.$inferSelect;
export type InsertVideoTranscript = typeof videoTranscripts.$inferInsert;