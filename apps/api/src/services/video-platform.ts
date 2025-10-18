import { downloadInstagramReel, isValidInstagramReelUrl } from './instagram';
import { config } from '../config';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ShortVideoInfo {
  videoUrl: string;
  username: string;
  timestamp: string;
}

export interface ShortVideoDownloadResult {
  videoPath: string;
  caption?: string;
  metadata: ShortVideoInfo;
}

/**
 * Validate if URL is a valid short video URL (Instagram Reel or YouTube Shorts)
 */
export function isValidShortVideoUrl(url: string): boolean {
  const instagramPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
    /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
    /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
  ];
  
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]+$/,
    /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]+$/,
  ];
  
  return instagramPatterns.some(pattern => pattern.test(url)) || 
         youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * Determine if URL is an Instagram Reel
 */
export function isInstagramReel(url: string): boolean {
  return isValidInstagramReelUrl(url);
}

/**
 * Determine if URL is a YouTube Shorts
 */
export function isYouTubeShorts(url: string): boolean {
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]+$/,
    /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]+$/,
  ];
  
  return youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * Extract video ID from YouTube Shorts URL
 */
export function extractYouTubeShortsId(url: string): string | null {
  const patterns = [
    /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/,
    /youtu\.be\/([A-Za-z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Download short video from any supported platform
 */
export async function downloadShortVideo(
  videoUrl: string, 
  browserCookies?: string, 
  cookiesFile?: string
): Promise<ShortVideoDownloadResult> {
  if (!isValidShortVideoUrl(videoUrl)) {
    throw new Error('Invalid short video URL format');
  }

  if (isInstagramReel(videoUrl)) {
    // Use existing Instagram downloader
    const result = await downloadInstagramReel(videoUrl, browserCookies, cookiesFile);
    return {
      videoPath: result.videoPath,
      caption: result.caption,
      metadata: {
        videoUrl: result.metadata.videoUrl,
        username: result.metadata.username,
        timestamp: result.metadata.timestamp,
      },
    };
  } else if (isYouTubeShorts(videoUrl)) {
    // Use Python worker for YouTube Shorts
    return await downloadYouTubeShorts(videoUrl, browserCookies, cookiesFile);
  } else {
    throw new Error('Unsupported video platform');
  }
}

/**
 * Download YouTube Shorts using Python worker
 */
async function downloadYouTubeShorts(
  videoUrl: string, 
  browserCookies?: string, 
  cookiesFile?: string
): Promise<ShortVideoDownloadResult> {
  const videoId = extractYouTubeShortsId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube Shorts URL');
  }

  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const videoPath = path.join(tempDir, `youtube_shorts_${videoId}.mp4`);
  
  try {
    // Call the Python worker to download YouTube Shorts
    const response = await fetch(`${config.WORKER_PYTHON_URL}/download-short-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoUrl,
        output_path: videoPath,
        browser_cookies: browserCookies,
        cookies_file: cookiesFile,
      }),
    });

    if (!response.ok) {
      throw new Error(`YouTube Shorts download failed: ${response.statusText}`);
    }

    const result = await response.json() as { 
      success: boolean; 
      error?: string; 
      video_path?: string;
      caption?: string; 
      username?: string; 
      duration?: number;
      view_count?: number;
      like_count?: number;
      upload_date?: string;
      thumbnail?: string;
      webpage_url?: string;
    };
    
    if (!result.success) {
      throw new Error(`YouTube Shorts download failed: ${result.error}`);
    }

    // Verify the file exists
    try {
      await fs.access(videoPath);
    } catch (error) {
      throw new Error(`Downloaded video not found at: ${videoPath}`);
    }

    // Convert upload_date to ISO string if available
    let timestamp = new Date().toISOString();
    if (result.upload_date) {
      try {
        // YouTube upload_date is typically in YYYYMMDD format
        const year = result.upload_date.substring(0, 4);
        const month = result.upload_date.substring(4, 6);
        const day = result.upload_date.substring(6, 8);
        timestamp = new Date(`${year}-${month}-${day}`).toISOString();
      } catch (error) {
        console.warn('Failed to parse upload_date:', result.upload_date);
      }
    }

    return {
      videoPath,
      caption: result.caption,
      metadata: {
        videoUrl: result.webpage_url || videoUrl,
        username: result.username || 'Unknown',
        timestamp,
      },
    };

  } catch (error) {
    // Clean up on error
    try {
      await fs.unlink(videoPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Get short video metadata without downloading
 */
export async function getShortVideoMetadata(
  videoUrl: string, 
  browserCookies?: string, 
  cookiesFile?: string
): Promise<ShortVideoInfo> {
  if (isInstagramReel(videoUrl)) {
    // Use existing Instagram metadata function
    const metadata = await import('./instagram').then(m => m.getInstagramReelMetadata(videoUrl, browserCookies, cookiesFile));
    return {
      videoUrl: metadata.videoUrl,
      username: metadata.username,
      timestamp: metadata.timestamp,
    };
  } else if (isYouTubeShorts(videoUrl)) {
    // Get YouTube Shorts metadata
    try {
      const response = await fetch(`${config.WORKER_PYTHON_URL}/download-short-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          output_path: null, // Don't download video, just extract metadata
          browser_cookies: browserCookies,
          cookies_file: cookiesFile,
        }),
      });

      if (!response.ok) {
        throw new Error(`YouTube Shorts metadata extraction failed: ${response.statusText}`);
      }

      const result = await response.json() as { 
        success: boolean; 
        error?: string; 
        caption?: string; 
        username?: string; 
        upload_date?: string;
        webpage_url?: string;
      };
      
      if (!result.success) {
        throw new Error(`YouTube Shorts metadata extraction failed: ${result.error}`);
      }

      // Convert upload_date to ISO string if available
      let timestamp = new Date().toISOString();
      if (result.upload_date) {
        try {
          const year = result.upload_date.substring(0, 4);
          const month = result.upload_date.substring(4, 6);
          const day = result.upload_date.substring(6, 8);
          timestamp = new Date(`${year}-${month}-${day}`).toISOString();
        } catch (error) {
          console.warn('Failed to parse upload_date:', result.upload_date);
        }
      }

      return {
        videoUrl: result.webpage_url || videoUrl,
        username: result.username || 'Unknown',
        timestamp,
      };

    } catch (error) {
      console.error('YouTube Shorts metadata extraction error:', error);
      throw new Error(`Failed to get YouTube Shorts metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    throw new Error('Unsupported video platform');
  }
}
