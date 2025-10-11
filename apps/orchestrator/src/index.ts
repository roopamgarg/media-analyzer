import { createAnalysisWorker, AnalysisJobData } from '@media-analyzer/lib-node';
import { logger } from './lib/logger';
import { processAnalysisJob } from './consumers/analyze';
import { emitWebhook } from './services/webhooks';

async function start() {
  try {
    logger.info('Starting orchestrator...');
    
    // Create analysis worker
    const analysisWorker = createAnalysisWorker(async (job) => {
      const { analysisId, projectId } = job.data;
      
      logger.info({
        analysisId,
        projectId,
        jobId: job.id,
      }, 'Processing analysis job');
      
      try {
        // Mark as processing
        await markAnalysisProcessing(analysisId);
        
        // Process the analysis
        const result = await processAnalysisJob(job.data);
        
        // Emit completion webhook
        await emitWebhook('analysis.completed', {
          analysisId,
          projectId,
          result,
        });
        
        logger.info({
          analysisId,
          projectId,
        }, 'Analysis completed successfully');
        
        return result;
        
      } catch (error) {
        logger.error({
          analysisId,
          projectId,
          error: (error as any).message,
        }, 'Analysis failed');
        
        // Mark as failed
        await markAnalysisFailed(analysisId, (error as any).message);
        
        // Emit failure webhook
        await emitWebhook('analysis.failed', {
          analysisId,
          projectId,
          error: (error as any).message,
        });
        
        throw error;
      }
    });
    
    // Handle worker events
    analysisWorker.on('completed', (job) => {
      logger.info({
        jobId: job.id,
        analysisId: job.data.analysisId,
      }, 'Job completed');
    });
    
    analysisWorker.on('failed', (job, err) => {
      logger.error({
        jobId: job?.id,
        analysisId: job?.data?.analysisId,
        error: err.message,
      }, 'Job failed');
    });
    
    logger.info('Orchestrator started successfully');
    
  } catch (error) {
    logger.error({ error: (error as any).message }, 'Failed to start orchestrator');
    process.exit(1);
  }
}

// Import the analysis processing functions
import { markAnalysisProcessing, markAnalysisFailed } from './db/analyses.repo';

if (require.main === module) {
  start();
}
