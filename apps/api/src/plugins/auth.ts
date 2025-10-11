import fp from 'fastify-plugin';

// Using 'any' for Fastify plugin types due to complex generic constraints
// Fastify's plugin system has intricate type relationships that are difficult to type properly
export const authPlugin = fp(async (fastify: any) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request: any, reply: any) => {
    // Skip auth for health checks
    if (request.url.startsWith('/health')) {
      return;
    }

    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.code(401).send({
        code: 'UNAUTHORIZED',
        message: 'Missing authorization token',
      });
    }

    try {
      const decoded = fastify.jwt.verify(token) as any;
      request.user = {
        projectId: decoded.projectId,
        userId: decoded.userId,
      };
    } catch (err) {
      return reply.code(401).send({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }
  });
});
