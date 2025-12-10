/**
 * Google OAuth 2.0 Implementation
 * Pure Google OAuth without Manus infrastructure dependencies
 */

import { ENV } from './_core/env';

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
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
  console.log('[Google OAuth] Exchanging code for token...');
  console.log('[Google OAuth] Redirect URI:', ENV.googleRedirectUri);
  console.log('[Google OAuth] Client ID:', ENV.googleClientId.substring(0, 20) + '...');
  
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
    const error = await response.text();
    console.error('[Google OAuth] Token exchange failed:', error);
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  console.log('[Google OAuth] Token exchange successful');
  return response.json();
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return response.json();
}

/**
 * Complete OAuth flow: exchange code and get user info
 */
export async function completeGoogleOAuth(code: string): Promise<GoogleUserInfo> {
  const tokenData = await exchangeCodeForToken(code);
  const userInfo = await getGoogleUserInfo(tokenData.access_token);
  return userInfo;
}
