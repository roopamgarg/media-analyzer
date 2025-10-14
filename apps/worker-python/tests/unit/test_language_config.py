"""
Unit tests for the language configuration module
"""
import pytest

from language_config import (
    get_language_whisper_params,
    get_language_frequency_range,
    get_language_postprocessing_rules,
    get_supported_languages,
    is_language_supported,
    LANGUAGE_WHISPER_PARAMS,
    LANGUAGE_FREQUENCY_RANGES,
    LANGUAGE_POSTPROCESSING
)


class TestLanguageWhisperParams:
    """Test language-specific Whisper parameters."""
    
    def test_get_language_whisper_params_english(self):
        """Test getting English Whisper parameters."""
        params = get_language_whisper_params("en")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert "temperature" in params
        assert "compression_ratio_threshold" in params
        assert "log_prob_threshold" in params
        assert "no_speech_threshold" in params
        assert params["initial_prompt"] == "This is a clear, well-spoken English audio recording."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_hindi(self):
        """Test getting Hindi Whisper parameters."""
        params = get_language_whisper_params("hi")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "यह एक स्पष्ट हिंदी ऑडियो रिकॉर्डिंग है।"
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_spanish(self):
        """Test getting Spanish Whisper parameters."""
        params = get_language_whisper_params("es")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "Esta es una grabación de audio en español clara."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_french(self):
        """Test getting French Whisper parameters."""
        params = get_language_whisper_params("fr")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "Ceci est un enregistrement audio français clair."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_german(self):
        """Test getting German Whisper parameters."""
        params = get_language_whisper_params("de")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "Dies ist eine klare deutsche Audioaufnahme."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_tamil(self):
        """Test getting Tamil Whisper parameters."""
        params = get_language_whisper_params("ta")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "இது ஒரு தெளிவான தமிழ் ஆடியோ பதிவு."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_telugu(self):
        """Test getting Telugu Whisper parameters."""
        params = get_language_whisper_params("te")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "ఇది స్పష్టమైన తెలుగు ఆడియో రికార్డింగ్."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_bengali(self):
        """Test getting Bengali Whisper parameters."""
        params = get_language_whisper_params("bn")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "এটি একটি স্পষ্ট বাংলা অডিও রেকর্ডিং।"
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_chinese(self):
        """Test getting Chinese Whisper parameters."""
        params = get_language_whisper_params("zh")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "这是一个清晰的中文音频录音。"
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_japanese(self):
        """Test getting Japanese Whisper parameters."""
        params = get_language_whisper_params("ja")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "これは明確な日本語の音声録音です。"
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_korean(self):
        """Test getting Korean Whisper parameters."""
        params = get_language_whisper_params("ko")
        
        assert isinstance(params, dict)
        assert "initial_prompt" in params
        assert params["initial_prompt"] == "이것은 명확한 한국어 오디오 녹음입니다."
        assert params["temperature"] == 0.0
    
    def test_get_language_whisper_params_unsupported_language(self):
        """Test getting parameters for unsupported language (should fallback to English)."""
        params = get_language_whisper_params("xyz")
        
        assert isinstance(params, dict)
        assert params == LANGUAGE_WHISPER_PARAMS["en"]
    
    def test_get_language_whisper_params_none_language(self):
        """Test getting parameters for None language (should fallback to English)."""
        params = get_language_whisper_params(None)
        
        assert isinstance(params, dict)
        assert params == LANGUAGE_WHISPER_PARAMS["en"]
    
    def test_get_language_whisper_params_empty_string(self):
        """Test getting parameters for empty string (should fallback to English)."""
        params = get_language_whisper_params("")
        
        assert isinstance(params, dict)
        assert params == LANGUAGE_WHISPER_PARAMS["en"]


