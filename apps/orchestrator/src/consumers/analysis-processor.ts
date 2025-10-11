// Re-export the analysis processing functions from the API
// In a real implementation, you might want to duplicate this logic
// or create a shared package for the analysis pipeline

export { prepareContext, runSyncAnalysis } from '@media-analyzer/api/src/services/analyze-sync';
