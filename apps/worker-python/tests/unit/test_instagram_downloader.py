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
