import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config';

export interface InstagramReelInfo {
  videoUrl: string;
  caption?: string;
  username: string;
  timestamp: string;
}

/**
 * Extract Instagram Reel ID from URL
 * Supports formats:
 * - https://www.instagram.com/reel/ABC123/
 * - https://www.instagram.com/reels/ABC123/
 * - https://instagram.com/reel/ABC123/
 * - https://www.instagram.com/p/ABC123/ (posts can be reels)
 */
export function extractReelId(url: string): string | null {
  const patterns = [
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reels\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
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
 * Download Instagram Reel video
 * Note: This is a simplified implementation. In production, you'd need:
 * 1. Instagram API access or web scraping
 * 2. Proper authentication
 * 3. Rate limiting and error handling
 * 4. Legal compliance with Instagram's ToS
 */
/** @deprecated Use downloadShortVideo from video-platform service instead. This function will be removed in a future version. */
export async function downloadInstagramReel(reelUrl: string, browserCookies?: string, cookiesFile?: string): Promise<{
  videoPath: string;
  caption?: string;
  metadata: InstagramReelInfo;
}> {
  const reelId = extractReelId(reelUrl);
  if (!reelId) {
    throw new Error('Invalid Instagram Reel URL');
  }

  // For demo purposes, we'll simulate the download
  // In production, you'd use Instagram's API or a service like:
  // - Instagram Basic Display API
  // - Instagram Graph API
  // - Third-party services like RapidAPI Instagram scraper
  
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const videoPath = path.join(tempDir, `instagram_reel_${reelId}.mp4`);
  
  try {
    // Get reel metadata first
    const reelInfo = await fetchReelInfo(reelUrl, browserCookies, cookiesFile);
    
    // Download the actual video file using Python worker and get additional metadata
    const downloadMetadata = await downloadInstagramVideo(reelUrl, videoPath, browserCookies, cookiesFile);
    
    // Use the real caption from the download metadata (more accurate than metadata-only call)
    const realCaption = downloadMetadata.caption || reelInfo.caption;
    
    return {
      videoPath,
      caption: realCaption,
      metadata: {
        ...reelInfo,
        caption: realCaption, // Ensure metadata also has the real caption
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
 * Fetch reel information from Instagram using Python worker
 * This function calls the Python worker to extract metadata without downloading the video
 */
async function fetchReelInfo(reelUrl: string, browserCookies?: string, cookiesFile?: string): Promise<InstagramReelInfo> {
  try {
    // Call the Python worker to get Instagram metadata
    const response = await fetch(`${config.WORKER_PYTHON_URL}/download-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: reelUrl,
        output_path: null, // Don't download video, just extract metadata
        browser_cookies: browserCookies,
        cookies_file: cookiesFile,
      }),
    });

    if (!response.ok) {
      throw new Error(`Instagram metadata extraction failed: ${response.statusText}`);
    }

    const result = await response.json() as { 
      success: boolean; 
      error?: string; 
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
      throw new Error(`Instagram metadata extraction failed: ${result.error}`);
    }

    // Convert upload_date to ISO string if available
    let timestamp = new Date().toISOString();
    if (result.upload_date) {
      try {
        // Instagram upload_date is typically in YYYYMMDD format
        const year = result.upload_date.substring(0, 4);
        const month = result.upload_date.substring(4, 6);
        const day = result.upload_date.substring(6, 8);
        timestamp = new Date(`${year}-${month}-${day}`).toISOString();
      } catch (error) {
        console.warn('Failed to parse upload_date:', result.upload_date);
      }
    }

    return {
      videoUrl: result.webpage_url || reelUrl,
      caption: result.caption,
      username: result.username || 'unknown',
      timestamp,
    };

  } catch (error) {
    console.error('Instagram metadata extraction error:', error);
    // Fallback to basic info if metadata extraction fails
    const reelId = extractReelId(reelUrl);
    return {
      videoUrl: reelUrl,
      caption: `Instagram Reel ${reelId}`,
      username: 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Download Instagram Reel video using Python worker
 */
async function downloadInstagramVideo(reelUrl: string, outputPath: string, browserCookies?: string, cookiesFile?: string): Promise<{
  caption?: string;
  username?: string;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  uploadDate?: string;
  thumbnail?: string;
  webpageUrl?: string;
}> {
  try {
    // Call the Python worker to download the Instagram Reel
    const response = await fetch(`${config.WORKER_PYTHON_URL}/download-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: reelUrl,
        output_path: outputPath,
        browser_cookies: browserCookies,
        cookies_file: cookiesFile,
      }),
    });

    if (!response.ok) {
      throw new Error(`Instagram download failed: ${response.statusText}`);
    }

    const result = await response.json() as { 
      success: boolean; 
      error?: string; 
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
      throw new Error(`Instagram download failed: ${result.error}`);
    }

    // The video should now be available at outputPath
    try {
      await fs.access(outputPath);
    } catch (error) {
      throw new Error(`Downloaded video not found at: ${outputPath}`);
    }

    // Return the actual metadata from the Python worker
    return {
      caption: result.caption,
      username: result.username,
      duration: result.duration,
      viewCount: result.view_count,
      likeCount: result.like_count,
      uploadDate: result.upload_date,
      thumbnail: result.thumbnail,
      webpageUrl: result.webpage_url,
    };

  } catch (error) {
    console.error('Instagram download error:', error);
    throw new Error(`Failed to download Instagram Reel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Instagram Reel URL format
 */
/** @deprecated Use isValidShortVideoUrl from video-platform service instead. This function will be removed in a future version. */
export function isValidInstagramReelUrl(url: string): boolean {
  const instagramPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
    /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
    /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
  ];
  
  return instagramPatterns.some(pattern => pattern.test(url));
}

/**
 * Get Instagram Reel metadata without downloading
 */
export async function getInstagramReelMetadata(reelUrl: string, browserCookies?: string, cookiesFile?: string): Promise<InstagramReelInfo> {
  const reelId = extractReelId(reelUrl);
  if (!reelId) {
    throw new Error('Invalid Instagram Reel URL');
  }
  
  return await fetchReelInfo(reelUrl, browserCookies, cookiesFile);
}


