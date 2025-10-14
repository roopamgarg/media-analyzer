"""
Test configuration and fixtures for the Python worker service
"""
import pytest
import asyncio
import tempfile
import os
import io
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

from main import app
from instagram_downloader import InstagramDownloader


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_whisper_model():
    """Mock Whisper model for testing."""
    with patch('main.get_whisper_model') as mock_model:
        mock_segments = [
            Mock(start=0.0, end=2.5, text="Hello world"),
            Mock(start=2.5, end=5.0, text="This is a test")
        ]
        mock_info = Mock(language="en")
        
        mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
        yield mock_model


@pytest.fixture
def mock_pytesseract():
    """Mock pytesseract for OCR testing."""
    with patch('main.pytesseract') as mock_tesseract:
        mock_tesseract.image_to_string.return_value = "Sample OCR text"
        
        # Mock image_to_data for bounding boxes
        mock_data = {
            'text': ['Sample', 'OCR', 'text'],
            'left': [10, 50, 90],
            'top': [20, 20, 20],
            'width': [30, 30, 30],
            'height': [15, 15, 15],
            'conf': [85, 90, 80]
        }
        mock_tesseract.image_to_data.return_value = mock_data
        mock_tesseract.Output.DICT = 'dict'
        
        yield mock_tesseract


@pytest.fixture
def sample_audio_file():
    """Create a sample audio file for testing."""
    # Create a simple WAV file in memory
    import wave
    import struct
    
    # Generate a simple sine wave
    sample_rate = 44100
    duration = 1.0  # 1 second
    frequency = 440  # A4 note
    
    frames = []
    for i in range(int(sample_rate * duration)):
        value = int(32767 * np.sin(2 * np.pi * frequency * i / sample_rate))
        frames.append(struct.pack('<h', value))
    
    # Create WAV file in memory
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b''.join(frames))
    
    wav_buffer.seek(0)
    return wav_buffer.getvalue()


@pytest.fixture
def sample_image_file():
    """Create a sample image file for testing."""
    # Create a simple test image with text
    img = Image.new('RGB', (200, 100), color='white')
    
    # Add some text-like content (simplified)
    pixels = np.array(img)
    # Add some patterns that could be interpreted as text
    pixels[20:30, 20:80] = [0, 0, 0]  # Black rectangle
    pixels[40:50, 20:80] = [0, 0, 0]  # Another black rectangle
    
    img = Image.fromarray(pixels)
    
    # Save to bytes
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    return img_buffer.getvalue()


@pytest.fixture
def mock_instagram_downloader():
    """Mock Instagram downloader for testing."""
    with patch('main.InstagramDownloader') as mock_downloader_class:
        mock_downloader = Mock()
        mock_downloader.download_reel.return_value = {
            'video_path': '/tmp/test_video.mp4',
            'caption': 'Test Instagram Reel',
            'username': 'test_user',
            'duration': 30.0,
            'view_count': 1000,
            'like_count': 50,
            'upload_date': '20240101',
            'thumbnail': 'https://example.com/thumb.jpg',
            'webpage_url': 'https://www.instagram.com/reel/test123/'
        }
        mock_downloader_class.return_value = mock_downloader
        yield mock_downloader


@pytest.fixture
def temp_dir():
    """Create a temporary directory for testing."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_instagram_url():
    """Sample Instagram Reel URL for testing."""
    return "https://www.instagram.com/reel/ABC123DEF456/"


@pytest.fixture
def sample_instagram_response():
    """Sample Instagram download response."""
    return {
        "success": True,
        "video_path": "/tmp/instagram_reel_ABC123DEF456.mp4",
        "caption": "Check out this amazing product! #fashion #style",
        "username": "fashionista",
        "duration": 30.0
    }


# Test data fixtures
@pytest.fixture
def asr_test_data():
    """Test data for ASR endpoint."""
    return {
        "language": "en",
        "segments": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "This is a test"}
        ],
        "timing": 1500.0
    }


@pytest.fixture
def ocr_test_data():
    """Test data for OCR endpoint."""
    return {
        "frames": [
            {
                "t": 0,
                "boxes": [
                    {"box": [10, 20, 30, 15], "text": "Sample"},
                    {"box": [50, 20, 30, 15], "text": "OCR"},
                    {"box": [90, 20, 30, 15], "text": "text"}
                ]
            }
        ],
        "timing": 800.0
    }
