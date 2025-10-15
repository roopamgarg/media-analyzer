#!/usr/bin/env python3
"""
Script to extract cookies from Chrome browser for use with yt-dlp
This helps bypass Instagram rate limiting by using your logged-in session.
"""

import os
import sys
import tempfile
import subprocess
from pathlib import Path

def get_chrome_cookies_path():
    """Get the path to Chrome's cookies database"""
    system = sys.platform.lower()
    
    if system == "darwin":  # macOS
        return os.path.expanduser("~/Library/Application Support/Google/Chrome/Default/Cookies")
    elif system == "linux":
        return os.path.expanduser("~/.config/google-chrome/Default/Cookies")
    elif system == "win32":
        return os.path.expanduser("~/AppData/Local/Google/Chrome/User Data/Default/Cookies")
    else:
        raise OSError(f"Unsupported operating system: {system}")

def extract_cookies_to_file(output_file: str = None):
    """
    Extract Instagram cookies from Chrome and save to a cookies.txt file
    
    Args:
        output_file: Path to save cookies.txt file. If None, saves to temp file.
    
    Returns:
        Path to the cookies.txt file
    """
    if output_file is None:
        output_file = os.path.join(tempfile.gettempdir(), "instagram_cookies.txt")
    
    chrome_cookies_path = get_chrome_cookies_path()
    
    if not os.path.exists(chrome_cookies_path):
        raise FileNotFoundError(f"Chrome cookies database not found at: {chrome_cookies_path}")
    
    # Use yt-dlp to extract cookies
    try:
        cmd = [
            "yt-dlp",
            "--cookies-from-browser", "chrome",
            "--print", "cookies",
            "https://www.instagram.com/reels/DO3i-MviVuG/"
        ]
        
        print(f"Extracting cookies from Chrome...")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Save cookies to file
        with open(output_file, 'w') as f:
            f.write(result.stdout)
        
        print(f"Cookies extracted successfully to: {output_file}")
        return output_file
        
    except subprocess.CalledProcessError as e:
        print(f"Error extracting cookies: {e}")
        print(f"stderr: {e.stderr}")
        raise
    except FileNotFoundError:
        print("yt-dlp not found. Please install it first:")
        print("pip install yt-dlp")
        raise

def validate_cookies(cookies_file: str):
    """Test if the extracted cookies work with Instagram"""
    try:
        cmd = [
            "yt-dlp",
            "--cookies", cookies_file,
            "--print", "title",
            "https://www.instagram.com"
        ]
        
        print(f"Testing cookies with Instagram...")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ Cookies work! Instagram title: {result.stdout.strip()}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Cookies test failed: {e}")
        print(f"stderr: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ yt-dlp not found. Please install it first:")
        print("pip install yt-dlp")
        return False
    except subprocess.TimeoutExpired:
        print("❌ Network timeout. Please check your internet connection.")
        return False

def main():
    """Main function to extract and test cookies"""
    print("🍪 Instagram Cookie Extractor for yt-dlp")
    print("=" * 50)
    
    try:
        # Extract cookies
        cookies_file = extract_cookies_to_file()
        
        # Test cookies
        if validate_cookies(cookies_file):
            print(f"\n✅ Success! You can now use these cookies with yt-dlp:")
            print(f"   --cookies {cookies_file}")
            print(f"\nOr use browser cookies directly:")
            print(f"   --cookies-from-browser chrome")
        else:
            print(f"\n❌ Cookie extraction failed. You may need to:")
            print("   1. Log into Instagram in Chrome first")
            print("   2. Make sure Chrome is not running")
            print("   3. Try a different browser (firefox, safari)")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
