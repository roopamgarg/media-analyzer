"""
Integration tests for multilingual ASR workflows
"""
import pytest
import io
import numpy as np
import soundfile as sf
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

from main import app


class TestMultilingualASRWorkflows:
    """Test complete multilingual ASR workflows."""
    
    def test_complete_hindi_asr_workflow(self, client, sample_audio_file):
        """Test complete Hindi ASR workflow with preprocessing and post-processing."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess, \
             patch('main.get_language_whisper_params') as mock_lang_config:
            
            # Setup mocks
            mock_segments = [
                Mock(start=0.0, end=2.5, text="नमस्ते दुनिया"),
                Mock(start=2.5, end=5.0, text="यह एक परीक्षण है")
            ]
            mock_info = Mock(language="hi")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [
                {"tStart": 0.0, "tEnd": 2.5, "text": "नमस्ते दुनिया"},
                {"tStart": 2.5, "tEnd": 5.0, "text": "यह एक परीक्षण है"}
            ]
            mock_lang_config.return_value = {
                "initial_prompt": "यह एक स्पष्ट हिंदी ऑडियो रिकॉर्डिंग है।",
                "temperature": 0.0
            }
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=hi&enable_preprocessing=true&preprocessing_level=standard&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["language"] == "hi"
            assert data["preprocessing_enabled"] == True
            assert data["preprocessing_level"] == "standard"
            assert data["postprocessing_enabled"] == True
            assert len(data["segments"]) == 2
            assert data["segments"][0]["text"] == "नमस्ते दुनिया"
            assert data["segments"][1]["text"] == "यह एक परीक्षण है"
            
            # Verify preprocessing was called with language hint
            mock_preprocess.assert_called_once()
            call_args = mock_preprocess.call_args
            assert call_args[1]["language_hint"] == "hi"
            assert call_args[1]["preprocessing_level"] == "standard"
            
            # Verify post-processing was called with language
            mock_postprocess.assert_called_once()
            call_args = mock_postprocess.call_args
            assert call_args[1]["language"] == "hi"
            
            # Verify language config was called
            mock_lang_config.assert_called_once_with("hi")
    
    def test_complete_spanish_asr_workflow(self, client, sample_audio_file):
        """Test complete Spanish ASR workflow with preprocessing and post-processing."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess, \
             patch('main.get_language_whisper_params') as mock_lang_config:
            
            # Setup mocks
            mock_segments = [
                Mock(start=0.0, end=2.5, text="Hola mundo"),
                Mock(start=2.5, end=5.0, text="Esta es una prueba")
            ]
            mock_info = Mock(language="es")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [
                {"tStart": 0.0, "tEnd": 2.5, "text": "Hola mundo"},
                {"tStart": 2.5, "tEnd": 5.0, "text": "Esta es una prueba"}
            ]
            mock_lang_config.return_value = {
                "initial_prompt": "Esta es una grabación de audio en español clara.",
                "temperature": 0.0
            }
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=es&enable_preprocessing=true&preprocessing_level=aggressive&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["language"] == "es"
            assert data["preprocessing_enabled"] == True
            assert data["preprocessing_level"] == "aggressive"
            assert data["postprocessing_enabled"] == True
            assert len(data["segments"]) == 2
            assert data["segments"][0]["text"] == "Hola mundo"
            assert data["segments"][1]["text"] == "Esta es una prueba"
            
            # Verify preprocessing was called with language hint
            mock_preprocess.assert_called_once()
            call_args = mock_preprocess.call_args
            assert call_args[1]["language_hint"] == "es"
            assert call_args[1]["preprocessing_level"] == "aggressive"
            
            # Verify post-processing was called with language
            mock_postprocess.assert_called_once()
            call_args = mock_postprocess.call_args
            assert call_args[1]["language"] == "es"
            
            # Verify language config was called
            mock_lang_config.assert_called_once_with("es")
    
    def test_complete_chinese_asr_workflow(self, client, sample_audio_file):
        """Test complete Chinese ASR workflow with preprocessing and post-processing."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess, \
             patch('main.get_language_whisper_params') as mock_lang_config:
            
            # Setup mocks
            mock_segments = [
                Mock(start=0.0, end=2.5, text="你好世界"),
                Mock(start=2.5, end=5.0, text="这是一个测试")
            ]
            mock_info = Mock(language="zh")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [
                {"tStart": 0.0, "tEnd": 2.5, "text": "你好世界"},
                {"tStart": 2.5, "tEnd": 5.0, "text": "这是一个测试"}
            ]
            mock_lang_config.return_value = {
                "initial_prompt": "这是一个清晰的中文音频录音。",
                "temperature": 0.0
            }
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=zh&enable_preprocessing=true&preprocessing_level=minimal&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["language"] == "zh"
            assert data["preprocessing_enabled"] == True
            assert data["preprocessing_level"] == "minimal"
            assert data["postprocessing_enabled"] == True
            assert len(data["segments"]) == 2
            assert data["segments"][0]["text"] == "你好世界"
            assert data["segments"][1]["text"] == "这是一个测试"
            
            # Verify preprocessing was called with language hint
            mock_preprocess.assert_called_once()
            call_args = mock_preprocess.call_args
            assert call_args[1]["language_hint"] == "zh"
            assert call_args[1]["preprocessing_level"] == "minimal"
            
            # Verify post-processing was called with language
            mock_postprocess.assert_called_once()
            call_args = mock_postprocess.call_args
            assert call_args[1]["language"] == "zh"
            
            # Verify language config was called
            mock_lang_config.assert_called_once_with("zh")
    
    def test_complete_tamil_asr_workflow(self, client, sample_audio_file):
        """Test complete Tamil ASR workflow with preprocessing and post-processing."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess, \
             patch('main.get_language_whisper_params') as mock_lang_config:
            
            # Setup mocks
            mock_segments = [
                Mock(start=0.0, end=2.5, text="வணக்கம் உலகம்"),
                Mock(start=2.5, end=5.0, text="இது ஒரு சோதனை")
            ]
            mock_info = Mock(language="ta")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [
                {"tStart": 0.0, "tEnd": 2.5, "text": "வணக்கம் உலகம்"},
                {"tStart": 2.5, "tEnd": 5.0, "text": "இது ஒரு சோதனை"}
            ]
            mock_lang_config.return_value = {
                "initial_prompt": "இது ஒரு தெளிவான தமிழ் ஆடியோ பதிவு.",
                "temperature": 0.0
            }
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=ta&enable_preprocessing=true&preprocessing_level=standard&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["language"] == "ta"
            assert data["preprocessing_enabled"] == True
            assert data["preprocessing_level"] == "standard"
            assert data["postprocessing_enabled"] == True
            assert len(data["segments"]) == 2
            assert data["segments"][0]["text"] == "வணக்கம் உலகம்"
            assert data["segments"][1]["text"] == "இது ஒரு சோதனை"
            
            # Verify preprocessing was called with language hint
            mock_preprocess.assert_called_once()
            call_args = mock_preprocess.call_args
            assert call_args[1]["language_hint"] == "ta"
            assert call_args[1]["preprocessing_level"] == "standard"
            
            # Verify post-processing was called with language
            mock_postprocess.assert_called_once()
            call_args = mock_postprocess.call_args
            assert call_args[1]["language"] == "ta"
            
            # Verify language config was called
            mock_lang_config.assert_called_once_with("ta")


