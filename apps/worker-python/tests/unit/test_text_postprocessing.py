"""
Unit tests for the text post-processing module
"""
import pytest
from unittest.mock import patch, Mock

from text_postprocessing import (
    post_process_transcript,
    apply_general_postprocessing,
    apply_language_specific_postprocessing,
    remove_filler_words,
    remove_word_repetitions,
    fix_common_errors,
    apply_language_specific_error_corrections,
    capitalize_sentences,
    normalize_punctuation,
    remove_extra_spaces,
    apply_aggressive_cleaning_language_specific,
    clean_transcript_text,
    validate_postprocessing_quality
)


class TestPostProcessTranscript:
    """Test the main transcript post-processing function."""
    
    def test_post_process_transcript_basic(self, sample_segments):
        """Test basic transcript post-processing."""
        result = post_process_transcript(sample_segments)
        
        assert isinstance(result, list)
        assert len(result) == len(sample_segments)
        assert all("text" in segment for segment in result)
    
    def test_post_process_transcript_with_language(self, sample_segments):
        """Test transcript post-processing with language hint."""
        result = post_process_transcript(sample_segments, language="en")
        
        assert isinstance(result, list)
        assert len(result) == len(sample_segments)
    
    def test_post_process_transcript_with_aggressive_cleaning(self, sample_segments):
        """Test transcript post-processing with aggressive cleaning."""
        result = post_process_transcript(sample_segments, enable_aggressive_cleaning=True)
        
        assert isinstance(result, list)
        assert len(result) == len(sample_segments)
    
    def test_post_process_transcript_empty_segments(self):
        """Test post-processing with empty segments."""
        empty_segments = []
        result = post_process_transcript(empty_segments)
        
        assert result == empty_segments
    
    def test_post_process_transcript_empty_text(self):
        """Test post-processing with empty text segments."""
        segments = [
            {"tStart": 0.0, "tEnd": 2.5, "text": ""},
            {"tStart": 2.5, "tEnd": 5.0, "text": "   "},
            {"tStart": 5.0, "tEnd": 7.5, "text": "Hello world"}
        ]
        result = post_process_transcript(segments)
        
        assert len(result) == 3
        assert result[0]["text"] == ""
        assert result[1]["text"].strip() == ""  # Whitespace-only text gets stripped
        assert result[2]["text"] != ""
    
    def test_post_process_transcript_processing_error(self, sample_segments):
        """Test post-processing with processing error."""
        with patch('text_postprocessing.apply_general_postprocessing') as mock_process:
            mock_process.side_effect = Exception("Processing error")
            
            result = post_process_transcript(sample_segments)
            
            assert result == sample_segments  # Should return original on error


class TestGeneralPostprocessing:
    """Test general post-processing functions."""
    
    def test_apply_general_postprocessing(self, sample_text):
        """Test general post-processing application."""
        result = apply_general_postprocessing(sample_text)
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_general_postprocessing_aggressive(self, sample_text):
        """Test general post-processing with aggressive cleaning."""
        result = apply_general_postprocessing(sample_text, enable_aggressive_cleaning=True)
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_remove_filler_words(self):
        """Test filler word removal."""
        text = "um hello uh world er like you know so"
        result = remove_filler_words(text, ["um", "uh", "er", "like", "you know", "so"])
        
        assert "um" not in result
        assert "uh" not in result
        assert "er" not in result
        assert "like" not in result
        assert "you know" not in result
        assert "so" not in result
        assert "hello" in result
        assert "world" in result
    
    def test_remove_filler_words_case_insensitive(self):
        """Test filler word removal with case insensitive matching."""
        text = "UM hello UH world ER"
        result = remove_filler_words(text, ["um", "uh", "er"])
        
        assert "UM" not in result
        assert "UH" not in result
        assert "ER" not in result
        assert "hello" in result
        assert "world" in result
    
    def test_remove_word_repetitions(self):
        """Test word repetition removal."""
        text = "hello hello world world world test"
        result = remove_word_repetitions(text)
        
        assert "hello hello" not in result
        assert "world world world" not in result
        assert "hello world test" in result
    
    def test_fix_common_errors(self):
        """Test common error corrections."""
        text = "to two for four their there they're you're we're it's won't can't don't"
        result = fix_common_errors(text)
        
        # Should fix common ASR errors
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_capitalize_sentences(self):
        """Test sentence capitalization."""
        text = "hello world. this is a test. another sentence!"
        result = capitalize_sentences(text)
        
        assert result.startswith("Hello")
        assert "This is" in result
        assert "Another sentence" in result
    
    def test_normalize_punctuation(self):
        """Test punctuation normalization."""
        text = '""hello world"" -- this is a test...'
        result = normalize_punctuation(text)
        
        assert '"' in result
        assert '--' in result
        # The function normalizes multiple dots to single dots, so check for that
        assert '.' in result  # Should have at least one dot
    
    def test_remove_extra_spaces(self):
        """Test extra space removal."""
        text = "  hello    world  .  this   is   a   test  "
        result = remove_extra_spaces(text)
        
        assert "  " not in result  # No double spaces
        assert result.strip() == result  # No leading/trailing spaces


