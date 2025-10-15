"""
Unit tests for extract_cookies module
"""
import pytest
import tempfile
import os
import sys
from unittest.mock import patch, Mock, mock_open
from pathlib import Path
import subprocess

from extract_cookies import (
    get_chrome_cookies_path,
    extract_cookies_to_file,
    validate_cookies,
    main
)


class TestGetChromeCookiesPath:
    """Test Chrome cookies path detection for different platforms."""

    def test_get_chrome_cookies_path_macos(self):
        """Test cookie path detection on macOS."""
        with patch('sys.platform', 'darwin'):
            path = get_chrome_cookies_path()
            expected_path = os.path.expanduser(
                "~/Library/Application Support/Google/Chrome/Default/Cookies"
            )
            assert path == expected_path

    def test_get_chrome_cookies_path_linux(self):
        """Test cookie path detection on Linux."""
        with patch('sys.platform', 'linux'):
            path = get_chrome_cookies_path()
            expected_path = os.path.expanduser(
                "~/.config/google-chrome/Default/Cookies"
            )
            assert path == expected_path

    def test_get_chrome_cookies_path_windows(self):
        """Test cookie path detection on Windows."""
        with patch('sys.platform', 'win32'):
            path = get_chrome_cookies_path()
            expected_path = os.path.expanduser(
                "~/AppData/Local/Google/Chrome/User Data/Default/Cookies"
            )
            assert path == expected_path

    def test_get_chrome_cookies_path_unsupported_platform(self):
        """Test error handling for unsupported platforms."""
        with patch('sys.platform', 'unsupported'):
            with pytest.raises(OSError, match="Unsupported operating system"):
                get_chrome_cookies_path()


class TestExtractCookiesToFile:
    """Test cookie extraction functionality."""

    def test_extract_cookies_to_file_success(self):
        """Test successful cookie extraction."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run, \
             patch('builtins.open', mock_open()) as mock_file:
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "cookie_data"
            
            with tempfile.NamedTemporaryFile() as temp_file:
                result = extract_cookies_to_file(temp_file.name)
                
                assert result == temp_file.name
                mock_run.assert_called_once()
                mock_file.assert_called_once_with(temp_file.name, 'w')

    def test_extract_cookies_to_file_default_path(self):
        """Test cookie extraction with default temp path."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run, \
             patch('builtins.open', mock_open()), \
             patch('tempfile.gettempdir', return_value='/tmp'):
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "cookie_data"
            
            result = extract_cookies_to_file()
            expected_path = "/tmp/instagram_cookies.txt"
            assert result == expected_path

    def test_extract_cookies_to_file_chrome_not_found(self):
        """Test cookie extraction when Chrome cookies database doesn't exist."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=False):
            
            mock_path.return_value = "/path/to/cookies"
            
            with pytest.raises(FileNotFoundError, match="Chrome cookies database not found"):
                extract_cookies_to_file("/tmp/validate_cookies.txt")

    def test_extract_cookies_to_file_yt_dlp_not_found(self):
        """Test cookie extraction when yt-dlp is not installed."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run', side_effect=FileNotFoundError):
            
            mock_path.return_value = "/path/to/cookies"
            
            with pytest.raises(FileNotFoundError):
                extract_cookies_to_file("/tmp/validate_cookies.txt")

    def test_extract_cookies_to_file_subprocess_error(self):
        """Test cookie extraction when subprocess fails."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run:
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.side_effect = subprocess.CalledProcessError(1, "yt-dlp", "Error")
            
            with pytest.raises(subprocess.CalledProcessError):
                extract_cookies_to_file("/tmp/validate_cookies.txt")

    def test_extract_cookies_to_file_permission_error(self):
        """Test cookie extraction when file write permission is denied."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run, \
             patch('builtins.open', side_effect=PermissionError("Permission denied")):
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "cookie_data"
            
            with pytest.raises(PermissionError):
                extract_cookies_to_file("/tmp/validate_cookies.txt")


