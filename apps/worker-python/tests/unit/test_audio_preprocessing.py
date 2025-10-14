"""
Unit tests for the audio preprocessing module
"""
import pytest
import numpy as np
import io
from unittest.mock import patch, Mock
import librosa
import soundfile as sf

from audio_preprocessing import (
    preprocess_audio,
    apply_minimal_preprocessing,
    apply_standard_preprocessing,
    apply_aggressive_preprocessing,
    normalize_audio,
    remove_dc_offset,
    reduce_noise,
    trim_silence,
    apply_preemphasis,
    apply_high_pass_filter,
    apply_bandpass_filter,
    apply_language_specific_preprocessing,
    apply_wiener_filter,
    assess_audio_quality,
    validate_preprocessing_quality
)


class TestAudioPreprocessing:
    """Test the main audio preprocessing function."""
    
    def test_preprocess_audio_minimal(self, sample_audio_data):
        """Test minimal preprocessing level."""
        result = preprocess_audio(sample_audio_data, preprocessing_level="minimal")
        
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result != sample_audio_data  # Should be processed
    
    def test_preprocess_audio_standard(self, sample_audio_data):
        """Test standard preprocessing level."""
        result = preprocess_audio(sample_audio_data, preprocessing_level="standard")
        
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result != sample_audio_data  # Should be processed
    
    def test_preprocess_audio_aggressive(self, sample_audio_data):
        """Test aggressive preprocessing level."""
        result = preprocess_audio(sample_audio_data, preprocessing_level="aggressive")
        
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result != sample_audio_data  # Should be processed
    
    def test_preprocess_audio_with_language_hint(self, sample_audio_data):
        """Test preprocessing with language hint."""
        result = preprocess_audio(
            sample_audio_data, 
            preprocessing_level="standard",
            language_hint="en"
        )
        
        assert isinstance(result, bytes)
        assert len(result) > 0
    
    def test_preprocess_audio_invalid_level(self, sample_audio_data):
        """Test preprocessing with invalid level (should fallback to standard)."""
        result = preprocess_audio(sample_audio_data, preprocessing_level="invalid")
        
        assert isinstance(result, bytes)
        assert len(result) > 0
    
    def test_preprocess_audio_processing_error(self):
        """Test preprocessing with processing error (should return original)."""
        invalid_audio = b"not audio data"
        result = preprocess_audio(invalid_audio, preprocessing_level="standard")
        
        assert result == invalid_audio  # Should return original on error


class TestMinimalPreprocessing:
    """Test minimal preprocessing functions."""
    
    def test_apply_minimal_preprocessing(self, sample_audio_array):
        """Test minimal preprocessing application."""
        result = apply_minimal_preprocessing(sample_audio_array, 16000)
        
        assert isinstance(result, np.ndarray)
        assert len(result) > 0
        assert not np.array_equal(result, sample_audio_array)  # Should be processed
    
    def test_normalize_audio(self, sample_audio_array):
        """Test audio normalization."""
        result = normalize_audio(sample_audio_array, target_db=-20.0)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)
        assert not np.array_equal(result, sample_audio_array)  # Should be normalized
    
    def test_remove_dc_offset(self, sample_audio_array):
        """Test DC offset removal."""
        # Add DC offset
        audio_with_offset = sample_audio_array + 0.1
        result = remove_dc_offset(audio_with_offset)
        
        assert isinstance(result, np.ndarray)
        assert abs(np.mean(result)) < 0.01  # Should have near-zero mean
    
    def test_trim_silence(self, sample_audio_array):
        """Test silence trimming."""
        result = trim_silence(sample_audio_array, 16000)
        
        assert isinstance(result, np.ndarray)
        assert len(result) <= len(sample_audio_array)  # Should be same or shorter