class TestLanguageFrequencyRanges:
    """Test language-specific frequency ranges."""
    
    def test_get_language_frequency_range_english(self):
        """Test getting English frequency range."""
        low, high = get_language_frequency_range("en")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 200
        assert high == 8000
    
    def test_get_language_frequency_range_spanish(self):
        """Test getting Spanish frequency range."""
        low, high = get_language_frequency_range("es")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 200.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_french(self):
        """Test getting French frequency range."""
        low, high = get_language_frequency_range("fr")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 200.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_german(self):
        """Test getting German frequency range."""
        low, high = get_language_frequency_range("de")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 200.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_hindi(self):
        """Test getting Hindi frequency range."""
        low, high = get_language_frequency_range("hi")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 100.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_tamil(self):
        """Test getting Tamil frequency range."""
        low, high = get_language_frequency_range("ta")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 100.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_telugu(self):
        """Test getting Telugu frequency range."""
        low, high = get_language_frequency_range("te")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 100.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_bengali(self):
        """Test getting Bengali frequency range."""
        low, high = get_language_frequency_range("bn")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 100.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_chinese(self):
        """Test getting Chinese frequency range."""
        low, high = get_language_frequency_range("zh")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 150.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_japanese(self):
        """Test getting Japanese frequency range."""
        low, high = get_language_frequency_range("ja")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 150.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_korean(self):
        """Test getting Korean frequency range."""
        low, high = get_language_frequency_range("ko")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 150.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_unsupported_language(self):
        """Test getting frequency range for unsupported language (should use default)."""
        low, high = get_language_frequency_range("xyz")
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 80.0
        assert high == 8000.0
    
    def test_get_language_frequency_range_none_language(self):
        """Test getting frequency range for None language (should use default)."""
        low, high = get_language_frequency_range(None)
        
        assert isinstance(low, (int, float))
        assert isinstance(high, (int, float))
        assert low == 80.0
        assert high == 8000.0


class TestLanguagePostprocessingRules:
    """Test language-specific post-processing rules."""
    
    def test_get_language_postprocessing_rules_english(self):
        """Test getting English post-processing rules."""
        rules = get_language_postprocessing_rules("en")
        
        assert isinstance(rules, dict)
        assert "filler_words" in rules
        assert "common_errors" in rules
        assert isinstance(rules["filler_words"], list)
        assert isinstance(rules["common_errors"], dict)
        assert "um" in rules["filler_words"]
        assert "uh" in rules["filler_words"]
        assert "er" in rules["filler_words"]
    
    def test_get_language_postprocessing_rules_hindi(self):
        """Test getting Hindi post-processing rules."""
        rules = get_language_postprocessing_rules("hi")
        
        assert isinstance(rules, dict)
        assert "filler_words" in rules
        assert "common_errors" in rules
        assert isinstance(rules["filler_words"], list)
        assert isinstance(rules["common_errors"], dict)
        assert "अ" in rules["filler_words"]
        assert "उम" in rules["filler_words"]
        assert "तो" in rules["filler_words"]
    
    def test_get_language_postprocessing_rules_spanish(self):
        """Test getting Spanish post-processing rules."""
        rules = get_language_postprocessing_rules("es")
        
        assert isinstance(rules, dict)
        assert "filler_words" in rules
        assert "common_errors" in rules
        assert isinstance(rules["filler_words"], list)
        assert isinstance(rules["common_errors"], dict)
        assert "eh" in rules["filler_words"]
        assert "um" in rules["filler_words"]
        assert "este" in rules["filler_words"]
    
    def test_get_language_postprocessing_rules_french(self):
        """Test getting French post-processing rules."""
        rules = get_language_postprocessing_rules("fr")
        
        assert isinstance(rules, dict)
        assert "filler_words" in rules
        assert "common_errors" in rules
        assert isinstance(rules["filler_words"], list)
        assert isinstance(rules["common_errors"], dict)
        assert "euh" in rules["filler_words"]
        assert "ben" in rules["filler_words"]
        assert "alors" in rules["filler_words"]
    
    def test_get_language_postprocessing_rules_german(self):
        """Test getting German post-processing rules."""
        rules = get_language_postprocessing_rules("de")
        
        assert isinstance(rules, dict)
        assert "filler_words" in rules
        assert "common_errors" in rules
        assert isinstance(rules["filler_words"], list)
        assert isinstance(rules["common_errors"], dict)
        assert "äh" in rules["filler_words"]
        assert "ähm" in rules["filler_words"]
        assert "also" in rules["filler_words"]
    
    def test_get_language_postprocessing_rules_unsupported_language(self):
        """Test getting post-processing rules for unsupported language (should fallback to English)."""
        rules = get_language_postprocessing_rules("xyz")
        
        assert isinstance(rules, dict)
        assert rules == LANGUAGE_POSTPROCESSING["en"]
    
    def test_get_language_postprocessing_rules_none_language(self):
        """Test getting post-processing rules for None language (should fallback to English)."""
        rules = get_language_postprocessing_rules(None)
        
        assert isinstance(rules, dict)
        assert rules == LANGUAGE_POSTPROCESSING["en"]


