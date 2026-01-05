/**
 * Google OAuth 2.0 Implementation
 * Pure Google OAuth without Manus infrastructure dependencies
 */

import { ENV } from './_core/env.js';

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  // Validate environment variables
  if (!ENV.googleClientId) {
    console.error('[Google OAuth] ❌ GOOGLE_CLIENT_ID is not set');
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
  }

  if (!ENV.googleRedirectUri) {
    console.error('[Google OAuth] ❌ GOOGLE_REDIRECT_URI is not set');
    throw new Error('GOOGLE_REDIRECT_URI environment variable is required');
  }

  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] Generating auth URL...');
    console.log('[Google OAuth] Client ID:', ENV.googleClientId.substring(0, 20) + '...');
    console.log('[Google OAuth] Redirect URI:', ENV.googleRedirectUri);
  }

  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: ENV.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) {
    params.append('state', state);
    if (ENV.enableOAuthLogs) {
      console.log('[Google OAuth] State parameter included');
    }
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] ✅ Auth URL generated successfully');
  }
  return authUrl;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}> {
  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] 🔄 Exchanging authorization code for token...');
    console.log('[Google OAuth] Redirect URI:', ENV.googleRedirectUri);
    console.log('[Google OAuth] Client ID:', ENV.googleClientId ? ENV.googleClientId.substring(0, 20) + '...' : 'NOT SET');
    console.log('[Google OAuth] Client Secret:', ENV.googleClientSecret ? 'SET' : '❌ NOT SET');
    console.log('[Google OAuth] Authorization code length:', code.length);
  }
  
  if (!ENV.googleClientSecret) {
    console.error('[Google OAuth] ❌ GOOGLE_CLIENT_SECRET is not set');
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: ENV.googleRedirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Google OAuth] ❌ Token exchange failed');
    console.error('[Google OAuth] Status:', response.status, response.statusText);
    console.error('[Google OAuth] Error response:', errorText);
    throw new Error(`Failed to exchange code for token (${response.status}): ${errorText}`);
  }

  const tokenData = await response.json();
  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] ✅ Token exchange successful');
    console.log('[Google OAuth] Token type:', tokenData.token_type);
    console.log('[Google OAuth] Expires in:', tokenData.expires_in, 'seconds');
    console.log('[Google OAuth] Refresh token:', tokenData.refresh_token ? 'provided' : 'not provided');
  }
  return tokenData;
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] 🔄 Fetching user info from Google...');
    console.log('[Google OAuth] Access token length:', accessToken.length);
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Google OAuth] ❌ Failed to get user info');
    console.error('[Google OAuth] Status:', response.status, response.statusText);
    console.error('[Google OAuth] Error response:', errorText);
    throw new Error(`Failed to get user info (${response.status}): ${errorText}`);
  }

  const userInfo = await response.json();
  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] ✅ User info retrieved successfully');
    console.log('[Google OAuth] User email:', userInfo.email);
    console.log('[Google OAuth] User ID:', userInfo.id);
    console.log('[Google OAuth] User name:', userInfo.name);
  }
  return userInfo;
}

/**
 * Complete OAuth flow: exchange code and get user info
 */
export async function completeGoogleOAuth(code: string): Promise<GoogleUserInfo> {
  if (ENV.enableOAuthLogs) {
    console.log('[Google OAuth] 🚀 Starting OAuth flow completion...');
  }
  try {
    const tokenData = await exchangeCodeForToken(code);
    const userInfo = await getGoogleUserInfo(tokenData.access_token);
    if (ENV.enableOAuthLogs) {
      console.log('[Google OAuth] ✅ OAuth flow completed successfully');
    }
    return userInfo;
  } catch (error) {
    console.error('[Google OAuth] ❌ OAuth flow failed:', error);
    throw error;
  }
}
