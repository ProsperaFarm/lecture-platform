import type { Request, Response } from "express";
import { createApp } from "../server/_core/index";

// Create the Express app for Vercel serverless function
const appPromise = createApp();

// Export the handler for Vercel
// Vercel will automatically route /api/* requests to this function
export default async function handler(req: Request, res: Response) {
  const app = await appPromise;
  return app(req, res);
}

