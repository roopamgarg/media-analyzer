"""
Named Entity Recognition Service using transformers and spaCy.

This service provides ML-based entity extraction with relationship detection,
co-reference resolution, and confidence scoring.
"""

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache
import re
from collections import defaultdict

from models import model_manager

logger = logging.getLogger(__name__)

# Domain-specific entity databases
BRAND_DATABASE = {
    'tech': ['apple', 'google', 'microsoft', 'samsung', 'amazon', 'meta', 'netflix', 'spotify', 
             'uber', 'airbnb', 'tesla', 'tiktok', 'youtube', 'instagram', 'facebook', 'twitter', 
             'linkedin', 'snapchat', 'zoom', 'slack', 'discord', 'twitch'],
    'fashion': ['nike', 'adidas', 'gucci', 'zara', 'h&m', 'uniqlo', 'gap', 'levis', 
                'calvin klein', 'tommy hilfiger', 'ralph lauren', 'versace', 'prada', 'chanel', 
                'louis vuitton', 'hermes', 'burberry', 'balenciaga'],
    'food': ['mcdonalds', 'starbucks', 'subway', 'dominos', 'pizza hut', 'kfc', 'burger king', 
             'wendys', 'taco bell', 'chipotle', 'panera', 'dunkin'],
    'automotive': ['tesla', 'bmw', 'mercedes', 'toyota', 'honda', 'ford', 'chevrolet', 'audi', 
                   'volkswagen', 'nissan', 'hyundai', 'kia'],
    'beauty': ['loreal', 'maybelline', 'revlon', 'covergirl', 'clinique', 'estee lauder', 
               'mac', 'urban decay', 'fenty beauty', 'glossier']
}

COMPETITOR_KEYWORDS = ['competitor', 'rival', 'alternative', 'versus', 'vs', 'compared to', 
                       'better than', 'instead of', 'other brands']

REGULATED_KEYWORDS = ['guaranteed', 'promise', 'cure', 'treat', 'heal', 'medical', 'clinical', 
                      'scientifically proven', 'doctor approved', 'fda approved', 'certified', 
                      'miracle', 'revolutionary cure']

CLAIM_KEYWORDS = ['best', 'number 1', '#1', 'leading', 'top rated', 'award winning', 
                  'fastest', 'strongest', 'most effective', 'only', 'exclusive']


