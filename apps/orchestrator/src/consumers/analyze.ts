import { AnalysisJobData } from '@media-analyzer/lib-node';
import { prepareContext, runSyncAnalysis } from '@media-analyzer/api/src/services/analyze-sync';

export async function processAnalysisJob(data: AnalysisJobData) {
  // Cast category to the correct type
  const typedData = {
    ...data,
    category: data.category as 'Beauty' | 'Health' | 'Finance' | 'Gaming' | 'Other'
  };
  
  const ctx = await prepareContext(typedData);
  const result = await runSyncAnalysis(ctx);
  return result;
}
