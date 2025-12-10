import { eq, and, asc } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pkg from 'pg';
const { Pool } = pkg;
import { 
  InsertUser, users, courses, modules, sections, lessons,
  Course, Module, Section, Lesson 
} from "../drizzle/schema";
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
 * Get all modules for a course
 */
export async function getModulesByCourse(courseId: string): Promise<Module[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get modules: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order));
  
  return result;
}

/**
 * Get all sections for a module
 */
export async function getSectionsByModule(moduleId: string): Promise<Section[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sections: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(sections)
    .where(eq(sections.moduleId, moduleId))
    .orderBy(asc(sections.order));
  
  return result;
}

/**
 * Get all lessons for a section
 */
export async function getLessonsBySection(sectionId: string): Promise<Lesson[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lessons: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(lessons)
    .where(eq(lessons.sectionId, sectionId))
    .orderBy(asc(lessons.order));
  
  return result;
}

/**
 * Get all lessons for a course (flat list, properly ordered)
 */
export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lessons: database not available");
    return [];
  }

  // Get all modules for this course
  const courseModules = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order));

  // Get all sections for these modules
  const allSections: Section[] = [];
  for (const module of courseModules) {
    const moduleSections = await db
      .select()
      .from(sections)
      .where(eq(sections.moduleId, module.moduleId))
      .orderBy(asc(sections.order));
    allSections.push(...moduleSections);
  }

  // Get all lessons for these sections
  const allLessons: Lesson[] = [];
  for (const section of allSections) {
    const sectionLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.sectionId, section.sectionId))
      .orderBy(asc(lessons.order));
    allLessons.push(...sectionLessons);
  }

  return allLessons;
}

/**
 * Get lesson by lessonId
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
 * Get full course structure with modules, sections, and lessons
 */
export interface CourseStructure {
  course: Course;
  modules: Array<{
    module: Module;
    sections: Array<{
      section: Section;
      lessons: Lesson[];
    }>;
  }>;
}

export async function getCourseStructure(courseId: string): Promise<CourseStructure | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get course structure: database not available");
    return undefined;
  }

  // Get course
  const course = await getCourseById(courseId);
  if (!course) return undefined;

  // Get modules
  const courseModules = await getModulesByCourse(courseId);

  // Build structure
  const modulesWithSections = [];
  for (const module of courseModules) {
    const moduleSections = await getSectionsByModule(module.moduleId);
    
    const sectionsWithLessons = [];
    for (const section of moduleSections) {
      const sectionLessons = await getLessonsBySection(section.sectionId);
      sectionsWithLessons.push({
        section,
        lessons: sectionLessons,
      });
    }

    modulesWithSections.push({
      module,
      sections: sectionsWithLessons,
    });
  }

  return {
    course,
    modules: modulesWithSections,
  };
}

/**
 * Get next lesson in sequence (module -> section -> lesson order)
 */
