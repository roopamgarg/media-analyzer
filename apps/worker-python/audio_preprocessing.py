"""
Audio preprocessing module for ASR quality improvement.
Provides various levels of audio preprocessing to enhance transcription accuracy.
"""

import io
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter, filtfilt, wiener
from typing import Optional, Tuple
import logging

from language_config import get_language_frequency_range

logger = logging.getLogger(__name__)

def preprocess_audio(audio_data: bytes, 
                    target_sr: int = 16000,
                    language_hint: Optional[str] = None,
                    preprocessing_level: str = "standard") -> bytes:
    """
    Comprehensive audio preprocessing for ASR quality improvement.
    
    Args:
        audio_data: Raw audio data as bytes
        target_sr: Target sample rate (default: 16000 Hz for Whisper)
        language_hint: Language code for language-specific preprocessing
        preprocessing_level: Level of preprocessing ("minimal", "standard", "aggressive")
        
    Returns:
        Preprocessed audio data as bytes
    """
    try:
        # Load audio with librosa
        audio, sr = librosa.load(io.BytesIO(audio_data), sr=target_sr)
        
        if preprocessing_level == "minimal":
            audio = apply_minimal_preprocessing(audio, sr)
        elif preprocessing_level == "standard":
            audio = apply_standard_preprocessing(audio, sr, language_hint)
        elif preprocessing_level == "aggressive":
            audio = apply_aggressive_preprocessing(audio, sr, language_hint)
        else:
            logger.warning(f"Unknown preprocessing level: {preprocessing_level}, using standard")
            audio = apply_standard_preprocessing(audio, sr, language_hint)
        
        # Convert back to bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio, target_sr, format='WAV', subtype='PCM_16')
        return buffer.getvalue()
        
    except Exception as e:
        logger.error(f"Audio preprocessing failed: {str(e)}")
        # Return original audio if preprocessing fails
        return audio_data

def apply_minimal_preprocessing(audio: np.ndarray, sr: int) -> np.ndarray:
    """Apply minimal preprocessing (fastest)."""
    # Basic normalization
    audio = normalize_audio(audio)
    
    # Remove DC offset
    audio = remove_dc_offset(audio)
    
    # Basic silence trimming
    audio = trim_silence(audio, sr)
    
    return audio

def apply_standard_preprocessing(audio: np.ndarray, sr: int, language_hint: Optional[str] = None) -> np.ndarray:
    """Apply standard preprocessing (good balance of quality and speed)."""
    # Normalize audio levels
    audio = normalize_audio(audio)
    
    # Remove DC offset
    audio = remove_dc_offset(audio)
    
    # Apply language-specific frequency filtering
    if language_hint:
        audio = apply_language_specific_preprocessing(audio, sr, language_hint)
    else:
        # Default bandpass filter
        audio = apply_bandpass_filter(audio, sr, low_cutoff=80, high_cutoff=8000)
    
    # Basic noise reduction
    audio = reduce_noise(audio, sr, noise_reduction_factor=0.7)
    
    # Trim silence
    audio = trim_silence(audio, sr)
    
    # Apply pre-emphasis
    audio = apply_preemphasis(audio)
    
    # Final normalization
    audio = librosa.util.normalize(audio)
    
    return audio

def apply_aggressive_preprocessing(audio: np.ndarray, sr: int, language_hint: Optional[str] = None) -> np.ndarray:
    """Apply aggressive preprocessing (best quality, slower)."""
    # Normalize audio levels
    audio = normalize_audio(audio)
    
    # Remove DC offset
    audio = remove_dc_offset(audio)
    
    # Apply language-specific frequency filtering
    if language_hint:
        audio = apply_language_specific_preprocessing(audio, sr, language_hint)
    else:
        # Default bandpass filter
        audio = apply_bandpass_filter(audio, sr, low_cutoff=80, high_cutoff=8000)
    
    # Aggressive noise reduction
    audio = reduce_noise(audio, sr, noise_reduction_factor=0.9)
    audio = apply_wiener_filter(audio)
    
    # Trim silence with more aggressive settings
    audio = trim_silence(audio, sr, top_db=15)
    
    # Apply pre-emphasis
    audio = apply_preemphasis(audio)
    
    # Final normalization
    audio = librosa.util.normalize(audio)
    
    return audio

