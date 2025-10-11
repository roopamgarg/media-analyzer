import { prisma } from '@media-analyzer/lib-node';
import { AnalysisResult } from '@media-analyzer/contracts';
import { AnalysisContext } from '../services/analyze-sync';

export async function persistAnalysis(
  ctx: AnalysisContext,
  payload: AnalysisResult
): Promise<void> {
  await prisma.analysis.upsert({
    where: { id: ctx.analysisId },
    update: {
      status: 'completed',
      scores: payload.scores as any,
      flags: payload.flags as any,
      evidence: payload.evidence as any,
      artifacts: payload.artifacts as any,
      timings: payload.timings as any,
      ruleset: payload.version,
      completedAt: new Date(),
    },
    create: {
      id: ctx.analysisId,
      projectId: ctx.projectId,
      postId: null,
      brandKitId: ctx.brandKit.brandKitId || null,
      status: 'completed',
      scores: payload.scores as any,
      flags: payload.flags as any,
      evidence: payload.evidence as any,
      artifacts: payload.artifacts as any,
      timings: payload.timings as any,
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
