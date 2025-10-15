"""
Semantic Similarity Service using Sentence Transformers.

This service provides embeddings generation, keyword clustering,
and semantic similarity analysis for improved keyword grouping.
"""

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import AgglomerativeClustering
from collections import defaultdict

from models import model_manager

logger = logging.getLogger(__name__)


class SemanticService:
    """Semantic similarity and clustering service."""
    
    def __init__(self):
        self.similarity_threshold = float(os.getenv("SEMANTIC_SIMILARITY_THRESHOLD", "0.75"))
        self.enable_clustering = os.getenv("ENABLE_CLUSTERING", "true").lower() == "true"
        self.embedding_cache: Dict[str, np.ndarray] = {}
        self.cache_size = int(os.getenv("CACHE_SIZE", "1000"))
    
    def compute_similarity(
        self, 
        keywords: List[str],
        language: str = 'en',
        cluster: bool = True
    ) -> Dict[str, Any]:
        """
        Compute semantic similarity between keywords and optionally cluster them.
        
        Args:
            keywords: List of keywords/phrases to analyze
            language: Language code for multilingual support
            cluster: Whether to cluster similar keywords
        
        Returns:
            Dictionary containing similarity matrix, clusters, and grouped keywords
        """
        try:
            if not keywords:
                return {
                    'clusters': [],
                    'similarity_matrix': [],
                    'grouped_keywords': {},
                    'embeddings_shape': (0, 0)
                }
            
            # Generate embeddings
            embeddings = self._generate_embeddings(keywords, language)
            
            # Compute similarity matrix
            similarity_matrix = self._compute_similarity_matrix(embeddings)
            
            # Cluster keywords if enabled
            clusters = []
            grouped_keywords = {}
            
            if cluster and self.enable_clustering and len(keywords) > 1:
                clusters = self._cluster_keywords(keywords, embeddings, similarity_matrix)
                grouped_keywords = self._group_by_similarity(keywords, similarity_matrix)
            
            return {
                'clusters': clusters,
                'similarity_matrix': similarity_matrix.tolist(),
                'grouped_keywords': grouped_keywords,
                'embeddings_shape': embeddings.shape,
                'metadata': {
                    'num_keywords': len(keywords),
                    'similarity_threshold': self.similarity_threshold,
                    'language': language
                }
            }
        except Exception as e:
            logger.error(f"Semantic similarity computation failed: {str(e)}")
            return {
                'clusters': [],
                'similarity_matrix': [],
                'grouped_keywords': {},
                'embeddings_shape': (0, 0),
                'error': str(e)
            }
    
    def _generate_embeddings(self, texts: List[str], language: str) -> np.ndarray:
        """Generate embeddings for texts using sentence transformers."""
        try:
            # Choose appropriate model based on language
            if language in ['en']:
                model = model_manager.get_semantic_model()
            else:
                model = model_manager.get_multilingual_semantic_model()
            
            # Check cache for existing embeddings
            uncached_texts = []
            uncached_indices = []
            embeddings_list = [None] * len(texts)
            
            for i, text in enumerate(texts):
                cache_key = f"{text}_{language}"
                if cache_key in self.embedding_cache:
                    embeddings_list[i] = self.embedding_cache[cache_key]
                else:
                    uncached_texts.append(text)
                    uncached_indices.append(i)
            
            # Generate embeddings for uncached texts
            if uncached_texts:
                new_embeddings = model.encode(uncached_texts, convert_to_numpy=True)
                
                # Cache new embeddings (with LRU-like behavior)
                if len(self.embedding_cache) > self.cache_size:
                    # Remove oldest entries
                    keys_to_remove = list(self.embedding_cache.keys())[:len(self.embedding_cache) - self.cache_size + len(uncached_texts)]
                    for key in keys_to_remove:
                        del self.embedding_cache[key]
                
                # Add to cache and results
                for i, idx in enumerate(uncached_indices):
                    cache_key = f"{texts[idx]}_{language}"
                    self.embedding_cache[cache_key] = new_embeddings[i]
                    embeddings_list[idx] = new_embeddings[i]
            
            return np.array(embeddings_list)
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            raise
    
    def _compute_similarity_matrix(self, embeddings: np.ndarray) -> np.ndarray:
        """Compute cosine similarity matrix for embeddings."""
        try:
            similarity_matrix = cosine_similarity(embeddings)
            return similarity_matrix
        except Exception as e:
            logger.error(f"Similarity matrix computation failed: {str(e)}")
            return np.array([[]])
    
    def _cluster_keywords(
        self, 
        keywords: List[str], 
        embeddings: np.ndarray,
        similarity_matrix: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Cluster keywords using hierarchical clustering."""
        try:
            if len(keywords) < 2:
                return [{'id': 0, 'keywords': keywords, 'centroid_keyword': keywords[0] if keywords else ''}]
            
            # Convert similarity to distance
            distance_matrix = 1 - similarity_matrix
            
            # Determine optimal number of clusters (between 2 and sqrt(n))
            max_clusters = min(int(np.sqrt(len(keywords))), len(keywords))
            n_clusters = max(2, max_clusters)
            
            # Perform hierarchical clustering
            clustering = AgglomerativeClustering(
                n_clusters=n_clusters,
                metric='precomputed',
                linkage='average'
            )
            
            labels = clustering.fit_predict(distance_matrix)
            
            # Group keywords by cluster
            clusters = []
            for cluster_id in range(n_clusters):
                cluster_keywords = [keywords[i] for i, label in enumerate(labels) if label == cluster_id]
                
                if cluster_keywords:
                    # Find centroid keyword (most similar to others in cluster)
                    cluster_indices = [i for i, label in enumerate(labels) if label == cluster_id]
                    cluster_similarities = similarity_matrix[np.ix_(cluster_indices, cluster_indices)]
                    avg_similarities = cluster_similarities.mean(axis=1)
                    centroid_idx = cluster_indices[np.argmax(avg_similarities)]
                    
                    clusters.append({
                        'id': int(cluster_id),
                        'keywords': cluster_keywords,
                        'centroid_keyword': keywords[centroid_idx],
                        'size': len(cluster_keywords),
                        'avg_similarity': float(avg_similarities.max())
                    })
            
            return clusters
        except Exception as e:
            logger.error(f"Keyword clustering failed: {str(e)}")
            return []
    
    def _group_by_similarity(
        self, 
        keywords: List[str], 
        similarity_matrix: np.ndarray
    ) -> Dict[str, List[Tuple[str, float]]]:
        """Group keywords by semantic similarity."""
        try:
            grouped = {}
            
            for i, keyword in enumerate(keywords):
                similar_keywords = []
                
                for j, other_keyword in enumerate(keywords):
                    if i != j and similarity_matrix[i][j] >= self.similarity_threshold:
                        similar_keywords.append((other_keyword, float(similarity_matrix[i][j])))
                
                # Sort by similarity score
                similar_keywords.sort(key=lambda x: x[1], reverse=True)
                
                if similar_keywords:
                    grouped[keyword] = similar_keywords
            
            return grouped
        except Exception as e:
            logger.error(f"Keyword grouping failed: {str(e)}")
            return {}
    
    def find_semantic_duplicates(
        self, 
        keywords: List[str],
        language: str = 'en',
        threshold: float = 0.9
    ) -> List[Tuple[str, str, float]]:
        """
        Find semantically similar keywords that might be duplicates.
        
        Args:
            keywords: List of keywords to check
            language: Language code
            threshold: Similarity threshold for considering duplicates (default 0.9)
        
        Returns:
            List of tuples (keyword1, keyword2, similarity_score)
        """
        try:
            if len(keywords) < 2:
                return []
            
            embeddings = self._generate_embeddings(keywords, language)
            similarity_matrix = self._compute_similarity_matrix(embeddings)
            
            duplicates = []
            for i in range(len(keywords)):
                for j in range(i + 1, len(keywords)):
                    if similarity_matrix[i][j] >= threshold:
                        duplicates.append((
                            keywords[i],
                            keywords[j],
                            float(similarity_matrix[i][j])
                        ))
            
            # Sort by similarity score
            duplicates.sort(key=lambda x: x[2], reverse=True)
            
            return duplicates
        except Exception as e:
            logger.error(f"Duplicate detection failed: {str(e)}")
            return []
    
    def compute_topic_coherence(
        self,
        topic_keywords: List[str],
        language: str = 'en'
    ) -> float:
        """
        Compute topic coherence score based on semantic similarity of keywords.
        
        Args:
            topic_keywords: List of keywords representing a topic
            language: Language code
        
        Returns:
            Coherence score (0-1, higher is more coherent)
        """
        try:
            if len(topic_keywords) < 2:
                return 1.0 if len(topic_keywords) == 1 else 0.0
            
            embeddings = self._generate_embeddings(topic_keywords, language)
            similarity_matrix = self._compute_similarity_matrix(embeddings)
            
            # Compute average pairwise similarity (excluding diagonal)
            n = len(topic_keywords)
            total_similarity = 0
            count = 0
            
            for i in range(n):
                for j in range(i + 1, n):
                    total_similarity += similarity_matrix[i][j]
                    count += 1
            
            coherence = total_similarity / count if count > 0 else 0.0
            
            return float(coherence)
        except Exception as e:
            logger.error(f"Topic coherence computation failed: {str(e)}")
            return 0.0
    
    def clear_cache(self):
        """Clear embedding cache."""
        self.embedding_cache.clear()
        logger.info("Embedding cache cleared")


# Global semantic service instance
semantic_service = SemanticService()


