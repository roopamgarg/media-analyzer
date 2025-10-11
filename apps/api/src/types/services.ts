import { CreateAnalysisRequest, AnalysisResult, Flag } from '@media-analyzer/contracts';
import { TimedDocument, Entities } from '../services/nlp';

export interface BrandKit {
  brandKitId?: string;
  inline?: {
    brandName: string;
    category?: 'Beauty' | 'Health' | 'Finance' | 'Gaming' | 'Other';
    palette: string[];
    doDonts: {
      do: string[];
      dont: string[];
    };
    competitors: string[];
    keywords: {
      tone: string[];
      avoid: string[];
    };
  };
}

export interface ScoringArgs {
  flags: Flag[];
  doc: TimedDocument;
  brandKit: BrandKit;
}

export interface Scores {
  risk: number;
  vibe: number;
  labels: {
    risk: string;
    vibe: string;
  };
  components: Record<string, number>;
}

export interface BuildFlagsArgs {
  doc: TimedDocument;
  entities: Entities;
  brandKit: BrandKit;
  category: string;
}

export interface ASRResult {
  language: string;
  segments: Array<{
    tStart: number;
    tEnd: number;
    text: string;
  }>;
  timing: number;
}

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
