import { CreateAnalysisRequest } from '@media-analyzer/contracts';
import { downloadVideo, writeBase64Video, extractFrames, extractAudio, getVideoDuration } from '@media-analyzer/lib-node';
import { config } from '../config';

export interface MediaExtraction {
  frames: Array<{ t: number; buffer: Buffer; ocrText?: string }>;
  audioPath: string;
  caption?: string;
}

export async function fetchAndExtract(ctx: {
  input: CreateAnalysisRequest['input'];
  options: CreateAnalysisRequest['options'];
}): Promise<MediaExtraction> {
  let videoPath: string;
  
  // Resolve input to file
  if (ctx.input.url) {
    videoPath = await downloadVideo(ctx.input.url);
  } else if (ctx.input.media?.videoBase64) {
    videoPath = await writeBase64Video(ctx.input.media.videoBase64);
  } else {
    throw new Error('No video input provided');
  }
  
  // Check duration for sync eligibility
  const duration = await getVideoDuration(videoPath);
  if (duration > config.ANALYZE_SYNC_MAX_SECONDS) {
    throw new Error(`Video too long for sync processing: ${duration}s > ${config.ANALYZE_SYNC_MAX_SECONDS}s`);
  }
  
  // Extract frames and audio
  const frames = await extractFrames(videoPath, ctx.options.evidence.frames);
  const audioPath = await extractAudio(videoPath);
  const caption = ctx.input.media?.caption;
  
  return {
    frames,
    audioPath,
    caption: caption || undefined,
  };
}