class TestCookies:
    """Test cookie validation functionality."""

    def test_validate_cookies_success(self):
        """Test successful cookie validation."""
        with patch('subprocess.run') as mock_run:
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "Instagram"
            
            result = validate_cookies("/tmp/cookies.txt")
            assert result is True
            mock_run.assert_called_once()

    def test_validate_cookies_failure(self):
        """Test cookie validation failure."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.CalledProcessError(1, "yt-dlp", "Error")
            
            result = validate_cookies("/tmp/cookies.txt")
            assert result is False

    def test_validate_cookies_yt_dlp_not_found(self):
        """Test cookie validation when yt-dlp is not found."""
        with patch('subprocess.run', side_effect=FileNotFoundError):
            result = validate_cookies("/tmp/cookies.txt")
            assert result is False

    def test_validate_cookies_invalid_file(self):
        """Test cookie validation with invalid cookie file."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.CalledProcessError(1, "yt-dlp", "Invalid cookies")
            
            result = validate_cookies("/tmp/invalid_cookies.txt")
            assert result is False


class TestMainFunction:
    """Test the main function functionality."""

    @patch('extract_cookies.validate_cookies')
    @patch('extract_cookies.extract_cookies_to_file')
    def test_main_success(self, mock_extract, mock_test):
        """Test successful main function execution."""
        mock_extract.return_value = "/tmp/cookies.txt"
        mock_test.return_value = True
        
        with patch('builtins.print') as mock_print:
            main()
            mock_extract.assert_called_once()
            mock_test.assert_called_once_with("/tmp/cookies.txt")

    @patch('extract_cookies.extract_cookies_to_file')
    def test_main_extraction_failure(self, mock_extract):
        """Test main function when cookie extraction fails."""
        mock_extract.side_effect = Exception("Extraction failed")
        
        with patch('builtins.print') as mock_print, \
             patch('sys.exit') as mock_exit:
            main()
            mock_exit.assert_called_once_with(1)

    @patch('extract_cookies.validate_cookies')
    @patch('extract_cookies.extract_cookies_to_file')
    def test_main_test_failure(self, mock_extract, mock_test):
        """Test main function when cookie testing fails."""
        mock_extract.return_value = "/tmp/cookies.txt"
        mock_test.return_value = False
        
        with patch('builtins.print') as mock_print:
            main()
            mock_extract.assert_called_once()
            mock_test.assert_called_once_with("/tmp/cookies.txt")


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_extract_cookies_to_file_empty_output(self):
        """Test cookie extraction with empty yt-dlp output."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run, \
             patch('builtins.open', mock_open()) as mock_file:
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = ""  # Empty output
            
            with tempfile.NamedTemporaryFile() as temp_file:
                result = extract_cookies_to_file(temp_file.name)
                assert result == temp_file.name

    def test_extract_cookies_to_file_large_output(self):
        """Test cookie extraction with large output."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run, \
             patch('builtins.open', mock_open()) as mock_file:
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "cookie_data" * 1000  # Large output
            
            with tempfile.NamedTemporaryFile() as temp_file:
                result = extract_cookies_to_file(temp_file.name)
                assert result == temp_file.name

    def test_validate_cookies_network_timeout(self):
        """Test cookie validation with network timeout."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired("yt-dlp", 30)
            
            result = validate_cookies("/tmp/cookies.txt")
            assert result is False

    def test_extract_cookies_to_file_disk_full(self):
        """Test cookie extraction when disk is full."""
        with patch('extract_cookies.get_chrome_cookies_path') as mock_path, \
             patch('os.path.exists', return_value=True), \
             patch('subprocess.run') as mock_run, \
             patch('builtins.open', side_effect=OSError("No space left on device")):
            
            mock_path.return_value = "/path/to/cookies"
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "cookie_data"
            
            with pytest.raises(OSError, match="No space left on device"):
                extract_cookies_to_file("/tmp/validate_cookies.txt")
