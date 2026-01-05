import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router, adminProcedure } from "./_core/trpc.js";
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
  updateUserRole,
  createUserInvite,
  getUserInviteByEmail,
  hasValidInvite,
  createUserByEmail,
  getUserByEmail,
  updateUserOpenId
} from "./db.js";
import { z } from "zod";
import { completeGoogleOAuth, getGoogleAuthUrl } from "./google-oauth.js";
import { SignJWT } from "jose";
import { ENV } from "./_core/env.js";

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
      try {
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] getGoogleAuthUrl called');
        }
        // Log environment variables status (always, not just when enableOAuthLogs is true)
        console.log('[tRPC] Environment check:', {
          hasClientId: !!ENV.googleClientId,
          hasClientSecret: !!ENV.googleClientSecret,
          hasRedirectUri: !!ENV.googleRedirectUri,
          redirectUri: ENV.googleRedirectUri,
          isProduction: ENV.isProduction
        });
        const url = getGoogleAuthUrl();
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] getGoogleAuthUrl ✅ Success - URL generated');
        }
        return { url };
      } catch (error) {
        // Always log errors, not just when enableOAuthLogs is true
        console.error('[tRPC] getGoogleAuthUrl ❌ Error:', error);
        console.error('[tRPC] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    }),
    googleCallback: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] googleCallback mutation called');
          console.log('[tRPC] Authorization code received, length:', input.code.length);
        }
        
        // Exchange code for user info
        const googleUser = await completeGoogleOAuth(input.code);
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] Google user retrieved:', googleUser.email);
        }
        
        // Check if user exists by email (could be pre-registered)
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] Checking if user exists by email:', googleUser.email);
        }
        let dbUser = await getUserByEmail(googleUser.email);
        
        if (dbUser) {
          if (ENV.enableOAuthLogs) {
            console.log('[tRPC] ✅ User found in database');
            console.log('[tRPC] User openId:', dbUser.openId);
            console.log('[tRPC] User role:', dbUser.role);
          }
          
          // User exists - update openId if it was a pending user
          if (dbUser.openId.startsWith('pending-')) {
            if (ENV.enableOAuthLogs) {
              console.log('[tRPC] Updating pending user openId to:', googleUser.id);
            }
            await updateUserOpenId(dbUser.id, googleUser.id);
            dbUser = await getUserByOpenId(googleUser.id);
          } else if (dbUser.openId !== googleUser.id) {
            if (ENV.enableOAuthLogs) {
              console.log('[tRPC] ⚠️ User openId mismatch, updating from', dbUser.openId, 'to', googleUser.id);
            }
            await updateUserOpenId(dbUser.id, googleUser.id);
            dbUser = await getUserByOpenId(googleUser.id);
          }
          
          // Update last signed in
          if (ENV.enableOAuthLogs) {
            console.log('[tRPC] Updating last signed in timestamp');
          }
          await upsertUser({
            openId: googleUser.id,
            lastSignedIn: new Date(),
          });
        } else {
          // User doesn't exist - reject access (only pre-registered users can access)
          if (ENV.enableOAuthLogs) {
            console.log('[tRPC] ❌ User not found in database - access denied');
          }
          throw new Error('Acesso não autorizado. Entre em contato com um administrador.');
        }
        
        if (!dbUser) {
          console.error('[tRPC] ❌ dbUser is null after lookup');
          throw new Error('Acesso não autorizado. Entre em contato com um administrador.');
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
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] Setting authentication cookie:', COOKIE_NAME);
          console.log('[tRPC] Cookie domain:', cookieOptions.domain || 'default');
          console.log('[tRPC] Cookie secure:', cookieOptions.secure);
          console.log('[tRPC] Cookie sameSite:', cookieOptions.sameSite);
        }
        
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        if (ENV.enableOAuthLogs) {
          console.log('[tRPC] ✅ Cookie set successfully');
          console.log('[tRPC] ✅ googleCallback mutation completed successfully');
        }
        
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
    
    // Update user role (promote to admin / demote to user)
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    
    // Add user (create user and optionally send invite email)
    addUser: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        sendInvite: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }
        
        // Check if user already exists by email
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Usuário com este email já existe");
        }
        
        // Create user in database
        const newUser = await createUserByEmail(input.email, input.name);
        
        // If sendInvite is true, send invitation email
        if (input.sendInvite) {
          try {
            const { sendInviteEmail } = await import("./services/email");
            const loginUrl = `${ENV.frontendUrl}/login`;
            
            await sendInviteEmail(input.email, {
              userName: input.name,
              loginUrl: loginUrl,
            });
            
            // Also create an invite record for tracking
            const token = globalThis.crypto.randomUUID();
            await createUserInvite({
              email: input.email,
              invitedBy: ctx.user.id,
              token: token,
              used: false,
            });
            
            return {
              success: true,
              message: "Usuário adicionado e convite enviado com sucesso.",
              user: newUser,
              emailError: false,
            };
          } catch (error) {
            console.error("[Admin] Failed to send invite email:", error);
            // User was created, but email failed - still return success
            return {
              success: true,
              message: "Usuário adicionado, mas falha ao enviar email de convite.",
              user: newUser,
              emailError: true,
            };
          }
        }
        
        return {
          success: true,
          message: "Usuário adicionado com sucesso.",
          user: newUser,
          emailError: false,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
