import yt_dlp
import os
import tempfile
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class InstagramDownloader:
    def __init__(self, browser_cookies: Optional[str] = None, cookies_file: Optional[str] = None):
        self.temp_dir = tempfile.mkdtemp(prefix="instagram_")
        self.browser_cookies = browser_cookies  # e.g., 'chrome', 'firefox', 'safari'
        self.cookies_file = cookies_file  # Path to cookies.txt file
        
    def download_reel(self, url: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Download Instagram Reel video and return metadata
        
        Args:
            url: Instagram Reel URL
            output_path: Optional custom output path. If None, only extract metadata without downloading
            
        Returns:
            Dict containing video path, caption, username, and other metadata
        """
        try:
            # Configure yt-dlp options
            ydl_opts = {
                'format': 'best',  # Use best available format
                'writesubtitles': False,
                'writeautomaticsub': False,
                'writethumbnail': False,
                'quiet': True,  # Reduce output noise
                'no_warnings': True,
                'extract_flat': False,
            }
            
            # If output_path is None, only extract metadata without downloading
            if output_path is None:
                ydl_opts['skip_download'] = True
                logger.info("Extracting metadata only (no download)")
            else:
                ydl_opts['outtmpl'] = output_path
                logger.info(f"Downloading to: {output_path}")
            
            # Add cookie options if provided
            if self.browser_cookies:
                ydl_opts['cookiesfrombrowser'] = (self.browser_cookies,)
                logger.info(f"Using cookies from browser: {self.browser_cookies}")
            elif self.cookies_file:
                ydl_opts['cookiefile'] = self.cookies_file
                logger.info(f"Using cookies file: {self.cookies_file}")
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract info first to get metadata
                info = ydl.extract_info(url, download=False)
                
                logger.info(f"Available formats: {[f.get('format_id', 'unknown') for f in info.get('formats', [])]}")
                
                # Download the video only if output_path is provided
                if output_path is not None:
                    ydl.download([url])
                    
                    # Get the actual downloaded file path
                    downloaded_file = ydl.prepare_filename(info)
                    if not os.path.exists(downloaded_file):
                        # Try with different extensions
                        for ext in ['mp4', 'webm', 'mkv']:
                            test_path = downloaded_file.rsplit('.', 1)[0] + f'.{ext}'
                            if os.path.exists(test_path):
                                downloaded_file = test_path
                                break
                    
                    if not os.path.exists(downloaded_file):
                        raise Exception(f"Downloaded file not found: {downloaded_file}")
                    
                    logger.info(f"Successfully downloaded Instagram Reel: {downloaded_file}")
                else:
                    downloaded_file = None
                    logger.info("Metadata extraction completed (no file downloaded)")
                
                # Extract metadata
                metadata = {
                    'video_path': downloaded_file,
                    'caption': info.get('description', '') or info.get('title', ''),
                    'username': info.get('uploader', ''),
                    'duration': info.get('duration', 0),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                    'upload_date': info.get('upload_date', ''),
                    'thumbnail': info.get('thumbnail', ''),
                    'webpage_url': info.get('webpage_url', url),
                }
                
                return metadata
                
        except Exception as e:
            logger.error(f"Failed to download Instagram Reel {url}: {str(e)}")
            raise Exception(f"Instagram download failed: {str(e)}")
    
    def _extract_reel_id(self, url: str) -> str:
        """Extract reel ID from Instagram URL"""
        import re
        
        patterns = [
            r'instagram\.com/reel/([A-Za-z0-9_-]+)',
            r'instagram\.com/reels/([A-Za-z0-9_-]+)',
            r'instagram\.com/p/([A-Za-z0-9_-]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        # Fallback: use a hash of the URL
        import hashlib
        return hashlib.md5(url.encode()).hexdigest()[:12]
    
    def cleanup(self):
        """Clean up temporary files"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            logger.info(f"Cleaned up temporary directory: {self.temp_dir}")

# Test function
def test_download():
    """Test the Instagram downloader with a sample URL"""
    downloader = InstagramDownloader()
    
    # Test URL (replace with a real Instagram Reel URL)
    test_url = "https://www.instagram.com/reels/DO3i-MviVuG/"
    
    try:
        result = downloader.download_reel(test_url)
        print("Download successful!")
        print(f"Video path: {result['video_path']}")
        print(f"Caption: {result['caption']}")
        print(f"Username: {result['username']}")
        print(f"Duration: {result['duration']} seconds")
        
        # Clean up
        downloader.cleanup()
        
    except Exception as e:
        print(f"Download failed: {e}")
        downloader.cleanup()

if __name__ == "__main__":
    test_download()
