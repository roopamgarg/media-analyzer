"""
Integration tests for the Python worker service API
"""
import pytest
import io
import tempfile
import os
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from main import app


class TestAPIWorkflow:
    """Test complete API workflows."""
    
    def test_health_check_workflow(self, client):
        """Test the health check workflow."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "worker-python"
    
    def test_asr_workflow(self, client, sample_audio_file, mock_whisper_model):
        """Test complete ASR workflow."""
        # Step 1: Upload audio file
        files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
        response = client.post("/asr", files=files)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "language" in data
        assert "segments" in data
        assert "timing" in data
        assert isinstance(data["segments"], list)
        assert len(data["segments"]) > 0
        
        # Verify segment structure
        segment = data["segments"][0]
        assert "tStart" in segment
        assert "tEnd" in segment
        assert "text" in segment
        assert isinstance(segment["text"], str)
    
    def test_ocr_workflow(self, client, sample_image_file, mock_pytesseract):
        """Test complete OCR workflow."""
        # Step 1: Upload image files
        files = [
            ("files", ("test1.png", io.BytesIO(sample_image_file), "image/png")),
            ("files", ("test2.png", io.BytesIO(sample_image_file), "image/png"))
        ]
        response = client.post("/ocr", files=files)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "frames" in data
        assert "timing" in data
        assert isinstance(data["frames"], list)
        assert len(data["frames"]) == 2
        
        # Verify frame structure
        frame = data["frames"][0]
        assert "t" in frame
        assert "boxes" in frame
        assert isinstance(frame["boxes"], list)
    
    def test_instagram_download_workflow(self, client, sample_instagram_url, mock_instagram_downloader):
        """Test complete Instagram download workflow."""
        # Step 1: Download Instagram Reel
        request_data = {
            "url": sample_instagram_url,
            "browser_cookies": "chrome"
        }
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "video_path" in data
        assert "caption" in data
        assert "username" in data
        assert "duration" in data
        
        # Verify data types
        assert isinstance(data["video_path"], str)
        assert isinstance(data["caption"], str)
        assert isinstance(data["username"], str)
        assert isinstance(data["duration"], (int, float))
    
    def test_instagram_download_with_cookies_file_workflow(self, client, sample_instagram_url, mock_instagram_downloader):
        """Test Instagram download workflow with cookies file."""
        request_data = {
            "url": sample_instagram_url,
            "cookies_file": "/path/to/cookies.txt"
        }
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_instagram_download_without_cookies_workflow(self, client, sample_instagram_url, mock_instagram_downloader):
        """Test Instagram download workflow without cookies."""
        request_data = {
            "url": sample_instagram_url
        }
        response = client.post("/download-instagram", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestErrorHandlingWorkflow:
    """Test error handling workflows."""
    
    def test_asr_error_workflow(self, client):
        """Test ASR error handling workflow."""
        with patch('main.get_whisper_model') as mock_model:
            mock_model.return_value.transcribe.side_effect = Exception("Whisper error")
            
            # Create a dummy audio file
            audio_data = io.BytesIO(b"fake audio data")
            files = {"file": ("test.wav", audio_data, "audio/wav")}
            
            response = client.post("/asr", files=files)
            
            assert response.status_code == 500
            data = response.json()
            assert "ASR processing failed" in data["detail"]
    
    def test_ocr_error_workflow(self, client):
        """Test OCR error handling workflow."""
        with patch('main.pytesseract') as mock_tesseract:
            mock_tesseract.image_to_string.side_effect = Exception("Tesseract error")
            
            # Create a dummy image file
            image_data = io.BytesIO(b"fake image data")
            files = {"files": ("test.png", image_data, "image/png")}
            
            response = client.post("/ocr", files=files)
            
            assert response.status_code == 500
            data = response.json()
            assert "OCR processing failed" in data["detail"]
    
    def test_instagram_download_error_workflow(self, client, sample_instagram_url):
        """Test Instagram download error handling workflow."""
        with patch('main.InstagramDownloader') as mock_downloader_class:
            mock_downloader = Mock()
            mock_downloader.download_reel.side_effect = Exception("Download error")
            mock_downloader_class.return_value = mock_downloader
            
            request_data = {"url": sample_instagram_url}
            response = client.post("/download-instagram", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert "error" in data
            assert "Download error" in data["error"]


class TestConcurrentRequests:
    """Test handling of concurrent requests."""
    
    def test_concurrent_asr_requests(self, client, sample_audio_file, mock_whisper_model):
        """Test handling multiple concurrent ASR requests."""
        import threading
        import time
        
        results = []
        errors = []
        
        def make_request():
            try:
                files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
                response = client.post("/asr", files=files)
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Verify all requests succeeded
        assert len(errors) == 0
        assert len(results) == 3
        assert all(status == 200 for status in results)
    
    def test_concurrent_ocr_requests(self, client, sample_image_file, mock_pytesseract):
        """Test handling multiple concurrent OCR requests."""
        import threading
        
        results = []
        errors = []
        
        def make_request():
            try:
                files = {"files": ("test.png", io.BytesIO(sample_image_file), "image/png")}
                response = client.post("/ocr", files=files)
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Verify all requests succeeded
        assert len(errors) == 0
        assert len(results) == 3
        assert all(status == 200 for status in results)


class TestPerformanceWorkflow:
    """Test performance-related workflows."""
    
    def test_asr_timing_accuracy(self, client, sample_audio_file, mock_whisper_model):
        """Test that ASR timing is reported accurately."""
        import time
        
        start_time = time.time()
        files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
        response = client.post("/asr", files=files)
        end_time = time.time()
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify timing is reasonable
        assert "timing" in data
        assert isinstance(data["timing"], (int, float))
        assert data["timing"] > 0
        
        # Verify timing is not too far off from actual request time
        actual_time = (end_time - start_time) * 1000  # Convert to milliseconds
        assert abs(data["timing"] - actual_time) < 1000  # Within 1 second
    
    def test_ocr_timing_accuracy(self, client, sample_image_file, mock_pytesseract):
        """Test that OCR timing is reported accurately."""
        import time
        
        start_time = time.time()
        files = {"files": ("test.png", io.BytesIO(sample_image_file), "image/png")}
        response = client.post("/ocr", files=files)
        end_time = time.time()
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify timing is reasonable
        assert "timing" in data
        assert isinstance(data["timing"], (int, float))
        assert data["timing"] > 0
        
        # Verify timing is not too far off from actual request time
        actual_time = (end_time - start_time) * 1000  # Convert to milliseconds
        assert abs(data["timing"] - actual_time) < 1000  # Within 1 second


class TestDataValidationWorkflow:
    """Test data validation workflows."""
    
    def test_asr_language_parameter_validation(self, client, sample_audio_file, mock_whisper_model):
        """Test ASR with different language parameters."""
        # Test with valid language
        files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
        response = client.post("/asr?language=en", files=files)
        assert response.status_code == 200
        
        # Test with different language
        response = client.post("/asr?language=es", files=files)
        assert response.status_code == 200
        
        # Test with invalid language (should still work)
        response = client.post("/asr?language=invalid", files=files)
        assert response.status_code == 200
    
    def test_instagram_url_validation(self, client):
        """Test Instagram URL validation."""
        # Test with valid Instagram URL
        with patch('main.InstagramDownloader') as mock_downloader_class:
            mock_downloader = Mock()
            mock_downloader.download_reel.return_value = {
                'video_path': '/tmp/test_video.mp4',
                'caption': 'Test Reel',
                'username': 'test_user',
                'duration': 30.0,
                'view_count': 1000,
                'like_count': 50,
                'upload_date': '20240101',
                'thumbnail': 'https://example.com/thumb.jpg',
                'webpage_url': 'https://www.instagram.com/reel/ABC123/'
            }
            mock_downloader_class.return_value = mock_downloader
            
            valid_url = "https://www.instagram.com/reel/ABC123/"
            request_data = {"url": valid_url}
            response = client.post("/download-instagram", json=request_data)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
        
        # Test with invalid URL (should fail in downloader)
        with patch('main.InstagramDownloader') as mock_downloader_class:
            mock_downloader = Mock()
            mock_downloader.download_reel.side_effect = Exception("Invalid URL")
            mock_downloader_class.return_value = mock_downloader
            
            invalid_url = "https://example.com/not-instagram"
            request_data = {"url": invalid_url}
            response = client.post("/download-instagram", json=request_data)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
    
    def test_file_type_validation(self, client, sample_image_file, mock_pytesseract):
        """Test file type validation for OCR."""
        # Test with valid image file
        files = {"files": ("test.png", io.BytesIO(sample_image_file), "image/png")}
        response = client.post("/ocr", files=files)
        assert response.status_code == 200
        
        # Test with different image format
        files = {"files": ("test.jpg", io.BytesIO(sample_image_file), "image/jpeg")}
        response = client.post("/ocr", files=files)
        assert response.status_code == 200


class TestResourceCleanupWorkflow:
    """Test resource cleanup workflows."""
    
    def test_instagram_downloader_cleanup(self, temp_dir):
        """Test that Instagram downloader properly cleans up resources."""
        from instagram_downloader import InstagramDownloader
        
        downloader = InstagramDownloader()
        temp_dir_path = downloader.temp_dir
        
        # Verify temp directory exists
        assert os.path.exists(temp_dir_path)
        
        # Clean up
        downloader.cleanup()
        
        # Verify temp directory is removed
        assert not os.path.exists(temp_dir_path)
    
    def test_multiple_downloader_instances(self):
        """Test multiple downloader instances don't interfere."""
        from instagram_downloader import InstagramDownloader
        
        downloader1 = InstagramDownloader()
        downloader2 = InstagramDownloader()
        
        # Verify they have different temp directories
        assert downloader1.temp_dir != downloader2.temp_dir
        
        # Clean up both
        downloader1.cleanup()
        downloader2.cleanup()
        
        # Verify both are cleaned up
        assert not os.path.exists(downloader1.temp_dir)
        assert not os.path.exists(downloader2.temp_dir)
