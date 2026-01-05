import { ENV } from './env';

/**
 * Validate and log OAuth environment variables
 * Called on server startup to help debug configuration issues
 */
export function validateOAuthEnv(): void {
  if (!ENV.enableOAuthLogs) {
    return; // Skip validation logging if disabled
  }

  console.log('\n=== OAuth Environment Validation ===');
  
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check Google OAuth credentials
  if (!ENV.googleClientId) {
    issues.push('GOOGLE_CLIENT_ID is not set');
  } else {
    console.log('✅ GOOGLE_CLIENT_ID:', ENV.googleClientId.substring(0, 20) + '...');
  }

  if (!ENV.googleClientSecret) {
    issues.push('GOOGLE_CLIENT_SECRET is not set');
  } else {
    console.log('✅ GOOGLE_CLIENT_SECRET: SET');
  }

  if (!ENV.googleRedirectUri) {
    issues.push('GOOGLE_REDIRECT_URI is not set');
  } else {
    console.log('✅ GOOGLE_REDIRECT_URI:', ENV.googleRedirectUri);
    
    // Warn if using HTTP in production
    if (ENV.isProduction && ENV.googleRedirectUri.startsWith('http://')) {
      warnings.push('GOOGLE_REDIRECT_URI uses HTTP in production (should use HTTPS)');
    }
  }

  // Check JWT Secret
  if (!ENV.cookieSecret) {
    issues.push('JWT_SECRET is not set');
  } else {
    console.log('✅ JWT_SECRET: SET');
  }

  // Check Database
  if (!ENV.databaseUrl) {
    issues.push('DATABASE_URL is not set');
  } else {
    console.log('✅ DATABASE_URL: SET');
  }

  // Check Frontend URL
  console.log('✅ FRONTEND_URL:', ENV.frontendUrl);
  if (ENV.isProduction && ENV.frontendUrl.startsWith('http://')) {
    warnings.push('FRONTEND_URL uses HTTP in production (should use HTTPS)');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log('  -', warning));
  }

  // Log issues
  if (issues.length > 0) {
    console.log('\n❌ Missing Environment Variables:');
    issues.forEach(issue => console.log('  -', issue));
    console.log('\n⚠️  OAuth will not work until these are configured!');
  } else {
    console.log('\n✅ All required OAuth environment variables are set');
  }

  console.log('=====================================\n');
}

