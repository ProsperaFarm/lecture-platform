import { eq } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pkg from 'pg';
const { Pool } = pkg;
import { InsertUser, users, courses, lessons, modules, sections, Course, Lesson } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleNode> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Use Neon serverless for production (Vercel/Supabase)
      // Use node-postgres for local development (Docker)
      const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('supabase.co');
      
      if (isProduction) {
        const sql = neon(process.env.DATABASE_URL);
        _db = drizzleNeon(sql);
      } else {
        // Local development with Docker
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        _db = drizzleNode(pool);
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using ON CONFLICT
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all courses
 */
export async function getAllCourses(): Promise<Course[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get courses: database not available");
    return [];
  }

  const result = await db.select().from(courses).orderBy(courses.createdAt);
  return result;
}

/**
 * Get course by courseId
 */
export async function getCourseById(courseId: string): Promise<Course | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get course: database not available");
    return undefined;
  }

  const result = await db.select().from(courses).where(eq(courses.courseId, courseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all lessons for a course with module and section names (for display)
 */
export async function getLessonsWithDetails(courseId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lessons: database not available");
    return [];
  }

  const result = await db
    .select({
      id: lessons.id,
      lessonId: lessons.lessonId,
      sectionId: lessons.sectionId,
      moduleId: lessons.moduleId,
      courseId: lessons.courseId,
      title: lessons.title,
      youtubeUrl: lessons.youtubeUrl,
      duration: lessons.duration,
      order: lessons.order,
      nextLessonId: lessons.nextLessonId,
      prevLessonId: lessons.prevLessonId,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
      moduleName: modules.title,
      moduleOrder: modules.order,
      moduleTotalDuration: modules.totalDuration,
      sectionName: sections.title,
      sectionOrder: sections.order,
      sectionTotalDuration: sections.totalDuration,
    })
    .from(lessons)
    .leftJoin(modules, eq(lessons.moduleId, modules.moduleId))
    .leftJoin(sections, eq(lessons.sectionId, sections.sectionId))
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);

  return result;
}

/**
 * Get all lessons for a course (flat list, properly ordered)
 * Note: This is kept for backward compatibility, but navigation should use nextLessonId/prevLessonId
 */
export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lessons: database not available");
    return [];
  }

  const result = await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.order);
  return result;
}

/**
 * Get lesson by lessonId
 * Includes nextLessonId and prevLessonId for navigation
 */
export async function getLessonById(lessonId: string): Promise<Lesson | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lesson: database not available");
    return undefined;
  }

  const result = await db.select().from(lessons).where(eq(lessons.lessonId, lessonId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get next lesson (simplified - just fetch by nextLessonId)
 */
export async function getNextLesson(currentLessonId: string): Promise<Lesson | null> {
  const currentLesson = await getLessonById(currentLessonId);
  if (!currentLesson || !currentLesson.nextLessonId) {
    return null;
  }
  
  const nextLesson = await getLessonById(currentLesson.nextLessonId);
  return nextLesson || null;
}

/**
 * Get previous lesson (simplified - just fetch by prevLessonId)
 */
export async function getPreviousLesson(currentLessonId: string): Promise<Lesson | null> {
  const currentLesson = await getLessonById(currentLessonId);
  if (!currentLesson || !currentLesson.prevLessonId) {
    return null;
  }
  
  const prevLesson = await getLessonById(currentLesson.prevLessonId);
  return prevLesson || null;
}
