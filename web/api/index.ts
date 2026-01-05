import type { Request, Response } from "express";
import { createApp } from "../server/_core/index";

// Create the Express app for Vercel serverless function
// Cache the app instance to avoid re-creating it on every request
let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

// Export the handler for Vercel
// Vercel will automatically route /api/* requests to this function
export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();
    // Express apps are callable at runtime (they implement the request handler interface)
    // TypeScript doesn't expose this in the type, so we use a type assertion
    (app as any)(req, res);
  } catch (error) {
    console.error("[Vercel Function] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

