import serverless from "serverless-http";
import { createApp } from "../server/_core/index";

// Create the Express app for Vercel serverless function
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
      throw error;
    }
  }
  
  if (!handlerPromise) {
    handlerPromise = serverless(await appPromise);
  }
  
  return handlerPromise;
}

// Export the handler for Vercel
// Vercel will automatically route /api/* requests to this function
export default async function handler(req: any, res: any) {
  try {
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

