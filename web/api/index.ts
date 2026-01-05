/**
 * Vercel Serverless Function Entry Point
 * 
 * This file is compiled by Vercel's build system and deployed as a serverless function.
 * It imports the Express app directly from the source code, which Vercel will bundle.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { createApp } from '../server/_core/index.js';

// Cache the app instance to avoid re-creating it on every request
let appPromise: ReturnType<typeof createApp> | null = null;
let handlerPromise: ReturnType<typeof serverless> | null = null;

async function getHandler() {
  if (!appPromise) {
    console.log("[Vercel Function] Initializing Express app...");
    try {
      appPromise = createApp();
      console.log("[Vercel Function] Express app initialized successfully");
    } catch (error) {
      console.error("[Vercel Function] Failed to initialize Express app:", error);
      console.error("[Vercel Function] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  if (!handlerPromise) {
    const app = await appPromise;
    handlerPromise = serverless(app);
  }
  
  return handlerPromise;
}

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`[Vercel Function] ${req.method} ${req.url}`);
    const serverlessHandler = await getHandler();
    return serverlessHandler(req, res);
  } catch (error) {
    console.error("[Vercel Function] Handler Error:", error);
    console.error("[Vercel Function] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "production" ? undefined : (error instanceof Error ? error.stack : undefined)
      });
    }
  }
}