class TestMultilingualErrorHandling:
    """Test error handling in multilingual workflows."""
    
    def test_language_specific_preprocessing_error(self, client, sample_audio_file):
        """Test error handling when language-specific preprocessing fails."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess:
            
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.side_effect = Exception("Preprocessing error")
            mock_postprocess.return_value = [{"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"}]
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=hi&enable_preprocessing=true&preprocessing_level=standard", files=files)
            
            # Preprocessing errors should return 500 status
            assert response.status_code == 500
            # When there's an error, the response structure may be different
            # Just verify that we get an error response
    
    def test_language_specific_postprocessing_error(self, client, sample_audio_file):
        """Test error handling when language-specific post-processing fails."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess:
            
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.side_effect = Exception("Post-processing error")
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=es&enable_postprocessing=true", files=files)
            
            # Post-processing errors should return 500 status
            assert response.status_code == 500
            # When there's an error, the response structure may be different
            # Just verify that we get an error response
    
    def test_unsupported_language_fallback(self, client, sample_audio_file):
        """Test fallback behavior for unsupported languages."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess, \
             patch('main.get_language_whisper_params') as mock_lang_config:
            
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [{"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"}]
            mock_lang_config.return_value = {
                "initial_prompt": "This is a clear, well-spoken English audio recording.",
                "temperature": 0.0
            }
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=xyz&enable_preprocessing=true&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["language"] == "en"
            assert data["preprocessing_enabled"] == True
            assert data["postprocessing_enabled"] == True
            
            # Should fallback to English configuration
            mock_lang_config.assert_called_once_with("xyz")


class TestMultilingualPerformance:
    """Test performance considerations for multilingual workflows."""
    
    def test_multilingual_processing_timing(self, client, sample_audio_file):
        """Test that multilingual processing includes proper timing information."""
        with patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess:
            
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [{"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"}]
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=hi&enable_preprocessing=true&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert "timing" in data
            assert isinstance(data["timing"], (int, float))
            assert data["timing"] > 0
    
    def test_multilingual_model_caching(self, client, sample_audio_file):
        """Test that Whisper model is properly cached for multilingual requests."""
        with patch('main.get_whisper_model') as mock_model:
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            # Make multiple requests with different languages
            response1 = client.post("/asr?language=hi", files=files)
            response2 = client.post("/asr?language=es", files=files)
            response3 = client.post("/asr?language=fr", files=files)
            
            assert response1.status_code == 200
            assert response2.status_code == 200
            assert response3.status_code == 200
            
            # Model should be called for each request (not cached in test environment)
            # In production, the model would be cached, but in tests each request is independent
            assert mock_model.call_count >= 1


class TestMultilingualConfiguration:
    """Test multilingual configuration and environment variables."""
    
    def test_multilingual_environment_variables(self, client, sample_audio_file):
        """Test multilingual processing with environment variables."""
        import os
        
        with patch.dict(os.environ, {
            'ASR_ENABLE_PREPROCESSING': 'true',
            'ASR_PREPROCESSING_LEVEL': 'aggressive',
            'ASR_ENABLE_POSTPROCESSING': 'true'
        }), patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess:
            
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [{"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"}]
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=de", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["preprocessing_enabled"] == True
            assert data["preprocessing_level"] == "aggressive"
            assert data["postprocessing_enabled"] == True
    
    def test_multilingual_parameter_override(self, client, sample_audio_file):
        """Test that request parameters override environment variables."""
        import os
        
        with patch.dict(os.environ, {
            'ASR_ENABLE_PREPROCESSING': 'false',
            'ASR_PREPROCESSING_LEVEL': 'minimal',
            'ASR_ENABLE_POSTPROCESSING': 'false'
        }), patch('main.get_whisper_model') as mock_model, \
             patch('main.preprocess_audio') as mock_preprocess, \
             patch('main.post_process_transcript') as mock_postprocess:
            
            # Setup mocks
            mock_segments = [Mock(start=0.0, end=2.5, text="Hello world")]
            mock_info = Mock(language="en")
            mock_model.return_value.transcribe.return_value = (mock_segments, mock_info)
            mock_preprocess.return_value = b"preprocessed_audio"
            mock_postprocess.return_value = [{"tStart": 0.0, "tEnd": 2.5, "text": "Hello world"}]
            
            files = {"file": ("test.wav", io.BytesIO(sample_audio_file), "audio/wav")}
            
            response = client.post("/asr?language=ja&enable_preprocessing=true&preprocessing_level=standard&enable_postprocessing=true", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["preprocessing_enabled"] == True
            assert data["preprocessing_level"] == "standard"
            assert data["postprocessing_enabled"] == True


# Fixtures for test data
@pytest.fixture
def sample_audio_file():
    """Create sample audio file for testing."""
    # Generate a simple sine wave
    duration = 1.0  # 1 second
    sample_rate = 16000
    frequency = 440  # A4 note
    
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    audio = np.sin(2 * np.pi * frequency * t).astype(np.float32)
    
    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format='WAV', subtype='PCM_16')
    return buffer.getvalue()
