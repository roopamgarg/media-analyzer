import { prisma } from '@media-analyzer/lib-node';

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
