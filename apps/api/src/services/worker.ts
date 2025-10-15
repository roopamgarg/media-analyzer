import axios from 'axios';
import { config } from '../config';
const FormData = require('form-data');
import { promises as fs } from 'fs';
import { EnhancedEntities, EntityRelationship } from './nlp';

export interface ASRResult {
  language: string;
  segments: Array<{
    tStart: number;
    tEnd: number;
    text: string;
  }>;
  timing: number;
}

export async function callWorkerASR(
  audioPath: string,
  languageHint?: string
): Promise<ASRResult> {
  const startTime = Date.now();
  
  try {
    const formData = new FormData();
    const audioBuffer = await fs.readFile(audioPath);
    
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    
    if (languageHint) {
      formData.append('language', languageHint);
    }
    
    const response = await axios.post(`${config.WORKER_PYTHON_URL}/asr`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000, // 2 minute timeout for longer videos
    });
    
    const timing = Date.now() - startTime;
    
    return {
      ...response.data,
      timing,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`ASR failed: ${errorMessage}`);
  }
}

export async function callWorkerOCR(
  frames: Array<{ buffer: Buffer; t: number }>
): Promise<Array<{ t: number; boxes: Array<{ box: [number, number, number, number]; text: string }> }>> {
  try {
    const formData = new FormData();
    
    frames.forEach((frame, index) => {
      formData.append('files', frame.buffer, {
        filename: `frame_${index}.jpg`,
        contentType: 'image/jpeg',
      });
    });
    
    const response = await axios.post(`${config.WORKER_PYTHON_URL}/ocr`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 1 minute timeout for OCR
    });
    
    return response.data.frames || response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OCR failed: ${errorMessage}`);
  }
}

export interface NERResult {
  entities: EnhancedEntities;
  relationships: EntityRelationship[];
  metadata: {
    language: string;
    total_entities: number;
    confidence_threshold: number;
  };
  timing: number;
}

export async function callWorkerNER(
  text: string,
  languageHint?: string
): Promise<NERResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${config.WORKER_PYTHON_URL}/ner`, {
      text,
      language: languageHint || 'en',
      include_relationships: true,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 1 minute timeout for NER
    });
    
    const timing = Date.now() - startTime;
    
    return {
      entities: response.data.entities as EnhancedEntities,
      relationships: response.data.relationships,
      metadata: response.data.metadata,
      timing,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`NER failed: ${errorMessage}`);
  }
}

export interface SemanticAnalysisResult {
  clusters: Array<{
    id: number;
    keywords: string[];
    centroid_keyword: string;
    size: number;
    avg_similarity: number;
  }>;
  similarity_matrix: number[][];
  grouped_keywords: Record<string, Array<[string, number]>>;
  embeddings_shape: [number, number];
  metadata: {
    num_keywords: number;
    similarity_threshold: number;
    language: string;
  };
  timing: number;
}

export async function callWorkerSemanticAnalysis(
  keywords: string[],
  languageHint?: string
): Promise<SemanticAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${config.WORKER_PYTHON_URL}/semantic-similarity`, {
      keywords,
      language: languageHint || 'en',
      cluster: true,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 1 minute timeout for semantic analysis
    });
    
    const timing = Date.now() - startTime;
    
    return {
      clusters: response.data.clusters,
      similarity_matrix: response.data.similarity_matrix,
      grouped_keywords: response.data.grouped_keywords,
      embeddings_shape: response.data.embeddings_shape,
      metadata: response.data.metadata,
      timing,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Semantic analysis failed: ${errorMessage}`);
  }
}
