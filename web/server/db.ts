import { eq, and, desc, gt } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pkg from 'pg';
const { Pool } = pkg;
import { InsertUser, User, users, courses, lessons, modules, sections, userProgress, Course, Lesson, UserProgress, InsertUserProgress, userInvites, InsertUserInvite, UserInvite } from "../drizzle/schema";
import { count } from "drizzle-orm";
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
      // Owner is always authorized
      values.authorized = true;
      updateSet.authorized = true;
    }

    // Handle authorized field
    if (user.authorized !== undefined) {
      values.authorized = user.authorized;
      updateSet.authorized = user.authorized;
    }

    // Handle blocked field
    if (user.blocked !== undefined) {
      values.blocked = user.blocked;
      updateSet.blocked = user.blocked;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // Check if this is the first time user is signing in (set firstAccess)
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    const isFirstLogin = existingUser.length > 0 && existingUser[0].firstAccess === null && user.lastSignedIn;
    if (isFirstLogin && user.lastSignedIn) {
      updateSet.firstAccess = user.lastSignedIn;
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
 * Get course metadata (total modules and sections)
 */
export async function getCourseMetadata(courseId: string): Promise<{
  totalModules: number;
  totalSections: number;
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get course metadata: database not available");
    return { totalModules: 0, totalSections: 0 };
  }

  // Count modules for this course
  const modulesResult = await db
    .select({ count: count() })
    .from(modules)
    .where(eq(modules.courseId, courseId));

  // Count sections for this course
  const sectionsResult = await db
    .select({ count: count() })
    .from(sections)
    .where(eq(sections.courseId, courseId));

  return {
    totalModules: modulesResult[0]?.count || 0,
    totalSections: sectionsResult[0]?.count || 0,
  };
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

/**
 * User Progress Management
 */

/**
 * Get user progress for a specific course
 */
export async function getUserProgressByCourse(userId: number, courseId: string): Promise<UserProgress[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user progress: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
  
  return result;
}

/**
 * Calculate course progress statistics
 * Returns total lessons, completed lessons, progress percentage, and durations
 */
export async function getCourseProgressStats(userId: number, courseId: string): Promise<{
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  watchedDuration: number;
  totalDuration: number;
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get course progress stats: database not available");
    return {
      totalLessons: 0,
      completedLessons: 0,
      progressPercentage: 0,
      watchedDuration: 0,
      totalDuration: 0,
    };
  }

  // Get all lessons for this course
  const courseLessons = await getLessonsByCourse(courseId);
  
  // Get user progress for this course
  const userProgressData = await getUserProgressByCourse(userId, courseId);
  
  // Create a map of lessonId -> completed status
  const progressMap = new Map<string, boolean>();
  userProgressData.forEach(progress => {
    progressMap.set(progress.lessonId, progress.completed || false);
  });

  // Calculate statistics (same logic as frontend)
  let completedCount = 0;
  let watchedDuration = 0;
  let totalDuration = 0;

  courseLessons.forEach(lesson => {
    const isCompleted = progressMap.get(lesson.lessonId) || false;
    const lessonDuration = lesson.duration || 0;

    if (isCompleted) {
      completedCount++;
      watchedDuration += lessonDuration;
    }
    totalDuration += lessonDuration;
  });

  const totalLessons = courseLessons.length;
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedCount / totalLessons) * 100) 
    : 0;

  return {
    totalLessons,
    completedLessons: completedCount,
    progressPercentage,
    watchedDuration,
    totalDuration,
  };
}

/**
 * Get all user progress for a user (across all courses)
 */
export async function getAllUserProgress(userId: number): Promise<UserProgress[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user progress: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));
  
  return result;
}

/**
 * Get user progress for a specific lesson
 */
export async function getUserProgressByLesson(userId: number, lessonId: string): Promise<UserProgress | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user progress: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get the last watched lesson for a user in a course
 * Returns the lesson with the most recent watchedAt or updatedAt where lastWatchedPosition > 0
 */
export async function getLastWatchedLesson(userId: number, courseId: string): Promise<Lesson | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get last watched lesson: database not available");
    return null;
  }

  // Find the most recent progress entry for this course where the user has watched something
  const lastProgress = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.courseId, courseId),
        gt(userProgress.lastWatchedPosition, 0) // Only lessons that were actually started
      )
    )
    .orderBy(desc(userProgress.updatedAt)) // Most recently updated
    .limit(1);

  if (lastProgress.length === 0) {
    return null;
  }

  // Get the lesson details
  const lesson = await getLessonById(lastProgress[0].lessonId);
  return lesson || null;
}

/**
 * Mark lesson as completed or update watch position
 */
export async function upsertUserProgress(data: {
  userId: number;
  lessonId: string;
  courseId: string;
  completed?: boolean;
  lastWatchedPosition?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user progress: database not available");
    return;
  }

  const now = new Date();
  
  await db
    .insert(userProgress)
    .values({
      userId: data.userId,
      lessonId: data.lessonId,
      courseId: data.courseId,
      completed: data.completed ?? false,
      lastWatchedPosition: data.lastWatchedPosition ?? 0,
      watchedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.lessonId],
      set: {
        completed: data.completed ?? false,
        lastWatchedPosition: data.lastWatchedPosition ?? 0,
        updatedAt: now,
      },
    });
}

/**
 * Toggle lesson completion status
 */
export async function toggleLessonCompletion(userId: number, lessonId: string, courseId: string, completed: boolean): Promise<void> {
  await upsertUserProgress({
    userId,
    lessonId,
    courseId,
    completed,
  });
}

/**
 * Reset all progress for a course (delete all user progress records for a course)
 */
export async function resetCourseProgress(userId: number, courseId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot reset course progress: database not available");
    throw new Error("Database not available");
  }

  await db
    .delete(userProgress)
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.courseId, courseId)
    ));
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all users for admin panel
 */
export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all users: database not available");
    return [];
  }

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

/**
 * Update user authorization status (authorized/blocked)
 */
export async function updateUserAuthorization(
  userId: number,
  updates: { authorized?: boolean; blocked?: boolean }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.authorized !== undefined) {
    updateSet.authorized = updates.authorized;
  }

  if (updates.blocked !== undefined) {
    updateSet.blocked = updates.blocked;
  }

  await db.update(users).set(updateSet).where(eq(users.id, userId));
}

/**
 * Create a user invite
 */
export async function createUserInvite(invite: InsertUserInvite): Promise<UserInvite> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(userInvites).values(invite).returning();
  return result[0];
}

/**
 * Get user invite by token
 */
export async function getUserInviteByToken(token: string): Promise<UserInvite | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user invite: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(userInvites)
    .where(eq(userInvites.token, token))
    .limit(1);

  return result[0];
}

/**
 * Get user invite by email
 */
export async function getUserInviteByEmail(email: string): Promise<UserInvite | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user invite: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(userInvites)
    .where(eq(userInvites.email, email))
    .limit(1);

  return result[0];
}

/**
 * Mark invite as used
 */
export async function markInviteAsUsed(inviteId: number, usedAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(userInvites)
    .set({
      used: true,
      usedAt: usedAt,
      updatedAt: new Date(),
    })
    .where(eq(userInvites.id, inviteId));
}

/**
 * Check if user email has a valid invite (not used, not expired)
 */
export async function hasValidInvite(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const result = await db
    .select()
    .from(userInvites)
    .where(
      and(
        eq(userInvites.email, email),
        eq(userInvites.used, false),
        sql`(${userInvites.expiresAt} IS NULL OR ${userInvites.expiresAt} > NOW())`
      )
    )
    .limit(1);

  return result.length > 0;
}
