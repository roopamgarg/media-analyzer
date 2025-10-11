import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.REDIS_URL);

// Using 'any' for Fastify plugin types due to complex generic constraints
// Fastify's plugin system has intricate type relationships that are difficult to type properly
export const idempotencyPlugin = fp(async (fastify: any) => {
  fastify.addHook('preHandler', async (request: any, reply: any) => {
    // Only apply to POST requests
    if (request.method !== 'POST') {
      return;
    }

    const idempotencyKey = request.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return;
    }

    const projectId = request.user?.projectId;
    if (!projectId) {
      return;
    }

    const cacheKey = `idem:${projectId}:${idempotencyKey}`;
    
    try {
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const { analysisId, responseJson } = JSON.parse(cached);
        
        // Set the same analysis ID for consistency
        request.headers['x-analysis-id'] = analysisId;
        
        return reply
          .code(200)
          .header('x-analysis-id', analysisId)
          .send(JSON.parse(responseJson));
      }
    } catch (err) {
      fastify.log.warn({ err }, 'Failed to check idempotency cache');
    }

    // Store the request for potential caching
    request.idempotencyKey = idempotencyKey;
    request.idempotencyCacheKey = cacheKey;
  });

  fastify.addHook('onSend', async (request: any, reply: any, payload: any) => {
    if (!request.idempotencyKey || !request.idempotencyCacheKey) {
      return payload;
    }

    // Only cache successful responses
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      const analysisId = reply.getHeader('x-analysis-id') as string;
      
      if (analysisId) {
        try {
          const cacheData = {
            analysisId,
            responseJson: JSON.stringify(JSON.parse(payload as string)),
          };
          
          // Cache for 24 hours
          await redis.setex(
            request.idempotencyCacheKey,
            24 * 60 * 60,
            JSON.stringify(cacheData)
          );
        } catch (err) {
          fastify.log.warn({ err }, 'Failed to cache idempotency response');
        }
      }
    }

    return payload;
  });
});

declare module 'fastify' {
  interface FastifyRequest {
    idempotencyKey?: string;
    idempotencyCacheKey?: string;
  }
}