class TestSupportedLanguages:
    """Test supported languages functionality."""
    
    def test_get_supported_languages(self):
        """Test getting list of supported languages."""
        languages = get_supported_languages()
        
        assert isinstance(languages, list)
        assert len(languages) > 0
        assert "en" in languages
        assert "hi" in languages
        assert "es" in languages
        assert "fr" in languages
        assert "de" in languages
        assert "ta" in languages
        assert "te" in languages
        assert "bn" in languages
        assert "zh" in languages
        assert "ja" in languages
        assert "ko" in languages
    
    def test_is_language_supported_english(self):
        """Test checking if English is supported."""
        assert is_language_supported("en") is True
    
    def test_is_language_supported_hindi(self):
        """Test checking if Hindi is supported."""
        assert is_language_supported("hi") is True
    
    def test_is_language_supported_spanish(self):
        """Test checking if Spanish is supported."""
        assert is_language_supported("es") is True
    
    def test_is_language_supported_french(self):
        """Test checking if French is supported."""
        assert is_language_supported("fr") is True
    
    def test_is_language_supported_german(self):
        """Test checking if German is supported."""
        assert is_language_supported("de") is True
    
    def test_is_language_supported_tamil(self):
        """Test checking if Tamil is supported."""
        assert is_language_supported("ta") is True
    
    def test_is_language_supported_telugu(self):
        """Test checking if Telugu is supported."""
        assert is_language_supported("te") is True
    
    def test_is_language_supported_bengali(self):
        """Test checking if Bengali is supported."""
        assert is_language_supported("bn") is True
    
    def test_is_language_supported_chinese(self):
        """Test checking if Chinese is supported."""
        assert is_language_supported("zh") is True
    
    def test_is_language_supported_japanese(self):
        """Test checking if Japanese is supported."""
        assert is_language_supported("ja") is True
    
    def test_is_language_supported_korean(self):
        """Test checking if Korean is supported."""
        assert is_language_supported("ko") is True
    
    def test_is_language_supported_unsupported_language(self):
        """Test checking if unsupported language is supported."""
        assert is_language_supported("xyz") is False
    
    def test_is_language_supported_none_language(self):
        """Test checking if None language is supported."""
        assert is_language_supported(None) is False
    
    def test_is_language_supported_empty_string(self):
        """Test checking if empty string language is supported."""
        assert is_language_supported("") is False
    
    def test_is_language_supported_case_sensitive(self):
        """Test that language checking is case sensitive."""
        assert is_language_supported("EN") is False
        assert is_language_supported("En") is False
        assert is_language_supported("eN") is False


