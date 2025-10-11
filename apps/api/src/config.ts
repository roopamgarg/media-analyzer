import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/media_analyzer',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // S3
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_BUCKET: process.env.S3_BUCKET || 'media-analyzer',
  
  // Worker
  WORKER_PYTHON_URL: process.env.WORKER_PYTHON_URL || 'http://localhost:8000',
  
  // Analysis limits
  ANALYZE_SYNC_MAX_SECONDS: parseInt(process.env.ANALYZE_SYNC_MAX_SECONDS || '10', 10),
  ANALYZE_MAX_FRAMES: parseInt(process.env.ANALYZE_MAX_FRAMES || '5', 10),
  ANALYZE_MAX_FILE_SIZE: parseInt(process.env.ANALYZE_MAX_FILE_SIZE || '52428800', 10), // 50MB
  
  // Rules
  RULESET_VERSION: process.env.RULESET_VERSION || new Date().toISOString().split('T')[0],
  OCR_ENABLED: process.env.OCR_ENABLED === 'true',
  
  // Language support
  LANG_HI: process.env.LANG_HI === 'true',
  LANG_TA: process.env.LANG_TA === 'false',
} as const;
