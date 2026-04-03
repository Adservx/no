/**
 * Environment configuration with validation
 */

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
  };
}

/**
 * Validate required environment variables
 */
const validateEnv = (): void => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Get environment configuration
 */
export const getEnvConfig = (): EnvConfig => {
  // Validate in development
  if (import.meta.env.DEV) {
    validateEnv();
  }

  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    r2: {
      accountId: import.meta.env.VITE_R2_ACCOUNT_ID || '',
      accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
      bucketName: import.meta.env.VITE_R2_BUCKET_NAME || '',
      publicUrl: import.meta.env.VITE_R2_PUBLIC_URL || '',
    },
    app: {
      name: 'Manikant Engineering Hub',
      version: '1.0.0',
      environment: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
    },
  };
};

/**
 * Check if R2 is configured
 */
export const isR2Configured = (): boolean => {
  const config = getEnvConfig();
  return !!(
    config.r2.accountId &&
    config.r2.accessKeyId &&
    config.r2.secretAccessKey &&
    config.r2.bucketName
  );
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return getEnvConfig().app.environment === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return getEnvConfig().app.environment === 'development';
};
