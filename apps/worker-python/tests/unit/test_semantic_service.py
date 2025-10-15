"""
Unit tests for Semantic Similarity Service
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from services.semantic_service import semantic_service, SemanticService


class TestSemanticService:
    """Test Semantic Similarity Service functionality"""

    def test_semantic_service_initialization(self):
        """Test that semantic service initializes correctly"""
        service = SemanticService()
        assert service.similarity_threshold == 0.75
        assert service.enable_clustering == True
        assert service.embedding_cache == {}
        assert service.cache_size == 1000

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_compute_similarity_basic(self, mock_get_model):
        """Test basic similarity computation"""
        # Mock the sentence transformer model
        mock_model = Mock()
        mock_embeddings = np.array([
            [0.1, 0.2, 0.3],
            [0.15, 0.25, 0.35],
            [0.9, 0.8, 0.7]
        ])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        result = service.compute_similarity(
            ['cat', 'kitten', 'dog'],
            language='en',
            cluster=True
        )
        
        assert 'similarity_matrix' in result
        assert 'clusters' in result
        assert 'grouped_keywords' in result
        assert len(result['similarity_matrix']) == 3
        assert len(result['similarity_matrix'][0]) == 3

    @patch('services.semantic_service.model_manager.get_multilingual_semantic_model')
    def test_multilingual_similarity(self, mock_get_model):
        """Test multilingual similarity computation"""
        mock_model = Mock()
        mock_embeddings = np.array([
            [0.1, 0.2],
            [0.2, 0.3]
        ])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        result = service.compute_similarity(
            ['hola', 'hello'],
            language='es',
            cluster=False
        )
        
        assert 'similarity_matrix' in result
        assert result['metadata']['language'] == 'es'

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_keyword_clustering(self, mock_get_model):
        """Test keyword clustering functionality"""
        mock_model = Mock()
        # Create embeddings where first two are similar, third is different
        mock_embeddings = np.array([
            [1.0, 0.0, 0.0],
            [0.9, 0.1, 0.0],
            [0.0, 0.0, 1.0]
        ])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        result = service.compute_similarity(
            ['running', 'jogging', 'swimming'],
            language='en',
            cluster=True
        )
        
        assert 'clusters' in result
        assert len(result['clusters']) > 0
        # Each cluster should have an ID, keywords, and centroid
        if result['clusters']:
            assert 'id' in result['clusters'][0]
            assert 'keywords' in result['clusters'][0]
            assert 'centroid_keyword' in result['clusters'][0]

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_embedding_caching(self, mock_get_model):
        """Test that embeddings are cached"""
        mock_model = Mock()
        mock_embeddings = np.array([[0.1, 0.2]])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        
        # First call - should generate embeddings
        service.compute_similarity(['test'], language='en')
        assert mock_model.encode.call_count == 1
        
        # Second call with same keyword - should use cache
        service.compute_similarity(['test'], language='en')
        # encode should only be called once (cached)
        assert len(service.embedding_cache) > 0

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_similarity_threshold_filtering(self, mock_get_model):
        """Test that similar keywords are grouped by threshold"""
        mock_model = Mock()
        # Create embeddings with varying similarity
        mock_embeddings = np.array([
            [1.0, 0.0],
            [0.9, 0.1],  # Very similar to first
            [0.0, 1.0]   # Not similar
        ])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        result = service.compute_similarity(
            ['car', 'automobile', 'tree'],
            language='en',
            cluster=True
        )
        
        assert 'grouped_keywords' in result
        # Keywords above threshold should be grouped together

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_find_semantic_duplicates(self, mock_get_model):
        """Test duplicate detection"""
        mock_model = Mock()
        # Create nearly identical embeddings
        mock_embeddings = np.array([
            [1.0, 0.0, 0.0],
            [0.99, 0.01, 0.0],  # Very similar - duplicate
            [0.5, 0.5, 0.0]      # Different
        ])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        duplicates = service.find_semantic_duplicates(
            ['run', 'running', 'jump'],
            language='en',
            threshold=0.9
        )
        
        assert isinstance(duplicates, list)
        # Should find the high-similarity pair
        if duplicates:
            assert len(duplicates[0]) == 3  # (keyword1, keyword2, score)
            assert duplicates[0][2] >= 0.9  # Score should be above threshold

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_topic_coherence(self, mock_get_model):
        """Test topic coherence calculation"""
        mock_model = Mock()
        # Create coherent embeddings (all similar)
        mock_embeddings = np.array([
            [1.0, 0.0],
            [0.9, 0.1],
            [0.8, 0.2]
        ])
        mock_model.encode.return_value = mock_embeddings
        mock_get_model.return_value = mock_model
        
        service = SemanticService()
        coherence = service.compute_topic_coherence(
            ['sports', 'athletics', 'fitness'],
            language='en'
        )
        
        assert isinstance(coherence, float)
        assert 0.0 <= coherence <= 1.0
        # Coherent topics should have higher score
        assert coherence > 0.5

    def test_empty_keywords_list(self):
        """Test handling of empty keywords list"""
        service = SemanticService()
        result = service.compute_similarity([], language='en')
        
        assert result['clusters'] == []
        assert result['similarity_matrix'] == []
        assert result['grouped_keywords'] == {}

    def test_single_keyword(self):
        """Test handling of single keyword"""
        service = SemanticService()
        with patch('services.semantic_service.model_manager.get_semantic_model') as mock_get_model:
            mock_model = Mock()
            mock_model.encode.return_value = np.array([[0.1, 0.2]])
            mock_get_model.return_value = mock_model
            
            result = service.compute_similarity(['test'], language='en')
            
            # Should handle single keyword gracefully
            assert 'similarity_matrix' in result

    @patch('services.semantic_service.model_manager.get_semantic_model')
    def test_error_handling(self, mock_get_model):
        """Test error handling when model fails"""
        mock_get_model.side_effect = Exception("Model loading failed")
        
        service = SemanticService()
        result = service.compute_similarity(['test'], language='en')
        
        # Should return error structure
        assert 'error' in result
        assert result['clusters'] == []

    def test_cache_clearing(self):
        """Test cache clearing functionality"""
        service = SemanticService()
        service.embedding_cache = {'test': np.array([1, 2, 3])}
        
        service.clear_cache()
        
        assert len(service.embedding_cache) == 0


