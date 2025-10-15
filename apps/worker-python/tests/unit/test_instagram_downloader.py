"""
Unit tests for the Instagram downloader module
"""
import pytest
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from instagram_downloader import InstagramDownloader


class TestInstagramDownloader:
    """Test the InstagramDownloader class."""
    
    def test_init_with_browser_cookies(self):
        """Test initializing with browser cookies."""
        downloader = InstagramDownloader(browser_cookies="chrome")
        
        assert downloader.browser_cookies == "chrome"
        assert downloader.cookies_file is None
        assert downloader.temp_dir is not None
        assert os.path.exists(downloader.temp_dir)
        
        # Cleanup
        downloader.cleanup()
    
    def test_init_with_cookies_file(self):
        """Test initializing with cookies file."""
        downloader = InstagramDownloader(cookies_file="/path/to/cookies.txt")
        
        assert downloader.cookies_file == "/path/to/cookies.txt"
        assert downloader.browser_cookies is None
        assert downloader.temp_dir is not None
        
        # Cleanup
        downloader.cleanup()
    
    def test_init_without_cookies(self):
        """Test initializing without cookies."""
        downloader = InstagramDownloader()
        
        assert downloader.browser_cookies is None
        assert downloader.cookies_file is None
        assert downloader.temp_dir is not None
        
        # Cleanup
        downloader.cleanup()
    
    def test_cleanup(self):
        """Test cleanup functionality."""
        downloader = InstagramDownloader()
        temp_dir = downloader.temp_dir
        
        assert os.path.exists(temp_dir)
        downloader.cleanup()
        assert not os.path.exists(temp_dir)
    
    def test_extract_reel_id_standard_url(self):
        """Test extracting reel ID from standard Instagram URL."""
        downloader = InstagramDownloader()
        
        url = "https://www.instagram.com/reel/ABC123DEF456/"
        reel_id = downloader._extract_reel_id(url)
        
        assert reel_id == "ABC123DEF456"
        downloader.cleanup()
    
    def test_extract_reel_id_reels_url(self):
        """Test extracting reel ID from reels URL."""
        downloader = InstagramDownloader()
        
        url = "https://www.instagram.com/reels/XYZ789GHI012/"
        reel_id = downloader._extract_reel_id(url)
        
        assert reel_id == "XYZ789GHI012"
        downloader.cleanup()
    
    def test_extract_reel_id_post_url(self):
        """Test extracting reel ID from post URL."""
        downloader = InstagramDownloader()
        
        url = "https://www.instagram.com/p/DEF456GHI789/"
        reel_id = downloader._extract_reel_id(url)
        
        assert reel_id == "DEF456GHI789"
        downloader.cleanup()
    
    def test_extract_reel_id_invalid_url(self):
        """Test extracting reel ID from invalid URL."""
        downloader = InstagramDownloader()
        
        url = "https://example.com/not-instagram"
        reel_id = downloader._extract_reel_id(url)
        
        # Should return a hash of the URL
        assert len(reel_id) == 12
        assert isinstance(reel_id, str)
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_success(self, mock_ydl_class, temp_dir):
        """Test successful reel download."""
        # Mock yt-dlp response
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        
        # Mock video info
        mock_info = {
            'formats': [{'format_id': 'best'}],
            'description': 'Test Instagram Reel',
            'title': 'Test Reel',
            'uploader': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_ydl.extract_info.return_value = mock_info
        mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
        
        # Mock the download method to create the file
        def mock_download(urls):
            video_path = os.path.join(temp_dir, 'test_video.mp4')
            with open(video_path, 'w') as f:
                f.write('dummy video content')
        mock_ydl.download.side_effect = mock_download
        
        downloader = InstagramDownloader()
        result = downloader.download_reel("https://www.instagram.com/reel/test123/")
        
        video_path = os.path.join(temp_dir, 'test_video.mp4')
        assert result['video_path'] == video_path
        assert result['caption'] == 'Test Instagram Reel'
        assert result['username'] == 'test_user'
        assert result['duration'] == 30.0
        assert result['view_count'] == 1000
        assert result['like_count'] == 50
        
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_with_browser_cookies(self, mock_ydl_class, temp_dir):
        """Test download with browser cookies."""
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        
        mock_info = {
            'formats': [{'format_id': 'best'}],
            'description': 'Test Reel',
            'uploader': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_ydl.extract_info.return_value = mock_info
        mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
        
        # Create a dummy video file
        video_path = os.path.join(temp_dir, 'test_video.mp4')
        with open(video_path, 'w') as f:
            f.write('dummy video content')
        
        downloader = InstagramDownloader(browser_cookies="chrome")
        result = downloader.download_reel("https://www.instagram.com/reel/test123/")
        
        # Check that yt-dlp was called with browser cookies
        mock_ydl_class.assert_called_once()
        call_args = mock_ydl_class.call_args[0][0]
        assert call_args['cookiesfrombrowser'] == ('chrome',)
        
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_with_cookies_file(self, mock_ydl_class, temp_dir):
        """Test download with cookies file."""
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        
        mock_info = {
            'formats': [{'format_id': 'best'}],
            'description': 'Test Reel',
            'uploader': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_ydl.extract_info.return_value = mock_info
        mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
        
        # Create a dummy video file
        video_path = os.path.join(temp_dir, 'test_video.mp4')
        with open(video_path, 'w') as f:
            f.write('dummy video content')
        
        downloader = InstagramDownloader(cookies_file="/path/to/cookies.txt")
        result = downloader.download_reel("https://www.instagram.com/reel/test123/")
        
        # Check that yt-dlp was called with cookies file
        mock_ydl_class.assert_called_once()
        call_args = mock_ydl_class.call_args[0][0]
        assert call_args['cookiefile'] == "/path/to/cookies.txt"
        
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_with_custom_output_path(self, mock_ydl_class, temp_dir):
        """Test download with custom output path."""
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        
        mock_info = {
            'formats': [{'format_id': 'best'}],
            'description': 'Test Reel',
            'uploader': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_ydl.extract_info.return_value = mock_info
        
        custom_path = os.path.join(temp_dir, 'custom_video.%(ext)s')
        mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'custom_video.mp4')
        
        # Create a dummy video file
        video_path = os.path.join(temp_dir, 'custom_video.mp4')
        with open(video_path, 'w') as f:
            f.write('dummy video content')
        
        downloader = InstagramDownloader()
        result = downloader.download_reel("https://www.instagram.com/reel/test123/", custom_path)
        
        # Check that yt-dlp was called with custom output template
        mock_ydl_class.assert_called_once()
        call_args = mock_ydl_class.call_args[0][0]
        assert call_args['outtmpl'] == custom_path
        
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_file_not_found(self, mock_ydl_class):
        """Test download when file is not found after download."""
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        
        mock_info = {
            'formats': [{'format_id': 'best'}],
            'description': 'Test Reel',
            'uploader': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_ydl.extract_info.return_value = mock_info
        mock_ydl.prepare_filename.return_value = '/nonexistent/path/video.mp4'
        
        # Mock the download method to not create any file
        def mock_download(urls):
            pass  # Don't create any file
        mock_ydl.download.side_effect = mock_download
        
        downloader = InstagramDownloader()
        
        with pytest.raises(Exception, match="Downloaded file not found"):
            downloader.download_reel("https://www.instagram.com/reel/test123/")
        
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_yt_dlp_error(self, mock_ydl_class):
        """Test download when yt-dlp raises an error."""
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        mock_ydl.extract_info.side_effect = Exception("yt-dlp error")
        
        downloader = InstagramDownloader()
        
        with pytest.raises(Exception, match="Instagram download failed"):
            downloader.download_reel("https://www.instagram.com/reel/test123/")
        
        downloader.cleanup()
    
    @patch('yt_dlp.YoutubeDL')
    def test_download_reel_different_extensions(self, mock_ydl_class, temp_dir):
        """Test download with different file extensions."""
        mock_ydl = Mock()
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl
        
        mock_info = {
            'formats': [{'format_id': 'best'}],
            'description': 'Test Reel',
            'uploader': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_ydl.extract_info.return_value = mock_info
        mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
        
        # Mock the download method to create a .webm file instead of .mp4
        def mock_download(urls):
            video_path = os.path.join(temp_dir, 'test_video.webm')
            with open(video_path, 'w') as f:
                f.write('dummy video content')
        mock_ydl.download.side_effect = mock_download
        
        downloader = InstagramDownloader()
        result = downloader.download_reel("https://www.instagram.com/reel/test123/")
        
        video_path = os.path.join(temp_dir, 'test_video.webm')
        assert result['video_path'] == video_path
        downloader.cleanup()


class TestInstagramDownloaderEdgeCases:
    """Test edge cases for Instagram downloader."""
    
    def test_download_reel_empty_metadata(self, temp_dir):
        """Test download with empty metadata."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            # Mock minimal info
            mock_info = {
                'formats': [{'format_id': 'best'}],
                'description': '',
                'title': '',
                'uploader': '',
                'duration': None,
                'view_count': None,
                'like_count': None,
                'upload_date': '',
                'thumbnail': '',
                'webpage_url': ''
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
            
            # Mock the download method to create the file
            def mock_download(urls):
                video_path = os.path.join(temp_dir, 'test_video.mp4')
                with open(video_path, 'w') as f:
                    f.write('dummy video content')
            mock_ydl.download.side_effect = mock_download
            
            downloader = InstagramDownloader()
            result = downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            video_path = os.path.join(temp_dir, 'test_video.mp4')
            assert result['video_path'] == video_path
            assert result['caption'] == ''
            assert result['username'] == ''
            assert result['duration'] is None or result['duration'] == 0
            assert result['view_count'] is None or result['view_count'] == 0
            assert result['like_count'] is None or result['like_count'] == 0
            
            downloader.cleanup()
    
    def test_download_reel_missing_formats(self, temp_dir):
        """Test download when no formats are available."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            # Mock info with no formats
            mock_info = {
                'formats': [],
                'description': 'Test Reel',
                'uploader': 'test_user',
                'duration': 30.0,
                'view_count': 1000,
                'like_count': 50,
                'upload_date': '20240101',
                'thumbnail': 'https://example.com/thumb.jpg',
                'webpage_url': 'https://www.instagram.com/reel/test123/'
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
            
            # Mock the download method to create the file
            def mock_download(urls):
                video_path = os.path.join(temp_dir, 'test_video.mp4')
                with open(video_path, 'w') as f:
                    f.write('dummy video content')
            mock_ydl.download.side_effect = mock_download
            
            downloader = InstagramDownloader()
            result = downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            video_path = os.path.join(temp_dir, 'test_video.mp4')
            assert result['video_path'] == video_path
            downloader.cleanup()


class TestNetworkErrorHandling:
    """Test network error handling scenarios."""

    def test_download_reel_network_timeout(self, temp_dir):
        """Test download with network timeout."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Network timeout")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Network timeout"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_connection_error(self, temp_dir):
        """Test download with connection error."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = ConnectionError("Connection refused")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Connection refused"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_dns_error(self, temp_dir):
        """Test download with DNS resolution error."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Name or service not known")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Name or service not known"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_rate_limited(self, temp_dir):
        """Test download when rate limited by Instagram."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("HTTP Error 429: Too Many Requests")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: HTTP Error 429: Too Many Requests"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()


class TestDiskSpaceErrorHandling:
    """Test disk space and file system error handling."""

    def test_download_reel_disk_full(self, temp_dir):
        """Test download when disk is full."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            mock_info = {
                'formats': [{'format_id': 'best', 'url': 'http://example.com/video.mp4'}],
                'description': 'Test Reel',
                'uploader': 'test_user',
                'duration': 30.0,
                'view_count': 1000,
                'like_count': 50,
                'upload_date': '20240101',
                'thumbnail': 'https://example.com/thumb.jpg',
                'webpage_url': 'https://www.instagram.com/reel/test123/'
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
            
            # Mock download to raise disk full error
            def mock_download(urls):
                raise OSError("No space left on device")
            mock_ydl.download.side_effect = mock_download
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: No space left on device"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_permission_denied(self, temp_dir):
        """Test download when permission is denied."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            mock_info = {
                'formats': [{'format_id': 'best', 'url': 'http://example.com/video.mp4'}],
                'description': 'Test Reel',
                'uploader': 'test_user',
                'duration': 30.0,
                'view_count': 1000,
                'like_count': 50,
                'upload_date': '20240101',
                'thumbnail': 'https://example.com/thumb.jpg',
                'webpage_url': 'https://www.instagram.com/reel/test123/'
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
            
            # Mock download to raise permission error
            def mock_download(urls):
                raise PermissionError("Permission denied")
            mock_ydl.download.side_effect = mock_download
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Permission denied"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()


class TestCookieErrorHandling:
    """Test cookie-related error handling."""

    def test_download_reel_cookie_file_corrupted(self, temp_dir):
        """Test download with corrupted cookie file."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Invalid cookie file format")
            
            downloader = InstagramDownloader(cookies_file="/path/to/corrupted_cookies.txt")
            with pytest.raises(Exception, match="Instagram download failed: Invalid cookie file format"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_cookie_file_not_found(self, temp_dir):
        """Test download when cookie file doesn't exist."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = FileNotFoundError("Cookie file not found")
            
            downloader = InstagramDownloader(cookies_file="/nonexistent/cookies.txt")
            with pytest.raises(Exception, match="Instagram download failed: Cookie file not found"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_browser_cookies_failed(self, temp_dir):
        """Test download when browser cookie extraction fails."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Failed to extract browser cookies")
            
            downloader = InstagramDownloader(browser_cookies="chrome")
            with pytest.raises(Exception, match="Instagram download failed: Failed to extract browser cookies"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()


class TestMetadataParsingErrors:
    """Test metadata parsing error handling."""

    def test_download_reel_malformed_metadata(self, temp_dir):
        """Test download with malformed metadata."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            # Mock info with malformed data
            mock_info = {
                'formats': [{'format_id': 'best', 'url': 'http://example.com/video.mp4'}],
                'description': None,  # Malformed
                'uploader': None,    # Malformed
                'duration': 'invalid',  # Malformed
                'view_count': 'invalid',  # Malformed
                'like_count': 'invalid',  # Malformed
                'upload_date': 'invalid',  # Malformed
                'thumbnail': None,  # Malformed
                'webpage_url': 'https://www.instagram.com/reel/test123/'
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
            
            # Mock the download method to create the file
            def mock_download(urls):
                video_path = os.path.join(temp_dir, 'test_video.mp4')
                with open(video_path, 'w') as f:
                    f.write('dummy video content')
            mock_ydl.download.side_effect = mock_download
            
            downloader = InstagramDownloader()
            result = downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            # Should handle malformed metadata gracefully
            assert result['caption'] == ''
            assert result['username'] is None
            assert result['duration'] == 'invalid'
            assert result['view_count'] == 'invalid'
            assert result['like_count'] == 'invalid'
            assert result['upload_date'] == 'invalid'
            assert result['thumbnail'] is None
            
            downloader.cleanup()

    def test_download_reel_metadata_parsing_exception(self, temp_dir):
        """Test download when metadata parsing raises exception."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Metadata parsing failed")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Metadata parsing failed"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()


class TestURLValidationErrors:
    """Test URL validation and format error handling."""

    def test_download_reel_invalid_url_format(self, temp_dir):
        """Test download with invalid URL format."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Invalid URL format")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Invalid URL format"):
                downloader.download_reel("not-a-valid-url")
            
            downloader.cleanup()

    def test_download_reel_private_video(self, temp_dir):
        """Test download with private video."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Private video - login required")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Private video - login required"):
                downloader.download_reel("https://www.instagram.com/reel/private123/")
            
            downloader.cleanup()

    def test_download_reel_video_not_found(self, temp_dir):
        """Test download with video not found."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Video not found")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Video not found"):
                downloader.download_reel("https://www.instagram.com/reel/nonexistent123/")
            
            downloader.cleanup()

    def test_download_reel_unsupported_url(self, temp_dir):
        """Test download with unsupported URL type."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Unsupported URL type")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Unsupported URL type"):
                downloader.download_reel("https://www.instagram.com/p/not-a-reel/")
            
            downloader.cleanup()


class TestConcurrentDownloadHandling:
    """Test concurrent download handling."""

    def test_download_reel_concurrent_requests(self, temp_dir):
        """Test download with concurrent requests."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            mock_info = {
                'formats': [{'format_id': 'best', 'url': 'http://example.com/video.mp4'}],
                'description': 'Test Reel',
                'uploader': 'test_user',
                'duration': 30.0,
                'view_count': 1000,
                'like_count': 50,
                'upload_date': '20240101',
                'thumbnail': 'https://example.com/thumb.jpg',
                'webpage_url': 'https://www.instagram.com/reel/test123/'
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'test_video.mp4')
            
            # Mock the download method to create the file
            def mock_download(urls):
                video_path = os.path.join(temp_dir, 'test_video.mp4')
                with open(video_path, 'w') as f:
                    f.write('dummy video content')
            mock_ydl.download.side_effect = mock_download
            
            downloader1 = InstagramDownloader()
            downloader2 = InstagramDownloader()
            
            # Simulate concurrent downloads
            result1 = downloader1.download_reel("https://www.instagram.com/reel/test123/")
            result2 = downloader2.download_reel("https://www.instagram.com/reel/test456/")
            
            assert result1['video_path'] is not None
            assert result2['video_path'] is not None
            
            downloader1.cleanup()
            downloader2.cleanup()

    def test_download_reel_resource_contention(self, temp_dir):
        """Test download with resource contention."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = Exception("Resource temporarily unavailable")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Resource temporarily unavailable"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()


class TestMemoryErrorHandling:
    """Test memory error handling scenarios."""

    def test_download_reel_memory_error(self, temp_dir):
        """Test download with memory error."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            mock_ydl.extract_info.side_effect = MemoryError("Out of memory")
            
            downloader = InstagramDownloader()
            with pytest.raises(Exception, match="Instagram download failed: Out of memory"):
                downloader.download_reel("https://www.instagram.com/reel/test123/")
            
            downloader.cleanup()

    def test_download_reel_large_file_handling(self, temp_dir):
        """Test download with very large file."""
        with patch('yt_dlp.YoutubeDL') as mock_ydl_class:
            mock_ydl = Mock()
            mock_ydl_class.return_value.__enter__.return_value = mock_ydl
            
            mock_info = {
                'formats': [{'format_id': 'best', 'url': 'http://example.com/large_video.mp4'}],
                'description': 'Large Test Reel',
                'uploader': 'test_user',
                'duration': 3600.0,  # 1 hour
                'view_count': 1000000,
                'like_count': 50000,
                'upload_date': '20240101',
                'thumbnail': 'https://example.com/thumb.jpg',
                'webpage_url': 'https://www.instagram.com/reel/large123/'
            }
            mock_ydl.extract_info.return_value = mock_info
            mock_ydl.prepare_filename.return_value = os.path.join(temp_dir, 'large_video.mp4')
            
            # Mock download to simulate large file processing
            def mock_download(urls):
                video_path = os.path.join(temp_dir, 'large_video.mp4')
                with open(video_path, 'w') as f:
                    f.write('large video content' * 1000)  # Simulate large file
            mock_ydl.download.side_effect = mock_download
            
            downloader = InstagramDownloader()
            result = downloader.download_reel("https://www.instagram.com/reel/large123/")
            
            assert result['duration'] == 3600.0
            assert result['view_count'] == 1000000
            assert result['like_count'] == 50000
            
            downloader.cleanup()
