import fp from 'fastify-plugin';

// Simple in-memory metrics store
// In production, use Prometheus or similar
const metrics = {
  analyze_requests_total: 0,
  analyze_requests_sync: 0,
  analyze_requests_async: 0,
  analyze_errors_total: 0,
  analyze_latency_ms: [] as number[],
  worker_asr_ms: [] as number[],
  worker_ocr_ms: [] as number[],
  queue_depth: 0,
};

// Using 'any' for Fastify plugin types due to complex generic constraints
// Fastify's plugin system has intricate type relationships that are difficult to type properly
export const metricsPlugin = fp(async (fastify: any) => {
  // Add metrics endpoint
  fastify.get('/metrics', async (request: any, reply: any) => {
    const avgLatency = metrics.analyze_latency_ms.length > 0
      ? metrics.analyze_latency_ms.reduce((a, b) => a + b, 0) / metrics.analyze_latency_ms.length
      : 0;

    const avgAsr = metrics.worker_asr_ms.length > 0
      ? metrics.worker_asr_ms.reduce((a, b) => a + b, 0) / metrics.worker_asr_ms.length
      : 0;

    const avgOcr = metrics.worker_ocr_ms.length > 0
      ? metrics.worker_ocr_ms.reduce((a, b) => a + b, 0) / metrics.worker_ocr_ms.length
      : 0;

    return {
      analyze_requests_total: metrics.analyze_requests_total,
      analyze_requests_sync: metrics.analyze_requests_sync,
      analyze_requests_async: metrics.analyze_requests_async,
      analyze_errors_total: metrics.analyze_errors_total,
      analyze_latency_avg_ms: Math.round(avgLatency),
      worker_asr_avg_ms: Math.round(avgAsr),
      worker_ocr_avg_ms: Math.round(avgOcr),
      queue_depth: metrics.queue_depth,
    };
  });

  // Add metrics collection hooks
  fastify.addHook('onRequest', async (request: any) => {
    if (request.url.startsWith('/v1/analyze')) {
      metrics.analyze_requests_total++;
    }
  });

  fastify.addHook('onResponse', async (request: any, reply: any) => {
    if (request.url.startsWith('/v1/analyze')) {
      const duration = reply.getResponseTime();
      metrics.analyze_latency_ms.push(duration);
      
      // Keep only last 100 measurements
      if (metrics.analyze_latency_ms.length > 100) {
        metrics.analyze_latency_ms = metrics.analyze_latency_ms.slice(-100);
      }

      if (reply.statusCode >= 400) {
        metrics.analyze_errors_total++;
      }
    }
  });
});

// Export metrics for use in other parts of the application
export { metrics };
