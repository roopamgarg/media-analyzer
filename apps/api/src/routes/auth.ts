import { z } from 'zod';

// Request schemas for authentication
const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  projectId: z.string().min(1),
  userId: z.string().min(1),
});

// Response schemas
const AuthResponse = z.object({
  token: z.string(),
  user: z.object({
    projectId: z.string(),
    userId: z.string(),
    email: z.string(),
  }),
  expiresIn: z.number(),
});

// Using 'any' for Fastify plugin types due to complex generic constraints
export const authRoutes = async (fastify: any) => {
  // Register new user
  fastify.post('/register', async (request: any, reply: any) => {
    try {
      const parsed = RegisterRequest.parse(request.body);
      
      // In production, you would:
      // 1. Hash the password
      // 2. Store user in database
      // 3. Check if email already exists
      
      // For demo purposes, we'll just generate a token
      const token = fastify.jwt.sign({
        projectId: parsed.projectId,
        userId: parsed.userId,
        email: parsed.email,
      }, {
        expiresIn: '24h'
      });
      
      const response = AuthResponse.parse({
        token,
        user: {
          projectId: parsed.projectId,
          userId: parsed.userId,
          email: parsed.email,
        },
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });
      
      return reply.send(response);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
      });
    }
  });

  // Login existing user
  fastify.post('/login', async (request: any, reply: any) => {
    try {
      const parsed = LoginRequest.parse(request.body);
      
      // In production, you would:
      // 1. Verify email/password against database
      // 2. Check if user exists and is active
      // 3. Hash password comparison
      
      // For demo purposes, we'll accept any email/password
      // and generate a token with default project/user IDs
      const token = fastify.jwt.sign({
        projectId: 'demo-project-123',
        userId: 'demo-user-456',
        email: parsed.email,
      }, {
        expiresIn: '24h'
      });
      
      const response = AuthResponse.parse({
        token,
        user: {
          projectId: 'demo-project-123',
          userId: 'demo-user-456',
          email: parsed.email,
        },
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });
      
      return reply.send(response);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      
      return reply.code(401).send({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }
  });

  // Generate demo token (for testing purposes)
  fastify.post('/demo-token', async (request: any, reply: any) => {
    try {
      // Generate a demo token for testing
      const token = fastify.jwt.sign({
        projectId: 'demo-project-123',
        userId: 'demo-user-456',
        email: 'demo@example.com',
      }, {
        expiresIn: '24h'
      });
      
      const response = AuthResponse.parse({
        token,
        user: {
          projectId: 'demo-project-123',
          userId: 'demo-user-456',
          email: 'demo@example.com',
        },
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });
      
      return reply.send(response);
      
    } catch (error: unknown) {
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate demo token',
      });
    }
  });

  // Verify token
  fastify.get('/verify', async (request: any, reply: any) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return reply.code(401).send({
          code: 'UNAUTHORIZED',
          message: 'Missing authorization token',
        });
      }
      
      const decoded = fastify.jwt.verify(token);
      
      return reply.send({
        valid: true,
        user: {
          projectId: decoded.projectId,
          userId: decoded.userId,
          email: decoded.email,
        },
      });
      
    } catch (error: unknown) {
      return reply.code(401).send({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }
  });
};


