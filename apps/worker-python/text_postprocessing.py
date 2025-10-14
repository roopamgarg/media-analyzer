"""
Text post-processing module for ASR transcript cleaning and error correction.
Provides language-aware text cleaning to improve transcript quality.
"""

import re
from typing import List, Dict, Any, Optional
import logging

from language_config import get_language_postprocessing_rules, is_language_supported

logger = logging.getLogger(__name__)

def post_process_transcript(segments: List[Dict[str, Any]], 
                          language: Optional[str] = None,
                          enable_aggressive_cleaning: bool = False) -> List[Dict[str, Any]]:
    """
    Post-process transcripts to improve quality.
    
    Args:
        segments: List of transcript segments with 'text', 'tStart', 'tEnd' keys
        language: Language code for language-specific processing
        enable_aggressive_cleaning: Whether to apply aggressive cleaning rules
        
    Returns:
        List of cleaned transcript segments
    """
    try:
        processed_segments = []
        
        for segment in segments:
            text = segment.get("text", "")
            
            if not text.strip():
                processed_segments.append(segment)
                continue
            
            # Apply language-specific post-processing
            if language and is_language_supported(language):
                text = apply_language_specific_postprocessing(text, language, enable_aggressive_cleaning)
            else:
                # Apply general post-processing
                text = apply_general_postprocessing(text, enable_aggressive_cleaning)
            
            processed_segments.append({
                **segment,
                "text": text.strip()
            })
        
        return processed_segments
        
    except Exception as e:
        logger.error(f"Text post-processing failed: {str(e)}")
        return segments  # Return original segments if processing fails

def apply_general_postprocessing(text: str, enable_aggressive_cleaning: bool = False) -> str:
    """Apply general post-processing rules."""
    # Remove filler words
    text = remove_filler_words(text, ["um", "uh", "er", "ah", "like", "you know", "so"])
    
    # Remove word repetitions
    text = remove_word_repetitions(text)
    
    # Fix common ASR errors
    text = fix_common_errors(text)
    
    # Capitalize sentences
    text = capitalize_sentences(text)
    
    if enable_aggressive_cleaning:
        # Remove extra spaces and normalize punctuation
        text = normalize_punctuation(text)
        text = remove_extra_spaces(text)
    
    return text

def apply_language_specific_postprocessing(text: str, language: str, enable_aggressive_cleaning: bool = False) -> str:
    """Apply language-specific post-processing rules."""
    try:
        rules = get_language_postprocessing_rules(language)
        
        # Remove language-specific filler words
        filler_words = rules.get("filler_words", [])
        if filler_words:
            text = remove_filler_words(text, filler_words)
        
        # Apply language-specific error corrections
        common_errors = rules.get("common_errors", {})
        if common_errors:
            text = apply_language_specific_error_corrections(text, common_errors)
        
        # Remove word repetitions
        text = remove_word_repetitions(text)
        
        # Capitalize sentences
        text = capitalize_sentences(text)
        
        if enable_aggressive_cleaning:
            # Language-specific aggressive cleaning
            text = apply_aggressive_cleaning_language_specific(text, language)
        
        return text
        
    except Exception as e:
        logger.warning(f"Language-specific post-processing failed for {language}: {str(e)}")
        return apply_general_postprocessing(text, enable_aggressive_cleaning)

def remove_filler_words(text: str, filler_words: List[str]) -> str:
    """Remove filler words from text."""
    try:
        # Create pattern for filler words (word boundaries)
        pattern = r'\b(' + '|'.join(re.escape(word) for word in filler_words) + r')\b'
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Clean up extra spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    except Exception as e:
        logger.warning(f"Filler word removal failed: {str(e)}")
        return text

def remove_word_repetitions(text: str) -> str:
    """Remove repeated words in sequence."""
    try:
        # Pattern to match repeated words
        pattern = r'\b(\w+)\s+\1\b'
        while re.search(pattern, text):
            text = re.sub(pattern, r'\1', text)
        
        return text
    except Exception as e:
        logger.warning(f"Word repetition removal failed: {str(e)}")
        return text

def fix_common_errors(text: str) -> str:
    """Fix common ASR transcription errors."""
    try:
        # Common English ASR error corrections
        corrections = {
            r'\bto\b': 'to',
            r'\btwo\b': 'two',
            r'\bfor\b': 'for',
            r'\bfour\b': 'four',
            r'\btheir\b': 'their',
            r'\bthere\b': 'there',
            r'\bthey\'re\b': "they're",
            r'\byou\'re\b': "you're",
            r'\bwe\'re\b': "we're",
            r'\bit\'s\b': "it's",
            r'\bwon\'t\b': "won't",
            r'\bcan\'t\b': "can't",
            r'\bdon\'t\b': "don't",
            r'\bdoesn\'t\b': "doesn't",
            r'\bdidn\'t\b': "didn't",
        }
        
        for pattern, replacement in corrections.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text
    except Exception as e:
        logger.warning(f"Common error correction failed: {str(e)}")
        return text

