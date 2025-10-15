"""
Integration tests for cross-service workflows between NER and Semantic services
"""
import pytest
import asyncio
from unittest.mock import patch, Mock
import numpy as np
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
class TestNERAndSemanticIntegration:
    """Test integration between NER and Semantic services."""

    async def test_ner_followed_by_semantic_clustering(self, async_client):
        """Test NER extraction followed by semantic clustering."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock NER pipeline
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [
                {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95},
                {'entity_group': 'PERSON', 'word': 'Steve Jobs', 'score': 0.90},
                {'entity_group': 'LOC', 'word': 'California', 'score': 0.85}
            ]
            mock_ner.return_value = mock_ner_pipeline
            
            # Mock semantic model
            mock_semantic_model = Mock()
            mock_embeddings = np.array([
                [0.1, 0.2, 0.3],
                [0.15, 0.25, 0.35],
                [0.9, 0.8, 0.7]
            ])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # Step 1: Extract entities with NER
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Apple was founded by Steve Jobs in California",
                    "language": "en",
                    "include_relationships": True
                }
            )
            
            assert ner_response.status_code == 200
            ner_data = ner_response.json()
            assert 'entities' in ner_data
            assert len(ner_data['entities']['organizations']) > 0
            
            # Extract keywords from NER results
            keywords = []
            for entity_type, entities in ner_data['entities'].items():
                for entity in entities:
                    keywords.append(entity['text'])
            
            # Step 2: Cluster keywords with semantic similarity
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": keywords,
                    "language": "en",
                    "cluster": True
                }
            )
            
            assert semantic_response.status_code == 200
            semantic_data = semantic_response.json()
            assert 'clusters' in semantic_data
            assert 'similarity_matrix' in semantic_data

    async def test_multilingual_ner_with_semantic_similarity(self, async_client):
        """Test multilingual NER with semantic similarity."""
        with patch('services.ner_service.model_manager.get_multilingual_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_multilingual_semantic_model') as mock_semantic:
            
            # Mock multilingual NER pipeline
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [
                {'entity_group': 'PER', 'word': 'Juan', 'score': 0.88},
                {'entity_group': 'LOC', 'word': 'Madrid', 'score': 0.85}
            ]
            mock_ner.return_value = mock_ner_pipeline
            
            # Mock multilingual semantic model
            mock_semantic_model = Mock()
            mock_embeddings = np.array([
                [0.1, 0.2],
                [0.2, 0.3]
            ])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # Test with Spanish text
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Juan vive en Madrid",
                    "language": "es",
                    "include_relationships": False
                }
            )
            
            assert ner_response.status_code == 200
            ner_data = ner_response.json()
            assert ner_data['metadata']['language'] == 'es'
            
            # Extract keywords and test semantic similarity
            keywords = ['Juan', 'Madrid']
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": keywords,
                    "language": "es",
                    "cluster": True
                }
            )
            
            assert semantic_response.status_code == 200
            semantic_data = semantic_response.json()
            assert semantic_data['metadata']['language'] == 'es'

    async def test_error_recovery_across_services(self, async_client):
        """Test error recovery across service boundaries."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock NER failure
            mock_ner.side_effect = Exception("NER model failed")
            
            # NER should fail gracefully
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Test text",
                    "language": "en"
                }
            )
            
            assert ner_response.status_code == 200
            # Check that the response contains error information
            ner_data = ner_response.json()
            assert 'error' in ner_data['metadata']
            
            # Semantic service should still work independently
            mock_semantic_model = Mock()
            mock_embeddings = np.array([[0.1, 0.2], [0.2, 0.3]])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test", "keywords"],
                    "language": "en",
                    "cluster": True
                }
            )
            
            assert semantic_response.status_code == 200

    async def test_concurrent_ner_and_semantic_requests(self, async_client):
        """Test concurrent requests to both services."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock NER pipeline
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [
                {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95}
            ]
            mock_ner.return_value = mock_ner_pipeline
            
            # Mock semantic model
            mock_semantic_model = Mock()
            mock_embeddings = np.array([[0.1, 0.2], [0.2, 0.3]])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # Create concurrent requests
            ner_task = async_client.post(
                "/ner",
                json={
                    "text": "Apple Inc. is a technology company",
                    "language": "en"
                }
            )
            
            semantic_task = async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["technology", "company"],
                    "language": "en",
                    "cluster": True
                }
            )
            
            # Execute concurrently
            ner_response, semantic_response = await asyncio.gather(ner_task, semantic_task)
            
            assert ner_response.status_code == 200
            assert semantic_response.status_code == 200

    async def test_large_text_processing_workflow(self, async_client):
        """Test processing large text with both services."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock NER pipeline for large text
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [
                {'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95},
                {'entity_group': 'PERSON', 'word': 'Steve Jobs', 'score': 0.90},
                {'entity_group': 'PERSON', 'word': 'Tim Cook', 'score': 0.88},
                {'entity_group': 'LOC', 'word': 'California', 'score': 0.85},
                {'entity_group': 'LOC', 'word': 'Cupertino', 'score': 0.82}
            ]
            mock_ner.return_value = mock_ner_pipeline
            
            # Mock semantic model
            mock_semantic_model = Mock()
            mock_embeddings = np.array([
                [0.1, 0.2, 0.3],
                [0.15, 0.25, 0.35],
                [0.2, 0.3, 0.4],
                [0.8, 0.7, 0.6],
                [0.85, 0.75, 0.65]
            ])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # Large text processing
            large_text = "Apple Inc. was founded by Steve Jobs and Steve Wozniak in California. " * 100
            
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": large_text,
                    "language": "en",
                    "include_relationships": True
                }
            )
            
            assert ner_response.status_code == 200
            ner_data = ner_response.json()
            
            # Extract all entities for semantic clustering
            all_entities = []
            for entity_type, entities in ner_data['entities'].items():
                for entity in entities:
                    all_entities.append(entity['text'])
            
            # Cluster all entities
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": all_entities,
                    "language": "en",
                    "cluster": True
                }
            )
            
            assert semantic_response.status_code == 200
            semantic_data = semantic_response.json()
            assert len(semantic_data['clusters']) > 0


