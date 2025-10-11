declare module 'fastify' {
  interface FastifyRequest {
    user: {
      projectId: string;
      userId: string;
    };
  }
}
