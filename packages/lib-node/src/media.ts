import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from './config';

export interface Frame {
  t: number;
  buffer: Buffer;
  ocrText?: string;
}

export interface MediaExtraction {
  frames: Frame[];
  audioPath: string;
  caption?: string;
}

export async function extractFrames(
  videoPath: string,
  timestamps: number[]
): Promise<Frame[]> {
  const frames: Frame[] = [];
  const tempDir = path.join(process.cwd(), 'temp');
  
  await fs.mkdir(tempDir, { recursive: true });

  // Get video duration first to filter out invalid timestamps
  const duration = await getVideoDuration(videoPath);
  const validTimestamps = timestamps.filter(t => t >= 0 && t < duration);
  
  if (validTimestamps.length === 0) {
    console.warn('No valid timestamps found, using first frame');
    validTimestamps.push(0);
  }

  for (const timestamp of validTimestamps) {
    const framePath = path.join(tempDir, `frame_${timestamp}.jpg`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .inputOptions([`-ss`, timestamp.toString()])
        .frames(1)
        .size('720x?')
        .outputOptions(['-q:v', '2', '-update', '1'])
        .output(framePath)
        .on('end', () => resolve())
        .on('error', (err) => {
          console.error(`FFmpeg error for timestamp ${timestamp}:`, err);
          reject(err);
        })
        .run();
    });

    const buffer = await fs.readFile(framePath);
    await fs.unlink(framePath);
    
    frames.push({
      t: timestamp,
      buffer,
    });
  }

  return frames;
}

export async function extractAudio(videoPath: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .output(audioPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });

  return audioPath;
}

export async function downloadVideo(url: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  
  // In a real implementation, you'd use axios or similar to download
  // For now, we'll assume the file is already available
  return videoPath;
}

export async function writeBase64Video(base64: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  const buffer = Buffer.from(base64, 'base64');
  
  await fs.writeFile(videoPath, buffer);
  return videoPath;
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const duration = metadata.format.duration;
      resolve(duration || 0);
    });
  });
}

export async function resizeFrame(buffer: Buffer, maxWidth: number = 720): Promise<Buffer> {
  return sharp(buffer)
    .resize(maxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}