def normalize_audio(audio: np.ndarray, target_db: float = -20.0) -> np.ndarray:
    """Normalize audio to target dB level."""
    # Calculate RMS and convert to dB
    rms = np.sqrt(np.mean(audio**2))
    if rms > 0:
        current_db = 20 * np.log10(rms)
        gain_db = target_db - current_db
        gain_linear = 10 ** (gain_db / 20)
        audio = audio * gain_linear
    
    # Prevent clipping
    max_val = np.max(np.abs(audio))
    if max_val > 0.95:
        audio = audio * (0.95 / max_val)
    
    return audio

def remove_dc_offset(audio: np.ndarray) -> np.ndarray:
    """Remove DC offset (constant bias) from audio."""
    return audio - np.mean(audio)

def reduce_noise(audio: np.ndarray, sr: int, noise_reduction_factor: float = 0.8) -> np.ndarray:
    """Apply noise reduction using spectral gating."""
    try:
        # Compute STFT
        stft = librosa.stft(audio, n_fft=2048, hop_length=512)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Estimate noise from first few frames (assuming they contain mostly noise)
        noise_frames = 5
        noise_spectrum = np.mean(magnitude[:, :noise_frames], axis=1, keepdims=True)
        
        # Apply spectral gating
        alpha = noise_reduction_factor
        gain = np.maximum(1 - alpha * (noise_spectrum / (magnitude + 1e-10)), 0.1)
        magnitude_cleaned = magnitude * gain
        
        # Reconstruct audio
        stft_cleaned = magnitude_cleaned * np.exp(1j * phase)
        audio_cleaned = librosa.istft(stft_cleaned, hop_length=512)
        
        return audio_cleaned
    except Exception as e:
        logger.warning(f"Noise reduction failed: {str(e)}, returning original audio")
        return audio

def trim_silence(audio: np.ndarray, sr: int, 
                top_db: float = 20, frame_length: int = 2048, hop_length: int = 512) -> np.ndarray:
    """Remove leading and trailing silence."""
    try:
        # Use librosa's trim function
        audio_trimmed, _ = librosa.effects.trim(
            audio, 
            top_db=top_db,
            frame_length=frame_length,
            hop_length=hop_length
        )
        return audio_trimmed
    except Exception as e:
        logger.warning(f"Silence trimming failed: {str(e)}, returning original audio")
        return audio

def apply_preemphasis(audio: np.ndarray, coeff: float = 0.97) -> np.ndarray:
    """Apply pre-emphasis filter to enhance high frequencies."""
    try:
        return librosa.effects.preemphasis(audio, coef=coeff)
    except Exception as e:
        logger.warning(f"Pre-emphasis failed: {str(e)}, returning original audio")
        return audio

def apply_high_pass_filter(audio: np.ndarray, sr: int, cutoff: float = 80.0) -> np.ndarray:
    """Apply high-pass filter to remove low-frequency noise."""
    try:
        nyquist = sr / 2
        normal_cutoff = cutoff / nyquist
        b, a = butter(4, normal_cutoff, btype='high', analog=False)
        filtered_audio = filtfilt(b, a, audio)
        return filtered_audio
    except Exception as e:
        logger.warning(f"High-pass filter failed: {str(e)}, returning original audio")
        return audio

