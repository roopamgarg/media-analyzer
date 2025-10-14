"""
Language-specific configuration for ASR optimization.
Provides language-specific parameters for Whisper transcription and audio preprocessing.
"""

from typing import Dict, Any, Tuple
import os

# Language-specific Whisper parameters
LANGUAGE_WHISPER_PARAMS: Dict[str, Dict[str, Any]] = {
    "en": {
        "initial_prompt": "This is a clear, well-spoken English audio recording.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "hi": {
        "initial_prompt": "यह एक स्पष्ट हिंदी ऑडियो रिकॉर्डिंग है।",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "es": {
        "initial_prompt": "Esta es una grabación de audio en español clara.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "fr": {
        "initial_prompt": "Ceci est un enregistrement audio français clair.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "de": {
        "initial_prompt": "Dies ist eine klare deutsche Audioaufnahme.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "ta": {
        "initial_prompt": "இது ஒரு தெளிவான தமிழ் ஆடியோ பதிவு.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "te": {
        "initial_prompt": "ఇది స్పష్టమైన తెలుగు ఆడియో రికార్డింగ్.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "bn": {
        "initial_prompt": "এটি একটি স্পষ্ট বাংলা অডিও রেকর্ডিং।",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "zh": {
        "initial_prompt": "这是一个清晰的中文音频录音。",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "ja": {
        "initial_prompt": "これは明確な日本語の音声録音です。",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
    "ko": {
        "initial_prompt": "이것은 명확한 한국어 오디오 녹음입니다.",
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
    },
}

# Language-specific audio preprocessing frequency ranges
LANGUAGE_FREQUENCY_RANGES: Dict[str, Tuple[float, float]] = {
    "en": (200, 8000),    # European languages - focus on speech frequencies
    "es": (200, 8000),
    "fr": (200, 8000),
    "de": (200, 8000),
    "hi": (100, 8000),    # Indian languages - wider range for tonal languages
    "ta": (100, 8000),
    "te": (100, 8000),
    "bn": (100, 8000),
    "zh": (150, 8000),    # East Asian languages
    "ja": (150, 8000),
    "ko": (150, 8000),
}

# Language-specific post-processing rules
LANGUAGE_POSTPROCESSING: Dict[str, Dict[str, Any]] = {
    "en": {
        "filler_words": ["um", "uh", "er", "ah", "like", "you know", "so"],
        "common_errors": {
            r"\bto\b": "to",
            r"\btwo\b": "two",
            r"\bfor\b": "for",
            r"\bfour\b": "four",
        }
    },
    "hi": {
        "filler_words": ["अ", "उम", "तो", "फिर"],
        "common_errors": {}
    },
    "es": {
        "filler_words": ["eh", "um", "este", "bueno"],
        "common_errors": {}
    },
    "fr": {
        "filler_words": ["euh", "ben", "alors"],
        "common_errors": {}
    },
    "de": {
        "filler_words": ["äh", "ähm", "also"],
        "common_errors": {}
    },
}

def get_language_whisper_params(language: str) -> Dict[str, Any]:
    """
    Get language-specific Whisper parameters.
    
    Args:
        language: Language code (e.g., 'en', 'hi', 'es')
        
    Returns:
        Dictionary of Whisper parameters optimized for the language
    """
    return LANGUAGE_WHISPER_PARAMS.get(language, LANGUAGE_WHISPER_PARAMS["en"])

def get_language_frequency_range(language: str) -> Tuple[float, float]:
    """
    Get language-specific frequency range for audio preprocessing.
    
    Args:
        language: Language code (e.g., 'en', 'hi', 'es')
        
    Returns:
        Tuple of (low_cutoff, high_cutoff) frequencies in Hz
    """
    return LANGUAGE_FREQUENCY_RANGES.get(language, (80, 8000))

def get_language_postprocessing_rules(language: str) -> Dict[str, Any]:
    """
    Get language-specific post-processing rules.
    
    Args:
        language: Language code (e.g., 'en', 'hi', 'es')
        
    Returns:
        Dictionary of post-processing rules for the language
    """
    return LANGUAGE_POSTPROCESSING.get(language, LANGUAGE_POSTPROCESSING["en"])

def get_supported_languages() -> list:
    """
    Get list of supported language codes.
    
    Returns:
        List of supported language codes
    """
    return list(LANGUAGE_WHISPER_PARAMS.keys())

def is_language_supported(language: str) -> bool:
    """
    Check if a language is supported.
    
    Args:
        language: Language code to check
        
    Returns:
        True if language is supported, False otherwise
    """
    return language in LANGUAGE_WHISPER_PARAMS

