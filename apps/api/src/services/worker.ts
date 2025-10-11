import axios from 'axios';
import { config } from '../config';
const FormData = require('form-data');
import { promises as fs } from 'fs';

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
      timeout: 30000, // 30 second timeout
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
      timeout: 30000,
    });
    
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OCR failed: ${errorMessage}`);
  }
}
