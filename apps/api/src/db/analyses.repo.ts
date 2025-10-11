import { prisma } from '@media-analyzer/lib-node';
import { AnalysisResult } from '@media-analyzer/contracts';
import { AnalysisContext } from '../services/analyze-sync';

export async function persistAnalysis(
  ctx: AnalysisContext,
  payload: AnalysisResult
): Promise<void> {
  // Ensure the project exists
  await prisma.project.upsert({
    where: { id: ctx.projectId },
    update: {},
    create: {
      id: ctx.projectId,
      name: `Project ${ctx.projectId}`,
    },
  });

  await prisma.analysis.upsert({
    where: { id: ctx.analysisId },
    update: {
      status: 'completed',
      scores: JSON.stringify(payload.scores),
      flags: JSON.stringify(payload.flags),
      evidence: JSON.stringify(payload.evidence),
      artifacts: JSON.stringify(payload.artifacts),
      timings: JSON.stringify(payload.timings),
      ruleset: payload.version,
      completedAt: new Date(),
    },
    create: {
      id: ctx.analysisId,
      projectId: ctx.projectId,
      postId: null,
      brandKitId: null, // For inline brand kits, we don't store a reference
      status: 'completed',
      scores: JSON.stringify(payload.scores),
      flags: JSON.stringify(payload.flags),
      evidence: JSON.stringify(payload.evidence),
      artifacts: JSON.stringify(payload.artifacts),
      timings: JSON.stringify(payload.timings),
      ruleset: payload.version,
      completedAt: new Date(),
    },
  });
}

export async function markAnalysisFailed(
  analysisId: string,
  error: string
): Promise<void> {
  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      status: 'failed',
      error,
      updatedAt: new Date(),
    },
  });
}

export async function markAnalysisProcessing(analysisId: string): Promise<void> {
  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      status: 'processing',
      updatedAt: new Date(),
    },
  });
}

export async function getAnalysis(analysisId: string, projectId: string) {
  return prisma.analysis.findFirst({
    where: {
      id: analysisId,
      projectId,
    },
  });
}
