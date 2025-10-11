import { CreateAnalysisRequest } from '@media-analyzer/contracts';
import { downloadVideo, writeBase64Video, extractFrames, extractAudio, getVideoDuration } from '@media-analyzer/lib-node';
import { config } from '../config';
import { downloadInstagramReel, isValidInstagramReelUrl } from './instagram';

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
  let caption: string | undefined;
  
  // Resolve input to file
  if (ctx.input.instagramReelUrl) {
    // Handle Instagram Reel
    if (!isValidInstagramReelUrl(ctx.input.instagramReelUrl)) {
      throw new Error('Invalid Instagram Reel URL format');
    }
    
    // Extract cookie options from context
    const cookieOptions = ctx.options.cookieOptions;
    const browserCookies = cookieOptions?.browserCookies;
    const cookiesFile = cookieOptions?.cookiesFile;
    
    const reelData = await downloadInstagramReel(ctx.input.instagramReelUrl, browserCookies, cookiesFile);
    videoPath = reelData.videoPath;
    caption = reelData.caption;
  } else if (ctx.input.url) {
    // Handle regular URL
    videoPath = await downloadVideo(ctx.input.url);
  } else if (ctx.input.media?.videoBase64) {
    // Handle base64 video
    videoPath = await writeBase64Video(ctx.input.media.videoBase64);
  } else if (ctx.input.media?.caption) {
    // Handle text-only input (no video)
    videoPath = '';
    caption = ctx.input.media.caption;
  } else {
    throw new Error('No video input provided');
  }
  
  // Check duration for sync eligibility (only for video input)
  let duration = 0;
  let frames: Array<{ t: number; buffer: Buffer; ocrText?: string }> = [];
  let audioPath = '';
  
  if (videoPath) {
    duration = await getVideoDuration(videoPath);
    if (duration > config.ANALYZE_SYNC_MAX_SECONDS) {
      throw new Error(`Video too long for sync processing: ${duration}s > ${config.ANALYZE_SYNC_MAX_SECONDS}s`);
    }
    
    // Extract frames and audio
    frames = await extractFrames(videoPath, ctx.options.evidence.frames);
    audioPath = await extractAudio(videoPath);
  }
  
  // Use caption from Instagram Reel or from media input
  const finalCaption = caption || ctx.input.media?.caption;
  
  return {
    frames,
    audioPath,
    caption: finalCaption || undefined,
  };
}
