import { Flag } from '@media-analyzer/contracts';
import { TimedDocument } from './nlp';
import { uploadToS3, getPresignedUrl } from '@media-analyzer/lib-node';
import { resizeFrame } from '@media-analyzer/lib-node';

export interface AssembleEvidenceArgs {
  flags: Flag[];
  frames: Array<{ t: number; buffer: Buffer; ocrText?: string }>;
  doc: TimedDocument;
  s3Prefix: string;
}

export interface Evidence {
  frames: Array<{
    t: number;
    imageUrl: string;
    ocr?: string;
  }>;
  caption: string | null;
  transcript: string | null;
}

export async function assembleEvidence(args: AssembleEvidenceArgs): Promise<Evidence> {
  const { flags, frames, doc, s3Prefix } = args;
  
  // For development, skip S3 uploads and use placeholder URLs
  const evidence: Evidence = {
    frames: frames.map((frame, index) => ({
      t: frame.t,
      imageUrl: `data:image/jpeg;base64,${frame.buffer.toString('base64')}`, // Use base64 data URL for development
      ocr: frame.ocrText,
    })),
    caption: doc.timeline.find(t => t.source === 'caption')?.text || null,
    transcript: doc.fullText || null,
  };
  
  return evidence;
}

async function uploadFrames(
  frames: Array<{ t: number; buffer: Buffer }>,
  s3Prefix: string
): Promise<Array<{ url: string; key: string }>> {
  const uploadPromises = frames.map(async (frame, index) => {
    // Resize frame for optimization
    const resizedBuffer = await resizeFrame(frame.buffer, 720);
    
    const key = `${s3Prefix}/frames/frame_${index}_${frame.t}s.jpg`;
    const result = await uploadToS3(key, resizedBuffer, 'image/jpeg');
    
    return {
      url: getPresignedUrl(result.key, 900), // 15 minutes
      key: result.key,
    };
  });
  
  return Promise.all(uploadPromises);
}