class TestStandardPreprocessing:
    """Test standard preprocessing functions."""
    
    def test_apply_standard_preprocessing(self, sample_audio_array):
        """Test standard preprocessing application."""
        result = apply_standard_preprocessing(sample_audio_array, 16000)
        
        assert isinstance(result, np.ndarray)
        assert len(result) > 0
        assert not np.array_equal(result, sample_audio_array)  # Should be processed
    
    def test_apply_standard_preprocessing_with_language(self, sample_audio_array):
        """Test standard preprocessing with language hint."""
        result = apply_standard_preprocessing(sample_audio_array, 16000, "en")
        
        assert isinstance(result, np.ndarray)
        assert len(result) > 0
    
    def test_reduce_noise(self, sample_audio_array):
        """Test noise reduction."""
        result = reduce_noise(sample_audio_array, 16000, noise_reduction_factor=0.7)
        
        assert isinstance(result, np.ndarray)
        # Note: STFT processing may change the length slightly due to hop_length
        assert abs(len(result) - len(sample_audio_array)) <= 512  # Allow for STFT hop_length difference
    
    def test_apply_preemphasis(self, sample_audio_array):
        """Test pre-emphasis application."""
        result = apply_preemphasis(sample_audio_array, coeff=0.97)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)
        assert not np.array_equal(result, sample_audio_array)  # Should be processed


class TestAggressivePreprocessing:
    """Test aggressive preprocessing functions."""
    
    def test_apply_aggressive_preprocessing(self, sample_audio_array):
        """Test aggressive preprocessing application."""
        result = apply_aggressive_preprocessing(sample_audio_array, 16000)
        
        assert isinstance(result, np.ndarray)
        assert len(result) > 0
        assert not np.array_equal(result, sample_audio_array)  # Should be processed
    
    def test_apply_aggressive_preprocessing_with_language(self, sample_audio_array):
        """Test aggressive preprocessing with language hint."""
        result = apply_aggressive_preprocessing(sample_audio_array, 16000, "hi")
        
        assert isinstance(result, np.ndarray)
        assert len(result) > 0
    
    def test_apply_wiener_filter(self, sample_audio_array):
        """Test Wiener filter application."""
        result = apply_wiener_filter(sample_audio_array, noise_variance=0.01)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)


class TestFilteringFunctions:
    """Test audio filtering functions."""
    
    def test_apply_high_pass_filter(self, sample_audio_array):
        """Test high-pass filter application."""
        result = apply_high_pass_filter(sample_audio_array, 16000, cutoff=80.0)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)
    
    def test_apply_bandpass_filter(self, sample_audio_array):
        """Test bandpass filter application."""
        result = apply_bandpass_filter(sample_audio_array, 16000, 80.0, 8000.0)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)
    
    def test_apply_language_specific_preprocessing(self, sample_audio_array):
        """Test language-specific preprocessing."""
        result = apply_language_specific_preprocessing(sample_audio_array, 16000, "en")
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)
    
    def test_apply_language_specific_preprocessing_unsupported_language(self, sample_audio_array):
        """Test language-specific preprocessing with unsupported language."""
        result = apply_language_specific_preprocessing(sample_audio_array, 16000, "xyz")
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)


class TestAudioQualityAssessment:
    """Test audio quality assessment functions."""
    
    def test_assess_audio_quality(self, sample_audio_array):
        """Test audio quality assessment."""
        metrics = assess_audio_quality(sample_audio_array, 16000)
        
        assert isinstance(metrics, dict)
        assert 'snr_estimate' in metrics
        assert 'dynamic_range' in metrics
        assert 'zero_crossing_rate' in metrics
        assert 'spectral_centroid' in metrics
    
    def test_validate_preprocessing_quality(self, sample_audio_array):
        """Test preprocessing quality validation."""
        # Create a processed version (simplified)
        processed_audio = sample_audio_array * 0.8  # Simulate processing
        
        is_improved = validate_preprocessing_quality(sample_audio_array, processed_audio, 16000)
        
        # Convert numpy boolean to Python boolean if needed
        assert isinstance(is_improved, (bool, np.bool_))
        assert bool(is_improved) in [True, False]
    
    def test_assess_audio_quality_with_error(self):
        """Test audio quality assessment with invalid input."""
        invalid_audio = np.array([])  # Empty array
        metrics = assess_audio_quality(invalid_audio, 16000)
        
        assert isinstance(metrics, dict)
        assert len(metrics) == 0  # Should return empty dict on error


