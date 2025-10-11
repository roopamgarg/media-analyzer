export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  
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
} as const;
