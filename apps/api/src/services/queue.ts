import { enqueueAnalysis, AnalysisJobData } from '@media-analyzer/lib-node';

export async function enqueueAnalysisJob(data: AnalysisJobData): Promise<void> {
  await enqueueAnalysis(data);
}
