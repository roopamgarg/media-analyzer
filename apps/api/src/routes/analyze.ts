import { CreateAnalysisRequest, AnalysisResult, AnalysisAccepted } from '@media-analyzer/contracts';
import { generateAnalysisId } from '@media-analyzer/lib-node';
import { canRunSync, prepareContext, runSyncAnalysis } from '../services/analyze-sync';
import { enqueueAnalysisJob } from '../services/queue';

// Using 'any' for Fastify plugin types due to complex generic constraints
// Fastify's plugin system has intricate type relationships that are difficult to type properly
export const analyzeRoutes = async (fastify: any) => {
  fastify.post('/analyze', async (request: any, reply: any) => {
    const startTime = Date.now();
    
    try {
      // Parse and validate request
      const parsed = CreateAnalysisRequest.parse(request.body);
      const { input, brandKit, category, options } = parsed;
      const projectId = request.user.projectId;

      const analysisId = request.headers['x-analysis-id'] as string || generateAnalysisId();
      
      // Determine if we can run synchronously
      const quick = canRunSync(input, options);
      
      if (!quick) {
        // Enqueue for async processing
        await enqueueAnalysisJob({
          analysisId,
          input,
          brandKit,
          category,
          options,
          projectId,
        });

        const response: AnalysisAccepted = {
          analysisId,
          mode: 'async',
          status: 'queued',
          pollAfterMs: 3000,
        };

        return reply.code(202).send(response);
      }

      // Run synchronous analysis
      const ctx = await prepareContext({
        analysisId,
        input,
        brandKit,
        category,
        options,
        projectId,
      });

      const result = await runSyncAnalysis(ctx);
      
      // Set analysis ID header for idempotency
      reply.header('x-analysis-id', analysisId);
      
      const duration = Date.now() - startTime;
      fastify.log.info({
        analysisId,
        projectId,
        mode: 'sync',
        durationMs: duration,
      }, 'Analysis completed');

      return reply.send(result);
      
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      fastify.log.error({
        error: errorMessage,
        durationMs: duration,
        projectId: request.user?.projectId,
      }, 'Analysis failed');

      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: (error as any).errors,
        });
      }

      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Analysis failed',
        details: errorMessage,
      });
    }
  });

  fastify.get('/analyses/:id', async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const projectId = request.user.projectId;

    try {
      const { prisma } = await import('@media-analyzer/lib-node');
      const analysis = await prisma.analysis.findFirst({
        where: {
          id,
          projectId,
        },
      });

      if (!analysis) {
        return reply.code(404).send({
          code: 'NOT_FOUND',
          message: 'Analysis not found',
        });
      }

      return reply.send({
        analysisId: analysis.id,
        status: analysis.status,
        progress: analysis.progress,
        error: analysis.error,
        result: analysis.status === 'completed' ? {
          analysisId: analysis.id,
          mode: 'async',
          status: 'completed',
          scores: analysis.scores,
          flags: analysis.flags,
          evidence: analysis.evidence,
          artifacts: analysis.artifacts,
          timings: analysis.timings,
          version: analysis.ruleset,
        } : undefined,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error({ error: errorMessage, analysisId: id }, 'Failed to fetch analysis');
      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch analysis',
      });
    }
  });
};

