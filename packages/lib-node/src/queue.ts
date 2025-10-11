import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { CreateAnalysisRequest } from '@media-analyzer/contracts';

export interface AnalysisJobData {
  analysisId: string;
  input: CreateAnalysisRequest['input'];
  brandKit: CreateAnalysisRequest['brandKit'];
  category: CreateAnalysisRequest['category'];
  options: CreateAnalysisRequest['options'];
  projectId: string;
}

export const analysisQueue = new Queue<AnalysisJobData>('analyze', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export async function enqueueAnalysis(data: AnalysisJobData): Promise<Job<AnalysisJobData>> {
  return analysisQueue.add('analyze.async', data, {
    jobId: data.analysisId,
    delay: 0,
  });
}

export function createAnalysisWorker(
  processor: (job: Job<AnalysisJobData>) => Promise<unknown>
): Worker<AnalysisJobData> {
  return new Worker<AnalysisJobData>('analyze', processor, {
    connection: redis,
    concurrency: 5,
  });
}
