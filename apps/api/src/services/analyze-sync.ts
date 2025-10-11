import { CreateAnalysisRequest, AnalysisResult } from '@media-analyzer/contracts';
import type { z } from 'zod';
import { config } from '../config';
import { fetchAndExtract } from './media';
import { callWorkerASR } from './worker';
import { runOCR } from './ocr';
import { buildTimedDoc, ner } from './nlp';
import { buildFlags } from './rules';
import { scoreAll } from './scoring';
import { assembleEvidence } from './evidence';
import { persistAnalysis } from '../db/analyses.repo';
import { BrandKit, Scores } from '../types/services';
import { Flag } from '@media-analyzer/contracts';

export interface AnalysisContext {
  analysisId: string;
  input: CreateAnalysisRequest['input'];
  brandKit: BrandKit;
  category: CreateAnalysisRequest['category'];
  options: CreateAnalysisRequest['options'];
  projectId: string;
  s3Prefix: string;
}

export function canRunSync(
  input: CreateAnalysisRequest['input'],
  options: CreateAnalysisRequest['options']
): boolean {
  // For now, always run sync for demo purposes
  // In production, check file size, duration, etc.
  return true;
}

export async function prepareContext(data: {
  analysisId: string;
  input: CreateAnalysisRequest['input'];
  brandKit: CreateAnalysisRequest['brandKit'];
  category: CreateAnalysisRequest['category'];
  options: CreateAnalysisRequest['options'];
  projectId: string;
}): Promise<AnalysisContext> {
  const s3Prefix = `analyses/${data.analysisId}`;
  
  return {
    ...data,
    s3Prefix,
  };
}

export async function runSyncAnalysis(ctx: AnalysisContext): Promise<AnalysisResult> {
  const t0 = Date.now();
  const timings: Record<string, number> = {};
  
  try {
    // Step 1: Extract media
    const extractStart = Date.now();
    const raw = await fetchAndExtract(ctx);
    timings.extract = Date.now() - extractStart;
    
    // Step 2: Run ASR and OCR in parallel
    const [asr, ocr] = await Promise.all([
      callWorkerASR(raw.audioPath, ctx.input.media?.languageHint),
      runOCR(raw.frames)
    ]);
    
    timings.asr = asr.timing;
    timings.ocr = ocr.timing;
    
    // Step 3: Build document
    const docStart = Date.now();
    const doc = buildTimedDoc({ caption: raw.caption, asr, ocr });
    timings.doc = Date.now() - docStart;
    
    // Step 4: Extract entities
    const nerStart = Date.now();
    const entities = ner(doc.fullText);
    timings.ner = Date.now() - nerStart;
    
    // Step 5: Build flags
    const flagsStart = Date.now();
    const flags = await buildFlags({ doc, entities, brandKit: ctx.brandKit, category: ctx.category });
    timings.flags = Date.now() - flagsStart;
    
    // Step 6: Score
    const scoreStart = Date.now();
    const scores = scoreAll({ flags, doc, brandKit: ctx.brandKit });
    timings.scoring = Date.now() - scoreStart;
    
    // Step 7: Assemble evidence
    const evidenceStart = Date.now();
    const evidence = await assembleEvidence({ flags, frames: raw.frames, doc, s3Prefix: ctx.s3Prefix });
    timings.evidence = Date.now() - evidenceStart;
    
    // Step 8: Create result
    const result = makeResult({
      analysisId: ctx.analysisId,
      scores,
      flags,
      evidence,
      t0,
      timings,
    });
    
    // Step 9: Persist
    await persistAnalysis(ctx, result);
    
    return result;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Analysis failed: ${errorMessage}`);
  }
}

function makeResult({
  analysisId,
  scores,
  flags,
  evidence,
  t0,
  timings,
}: {
  analysisId: string;
  scores: Scores;
  flags: Flag[];
  evidence: {
    frames: Array<{ t: number; imageUrl: string; ocr?: string }>;
    caption?: string | null;
    transcript?: string | null;
  };
  t0: number;
  timings: Record<string, number>;
}): AnalysisResult {
  const totalMs = Date.now() - t0;
  
  return {
    analysisId,
    mode: 'sync',
    status: 'completed',
    scores,
    flags,
    evidence,
    artifacts: {
      pdfUrl: null, // TODO: Generate PDF if requested
    },
    timings: {
      totalMs,
      stages: timings,
    },
    version: config.RULESET_VERSION,
  };
}