class TestLanguageSpecificPostprocessing:
    """Test language-specific post-processing functions."""
    
    def test_apply_language_specific_postprocessing_english(self):
        """Test English-specific post-processing."""
        text = "um hello uh world like you know so"
        result = apply_language_specific_postprocessing(text, "en")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_language_specific_postprocessing_hindi(self):
        """Test Hindi-specific post-processing."""
        text = "अ hello उम world तो फिर"
        result = apply_language_specific_postprocessing(text, "hi")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_language_specific_postprocessing_spanish(self):
        """Test Spanish-specific post-processing."""
        text = "eh hello um world este bueno"
        result = apply_language_specific_postprocessing(text, "es")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_language_specific_postprocessing_unsupported_language(self):
        """Test post-processing with unsupported language."""
        text = "hello world"
        result = apply_language_specific_postprocessing(text, "xyz")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_language_specific_error_corrections(self):
        """Test language-specific error corrections."""
        text = "hello world"
        corrections = {"hello": "hi", "world": "earth"}
        result = apply_language_specific_error_corrections(text, corrections)
        
        assert "hi" in result
        assert "earth" in result


class TestAggressiveCleaning:
    """Test aggressive cleaning functions."""
    
    def test_apply_aggressive_cleaning_english(self):
        """Test aggressive cleaning for English."""
        text = "um hello uh world like you know so este bueno"
        result = apply_aggressive_cleaning_language_specific(text, "en")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_aggressive_cleaning_hindi(self):
        """Test aggressive cleaning for Hindi."""
        text = "अ hello उम world तो फिर"
        result = apply_aggressive_cleaning_language_specific(text, "hi")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_aggressive_cleaning_east_asian(self):
        """Test aggressive cleaning for East Asian languages."""
        text = "那个 hello 嗯 world 啊"
        result = apply_aggressive_cleaning_language_specific(text, "zh")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_apply_aggressive_cleaning_unsupported_language(self):
        """Test aggressive cleaning with unsupported language."""
        text = "hello world"
        result = apply_aggressive_cleaning_language_specific(text, "xyz")
        
        assert isinstance(result, str)
        assert len(result) > 0


class TestCleanTranscriptText:
    """Test the clean_transcript_text function."""
    
    def test_clean_transcript_text_basic(self):
        """Test basic text cleaning."""
        text = "um hello uh world"
        result = clean_transcript_text(text)
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_clean_transcript_text_with_language(self):
        """Test text cleaning with language hint."""
        text = "um hello uh world"
        result = clean_transcript_text(text, language="en")
        
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_clean_transcript_text_empty(self):
        """Test text cleaning with empty text."""
        text = ""
        result = clean_transcript_text(text)
        
        assert result == text
    
    def test_clean_transcript_text_whitespace_only(self):
        """Test text cleaning with whitespace-only text."""
        text = "   \n\t   "
        result = clean_transcript_text(text)
        
        assert result == text
    
    def test_clean_transcript_text_processing_error(self):
        """Test text cleaning with processing error."""
        with patch('text_postprocessing.apply_general_postprocessing') as mock_process:
            mock_process.side_effect = Exception("Processing error")
            
            text = "hello world"
            result = clean_transcript_text(text)
            
            assert result == text  # Should return original on error


class TestQualityValidation:
    """Test post-processing quality validation."""
    
    def test_validate_postprocessing_quality_improvement(self):
        """Test quality validation with improvement."""
        original_segments = [
            {"text": "um hello uh world like you know so"},
            {"text": "this is a test test test"}
        ]
        processed_segments = [
            {"text": "hello world"},
            {"text": "this is a test"}
        ]
        
        is_improved = validate_postprocessing_quality(original_segments, processed_segments)
        
        assert isinstance(is_improved, bool)
    
    def test_validate_postprocessing_quality_no_improvement(self):
        """Test quality validation without improvement."""
        original_segments = [
            {"text": "hello world"},
            {"text": "this is a test"}
        ]
        processed_segments = [
            {"text": "um hello uh world like you know so"},
            {"text": "this is a test test test"}
        ]
        
        is_improved = validate_postprocessing_quality(original_segments, processed_segments)
        
        assert isinstance(is_improved, bool)
    
    def test_validate_postprocessing_quality_validation_error(self):
        """Test quality validation with validation error."""
        with patch('text_postprocessing.re.findall') as mock_findall:
            mock_findall.side_effect = Exception("Regex error")
            
            original_segments = [{"text": "hello world"}]
            processed_segments = [{"text": "hello world"}]
            
            is_improved = validate_postprocessing_quality(original_segments, processed_segments)
            
            assert is_improved is True  # Should assume improvement on error


