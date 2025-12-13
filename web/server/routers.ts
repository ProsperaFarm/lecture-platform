import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { 
  getAllCourses, 
  getCourseById, 
  getCourseMetadata,
  getLessonsByCourse,
  getLessonsWithDetails, 
  getLessonById, 
  getNextLesson,
  getPreviousLesson,
  upsertUser, 
  getUserByOpenId,
  getUserProgressByCourse,
  getAllUserProgress,
  getUserProgressByLesson,
  upsertUserProgress,
  toggleLessonCompletion,
  getCourseProgressStats
} from "./db";
import { z } from "zod";
import { completeGoogleOAuth, getGoogleAuthUrl } from "./google-oauth";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    getGoogleAuthUrl: publicProcedure.query(() => {
      return { url: getGoogleAuthUrl() };
    }),
    googleCallback: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Exchange code for user info
        const googleUser = await completeGoogleOAuth(input.code);
        
        // Upsert user in database
        await upsertUser({
          openId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          loginMethod: 'google',
          lastSignedIn: new Date(),
        });
        
        // Get user from database
        const dbUser = await getUserByOpenId(googleUser.id);
        
        if (!dbUser) {
          throw new Error('Failed to create user');
        }
        
        // Create JWT token using jose
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({
          openId: dbUser.openId,
          appId: ENV.appId,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .sign(secret);
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        console.log('[Google OAuth] Setting cookie:', COOKIE_NAME);
        console.log('[Google OAuth] Cookie options:', cookieOptions);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        console.log('[Google OAuth] Cookie set successfully');
        
        return {
          success: true,
          user: {
            openId: dbUser.openId,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
        };
      }),
  }),

  // Courses router
  courses: router({
    list: publicProcedure.query(async () => {
      return await getAllCourses();
    }),
    getById: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input }) => {
        return await getCourseById(input.courseId);
      }),
    getMetadata: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input }) => {
        return await getCourseMetadata(input.courseId);
      }),
    getMetadataForMultiple: publicProcedure
      .input(z.object({ courseIds: z.array(z.string()) }))
      .query(async ({ input }) => {
        const metadataMap: Record<string, Awaited<ReturnType<typeof getCourseMetadata>>> = {};
        await Promise.all(
          input.courseIds.map(async (courseId) => {
            metadataMap[courseId] = await getCourseMetadata(courseId);
          })
        );
        return metadataMap;
      }),
  }),

  // User Progress router
  progress: router({ 
    getAll: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return [];
      }
      return await getAllUserProgress(ctx.user.id);
    }),
    getByCourse: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          return [];
        }
        return await getUserProgressByCourse(ctx.user.id, input.courseId);
      }),
    getByLesson: publicProcedure
      .input(z.object({ lessonId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          return null;
        }
        return await getUserProgressByLesson(ctx.user.id, input.lessonId);
      }),
    upsert: publicProcedure
      .input(z.object({
        lessonId: z.string(),
        courseId: z.string(),
        completed: z.boolean().optional(),
        lastWatchedPosition: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }
        await upsertUserProgress({
          userId: ctx.user.id,
          lessonId: input.lessonId,
          courseId: input.courseId,
          completed: input.completed,
          lastWatchedPosition: input.lastWatchedPosition,
        });
        return { success: true };
      }),
    toggleCompletion: publicProcedure
      .input(z.object({
        lessonId: z.string(),
        courseId: z.string(),
        completed: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }
        await toggleLessonCompletion(ctx.user.id, input.lessonId, input.courseId, input.completed);
        return { success: true };
      }),
    getStats: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          return {
            totalLessons: 0,
            completedLessons: 0,
            progressPercentage: 0,
            watchedDuration: 0,
            totalDuration: 0,
          };
        }
        return await getCourseProgressStats(ctx.user.id, input.courseId);
      }),
    getStatsForMultiple: publicProcedure
      .input(z.object({ courseIds: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          return {};
        }
        const statsMap: Record<string, Awaited<ReturnType<typeof getCourseProgressStats>>> = {};
        await Promise.all(
          input.courseIds.map(async (courseId) => {
            statsMap[courseId] = await getCourseProgressStats(ctx.user!.id, courseId);
          })
        );
        return statsMap;
      }),
  }),

  // Lessons router
  lessons: router({
    getByCourse: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input }) => {
        return await getLessonsByCourse(input.courseId);
      }),
    getWithDetails: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input }) => {
        return await getLessonsWithDetails(input.courseId);
      }),
    getById: publicProcedure
      .input(z.object({ lessonId: z.string() }))
      .query(async ({ input }) => {
        return await getLessonById(input.lessonId);
      }),
    getNext: publicProcedure
      .input(z.object({ lessonId: z.string() }))
      .query(async ({ input }) => {
        return await getNextLesson(input.lessonId);
      }),
    getPrevious: publicProcedure
      .input(z.object({ lessonId: z.string() }))
      .query(async ({ input }) => {
        return await getPreviousLesson(input.lessonId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
