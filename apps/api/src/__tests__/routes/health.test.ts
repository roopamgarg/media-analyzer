import { createTestServer } from '../setup';

// Import the test type
type TestFastifyInstance = Awaited<ReturnType<typeof createTestServer>>;

describe('Health Routes', () => {
  let server: TestFastifyInstance;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(typeof body.timestamp).toBe('string');
      expect(typeof body.version).toBe('string');
    });

    it('should return valid timestamp format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status with checks', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('status', 'ready');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('database', 'ok');
      expect(body.checks).toHaveProperty('redis', 'ok');
      expect(body.checks).toHaveProperty('worker', 'ok');
    });

    it('should return all required health checks', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      const expectedChecks = ['database', 'redis', 'worker'];
      expectedChecks.forEach(check => {
        expect(body.checks).toHaveProperty(check);
        expect(body.checks[check]).toBe('ok');
      });
    });
  });

  describe('GET /health/config', () => {
    it('should return configuration values', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health/config',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('ANALYZE_SYNC_MAX_SECONDS');
      expect(body).toHaveProperty('WORKER_PYTHON_URL');
      expect(typeof body.ANALYZE_SYNC_MAX_SECONDS).toBe('number');
      expect(typeof body.WORKER_PYTHON_URL).toBe('string');
    });

    it('should return valid configuration types', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health/config',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      
      // ANALYZE_SYNC_MAX_SECONDS should be a positive number
      expect(body.ANALYZE_SYNC_MAX_SECONDS).toBeGreaterThan(0);
      
      // WORKER_PYTHON_URL should be a valid URL
      expect(body.WORKER_PYTHON_URL).toMatch(/^https?:\/\/.+/);
    });
  });
});