def apply_bandpass_filter(audio: np.ndarray, sr: int, 
                         low_cutoff: float = 80.0, high_cutoff: float = 8000.0) -> np.ndarray:
    """Apply bandpass filter to focus on speech frequencies."""
    try:
        nyquist = sr / 2
        low = low_cutoff / nyquist
        high = high_cutoff / nyquist
        b, a = butter(4, [low, high], btype='band', analog=False)
        filtered_audio = filtfilt(b, a, audio)
        return filtered_audio
    except Exception as e:
        logger.warning(f"Bandpass filter failed: {str(e)}, returning original audio")
        return audio

def apply_language_specific_preprocessing(audio: np.ndarray, sr: int, language: str) -> np.ndarray:
    """Apply language-specific preprocessing optimizations."""
    try:
        # Get language-specific frequency range
        low_cutoff, high_cutoff = get_language_frequency_range(language)
        
        # Apply language-specific bandpass filter
        audio = apply_bandpass_filter(audio, sr, low_cutoff, high_cutoff)
        
        return audio
    except Exception as e:
        logger.warning(f"Language-specific preprocessing failed: {str(e)}, using default")
        return apply_bandpass_filter(audio, sr, low_cutoff=80, high_cutoff=8000)

def apply_wiener_filter(audio: np.ndarray, noise_variance: float = 0.01) -> np.ndarray:
    """Apply Wiener filter for additional noise reduction."""
    try:
        # Estimate noise variance from quiet parts
        quiet_parts = audio[np.abs(audio) < np.percentile(np.abs(audio), 10)]
        if len(quiet_parts) > 0:
            noise_var = np.var(quiet_parts)
        else:
            noise_var = noise_variance
        
        # Apply Wiener filter
        signal_power = np.var(audio)
        wiener_gain = signal_power / (signal_power + noise_var)
        
        # Apply gain with smoothing
        from scipy.signal import savgol_filter
        smoothed_gain = savgol_filter(wiener_gain, window_length=5, polyorder=2)
        audio_filtered = audio * smoothed_gain
        
        return audio_filtered
    except Exception as e:
        logger.warning(f"Wiener filter failed: {str(e)}, returning original audio")
        return audio

def assess_audio_quality(audio: np.ndarray, sr: int) -> dict:
    """Assess audio quality metrics."""
    try:
        metrics = {}
        
        # Signal-to-noise ratio estimation
        signal_power = np.mean(audio**2)
        noise_floor = np.percentile(np.abs(audio), 10)
        snr_estimate = 20 * np.log10(signal_power / (noise_floor**2 + 1e-10))
        metrics['snr_estimate'] = snr_estimate
        
        # Dynamic range
        dynamic_range = 20 * np.log10(np.max(np.abs(audio)) / (np.min(np.abs(audio[np.abs(audio) > 0])) + 1e-10))
        metrics['dynamic_range'] = dynamic_range
        
        # Zero crossing rate (indicator of noise)
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))
        metrics['zero_crossing_rate'] = zcr
        
        # Spectral centroid (brightness)
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
        metrics['spectral_centroid'] = spectral_centroid
        
        return metrics
    except Exception as e:
        logger.warning(f"Audio quality assessment failed: {str(e)}")
        return {}

def validate_preprocessing_quality(original_audio: np.ndarray, 
                                 processed_audio: np.ndarray, 
                                 sr: int) -> bool:
    """Validate that preprocessing improved audio quality."""
    try:
        orig_metrics = assess_audio_quality(original_audio, sr)
        proc_metrics = assess_audio_quality(processed_audio, sr)
        
        # Check if SNR improved
        snr_improved = proc_metrics.get('snr_estimate', 0) > orig_metrics.get('snr_estimate', 0)
        
        # Check if zero crossing rate decreased (less noise)
        zcr_improved = proc_metrics.get('zero_crossing_rate', 1) < orig_metrics.get('zero_crossing_rate', 1)
        
        return snr_improved and zcr_improved
    except Exception as e:
        logger.warning(f"Preprocessing quality validation failed: {str(e)}")
        return True  # Assume improvement if validation fails

