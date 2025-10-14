import { createTestServer, createMockUser } from '../setup';

// Import the test type
type TestFastifyInstance = Awaited<ReturnType<typeof createTestServer>>;

describe('Authentication Routes', () => {
  let server: TestFastifyInstance;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        projectId: 'project-123',
        userId: 'user-456',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('expiresIn');
      expect(body.user).toEqual({
        projectId: userData.projectId,
        userId: userData.userId,
        email: userData.email,
      });
      expect(body.expiresIn).toBe(24 * 60 * 60);
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        projectId: 'project-123',
        userId: 'user-456',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Invalid request data');
    });

    it('should return validation error for short password', async () => {
      const userData = {
        email: 'user@example.com',
        password: '123',
        projectId: 'project-123',
        userId: 'user-456',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for missing fields', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'password123',
        // Missing projectId and userId
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('expiresIn');
      expect(body.user.projectId).toBe('demo-project-123');
      expect(body.user.userId).toBe('demo-user-456');
      expect(body.user.email).toBe(loginData.email);
    });

    it('should return validation error for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for short password', async () => {
      const loginData = {
        email: 'user@example.com',
        password: '123',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/demo-token', () => {
    it('should generate demo token successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('expiresIn');
      expect(body.user).toEqual({
        projectId: 'demo-project-123',
        userId: 'demo-user-456',
        email: 'demo@example.com',
      });
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid token successfully', async () => {
      // First get a token
      const tokenResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(tokenResponse.payload);

      const response = await server.inject({
        method: 'GET',
        url: '/auth/verify',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.valid).toBe(true);
      expect(body.user).toEqual({
        projectId: 'demo-project-123',
        userId: 'demo-user-456',
        email: 'demo@example.com',
      });
    });

    it('should return unauthorized for missing token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/verify',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.message).toBe('Missing authorization token');
    });

    it('should return unauthorized for invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/verify',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.message).toBe('Invalid token');
    });

    it('should return unauthorized for malformed authorization header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/verify',
        headers: {
          authorization: 'InvalidFormat token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.message).toBe('Invalid token');
    });
  });
});