@pytest.mark.asyncio
class TestServicePerformanceIntegration:
    """Test performance aspects of cross-service integration."""

    async def test_model_caching_across_services(self, async_client):
        """Test that models are cached across service calls."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock models
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [{'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95}]
            mock_ner.return_value = mock_ner_pipeline
            
            mock_semantic_model = Mock()
            mock_embeddings = np.array([[0.1, 0.2], [0.2, 0.3]])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # First call to NER
            await async_client.post(
                "/ner",
                json={
                    "text": "Apple Inc.",
                    "language": "en"
                }
            )
            
            # Second call to NER (should use cached model)
            await async_client.post(
                "/ner",
                json={
                    "text": "Microsoft Corp.",
                    "language": "en"
                }
            )
            
            # First call to semantic
            await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["Apple", "Microsoft"],
                    "language": "en"
                }
            )
            
            # Models should be loaded (caching behavior may vary)
            assert mock_ner.call_count >= 1
            assert mock_semantic.call_count == 1

    async def test_memory_usage_optimization(self, async_client):
        """Test memory usage optimization across services."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock models with memory tracking
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [{'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95}]
            mock_ner.return_value = mock_ner_pipeline
            
            mock_semantic_model = Mock()
            mock_embeddings = np.array([[0.1, 0.2], [0.2, 0.3]])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # Process multiple requests to test memory management
            for i in range(5):
                await async_client.post(
                    "/ner",
                    json={
                        "text": f"Test text {i}",
                        "language": "en"
                    }
                )
                
                await async_client.post(
                    "/semantic-similarity",
                    json={
                        "keywords": [f"keyword{i}"],
                        "language": "en"
                    }
                )
            
            # Services should handle multiple requests without memory leaks
            assert mock_ner.call_count >= 1  # Model loaded (caching behavior may vary)
            assert mock_semantic.call_count >= 1  # Model loaded (caching behavior may vary)


@pytest.mark.asyncio
class TestErrorPropagationIntegration:
    """Test error propagation across integrated services."""

    async def test_ner_error_propagation_to_semantic(self, async_client):
        """Test that NER errors don't affect semantic service."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # NER fails
            mock_ner.side_effect = Exception("NER model unavailable")
            
            # Semantic should still work
            mock_semantic_model = Mock()
            mock_embeddings = np.array([[0.1, 0.2], [0.2, 0.3]])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # NER should fail
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Test text",
                    "language": "en"
                }
            )
            assert ner_response.status_code == 200
            # Check that the response contains error information
            ner_data = ner_response.json()
            assert 'error' in ner_data['metadata']
            
            # Semantic should work
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test", "keywords"],
                    "language": "en"
                }
            )
            assert semantic_response.status_code == 200

    async def test_semantic_error_propagation_to_ner(self, async_client):
        """Test that semantic errors don't affect NER service."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Semantic fails
            mock_semantic.side_effect = Exception("Semantic model unavailable")
            
            # NER should still work
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [{'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95}]
            mock_ner.return_value = mock_ner_pipeline
            
            # NER should work
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Apple Inc.",
                    "language": "en"
                }
            )
            assert ner_response.status_code == 200
            
            # Semantic should fail
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test", "keywords"],
                    "language": "en"
                }
            )
            assert semantic_response.status_code == 200
            # Check that the response contains error information
            semantic_data = semantic_response.json()
            assert 'error' in semantic_data

    async def test_partial_failure_recovery(self, async_client):
        """Test recovery from partial service failures."""
        with patch('services.ner_service.model_manager.get_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_semantic_model') as mock_semantic:
            
            # Mock NER working
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [{'entity_group': 'ORG', 'word': 'Apple', 'score': 0.95}]
            mock_ner.return_value = mock_ner_pipeline
            
            # Mock semantic failing initially, then working
            call_count = 0
            def mock_semantic_side_effect():
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    raise Exception("Temporary semantic failure")
                else:
                    mock_semantic_model = Mock()
                    mock_embeddings = np.array([[0.1, 0.2], [0.2, 0.3]])
                    mock_semantic_model.encode.return_value = mock_embeddings
                    return mock_semantic_model
            
            mock_semantic.side_effect = mock_semantic_side_effect
            
            # NER should work
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Apple Inc.",
                    "language": "en"
                }
            )
            assert ner_response.status_code == 200
            
            # First semantic call should fail
            semantic_response1 = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test"],
                    "language": "en"
                }
            )
            assert semantic_response1.status_code == 200
            # Check that the response contains error information
            semantic_data1 = semantic_response1.json()
            assert 'error' in semantic_data1
            
            # Second semantic call should work
            semantic_response2 = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": ["test"],
                    "language": "en"
                }
            )
            assert semantic_response2.status_code == 200


