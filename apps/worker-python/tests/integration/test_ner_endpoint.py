"""
Integration tests for NER and Semantic Analysis endpoints
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, Mock
import numpy as np


@pytest.mark.asyncio
class TestNEREndpoint:
    """Test NER endpoint integration"""

    @pytest.mark.asyncio
    async def test_ner_endpoint_basic(self, async_client):
        """Test basic NER endpoint functionality"""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner:
            # Mock NER pipeline
            mock_pipeline = Mock()
            mock_pipeline.return_value = [
                {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95},
                {'entity_group': 'PER', 'word': 'Steve Jobs', 'score': 0.90}
            ]
            mock_ner.return_value = mock_pipeline
            
            response = await async_client.post(
                "/ner",
                json={
                    "text": "Apple was founded by Steve Jobs",
                    "language": "en",
                    "include_relationships": True
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert 'entities' in data
            assert 'relationships' in data
            assert 'metadata' in data
            assert 'timing' in data
            assert data['metadata']['language'] == 'en'

    @pytest.mark.asyncio
    async def test_ner_endpoint_multilingual(self, async_client):
        """Test NER endpoint with multilingual support"""
        with patch('services.ner_service.model_manager.get_multilingual_ner_model') as mock_ner:
            mock_pipeline = Mock()
            mock_pipeline.return_value = [
                {'entity_group': 'LOC', 'word': 'Madrid', 'score': 0.88}
            ]
            mock_ner.return_value = mock_pipeline
            
            response = await async_client.post(
                "/ner",
                json={
                    "text": "Madrid es la capital de España",
                    "language": "es",
                    "include_relationships": False
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['metadata']['language'] == 'es'

    @pytest.mark.asyncio
    async def test_ner_endpoint_validation(self, async_client):
        """Test NER endpoint input validation"""
        # Missing required field
        response = await async_client.post(
            "/ner",
            json={
                "language": "en"
            }
        )
        
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_ner_endpoint_error_handling(self, async_client):
        """Test NER endpoint error handling"""
        with patch('services.ner_service.ner_service.extract_entities') as mock_extract:
            mock_extract.side_effect = Exception("Extraction failed")
            
            response = await async_client.post(
                "/ner",
                json={
                    "text": "Test text",
                    "language": "en"
                }
            )
            
            assert response.status_code == 500


@pytest.mark.asyncio
class TestSemanticSimilarityEndpoint:
    """Test Semantic Similarity endpoint integration"""

    @pytest.mark.asyncio
    async def test_semantic_endpoint_basic(self, async_client):
        """Test basic semantic similarity endpoint"""
        with patch('services.semantic_service.model_manager.get_semantic_model') as mock_model:
            mock_model_instance = Mock()
            mock_model_instance.encode.return_value = np.array([
                [0.1, 0.2, 0.3],
                [0.15, 0.25, 0.35],
                [0.9, 0.8, 0.7]
            ])
            mock_model.return_value = mock_model_instance
            
            response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["cat", "kitten", "dog"],
                    "language": "en",
                    "cluster": True
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert 'clusters' in data
            assert 'similarity_matrix' in data
            assert 'grouped_keywords' in data
            assert 'embeddings_shape' in data
            assert 'metadata' in data
            assert 'timing' in data

    @pytest.mark.asyncio
    async def test_semantic_endpoint_no_clustering(self, async_client):
        """Test semantic similarity without clustering"""
        with patch('services.semantic_service.model_manager.get_semantic_model') as mock_model:
            mock_model_instance = Mock()
            mock_model_instance.encode.return_value = np.array([
                [0.1, 0.2],
                [0.2, 0.3]
            ])
            mock_model.return_value = mock_model_instance
            
            response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test1", "test2"],
                    "language": "en",
                    "cluster": False
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert 'similarity_matrix' in data

    @pytest.mark.asyncio
    async def test_semantic_endpoint_empty_keywords(self, async_client):
        """Test semantic similarity with empty keywords list"""
        response = await async_client.post(
            "/semantic-similarity",
            json={
                "keywords": [],
                "language": "en",
                "cluster": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['clusters'] == []
        assert data['similarity_matrix'] == []

    @pytest.mark.asyncio
    async def test_semantic_endpoint_multilingual(self, async_client):
        """Test semantic similarity with multilingual support"""
        with patch('services.semantic_service.model_manager.get_multilingual_semantic_model') as mock_model:
            mock_model_instance = Mock()
            mock_model_instance.encode.return_value = np.array([
                [0.1, 0.2],
                [0.15, 0.25]
            ])
            mock_model.return_value = mock_model_instance
            
            response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["hola", "hello"],
                    "language": "es",
                    "cluster": True
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['metadata']['language'] == 'es'

    @pytest.mark.asyncio
    async def test_semantic_endpoint_validation(self, async_client):
        """Test semantic similarity endpoint input validation"""
        # Missing required field
        response = await async_client.post(
            "/semantic-similarity",
            json={
                "language": "en"
            }
        )
        
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_semantic_endpoint_error_handling(self, async_client):
        """Test semantic similarity endpoint error handling"""
        with patch('services.semantic_service.semantic_service.compute_similarity') as mock_compute:
            mock_compute.side_effect = Exception("Computation failed")
            
            response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test"],
                    "language": "en"
                }
            )
            
            assert response.status_code == 500


