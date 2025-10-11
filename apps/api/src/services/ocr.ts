import { callWorkerOCR } from './worker';
import { config } from '../config';

export interface OCRResult {
  frames: Array<{
    t: number;
    boxes: Array<{
      box: [number, number, number, number];
      text: string;
    }>;
  }>;
  timing: number;
}

export async function runOCR(
  frames: Array<{ t: number; buffer: Buffer }>
): Promise<OCRResult> {
  const startTime = Date.now();
  
  if (!config.OCR_ENABLED) {
    return {
      frames: frames.map(f => ({ t: f.t, boxes: [] })),
      timing: Date.now() - startTime,
    };
  }
  
  try {
    const result = await callWorkerOCR(frames);
    const timing = Date.now() - startTime;
    
    return {
      frames: Array.isArray(result) ? result : (result as any).frames || [],
      timing,
    };
  } catch (error) {
    // Fallback to empty OCR results
    return {
      frames: frames.map(f => ({ t: f.t, boxes: [] })),
      timing: Date.now() - startTime,
    };
  }
}
