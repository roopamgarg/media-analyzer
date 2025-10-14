"""
Unit tests for the main FastAPI application endpoints
"""
import pytest
import io
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from main import app


class TestHealthEndpoint:
    """Test the health check endpoint."""
    
    def test_health_check(self, client):
        """Test that health endpoint returns correct status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "worker-python"


class TestASREndpoint:
    """Test the ASR (Automatic Speech Recognition) endpoint."""
    
    def test_asr_success(self, client, sample_audio_file, mock_whisper_model, asr_test_data):
        """Test successful ASR processing."""
        files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
        
        response = client.post("/asr", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "language" in data
        assert "segments" in data
        assert "timing" in data
        assert len(data["segments"]) > 0
        assert data["segments"][0]["text"] == "Hello world"
    
    def test_asr_with_language(self, client, sample_audio_file, mock_whisper_model):
        """Test ASR with specific language parameter."""
        files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
        
        response = client.post("/asr?language=en", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "en"
    
    def test_asr_no_file(self, client):
        """Test ASR endpoint without file upload."""
        response = client.post("/asr")
        
        assert response.status_code == 422  # Validation error
    
    def test_asr_processing_error(self, client, sample_audio_file):
        """Test ASR endpoint with processing error."""
        with patch('main.get_whisper_model') as mock_model:
            mock_model.return_value.transcribe.side_effect = Exception("Whisper error")
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            response = client.post("/asr", files=files)
            
            assert response.status_code == 500
            assert "ASR processing failed" in response.json()["detail"]


class TestOCREndpoint:
    """Test the OCR (Optical Character Recognition) endpoint."""
    
    def test_ocr_success(self, client, sample_image_file, mock_pytesseract, ocr_test_data):
        """Test successful OCR processing."""
        files = [
            ("files", ("test1.png", io.BytesIO(sample_image_file), "image/png")),
            ("files", ("test2.png", io.BytesIO(sample_image_file), "image/png"))
        ]
        
        response = client.post("/ocr", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "frames" in data
        assert "timing" in data
        assert len(data["frames"]) == 2
        assert all("boxes" in frame for frame in data["frames"])
    
    def test_ocr_single_file(self, client, sample_image_file, mock_pytesseract):
        """Test OCR with single file."""
        files = {"files": ("test.png", io.BytesIO(sample_image_file), "image/png")}
        
        response = client.post("/ocr", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["frames"]) == 1
    
    def test_ocr_no_files(self, client):
        """Test OCR endpoint without file uploads."""
        response = client.post("/ocr")
        
        assert response.status_code == 422  # Validation error
    
    def test_ocr_processing_error(self, client, sample_image_file):
        """Test OCR endpoint with processing error."""
        with patch('main.pytesseract') as mock_tesseract:
            mock_tesseract.image_to_string.side_effect = Exception("Tesseract error")
            
            files = {"files": ("test.png", io.BytesIO(sample_image_file), "image/png")}
            response = client.post("/ocr", files=files)
            
            assert response.status_code == 500
            assert "OCR processing failed" in response.json()["detail"]


class TestInstagramDownloadEndpoint:
    """Test the Instagram download endpoint."""
    
    def test_download_instagram_success(self, client, sample_instagram_url, mock_instagram_downloader):
        """Test successful Instagram download."""
        request_data = {
            "url": sample_instagram_url,
            "browser_cookies": "chrome"
        }
        
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "video_path" in data
        assert "caption" in data
        assert "username" in data
        assert "duration" in data
    
    def test_download_instagram_with_cookies_file(self, client, sample_instagram_url, mock_instagram_downloader):
        """Test Instagram download with cookies file."""
        request_data = {
            "url": sample_instagram_url,
            "cookies_file": "/path/to/cookies.txt"
        }
        
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_download_instagram_without_cookies(self, client, sample_instagram_url, mock_instagram_downloader):
        """Test Instagram download without cookies."""
        request_data = {
            "url": sample_instagram_url
        }
        
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_download_instagram_invalid_url(self, client, mock_instagram_downloader):
        """Test Instagram download with invalid URL."""
        mock_instagram_downloader.download_reel.side_effect = Exception("Invalid URL")
        
        request_data = {
            "url": "https://invalid-url.com"
        }
        
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "error" in data
    
    def test_download_instagram_missing_url(self, client):
        """Test Instagram download without URL."""
        request_data = {}
        
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_download_instagram_invalid_browser(self, client, sample_instagram_url):
        """Test Instagram download with invalid browser type."""
        request_data = {
            "url": sample_instagram_url,
            "browser_cookies": "invalid_browser"
        }
        
        response = client.post("/download-instagram", json=request_data)
        
        # Should still work, just with different cookie handling
        assert response.status_code == 200


class TestWhisperModelLoading:
    """Test Whisper model loading functionality."""
    
    def test_whisper_model_lazy_loading(self):
        """Test that Whisper model is loaded lazily."""
        with patch('main.model', None):
            with patch('faster_whisper.WhisperModel') as mock_whisper:
                # Import and reset the module to ensure fresh state
                import importlib
                import main
                importlib.reload(main)
                
                # First call should load the model
                model1 = main.get_whisper_model()
                assert mock_whisper.called
                
                # Second call should return the same model
                model2 = main.get_whisper_model()
                assert model1 is model2
                # Should not call WhisperModel again
                assert mock_whisper.call_count == 1


class TestErrorHandling:
    """Test error handling across endpoints."""
    
    def test_asr_file_read_error(self, client):
        """Test ASR with file read error."""
        # Create a mock file that will cause read error
        mock_file = Mock()
        mock_file.read.side_effect = Exception("File read error")
        
        with patch('main.UploadFile', return_value=mock_file):
            files = {"file": ("test.wav", io.BytesIO(b"fake audio"), "audio/wav")}
            response = client.post("/asr", files=files)
            
            assert response.status_code == 500
    
    def test_ocr_image_processing_error(self, client):
        """Test OCR with image processing error."""
        # Create invalid image data
        invalid_image = io.BytesIO(b"not an image")
        
        files = {"files": ("test.png", invalid_image, "image/png")}
        response = client.post("/ocr", files=files)
        
        assert response.status_code == 500
    
    def test_instagram_download_network_error(self, client, sample_instagram_url):
        """Test Instagram download with network error."""
        with patch('main.InstagramDownloader') as mock_downloader_class:
            mock_downloader = Mock()
            mock_downloader.download_reel.side_effect = Exception("Network error")
            mock_downloader_class.return_value = mock_downloader
            
            request_data = {"url": sample_instagram_url}
            response = client.post("/download-instagram", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert "Network error" in data["error"]


class TestRequestValidation:
    """Test request validation and edge cases."""
    
    def test_asr_empty_file(self, client):
        """Test ASR with empty file."""
        empty_file = io.BytesIO(b"")
        files = {"file": ("empty.wav", empty_file, "audio/wav")}
        
        response = client.post("/asr", files=files)
        
        # Should handle empty file gracefully
        assert response.status_code in [200, 500]  # Depends on implementation
    
    def test_ocr_unsupported_image_format(self, client):
        """Test OCR with unsupported image format."""
        # Create a file with unsupported format
        unsupported_file = io.BytesIO(b"not an image")
        files = {"files": ("test.txt", unsupported_file, "text/plain")}
        
        response = client.post("/ocr", files=files)
        
        assert response.status_code == 500
    
    def test_instagram_download_empty_url(self, client):
        """Test Instagram download with empty URL."""
        request_data = {"url": ""}
        
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