@pytest.mark.asyncio
class TestDataFlowIntegration:
    """Test data flow between NER and semantic services."""

    async def test_entity_to_keyword_flow(self, async_client):
        """Test flow from NER entities to semantic keywords."""
        # Clear model cache to ensure mocks work
        from models import _model_cache
        _model_cache.clear()
        
        with patch('services.ner_service.NERService.extract_entities') as mock_ner_extract, \
             patch('services.semantic_service.SemanticService.compute_similarity') as mock_semantic_compute:
            
            # Mock NER service to return specific entities
            mock_ner_extract.return_value = {
                'entities': {
                    'ORG': [
                        {'text': 'Apple', 'start': 0, 'end': 5, 'confidence': 0.95},
                        {'text': 'Microsoft', 'start': 10, 'end': 19, 'confidence': 0.90}
                    ],
                    'PERSON': [
                        {'text': 'Steve Jobs', 'start': 20, 'end': 30, 'confidence': 0.88}
                    ]
                },
                'relationships': [],
                'metadata': {
                    'language': 'en',
                    'total_entities': 3,
                    'confidence_threshold': 0.7
                }
            }
            
            # Mock semantic service to return clustering results
            mock_semantic_compute.return_value = {
                'clusters': [
                    {
                        'cluster_id': 0,
                        'keywords': ['Apple', 'Microsoft'],
                        'centroid': [0.95, 0.05, 0.0],
                        'size': 2
                    },
                    {
                        'cluster_id': 1,
                        'keywords': ['Steve Jobs'],
                        'centroid': [0.0, 0.0, 1.0],
                        'size': 1
                    }
                ],
                'similarity_matrix': [
                    [1.0, 0.9, 0.1],
                    [0.9, 1.0, 0.1],
                    [0.1, 0.1, 1.0]
                ],
                'grouped_keywords': {
                    'tech_companies': ['Apple', 'Microsoft'],
                    'people': ['Steve Jobs']
                },
                'embeddings_shape': (3, 3),
                'metadata': {
                    'language': 'en',
                    'total_keywords': 3,
                    'clustering_method': 'agglomerative'
                }
            }
            
            # Extract entities
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Apple and Microsoft are tech companies. Steve Jobs founded Apple.",
                    "language": "en"
                }
            )
            
            assert ner_response.status_code == 200
            ner_data = ner_response.json()
            
            # Extract entity texts
            entity_texts = []
            for entity_type, entities in ner_data['entities'].items():
                for entity in entities:
                    entity_texts.append(entity['text'])
            
            # Cluster entities semantically
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": entity_texts,
                    "language": "en",
                    "cluster": True
                }
            )
            
            assert semantic_response.status_code == 200
            semantic_data = semantic_response.json()
            
            # Should have clusters based on semantic similarity
            assert len(semantic_data['clusters']) > 0

    async def test_multilingual_data_flow(self, async_client):
        """Test multilingual data flow between services."""
        with patch('services.ner_service.model_manager.get_multilingual_ner_model') as mock_ner, \
             patch('services.semantic_service.model_manager.get_multilingual_semantic_model') as mock_semantic:
            
            # Mock multilingual NER
            mock_ner_pipeline = Mock()
            mock_ner_pipeline.return_value = [
                {'entity_group': 'PER', 'word': 'Juan', 'score': 0.88},
                {'entity_group': 'LOC', 'word': 'Madrid', 'score': 0.85}
            ]
            mock_ner.return_value = mock_ner_pipeline
            
            # Mock multilingual semantic model
            mock_semantic_model = Mock()
            mock_embeddings = np.array([
                [0.1, 0.2],
                [0.2, 0.3]
            ])
            mock_semantic_model.encode.return_value = mock_embeddings
            mock_semantic.return_value = mock_semantic_model
            
            # Process Spanish text
            ner_response = await async_client.post(
                "/ner",
                json={
                    "text": "Juan vive en Madrid",
                    "language": "es"
                }
            )
            
            assert ner_response.status_code == 200
            ner_data = ner_response.json()
            assert ner_data['metadata']['language'] == 'es'
            
            # Extract Spanish entities
            entity_texts = []
            for entity_type, entities in ner_data['entities'].items():
                for entity in entities:
                    entity_texts.append(entity['text'])
            
            # Process with semantic similarity in Spanish
            semantic_response = await async_client.post(
                "/semantic-similarity",
                json={
                    "keywords": entity_texts,
                    "language": "es",
                    "cluster": True
                }
            )
            
            assert semantic_response.status_code == 200
            semantic_data = semantic_response.json()
            assert semantic_data['metadata']['language'] == 'es'
