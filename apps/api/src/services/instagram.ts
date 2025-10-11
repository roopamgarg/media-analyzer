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
    // Simulate API call to get reel info
    // In production, replace with actual Instagram API call
    const reelInfo = await fetchReelInfo(reelId);
    
    // Download the actual video file using Python worker
    await downloadInstagramVideo(reelUrl, videoPath, browserCookies, cookiesFile);
    
    return {
      videoPath,
      caption: reelInfo.caption,
      metadata: reelInfo,
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
 * Fetch reel information from Instagram
 * This is a placeholder - in production, use Instagram's official APIs
 */
async function fetchReelInfo(reelId: string): Promise<InstagramReelInfo> {
  // Placeholder implementation
  // In production, you would:
  // 1. Use Instagram Basic Display API or Graph API
  // 2. Authenticate with proper credentials
  // 3. Make API calls to get reel metadata
  
  // For demo purposes, return mock data
  return {
    videoUrl: `https://example.com/instagram_reel_${reelId}.mp4`,
    caption: `Sample Instagram Reel ${reelId}`,
    username: 'sample_user',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Download Instagram Reel video using Python worker
 */
async function downloadInstagramVideo(reelUrl: string, outputPath: string, browserCookies?: string, cookiesFile?: string): Promise<void> {
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

    const result = await response.json() as { success: boolean; error?: string };
    
    if (!result.success) {
      throw new Error(`Instagram download failed: ${result.error}`);
    }

    // The video should now be available at outputPath
    try {
      await fs.access(outputPath);
    } catch (error) {
      throw new Error(`Downloaded video not found at: ${outputPath}`);
    }

  } catch (error) {
    console.error('Instagram download error:', error);
    throw new Error(`Failed to download Instagram Reel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Instagram Reel URL format
 */
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
export async function getInstagramReelMetadata(reelUrl: string): Promise<InstagramReelInfo> {
  const reelId = extractReelId(reelUrl);
  if (!reelId) {
    throw new Error('Invalid Instagram Reel URL');
  }
  
  return await fetchReelInfo(reelId);
}