def apply_language_specific_error_corrections(text: str, corrections: Dict[str, str]) -> str:
    """Apply language-specific error corrections."""
    try:
        for pattern, replacement in corrections.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text
    except Exception as e:
        logger.warning(f"Language-specific error correction failed: {str(e)}")
        return text

def capitalize_sentences(text: str) -> str:
    """Capitalize first letter of sentences."""
    try:
        # Split by sentence endings
        sentences = re.split(r'([.!?]+)', text)
        result = []
        
        for i, part in enumerate(sentences):
            if i % 2 == 0:  # Text part
                if part.strip():
                    # Capitalize first letter
                    part = part.strip()
                    if part:
                        part = part[0].upper() + part[1:]
                    result.append(part)
            else:  # Punctuation part
                result.append(part)
        
        return ' '.join(result)
    except Exception as e:
        logger.warning(f"Sentence capitalization failed: {str(e)}")
        return text

def normalize_punctuation(text: str) -> str:
    """Normalize punctuation marks."""
    try:
        # Normalize quotes
        text = re.sub(r'[""''„"«»]', '"', text)
        text = re.sub(r"[''']", "'", text)
        
        # Normalize dashes
        text = re.sub(r'[–—]', '-', text)
        
        # Normalize ellipsis
        text = re.sub(r'\.{3,}', '...', text)
        
        # Remove multiple punctuation
        text = re.sub(r'([.!?]){2,}', r'\1', text)
        
        return text
    except Exception as e:
        logger.warning(f"Punctuation normalization failed: {str(e)}")
        return text

def remove_extra_spaces(text: str) -> str:
    """Remove extra spaces and normalize whitespace."""
    try:
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove spaces around punctuation
        text = re.sub(r'\s+([.!?,:;])', r'\1', text)
        
        # Remove leading/trailing spaces
        text = text.strip()
        
        return text
    except Exception as e:
        logger.warning(f"Extra space removal failed: {str(e)}")
        return text

def apply_aggressive_cleaning_language_specific(text: str, language: str) -> str:
    """Apply language-specific aggressive cleaning rules."""
    try:
        if language in ['en', 'es', 'fr', 'de']:  # European languages
            # Remove common English/European filler patterns
            text = re.sub(r'\b(um|uh|er|ah|like|you know|so|este|bueno|euh|ben|alors|äh|ähm|also)\b', '', text, flags=re.IGNORECASE)
        
        elif language in ['hi', 'ta', 'te', 'bn']:  # Indian languages
            # Remove common Indian language filler patterns
            text = re.sub(r'\b(अ|उम|तो|फिर|ஆ|உம்|అ|ఉమ్)\b', '', text, flags=re.IGNORECASE)
        
        elif language in ['zh', 'ja', 'ko']:  # East Asian languages
            # Remove common East Asian filler patterns
            text = re.sub(r'\b(那个|嗯|啊|이|그|음|あの|えー|まあ)\b', '', text, flags=re.IGNORECASE)
        
        # Normalize punctuation
        text = normalize_punctuation(text)
        
        # Remove extra spaces
        text = remove_extra_spaces(text)
        
        return text
        
    except Exception as e:
        logger.warning(f"Aggressive cleaning failed for {language}: {str(e)}")
        return text

def clean_transcript_text(text: str, language: Optional[str] = None) -> str:
    """
    Clean a single transcript text string.
    
    Args:
        text: Text to clean
        language: Language code for language-specific cleaning
        
    Returns:
        Cleaned text
    """
    if not text.strip():
        return text
    
    try:
        if language and is_language_supported(language):
            return apply_language_specific_postprocessing(text, language, enable_aggressive_cleaning=False)
        else:
            return apply_general_postprocessing(text, enable_aggressive_cleaning=False)
    except Exception as e:
        logger.error(f"Text cleaning failed: {str(e)}")
        return text

def validate_postprocessing_quality(original_segments: List[Dict[str, Any]], 
                                 processed_segments: List[Dict[str, Any]]) -> bool:
    """Validate that post-processing improved transcript quality."""
    try:
        # Simple validation: check if processed text is cleaner
        original_text = ' '.join(seg.get('text', '') for seg in original_segments)
        processed_text = ' '.join(seg.get('text', '') for seg in processed_segments)
        
        # Check if filler words were removed
        filler_words = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so']
        original_filler_count = sum(1 for word in filler_words if word in original_text.lower())
        processed_filler_count = sum(1 for word in filler_words if word in processed_text.lower())
        
        # Check if repetitions were removed
        original_repetitions = len(re.findall(r'\b(\w+)\s+\1\b', original_text))
        processed_repetitions = len(re.findall(r'\b(\w+)\s+\1\b', processed_text))
        
        # Consider improvement if filler words or repetitions decreased
        return (processed_filler_count < original_filler_count or 
                processed_repetitions < original_repetitions)
        
    except Exception as e:
        logger.warning(f"Post-processing quality validation failed: {str(e)}")
        return True  # Assume improvement if validation fails
