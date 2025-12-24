/**
 * Email Service
 * Handles sending emails for invitations and notifications
 * Supports SMTP and Gmail API providers
 */

import { ENV } from "../_core/env";
import { readFileSync } from "fs";
import { join } from "path";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const EMAIL_TEMPLATE_PATH = join(process.cwd(), "server", "templates", "invite-email.html");

interface InviteEmailData {
  userName: string;
  loginUrl: string;
}

/**
 * Load and render email template with data
 */
export function renderInviteEmailTemplate(data: InviteEmailData): string {
  try {
    const template = readFileSync(EMAIL_TEMPLATE_PATH, "utf-8");
    
    // Replace placeholders
    return template
      .replace(/{{USER_NAME}}/g, data.userName)
      .replace(/{{LOGIN_URL}}/g, data.loginUrl);
  } catch (error) {
    console.error("[Email] Failed to load email template:", error);
    // Fallback to simple text template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Convite - Prospera Academy</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">Olá, ${data.userName}!</h1>
          <p>Você foi convidado para acessar a plataforma <strong>Prospera Academy</strong>.</p>
          <p>Para começar, acesse o link abaixo:</p>
          <p><a href="${data.loginUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Acessar Plataforma</a></p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p><a href="${data.loginUrl}">${data.loginUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">Este é um email automático, por favor não responda.</p>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Create SMTP transporter
 */
function createSmtpTransporter() {
  const missing: string[] = [];
  
  if (!ENV.emailSmtpHost) missing.push("EMAIL_SMTP_HOST");
  if (!ENV.emailSmtpUser) missing.push("EMAIL_SMTP_USER");
  if (!ENV.emailSmtpPassword) missing.push("EMAIL_SMTP_PASSWORD");
  
  if (missing.length > 0) {
    console.warn(`[Email] SMTP configuration incomplete. Missing: ${missing.join(", ")}`);
    return null;
  }

  return nodemailer.createTransport({
    host: ENV.emailSmtpHost,
    port: ENV.emailSmtpPort,
    secure: ENV.emailSmtpSecure, // true for 465, false for other ports
    auth: {
      user: ENV.emailSmtpUser,
      pass: ENV.emailSmtpPassword,
    },
  });
}

/**
 * Create Gmail API transporter using OAuth2
 */
async function createGmailApiTransporter() {
  const missing: string[] = [];
  
  if (!ENV.emailGmailUser) missing.push("EMAIL_GMAIL_USER");
  if (!ENV.emailGmailClientId) missing.push("EMAIL_GMAIL_CLIENT_ID (or GOOGLE_CLIENT_ID)");
  if (!ENV.emailGmailClientSecret) missing.push("EMAIL_GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)");
  if (!ENV.emailGmailRefreshToken) missing.push("EMAIL_GMAIL_REFRESH_TOKEN");
  
  if (missing.length > 0) {
    console.warn(`[Email] Gmail API configuration incomplete. Missing: ${missing.join(", ")}`);
    return null;
  }

  // Check if we're using fallback values
  const usingEmailGmailClientId = !!process.env.EMAIL_GMAIL_CLIENT_ID;
  const usingEmailGmailClientSecret = !!process.env.EMAIL_GMAIL_CLIENT_SECRET;
  const usingFallback = !usingEmailGmailClientId || !usingEmailGmailClientSecret;
  
  if (usingFallback) {
    console.warn(`[Email] ⚠️  WARNING: Using GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET as fallback!`);
    console.warn(`[Email] If your refresh token was generated with different credentials, this will fail.`);
    console.warn(`[Email] Make sure to set EMAIL_GMAIL_CLIENT_ID and EMAIL_GMAIL_CLIENT_SECRET explicitly.`);
  }

  console.log(`[Email] Client ID source: ${usingEmailGmailClientId ? 'EMAIL_GMAIL_CLIENT_ID' : 'GOOGLE_CLIENT_ID (fallback)'}`);
  console.log(`[Email] Client Secret source: ${usingEmailGmailClientSecret ? 'EMAIL_GMAIL_CLIENT_SECRET' : 'GOOGLE_CLIENT_SECRET (fallback)'}`);
  console.log(`[Email] Using Client ID: ${ENV.emailGmailClientId?.substring(0, 40)}...`);
  console.log(`[Email] Refresh token (first 40 chars): ${ENV.emailGmailRefreshToken?.substring(0, 40)}...`);

  const oauth2Client = new google.auth.OAuth2(
    ENV.emailGmailClientId,
    ENV.emailGmailClientSecret,
    'https://developers.google.com/oauthplayground' // Redirect URI (not used for refresh token)
  );

  oauth2Client.setCredentials({
    refresh_token: ENV.emailGmailRefreshToken,
  });

  try {
    // Verify we can get an access token
    const accessTokenResponse = await oauth2Client.getAccessToken();
    
    if (!accessTokenResponse.token) {
      throw new Error("Failed to get access token");
    }

    console.log(`[Email] Successfully obtained access token`);

    // Use Gmail API directly instead of SMTP
    // This is more reliable for OAuth2 authentication
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    return {
      type: 'gmail_api',
      gmailApiClient: gmail,
      emailUser: ENV.emailGmailUser,
    } as any;
  } catch (error: any) {
    console.error("[Email] Failed to create Gmail API transporter:", error);
    
    // Provide more helpful error messages
    if (error.code === 401 || error.message?.includes('unauthorized_client')) {
      const errorMsg = [
        "❌ Gmail API authentication failed: unauthorized_client",
        "",
        "This usually means:",
        "1. The refresh token was generated with different Client ID/Secret",
        "2. The Client ID or Client Secret is incorrect",
        "3. The refresh token has been revoked",
        "",
        "To fix:",
        "1. Make sure EMAIL_GMAIL_CLIENT_ID and EMAIL_GMAIL_CLIENT_SECRET match EXACTLY the credentials",
        "   used to generate the refresh token in OAuth Playground",
        "2. If you see 'fallback' in the logs above, you're using GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET",
        "   - Either set EMAIL_GMAIL_CLIENT_ID and EMAIL_GMAIL_CLIENT_SECRET explicitly in .env",
        "   - Or regenerate the refresh token using GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET",
        "3. Compare the Client ID shown above with the one you used in OAuth Playground",
        "   They MUST be identical (check for extra spaces, typos, etc.)",
        "4. Generate a new refresh token if the Client IDs don't match",
        "   (see docs/GMAIL_API_SETUP.md for instructions)",
        "",
        `Current Client ID (full): ${ENV.emailGmailClientId}`,
        `Refresh token (first 50 chars): ${ENV.emailGmailRefreshToken?.substring(0, 50)}...`,
        "",
        "Expected Client ID from your OAuth Playground: 986240292278-b8c7fujbu2ah3kqs8e2ji4mbou2nu1bn.apps.googleusercontent.com",
        "If they don't match, that's the problem!",
      ].join("\n");
      console.error(`[Email] ${errorMsg}`);
      throw new Error("Gmail API authentication failed. Check the logs above for details.");
    }
    
    throw new Error(`Failed to authenticate with Gmail API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create email transporter based on provider configuration
 */
async function createTransporter() {
  const provider = ENV.emailProvider.toLowerCase();
  
  // Debug: Show what provider was loaded from env
  console.log(`[Email] EMAIL_PROVIDER from env: "${process.env.EMAIL_PROVIDER || 'not set'}"`);
  console.log(`[Email] Creating transporter for provider: ${provider}`);

  if (provider === "gmail_api") {
    const transporter = await createGmailApiTransporter();
    if (!transporter) {
      console.error("[Email] Failed to create Gmail API transporter. Check the warnings above for missing configuration.");
    }
    return transporter;
  } else if (provider === "smtp") {
    const transporter = createSmtpTransporter();
    if (!transporter) {
      console.error("[Email] Failed to create SMTP transporter. Check the warnings above for missing configuration.");
    }
    return transporter;
  } else {
    console.warn(`[Email] Unknown email provider: ${provider}. Falling back to SMTP or log mode.`);
    const smtpTransporter = createSmtpTransporter();
    if (smtpTransporter) {
      return smtpTransporter;
    }
    return null;
  }
}

/**
 * Send invitation email
 * Works with both SMTP and Gmail API providers
 */
export async function sendInviteEmail(
  to: string,
  data: InviteEmailData
): Promise<void> {
  const htmlContent = renderInviteEmailTemplate(data);
  const subject = "Convite para Prospera Academy";
  const fromEmail = ENV.emailFrom;

  const transporter = await createTransporter();

  if (!transporter) {
    // No email service configured - just log (useful for development)
    console.log("[Email] =========================================");
    console.log("[Email] ⚠️  Email would be sent but no transporter is configured");
    console.log("[Email] Provider configured:", ENV.emailProvider);
    
    if (ENV.emailProvider?.toLowerCase() === "smtp") {
      console.log("[Email] Required variables for SMTP:");
      console.log("[Email]   - EMAIL_SMTP_HOST:", ENV.emailSmtpHost || "❌ NOT SET");
      console.log("[Email]   - EMAIL_SMTP_USER:", ENV.emailSmtpUser || "❌ NOT SET");
      console.log("[Email]   - EMAIL_SMTP_PASSWORD:", ENV.emailSmtpPassword ? "✅ SET" : "❌ NOT SET");
      console.log("[Email] See README.md for SMTP configuration instructions");
    } else if (ENV.emailProvider?.toLowerCase() === "gmail_api") {
      console.log("[Email] Required variables for Gmail API:");
      console.log("[Email]   - EMAIL_GMAIL_USER:", ENV.emailGmailUser || "❌ NOT SET");
      console.log("[Email]   - EMAIL_GMAIL_CLIENT_ID:", ENV.emailGmailClientId ? "✅ SET" : "❌ NOT SET (trying GOOGLE_CLIENT_ID)");
      console.log("[Email]   - EMAIL_GMAIL_CLIENT_SECRET:", ENV.emailGmailClientSecret ? "✅ SET" : "❌ NOT SET (trying GOOGLE_CLIENT_SECRET)");
      console.log("[Email]   - EMAIL_GMAIL_REFRESH_TOKEN:", ENV.emailGmailRefreshToken ? "✅ SET" : "❌ NOT SET");
      console.log("[Email] See docs/GMAIL_API_SETUP.md for step-by-step instructions to generate refresh token");
    }
    console.log("[Email] To:", to);
    console.log("[Email] From:", fromEmail);
    console.log("[Email] Subject:", subject);
    console.log("[Email] HTML Content:", htmlContent.substring(0, 300) + "...");
    console.log("[Email] =========================================");
    return;
  }

  try {
    // Check if we're using Gmail API directly
    if (transporter && typeof transporter === 'object' && 'type' in transporter && transporter.type === 'gmail_api') {
      // Send via Gmail API
      const gmailApiClient = (transporter as any).gmailApiClient;
      const emailUser = (transporter as any).emailUser;

      // Create email message in RFC 2822 format
      const message = [
        `From: ${fromEmail}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlContent,
      ].join('\n');

      // Encode message in base64url format (Gmail API requirement)
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      const response = await gmailApiClient.users.messages.send({
        userId: emailUser || 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`[Email] Email sent successfully via Gmail API. Message ID: ${response.data.id}`);
    } else {
      // Send via SMTP (Nodemailer)
      const mailOptions = {
        from: fromEmail,
        to: to,
        subject: subject,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email] Email sent successfully via ${ENV.emailProvider}:`, info.messageId);
    }
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}
