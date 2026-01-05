import "dotenv/config";
import express, { type Express } from "express";
import { createServer, type Server } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { validateOAuthEnv } from "./validateEnv";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Creates and configures the Express app.
 * This function can be used both for local development and Vercel serverless functions.
 */
export async function createApp(server?: Server): Promise<Express> {
  // Validate environment variables on startup
  if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true') {
    validateOAuthEnv();
  }

  const app = express();
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // On Vercel, only serve API routes, static files are handled by Vercel
  if (!process.env.VERCEL) {
    // development mode uses Vite, production mode uses static files
    if (process.env.NODE_ENV === "development") {
      if (!server) {
        throw new Error("Server instance is required for development mode");
      }
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  }

  return app;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Validate environment variables on startup
  if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true') {
    validateOAuthEnv();
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Only start server if not on Vercel
if (!process.env.VERCEL) {
  startServer().catch(console.error);
}
