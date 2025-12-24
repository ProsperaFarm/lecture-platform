export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.VITE_FRONTEND_URL ?? "http://localhost:3000",
  // Email configuration
  emailProvider: (process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase(), // 'smtp' or 'gmail_api'
  emailFrom: process.env.EMAIL_FROM ?? "noreply@prosperaacademy.com",
  // SMTP configuration
  emailSmtpHost: process.env.EMAIL_SMTP_HOST,
  emailSmtpPort: process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT) : 587,
  emailSmtpSecure: process.env.EMAIL_SMTP_SECURE === "true",
  emailSmtpUser: process.env.EMAIL_SMTP_USER,
  emailSmtpPassword: process.env.EMAIL_SMTP_PASSWORD,
  // Gmail API configuration
  emailGmailUser: process.env.EMAIL_GMAIL_USER, // Email account to send from
  emailGmailClientId: process.env.EMAIL_GMAIL_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID, // Reuse OAuth client if same project
  emailGmailClientSecret: process.env.EMAIL_GMAIL_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET, // Reuse OAuth client if same project
  emailGmailRefreshToken: process.env.EMAIL_GMAIL_REFRESH_TOKEN, // OAuth2 refresh token
  // Legacy Manus OAuth (not used, kept for compatibility with sdk.ts)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
};
