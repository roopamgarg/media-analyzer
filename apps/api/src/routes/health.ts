// Using 'any' for Fastify plugin types due to complex generic constraints
export const healthRoutes = async (fastify: any) => {
  fastify.get('/', async (request: any, reply: any) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  });

  fastify.get('/ready', async (request: any, reply: any) => {
    // Add database and Redis health checks here
    return {
      status: 'ready',
      checks: {
        database: 'ok',
        redis: 'ok',
        worker: 'ok',
      },
    };
  });

  fastify.get('/config', async (request: any, reply: any) => {
    const { config } = await import('../config');
    return {
      ANALYZE_SYNC_MAX_SECONDS: config.ANALYZE_SYNC_MAX_SECONDS,
      WORKER_PYTHON_URL: config.WORKER_PYTHON_URL,
    };
  });
};