class NERService:
    """Named Entity Recognition service with ML models and relationship detection."""
    
    def __init__(self):
        self.confidence_threshold = float(os.getenv("NER_CONFIDENCE_THRESHOLD", "0.7"))
        self.entity_cache: Dict[str, Any] = {}
        self.cache_size = int(os.getenv("CACHE_SIZE", "1000"))
    
    @lru_cache(maxsize=1000)
    def _cached_extract(self, text: str, language: str) -> str:
        """Cache key for entity extraction."""
        return f"{text[:100]}_{language}"
    
    def extract_entities(
        self, 
        text: str, 
        language: str = 'en',
        include_relationships: bool = True
    ) -> Dict[str, Any]:
        """
        Extract entities from text using ML models.
        
        Args:
            text: Input text to extract entities from
            language: Language code (en, hi, es, etc.)
            include_relationships: Whether to extract entity relationships
        
        Returns:
            Dictionary containing entities, relationships, and confidence scores
        """
        try:
            # Choose appropriate NER model based on language
            if language in ['en']:
                ner_results = self._extract_with_transformer(text, language)
            else:
                ner_results = self._extract_with_multilingual_transformer(text, language)
            
            # Extract relationships using spaCy
            relationships = []
            if include_relationships:
                relationships = self._extract_relationships(text, ner_results)
            
            # Extract domain-specific entities
            domain_entities = self._extract_domain_specific(text)
            
            # Merge and structure results
            structured_entities = self._structure_entities(ner_results, domain_entities)
            
            return {
                'entities': structured_entities,
                'relationships': relationships,
                'metadata': {
                    'language': language,
                    'total_entities': sum(len(v) for v in structured_entities.values()),
                    'confidence_threshold': self.confidence_threshold
                }
            }
        except Exception as e:
            logger.error(f"Entity extraction failed: {str(e)}")
            return {
                'entities': self._get_empty_entities(),
                'relationships': [],
                'metadata': {
                    'language': language,
                    'total_entities': 0,
                    'confidence_threshold': self.confidence_threshold,
                    'error': str(e)
                }
            }
    
    def _extract_with_transformer(self, text: str, language: str) -> List[Dict[str, Any]]:
        """Extract entities using transformer-based NER model."""
        try:
            ner_pipeline = model_manager.get_ner_model()
            results = ner_pipeline(text)
            
            # Filter by confidence threshold
            filtered_results = [
                r for r in results 
                if r.get('score', 0) >= self.confidence_threshold
            ]
            
            return filtered_results
        except Exception as e:
            logger.error(f"Transformer NER failed: {str(e)}")
            raise e  # Re-raise the exception so it can be caught by the main method
    
    def _extract_with_multilingual_transformer(self, text: str, language: str) -> List[Dict[str, Any]]:
        """Extract entities using multilingual transformer model."""
        try:
            ner_pipeline = model_manager.get_multilingual_ner_model()
            results = ner_pipeline(text)
            
            # Filter by confidence threshold
            filtered_results = [
                r for r in results 
                if r.get('score', 0) >= self.confidence_threshold
            ]
            
            return filtered_results
        except Exception as e:
            logger.error(f"Multilingual NER failed: {str(e)}")
            raise e  # Re-raise the exception so it can be caught by the main method
    
    def _extract_relationships(self, text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract relationships between entities using spaCy."""
        try:
            nlp = model_manager.get_spacy_model()
            doc = nlp(text)
            
            relationships = []
            
            # Extract dependency-based relationships
            for token in doc:
                # Brand-Product relationships
                if token.dep_ in ['poss', 'nmod'] and token.head.pos_ == 'NOUN':
                    entity1 = token.text
                    entity2 = token.head.text
                    
                    # Check if both are entities
                    if self._is_entity(entity1, entities) and self._is_entity(entity2, entities):
                        relationships.append({
                            'entity1': entity1,
                            'entity2': entity2,
                            'type': 'possession',
                            'confidence': 0.8
                        })
                
                # Product-Price relationships
                if token.pos_ == 'NUM' and any(child.text.lower() in ['$', 'usd', 'dollars'] for child in token.children):
                    for child in token.head.children:
                        if child.pos_ == 'NOUN':
                            relationships.append({
                                'entity1': child.text,
                                'entity2': f"${token.text}",
                                'type': 'product-price',
                                'confidence': 0.9
                            })
            
            return relationships
        except Exception as e:
            logger.error(f"Relationship extraction failed: {str(e)}")
            return []
    
    def _extract_domain_specific(self, text: str) -> Dict[str, List[Tuple[str, float]]]:
        """Extract domain-specific entities (brands, competitors, regulated terms)."""
        text_lower = text.lower()
        domain_entities = {
            'brands': [],
            'competitors': [],
            'regulated': [],
            'claims': []
        }
        
        # Extract brands
        for category, brands in BRAND_DATABASE.items():
            for brand in brands:
                if brand in text_lower:
                    # Find actual casing in text
                    pattern = re.compile(re.escape(brand), re.IGNORECASE)
                    matches = pattern.finditer(text)
                    for match in matches:
                        domain_entities['brands'].append((match.group(), 0.95, category))
        
        # Extract competitor mentions
        for keyword in COMPETITOR_KEYWORDS:
            if keyword in text_lower:
                domain_entities['competitors'].append((keyword, 0.85))
        
        # Extract regulated terms
        for keyword in REGULATED_KEYWORDS:
            if keyword in text_lower:
                pattern = re.compile(re.escape(keyword), re.IGNORECASE)
                matches = pattern.finditer(text)
                for match in matches:
                    domain_entities['regulated'].append((match.group(), 0.9))
        
        # Extract claims
        for keyword in CLAIM_KEYWORDS:
            if keyword in text_lower:
                pattern = re.compile(re.escape(keyword), re.IGNORECASE)
                matches = pattern.finditer(text)
                for match in matches:
                    domain_entities['claims'].append((match.group(), 0.85))
        
        return domain_entities
    
    def _structure_entities(
        self, 
        ner_results: List[Dict[str, Any]], 
        domain_entities: Dict[str, List[Tuple]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Structure and merge entities from different sources."""
        structured = {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
            'times': [],
            'money': [],
            'percent': [],
            'brands': [],
            'products': [],
            'influencers': [],
            'competitors': [],
            'regulated': [],
            'claims': [],
            'misc': []
        }
        
        # Process transformer NER results
        entity_type_mapping = {
            'PER': 'persons',
            'PERSON': 'persons',
            'ORG': 'organizations',
            'ORGANIZATION': 'organizations',
            'LOC': 'locations',
            'LOCATION': 'locations',
            'GPE': 'locations',
            'DATE': 'dates',
            'TIME': 'times',
            'MONEY': 'money',
            'PERCENT': 'percent',
            'PRODUCT': 'products',
            'MISC': 'misc'
        }
        
        for entity in ner_results:
            entity_type = entity.get('entity_group', entity.get('entity', 'MISC'))
            target_key = entity_type_mapping.get(entity_type, 'misc')
            
            structured[target_key].append({
                'text': entity.get('word', ''),
                'confidence': entity.get('score', 0.0)
            })
        
        # Add domain-specific entities
        for brand_info in domain_entities.get('brands', []):
            if len(brand_info) == 3:
                text, confidence, category = brand_info
                structured['brands'].append({
                    'text': text,
                    'confidence': confidence,
                    'category': category
                })
        
        for competitor in domain_entities.get('competitors', []):
            text, confidence = competitor
            structured['competitors'].append({
                'text': text,
                'confidence': confidence
            })
        
        for regulated in domain_entities.get('regulated', []):
            text, confidence = regulated
            structured['regulated'].append({
                'text': text,
                'confidence': confidence
            })
        
        for claim in domain_entities.get('claims', []):
            text, confidence = claim
            structured['claims'].append({
                'text': text,
                'confidence': confidence
            })
        
        # Deduplicate entities
        for key in structured:
            structured[key] = self._deduplicate_entities(structured[key])
        
        return structured
    
    def _deduplicate_entities(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate entities, keeping the one with highest confidence."""
        seen = {}
        for entity in entities:
            text = entity['text'].lower()
            if text not in seen or entity['confidence'] > seen[text]['confidence']:
                seen[text] = entity
        
        return list(seen.values())
    
    def _is_entity(self, text: str, entities: List[Dict[str, Any]]) -> bool:
        """Check if text matches any extracted entity."""
        text_lower = text.lower()
        for entity in entities:
            if entity.get('word', '').lower() == text_lower:
                return True
        return False
    
    def _get_empty_entities(self) -> Dict[str, List]:
        """Return empty entity structure."""
        return {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
            'times': [],
            'money': [],
            'percent': [],
            'brands': [],
            'products': [],
            'influencers': [],
            'competitors': [],
            'regulated': [],
            'claims': [],
            'misc': []
        }


# Global NER service instance
ner_service = NERService()