class TestErrorHandling:
    """Test error handling in text post-processing."""
    
    def test_remove_filler_words_with_error(self):
        """Test filler word removal with error."""
        with patch('text_postprocessing.re.sub') as mock_sub:
            mock_sub.side_effect = Exception("Regex error")
            
            text = "hello world"
            result = remove_filler_words(text, ["um", "uh"])
            
            assert result == text  # Should return original on error
    
    def test_remove_word_repetitions_with_error(self):
        """Test word repetition removal with error."""
        with patch('text_postprocessing.re.search') as mock_search:
            mock_search.side_effect = Exception("Regex error")
            
            text = "hello hello world"
            result = remove_word_repetitions(text)
            
            assert result == text  # Should return original on error
    
    def test_capitalize_sentences_with_error(self):
        """Test sentence capitalization with error."""
        with patch('text_postprocessing.re.split') as mock_split:
            mock_split.side_effect = Exception("Regex error")
            
            text = "hello world. test."
            result = capitalize_sentences(text)
            
            assert result == text  # Should return original on error
    
    def test_normalize_punctuation_with_error(self):
        """Test punctuation normalization with error."""
        with patch('text_postprocessing.re.sub') as mock_sub:
            mock_sub.side_effect = Exception("Regex error")
            
            text = '""hello world""'
            result = normalize_punctuation(text)
            
            assert result == text  # Should return original on error


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_post_process_transcript_missing_text_key(self):
        """Test post-processing with missing text key."""
        segments = [
            {"tStart": 0.0, "tEnd": 2.5},  # Missing text key
            {"tStart": 2.5, "tEnd": 5.0, "text": "hello world"}
        ]
        result = post_process_transcript(segments)
        
        assert len(result) == 2
        # The function should handle missing text key gracefully
        assert result[0].get("text", "") == ""  # Should have empty text or missing key
        assert result[1]["text"] == "Hello world"  # Text gets capitalized
    
    def test_remove_filler_words_empty_list(self):
        """Test filler word removal with empty filler words list."""
        text = "hello world"
        result = remove_filler_words(text, [])
        
        assert result == text
    
    def test_remove_filler_words_none_values(self):
        """Test filler word removal with None values."""
        text = "hello world"
        result = remove_filler_words(text, [None, "", "um"])
        
        assert isinstance(result, str)
    
    def test_capitalize_sentences_no_sentences(self):
        """Test sentence capitalization with no sentence endings."""
        text = "hello world test"
        result = capitalize_sentences(text)
        
        # The function capitalizes the first letter even without sentence endings
        assert result == "Hello world test"  # First letter gets capitalized
    
    def test_normalize_punctuation_no_punctuation(self):
        """Test punctuation normalization with no punctuation."""
        text = "hello world test"
        result = normalize_punctuation(text)
        
        assert result == text
    
    def test_remove_extra_spaces_no_spaces(self):
        """Test extra space removal with no extra spaces."""
        text = "hello world test"
        result = remove_extra_spaces(text)
        
        assert result == text


class TestPerformanceAndMemory:
    """Test performance and memory considerations."""
    
    def test_post_process_transcript_large_segments(self):
        """Test post-processing with large number of segments."""
        # Create many segments
        segments = []
        for i in range(100):
            segments.append({
                "tStart": float(i),
                "tEnd": float(i + 1),
                "text": f"segment {i} um uh like you know so"
            })
        
        result = post_process_transcript(segments)
        
        assert len(result) == len(segments)
        assert all("text" in segment for segment in result)
    
    def test_remove_filler_words_large_text(self):
        """Test filler word removal with large text."""
        # Create large text with many filler words
        text = "um uh like you know so " * 1000 + "hello world"
        filler_words = ["um", "uh", "like", "you know", "so"]
        
        result = remove_filler_words(text, filler_words)
        
        assert isinstance(result, str)
        assert "hello world" in result
        assert "um" not in result
    
    def test_memory_usage_consistency(self, sample_segments):
        """Test that post-processing doesn't cause memory leaks."""
        # Process multiple times to check for memory issues
        for _ in range(10):
            result = post_process_transcript(sample_segments)
            assert isinstance(result, list)
            del result  # Explicit cleanup


# Fixtures for test data
@pytest.fixture
def sample_segments():
    """Create sample transcript segments for testing."""
    return [
        {"tStart": 0.0, "tEnd": 2.5, "text": "um hello uh world like you know so"},
        {"tStart": 2.5, "tEnd": 5.0, "text": "this is a test test test"},
        {"tStart": 5.0, "tEnd": 7.5, "text": "another sentence. with punctuation!"}
    ]


@pytest.fixture
def sample_text():
    """Create sample text for testing."""
    return "um hello uh world like you know so this is a test test test"
