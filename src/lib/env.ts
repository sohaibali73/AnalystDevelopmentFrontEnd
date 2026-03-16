/**
 * Environment variable validation and type-safe access
 */

interface EnvironmentVariables {
  NEXT_PUBLIC_API_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that all required environment variables are present
 * @throws {EnvironmentError} If required variables are missing
 */
function validateEnvironment(): void {
  const missing: string[] = [];

  // Check for required public variables
  if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
    missing.push('NEXT_PUBLIC_API_URL');
  }

  if (missing.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Get environment variable with type safety and validation
 */
export function getEnv<K extends keyof EnvironmentVariables>(
  key: K,
  fallback?: EnvironmentVariables[K]
): EnvironmentVariables[K] {
  const value = process.env[key] as EnvironmentVariables[K] | undefined;

  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new EnvironmentError(`Environment variable ${key} is not defined`);
  }

  return value;
}

/**
 * Get API base URL with fallback for development
 * Trailing slashes are stripped to prevent double-slash URLs (e.g. baseUrl//auth/login)
 */
export function getApiUrl(): string {
  let url: string;

  if (typeof window === 'undefined') {
    // Server-side
    url = getEnv(
      'NEXT_PUBLIC_API_URL',
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : 'https://developer-potomaac.up.railway.app//'
    );
  } else {
    // Client-side
    url = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : 'https://developer-potomaac.up.railway.app/');
  }

  // Strip trailing slash to prevent double-slash URLs
  return url.replace(/\/+$/, '');
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

// Validate environment on module load (only in production)
if (isProduction() && !isServer()) {
  try {
    validateEnvironment();
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('[Environment]', error.message);
    }
  }
}

/**
 * Get the Next.js API proxy prefix for backend calls.
 * Use this instead of direct backend URLs to avoid CORS issues.
 * 
 * The proxy is configured in next.config.js:
 *   /api/backend/:path* → ${NEXT_PUBLIC_API_URL}/:path*
 * 
 * Example: getProxyUrl('/presentations/generate') → '/api/backend/presentations/generate'
 */
export function getProxyUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/api/backend${cleanPath}`;
}

export { EnvironmentError };