class TestDataConsistency:
    """Test data consistency across language configurations."""
    
    def test_all_supported_languages_have_whisper_params(self):
        """Test that all supported languages have Whisper parameters."""
        supported_languages = get_supported_languages()
        
        for language in supported_languages:
            params = get_language_whisper_params(language)
            assert isinstance(params, dict)
            assert "initial_prompt" in params
            assert "temperature" in params
            assert "compression_ratio_threshold" in params
            assert "log_prob_threshold" in params
            assert "no_speech_threshold" in params
    
    def test_all_supported_languages_have_frequency_ranges(self):
        """Test that all supported languages have frequency ranges."""
        supported_languages = get_supported_languages()
        
        for language in supported_languages:
            low, high = get_language_frequency_range(language)
            assert isinstance(low, (int, float))
            assert isinstance(high, (int, float))
            assert low > 0
            assert high > low
    
    def test_all_supported_languages_have_postprocessing_rules(self):
        """Test that all supported languages have post-processing rules."""
        supported_languages = get_supported_languages()
        
        for language in supported_languages:
            rules = get_language_postprocessing_rules(language)
            assert isinstance(rules, dict)
            assert "filler_words" in rules
            assert "common_errors" in rules
            assert isinstance(rules["filler_words"], list)
            assert isinstance(rules["common_errors"], dict)
    
    def test_whisper_params_consistency(self):
        """Test that Whisper parameters have consistent structure."""
        for language in LANGUAGE_WHISPER_PARAMS:
            params = LANGUAGE_WHISPER_PARAMS[language]
            assert "initial_prompt" in params
            assert "temperature" in params
            assert "compression_ratio_threshold" in params
            assert "log_prob_threshold" in params
            assert "no_speech_threshold" in params
            assert isinstance(params["initial_prompt"], str)
            assert isinstance(params["temperature"], (int, float))
            assert isinstance(params["compression_ratio_threshold"], (int, float))
            assert isinstance(params["log_prob_threshold"], (int, float))
            assert isinstance(params["no_speech_threshold"], (int, float))
    
    def test_frequency_ranges_consistency(self):
        """Test that frequency ranges have consistent structure."""
        for language in LANGUAGE_FREQUENCY_RANGES:
            low, high = LANGUAGE_FREQUENCY_RANGES[language]
            assert isinstance(low, (int, float))
            assert isinstance(high, (int, float))
            assert low > 0
            assert high > low
            assert low < 1000  # Reasonable lower bound
            assert high <= 20000  # Reasonable upper bound
    
    def test_postprocessing_rules_consistency(self):
        """Test that post-processing rules have consistent structure."""
        for language in LANGUAGE_POSTPROCESSING:
            rules = LANGUAGE_POSTPROCESSING[language]
            assert "filler_words" in rules
            assert "common_errors" in rules
            assert isinstance(rules["filler_words"], list)
            assert isinstance(rules["common_errors"], dict)
            assert all(isinstance(word, str) for word in rules["filler_words"])
            assert all(isinstance(pattern, str) for pattern in rules["common_errors"].keys())
            assert all(isinstance(replacement, str) for replacement in rules["common_errors"].values())


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_get_language_whisper_params_with_whitespace(self):
        """Test getting parameters with whitespace in language code."""
        params = get_language_whisper_params(" en ")
        
        # Should fallback to English since " en " is not in the dict
        assert params == LANGUAGE_WHISPER_PARAMS["en"]
    
    def test_get_language_frequency_range_with_whitespace(self):
        """Test getting frequency range with whitespace in language code."""
        low, high = get_language_frequency_range(" en ")
        
        # Should use default since " en " is not in the dict
        assert low == 80.0
        assert high == 8000.0
    
    def test_get_language_postprocessing_rules_with_whitespace(self):
        """Test getting post-processing rules with whitespace in language code."""
        rules = get_language_postprocessing_rules(" en ")
        
        # Should fallback to English since " en " is not in the dict
        assert rules == LANGUAGE_POSTPROCESSING["en"]
    
    def test_is_language_supported_with_whitespace(self):
        """Test checking support with whitespace in language code."""
        assert is_language_supported(" en ") is False
    
    def test_get_language_whisper_params_with_special_characters(self):
        """Test getting parameters with special characters in language code."""
        params = get_language_whisper_params("en@#$")
        
        # Should fallback to English since "en@#$" is not in the dict
        assert params == LANGUAGE_WHISPER_PARAMS["en"]
    
    def test_get_language_frequency_range_with_special_characters(self):
        """Test getting frequency range with special characters in language code."""
        low, high = get_language_frequency_range("en@#$")
        
        # Should use default since "en@#$" is not in the dict
        assert low == 80.0
        assert high == 8000.0
    
    def test_get_language_postprocessing_rules_with_special_characters(self):
        """Test getting post-processing rules with special characters in language code."""
        rules = get_language_postprocessing_rules("en@#$")
        
        # Should fallback to English since "en@#$" is not in the dict
        assert rules == LANGUAGE_POSTPROCESSING["en"]
    
    def test_is_language_supported_with_special_characters(self):
        """Test checking support with special characters in language code."""
        assert is_language_supported("en@#$") is False
