import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
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
  getCourseProgressStats,
  resetCourseProgress,
  getLastWatchedLesson,
  getAllUsers,
  updateUserAuthorization,
  createUserInvite,
  getUserInviteByEmail,
  hasValidInvite
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
    reset: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }
        await resetCourseProgress(ctx.user.id, input.courseId);
        return { success: true };
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
    getLastWatched: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          return null;
        }
        return await getLastWatchedLesson(ctx.user.id, input.courseId);
      }),
  }),
  admin: router({
    // Get all users
    getAllUsers: adminProcedure.query(async () => {
      return await getAllUsers();
    }),
    
    // Update user authorization (authorize/block)
    updateUserAuthorization: adminProcedure
      .input(z.object({
        userId: z.number(),
        authorized: z.boolean().optional(),
        blocked: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateUserAuthorization(input.userId, {
          authorized: input.authorized,
          blocked: input.blocked,
        });
        return { success: true };
      }),
    
    // Send invite (create invite and authorize user)
    sendInvite: adminProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }
        
        // Check if user already exists
        const existingInvite = await getUserInviteByEmail(input.email);
        if (existingInvite && !existingInvite.used) {
          throw new Error("An active invite already exists for this email");
        }
        
        // Generate a unique token for the invite
        const token = globalThis.crypto.randomUUID();
        
        // Create invite
        await createUserInvite({
          email: input.email,
          invitedBy: ctx.user.id,
          token: token,
          used: false,
        });
        
        // TODO: Send email with invite link
        // For now, we'll just log it
        console.log(`[Admin] Invite created for ${input.email} with token: ${token}`);
        console.log(`[Admin] Invite URL would be: ${ENV.frontendUrl || 'https://your-domain.com'}/auth/invite/${token}`);
        
        return {
          success: true,
          token: token, // Return token for testing (remove in production)
          message: "Invite created successfully. Email will be sent shortly.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
