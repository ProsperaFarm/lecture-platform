/**
 * Vercel Serverless Function Entry Point
 * 
 * This file is compiled by Vercel's build system and deployed as a serverless function.
 * Optimized for fast cold starts by avoiding serverless-http wrapper.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import { createApp } from '../server/_core/index.js';

// Cache the app instance to avoid re-creating it on every request
let appInstance: Express | null = null;
let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  // If app is already initialized, return it immediately
  if (appInstance) {
    return appInstance;
  }
  
  // If initialization is in progress, wait for it
  if (appPromise) {
    return appPromise;
  }
  
  // Start initialization
  console.log("[Vercel Function] Initializing Express app...");
  appPromise = createApp()
    .then(app => {
      appInstance = app;
      console.log("[Vercel Function] Express app initialized successfully");
      return app;
    })
    .catch(error => {
      console.error("[Vercel Function] Failed to initialize Express app:", error);
      console.error("[Vercel Function] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Reset promise so next request can retry
      appPromise = null;
      throw error;
    });
  
  return appPromise;
}

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`[Vercel Function] ${req.method} ${req.url}`);
    
    const app = await getApp();
    
    // Convert Vercel request/response to Express format
    // Express expects req to have certain properties that VercelRequest might not have
    const expressReq = req as any;
    const expressRes = res as any;
    
    // Ensure required Express properties exist
    if (!expressReq.app) {
      expressReq.app = app;
    }
    
    // Handle the request with Express
    app(expressReq, expressRes);
    
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