export async function getNextLesson(currentLessonId: string): Promise<Lesson | null> {
  const db = await getDb();
  if (!db) return null;

  const currentLesson = await getLessonById(currentLessonId);
  if (!currentLesson) return null;

  // Try to find next lesson in same section
  const sameSectionLessons = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.sectionId, currentLesson.sectionId),
        eq(lessons.order, currentLesson.order + 1)
      )
    )
    .limit(1);

  if (sameSectionLessons.length > 0) {
    return sameSectionLessons[0];
  }

  // No more lessons in current section, find next section
  const currentSection = await db
    .select()
    .from(sections)
    .where(eq(sections.sectionId, currentLesson.sectionId))
    .limit(1);

  if (currentSection.length === 0) return null;

  const nextSection = await db
    .select()
    .from(sections)
    .where(
      and(
        eq(sections.moduleId, currentSection[0].moduleId),
        eq(sections.order, currentSection[0].order + 1)
      )
    )
    .limit(1);

  if (nextSection.length > 0) {
    // Get first lesson of next section
    const firstLesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.sectionId, nextSection[0].sectionId))
      .orderBy(asc(lessons.order))
      .limit(1);

    return firstLesson.length > 0 ? firstLesson[0] : null;
  }

  // No more sections in current module, find next module
  const currentModule = await db
    .select()
    .from(modules)
    .where(eq(modules.moduleId, currentSection[0].moduleId))
    .limit(1);

  if (currentModule.length === 0) return null;

  const nextModule = await db
    .select()
    .from(modules)
    .where(
      and(
        eq(modules.courseId, currentModule[0].courseId),
        eq(modules.order, currentModule[0].order + 1)
      )
    )
    .limit(1);

  if (nextModule.length > 0) {
    // Get first section of next module
    const firstSection = await db
      .select()
      .from(sections)
      .where(eq(sections.moduleId, nextModule[0].moduleId))
      .orderBy(asc(sections.order))
      .limit(1);

    if (firstSection.length > 0) {
      // Get first lesson of first section
      const firstLesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.sectionId, firstSection[0].sectionId))
        .orderBy(asc(lessons.order))
        .limit(1);

      return firstLesson.length > 0 ? firstLesson[0] : null;
    }
  }

  return null; // End of course
}

/**
 * Get previous lesson in sequence
 */
export async function getPreviousLesson(currentLessonId: string): Promise<Lesson | null> {
  const db = await getDb();
  if (!db) return null;

  const currentLesson = await getLessonById(currentLessonId);
  if (!currentLesson) return null;

  // Try to find previous lesson in same section
  if (currentLesson.order > 1) {
    const sameSectionLessons = await db
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.sectionId, currentLesson.sectionId),
          eq(lessons.order, currentLesson.order - 1)
        )
      )
      .limit(1);

    if (sameSectionLessons.length > 0) {
      return sameSectionLessons[0];
    }
  }

  // No previous lesson in current section, find previous section
  const currentSection = await db
    .select()
    .from(sections)
    .where(eq(sections.sectionId, currentLesson.sectionId))
    .limit(1);

  if (currentSection.length === 0) return null;

  if (currentSection[0].order > 1) {
    const prevSection = await db
      .select()
      .from(sections)
      .where(
        and(
          eq(sections.moduleId, currentSection[0].moduleId),
          eq(sections.order, currentSection[0].order - 1)
        )
      )
      .limit(1);

    if (prevSection.length > 0) {
      // Get last lesson of previous section
      const lastLesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.sectionId, prevSection[0].sectionId))
        .orderBy(asc(lessons.order))
        .limit(1000); // Get all and take last

      return lastLesson.length > 0 ? lastLesson[lastLesson.length - 1] : null;
    }
  }

  // No previous section in current module, find previous module
  const currentModule = await db
    .select()
    .from(modules)
    .where(eq(modules.moduleId, currentSection[0].moduleId))
    .limit(1);

  if (currentModule.length === 0 || currentModule[0].order <= 1) return null;

  const prevModule = await db
    .select()
    .from(modules)
    .where(
      and(
        eq(modules.courseId, currentModule[0].courseId),
        eq(modules.order, currentModule[0].order - 1)
      )
    )
    .limit(1);

  if (prevModule.length > 0) {
    // Get last section of previous module
    const lastSection = await db
      .select()
      .from(sections)
      .where(eq(sections.moduleId, prevModule[0].moduleId))
      .orderBy(asc(sections.order))
      .limit(1000); // Get all and take last

    if (lastSection.length > 0) {
      const section = lastSection[lastSection.length - 1];
      // Get last lesson of last section
      const lastLesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.sectionId, section.sectionId))
        .orderBy(asc(lessons.order))
        .limit(1000); // Get all and take last

      return lastLesson.length > 0 ? lastLesson[lastLesson.length - 1] : null;
    }
  }

  return null; // Beginning of course
}
