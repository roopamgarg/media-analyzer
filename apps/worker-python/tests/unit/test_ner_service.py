"""
Unit tests for NER Service
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from services.ner_service import ner_service, NERService


class TestNERService:
    """Test NER Service functionality"""

    def test_ner_service_initialization(self):
        """Test that NER service initializes correctly"""
        service = NERService()
        assert service.confidence_threshold == 0.7
        assert service.entity_cache == {}
        assert service.cache_size == 1000

    @patch('services.ner_service.model_manager.get_ner_model')
    def test_extract_entities_basic(self, mock_get_model):
        """Test basic entity extraction"""
        # Mock the NER pipeline
        mock_pipeline = Mock()
        mock_pipeline.return_value = [
            {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95},
            {'entity_group': 'PERSON', 'word': 'Steve Jobs', 'score': 0.90},
            {'entity_group': 'LOC', 'word': 'California', 'score': 0.85}
        ]
        mock_get_model.return_value = mock_pipeline
        
        service = NERService()
        result = service.extract_entities(
            "Apple was founded by Steve Jobs in California", 
            language='en'
        )
        
        assert 'entities' in result
        assert 'relationships' in result
        assert 'metadata' in result
        assert len(result['entities']['organizations']) > 0
        assert result['entities']['organizations'][0]['text'] == 'Apple'

    @patch('services.ner_service.model_manager.get_ner_model')
    def test_extract_entities_with_domain_specific(self, mock_get_model):
        """Test entity extraction with domain-specific entities"""
        mock_pipeline = Mock()
        mock_pipeline.return_value = []
        mock_get_model.return_value = mock_pipeline
        
        service = NERService()
        result = service.extract_entities(
            "Nike shoes are guaranteed to improve your performance",
            language='en'
        )
        
        # Check for brand entities
        assert len(result['entities']['brands']) > 0
        # Check for regulated terms
        assert len(result['entities']['regulated']) > 0

    @patch('services.ner_service.model_manager.get_multilingual_ner_model')
    def test_extract_entities_multilingual(self, mock_get_model):
        """Test multilingual entity extraction"""
        mock_pipeline = Mock()
        mock_pipeline.return_value = [
            {'entity_group': 'PER', 'word': 'Juan', 'score': 0.88}
        ]
        mock_get_model.return_value = mock_pipeline
        
        service = NERService()
        result = service.extract_entities(
            "Juan vive en España",
            language='es'
        )
        
        assert 'entities' in result
        assert result['metadata']['language'] == 'es'

    @patch('services.ner_service.model_manager.get_ner_model')
    def test_confidence_threshold_filtering(self, mock_get_model):
        """Test that entities below confidence threshold are filtered"""
        mock_pipeline = Mock()
        mock_pipeline.return_value = [
            {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95},  # Above threshold
            {'entity_group': 'PERSON', 'word': 'John', 'score': 0.60}  # Below threshold
        ]
        mock_get_model.return_value = mock_pipeline
        
        service = NERService()
        result = service.extract_entities("Apple and John", language='en')
        
        # Only high-confidence entity should be included
        assert len(result['entities']['organizations']) == 1
        assert result['entities']['organizations'][0]['text'] == 'Apple'

    @patch('services.ner_service.model_manager.get_ner_model')
    @patch('services.ner_service.model_manager.get_spacy_model')
    def test_relationship_extraction(self, mock_spacy, mock_ner):
        """Test entity relationship extraction"""
        mock_pipeline = Mock()
        mock_pipeline.return_value = [
            {'entity_group': 'ORG', 'word': 'Nike', 'score': 0.90},
            {'entity_group': 'PRODUCT', 'word': 'shoe', 'score': 0.85}
        ]
        mock_ner.return_value = mock_pipeline
        
        # Mock spaCy doc
        mock_doc = Mock()
        mock_token = Mock()
        mock_token.dep_ = 'poss'
        mock_token.text = 'Nike'
        mock_token.head = Mock(pos_='NOUN', text='shoe')
        mock_doc.__iter__ = Mock(return_value=iter([mock_token]))
        
        mock_nlp = Mock()
        mock_nlp.return_value = mock_doc
        mock_spacy.return_value = mock_nlp
        
        service = NERService()
        result = service.extract_entities(
            "Nike's new shoe",
            language='en',
            include_relationships=True
        )
        
        assert 'relationships' in result
        # Relationship extraction should be attempted
        assert isinstance(result['relationships'], list)

    @patch('services.ner_service.model_manager.get_ner_model')
    def test_deduplication(self, mock_get_model):
        """Test that duplicate entities are deduplicated"""
        mock_pipeline = Mock()
        mock_pipeline.return_value = [
            {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95},
            {'entity_group': 'ORG', 'word': 'apple', 'score': 0.90},  # Duplicate with lower score
            {'entity_group': 'ORG', 'word': 'APPLE', 'score': 0.92}   # Another duplicate
        ]
        mock_get_model.return_value = mock_pipeline
        
        service = NERService()
        result = service.extract_entities("Apple Apple APPLE", language='en')
        
        # Should only have one "Apple" entity with the highest confidence
        assert len(result['entities']['organizations']) == 1
        assert result['entities']['organizations'][0]['confidence'] == 0.95

    def test_empty_text(self):
        """Test extraction on empty text"""
        service = NERService()
        result = service.extract_entities("", language='en')
        
        assert 'entities' in result
        assert sum(len(v) for v in result['entities'].values()) == 0

    @patch('services.ner_service.model_manager.get_ner_model')
    def test_error_handling(self, mock_get_model):
        """Test error handling when model fails"""
        mock_get_model.side_effect = Exception("Model loading failed")
        
        service = NERService()
        result = service.extract_entities("Test text", language='en')
        
        # Should return empty entities structure on error
        assert 'entities' in result
        assert 'error' in result['metadata']


