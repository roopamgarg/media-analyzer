const fastify = require('fastify');
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { config } from './config';
import { logger } from './lib/logger';
import { authPlugin } from './plugins/auth';
import { idempotencyPlugin } from './plugins/idempotency';
import { metricsPlugin } from './plugins/metrics';
import { analyzeRoutes } from './routes/analyze';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { nanoid } from 'nanoid';

const server = fastify({
  logger: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId: () => nanoid(),
});

async function build() {
  // Register plugins
  await server.register(cors, {
    origin: config.CORS_ORIGINS,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    // Using 'any' for rate limiter keyGenerator due to Fastify's complex request typing
    keyGenerator: (request: any) => {
      return request.headers['x-api-key'] as string || request.ip;
    },
  });

  await server.register(jwt, {
    secret: config.JWT_SECRET,
  });

  await server.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  await server.register(authPlugin);
  await server.register(idempotencyPlugin);
  await server.register(metricsPlugin);

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' });
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(analyzeRoutes, { prefix: '/v1' });

  return server;
}

async function start() {
  try {
    const server = await build();
    
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    logger.info(`Server listening on ${config.HOST}:${config.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { build };
