"""
Test configuration and fixtures for the Python worker service
"""
import pytest
import pytest_asyncio
import asyncio
import tempfile
import os
import io
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np
import soundfile as sf

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


@pytest_asyncio.fixture
async def async_client():
    """Create an async test client for the FastAPI app."""
    from httpx import AsyncClient, ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_whisper_model():
    """Mock Whisper model for testing."""
    with patch('main.get_whisper_model') as mock_model:
        def mock_transcribe(audio, language=None, **kwargs):
            mock_segments = [
                Mock(start=0.0, end=2.5, text="Hello world"),
                Mock(start=2.5, end=5.0, text="This is a test")
            ]
            # Return the requested language or default to "en"
            detected_language = language if language else "en"
            mock_info = Mock(language=detected_language)
            return (mock_segments, mock_info)
        
        mock_model.return_value.transcribe = mock_transcribe
        yield mock_model

@pytest.fixture
def mock_audio_preprocessing():
    """Mock audio preprocessing for testing."""
    with patch('main.preprocess_audio') as mock_preprocess:
        mock_preprocess.return_value = b"preprocessed_audio_data"
        yield mock_preprocess

@pytest.fixture
def mock_text_postprocessing():
    """Mock text post-processing for testing."""
    with patch('main.post_process_transcript') as mock_postprocess:
        mock_segments = [
            {"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "This is a test"}
        ]
        mock_postprocess.return_value = mock_segments
        yield mock_postprocess

@pytest.fixture
def mock_language_config():
    """Mock language configuration for testing."""
    with patch('main.get_language_whisper_params') as mock_lang_config:
        mock_lang_config.return_value = {
            "initial_prompt": "This is a clear, well-spoken English audio recording.",
            "temperature": 0.0,
            "compression_ratio_threshold": 2.4,
            "log_prob_threshold": -1.0,
            "no_speech_threshold": 0.6
        }
        yield mock_lang_config


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


@pytest.fixture
def multilingual_audio_data():
    """Create multilingual audio data for testing."""
    # Generate audio with different characteristics for different languages
    duration = 2.0  # 2 seconds
    sample_rate = 16000
    
    # Create a more complex audio signal
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    audio = np.sin(2 * np.pi * 440 * t) + 0.5 * np.sin(2 * np.pi * 880 * t)
    audio = audio.astype(np.float32)
    
    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format='WAV', subtype='PCM_16')
    return buffer.getvalue()


@pytest.fixture
def multilingual_segments():
    """Create multilingual transcript segments for testing."""
    return {
        "en": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "This is a test"}
        ],
        "hi": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "नमस्ते दुनिया"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "यह एक परीक्षण है"}
        ],
        "es": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "Hola mundo"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "Esta es una prueba"}
        ],
        "fr": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "Bonjour le monde"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "Ceci est un test"}
        ],
        "de": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "Hallo Welt"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "Das ist ein Test"}
        ],
        "ta": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "வணக்கம் உலகம்"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "இது ஒரு சோதனை"}
        ],
        "te": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "హలో వరల్డ్"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "ఇది ఒక పరీక్ష"}
        ],
        "bn": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "হ্যালো বিশ্ব"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "এটি একটি পরীক্ষা"}
        ],
        "zh": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "你好世界"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "这是一个测试"}
        ],
        "ja": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "こんにちは世界"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "これはテストです"}
        ],
        "ko": [
            {"tStart": 0.0, "tEnd": 2.5, "text": "안녕하세요 세계"},
            {"tStart": 2.5, "tEnd": 5.0, "text": "이것은 테스트입니다"}
        ]
    }


@pytest.fixture
def multilingual_text_samples():
    """Create multilingual text samples for testing."""
    return {
        "en": "Hello world, this is a test. How are you today?",
        "hi": "नमस्ते दुनिया, यह एक परीक्षण है। आज आप कैसे हैं?",
        "es": "Hola mundo, esta es una prueba. ¿Cómo estás hoy?",
        "fr": "Bonjour le monde, ceci est un test. Comment allez-vous aujourd'hui?",
        "de": "Hallo Welt, das ist ein Test. Wie geht es dir heute?",
        "ta": "வணக்கம் உலகம், இது ஒரு சோதனை. இன்று நீங்கள் எப்படி இருக்கிறீர்கள்?",
        "te": "హలో వరల్డ్, ఇది ఒక పరీక్ష. ఈరోజు మీరు ఎలా ఉన్నారు?",
        "bn": "হ্যালো বিশ্ব, এটি একটি পরীক্ষা। আজ আপনি কেমন আছেন?",
        "zh": "你好世界，这是一个测试。你今天怎么样？",
        "ja": "こんにちは世界、これはテストです。今日はどうですか？",
        "ko": "안녕하세요 세계, 이것은 테스트입니다. 오늘 어떻게 지내세요?"
    }