class TestErrorHandling:
    """Test error handling in audio preprocessing."""
    
    def test_preprocess_audio_with_librosa_error(self, sample_audio_data):
        """Test preprocessing with librosa error."""
        with patch('audio_preprocessing.librosa.load') as mock_load:
            mock_load.side_effect = Exception("Librosa error")
            
            result = preprocess_audio(sample_audio_data, preprocessing_level="standard")
            
            assert result == sample_audio_data  # Should return original on error
    
    def test_preprocess_audio_with_soundfile_error(self, sample_audio_data):
        """Test preprocessing with soundfile error."""
        with patch('audio_preprocessing.sf.write') as mock_write:
            mock_write.side_effect = Exception("Soundfile error")
            
            result = preprocess_audio(sample_audio_data, preprocessing_level="standard")
            
            assert result == sample_audio_data  # Should return original on error
    
    def test_reduce_noise_with_error(self, sample_audio_array):
        """Test noise reduction with error."""
        with patch('audio_preprocessing.librosa.stft') as mock_stft:
            mock_stft.side_effect = Exception("STFT error")
            
            result = reduce_noise(sample_audio_array, 16000)
            
            assert np.array_equal(result, sample_audio_array)  # Should return original
    
    def test_trim_silence_with_error(self, sample_audio_array):
        """Test silence trimming with error."""
        with patch('audio_preprocessing.librosa.effects.trim') as mock_trim:
            mock_trim.side_effect = Exception("Trim error")
            
            result = trim_silence(sample_audio_array, 16000)
            
            assert np.array_equal(result, sample_audio_array)  # Should return original


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_preprocess_audio_empty_data(self):
        """Test preprocessing with empty audio data."""
        empty_audio = b""
        result = preprocess_audio(empty_audio, preprocessing_level="standard")
        
        assert result == empty_audio  # Should return original
    
    def test_preprocess_audio_very_short_data(self):
        """Test preprocessing with very short audio data."""
        short_audio = b"short"
        result = preprocess_audio(short_audio, preprocessing_level="standard")
        
        assert result == short_audio  # Should return original on error
    
    def test_normalize_audio_zero_signal(self):
        """Test normalization with zero signal."""
        zero_audio = np.zeros(1000)
        result = normalize_audio(zero_audio, target_db=-20.0)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(zero_audio)
    
    def test_trim_silence_all_silence(self):
        """Test trimming with all silence."""
        silence = np.zeros(1000)
        result = trim_silence(silence, 16000)
        
        assert isinstance(result, np.ndarray)
        assert len(result) <= len(silence)
    
    def test_apply_bandpass_filter_edge_frequencies(self, sample_audio_array):
        """Test bandpass filter with edge frequencies."""
        # Test with very low frequencies
        result = apply_bandpass_filter(sample_audio_array, 16000, 1.0, 2.0)
        
        assert isinstance(result, np.ndarray)
        assert len(result) == len(sample_audio_array)


class TestPerformanceAndMemory:
    """Test performance and memory considerations."""
    
    def test_preprocess_audio_large_data(self):
        """Test preprocessing with large audio data."""
        # Create larger audio data
        large_audio = np.random.randn(16000 * 10).astype(np.float32)  # 10 seconds at 16kHz
        buffer = io.BytesIO()
        sf.write(buffer, large_audio, 16000, format='WAV', subtype='PCM_16')
        large_audio_bytes = buffer.getvalue()
        
        result = preprocess_audio(large_audio_bytes, preprocessing_level="standard")
        
        assert isinstance(result, bytes)
        assert len(result) > 0
    
    def test_memory_usage_consistency(self, sample_audio_data):
        """Test that preprocessing doesn't cause memory leaks."""
        # Process multiple times to check for memory issues
        for _ in range(10):
            result = preprocess_audio(sample_audio_data, preprocessing_level="standard")
            assert isinstance(result, bytes)
            del result  # Explicit cleanup


# Fixtures for test data
@pytest.fixture
def sample_audio_data():
    """Create sample audio data for testing."""
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


@pytest.fixture
def sample_audio_array():
    """Create sample audio array for testing."""
    # Generate a simple sine wave
    duration = 1.0  # 1 second
    sample_rate = 16000
    frequency = 440  # A4 note
    
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    return np.sin(2 * np.pi * frequency * t).astype(np.float32)
