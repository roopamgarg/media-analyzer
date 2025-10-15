"""
Model management for NER and Semantic Analysis.

This module provides lazy loading and caching for ML models used in
Named Entity Recognition and Semantic Similarity analysis.
"""

import os
import logging
from typing import Optional, Dict, Any
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
from sentence_transformers import SentenceTransformer
import spacy
from functools import lru_cache

logger = logging.getLogger(__name__)

# Global model cache
_model_cache: Dict[str, Any] = {}


class ModelManager:
    """Manages loading and caching of ML models."""
    
    def __init__(self):
        self.device = self._detect_device()
        logger.info(f"ModelManager initialized with device: {self.device}")
    
    def _detect_device(self) -> str:
        """Detect if GPU is available and should be used."""
        use_gpu = os.getenv("USE_GPU", "auto").lower()
        
        if use_gpu == "false":
            return "cpu"
        elif use_gpu == "true":
            return "cuda" if torch.cuda.is_available() else "cpu"
        else:  # auto
            return "cuda" if torch.cuda.is_available() else "cpu"
    
    def get_ner_model(self, model_name: Optional[str] = None):
        """
        Get NER model with lazy loading.
        
        Args:
            model_name: Name of the model to load. Defaults to env var NER_MODEL.
        
        Returns:
            Transformers pipeline for token classification
        """
        model_name = model_name or os.getenv("NER_MODEL", "dslim/bert-base-NER")
        cache_key = f"ner_{model_name}"
        
        if cache_key not in _model_cache:
            logger.info(f"Loading NER model: {model_name}")
            try:
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForTokenClassification.from_pretrained(model_name)
                
                # Move model to appropriate device
                if self.device == "cuda":
                    model = model.to(self.device)
                
                ner_pipeline = pipeline(
                    "ner",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple",
                    device=0 if self.device == "cuda" else -1
                )
                
                _model_cache[cache_key] = ner_pipeline
                logger.info(f"NER model {model_name} loaded successfully on {self.device}")
            except Exception as e:
                logger.error(f"Failed to load NER model {model_name}: {str(e)}")
                raise
        
        return _model_cache[cache_key]
    
    def get_multilingual_ner_model(self, model_name: Optional[str] = None):
        """
        Get multilingual NER model with lazy loading.
        
        Args:
            model_name: Name of the model to load. Defaults to env var NER_MULTILINGUAL_MODEL.
        
        Returns:
            Transformers pipeline for token classification
        """
        model_name = model_name or os.getenv(
            "NER_MULTILINGUAL_MODEL", 
            "xlm-roberta-large-finetuned-conll03-english"
        )
        cache_key = f"ner_multilingual_{model_name}"
        
        if cache_key not in _model_cache:
            logger.info(f"Loading multilingual NER model: {model_name}")
            try:
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForTokenClassification.from_pretrained(model_name)
                
                # Move model to appropriate device
                if self.device == "cuda":
                    model = model.to(self.device)
                
                ner_pipeline = pipeline(
                    "ner",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple",
                    device=0 if self.device == "cuda" else -1
                )
                
                _model_cache[cache_key] = ner_pipeline
                logger.info(f"Multilingual NER model {model_name} loaded successfully on {self.device}")
            except Exception as e:
                logger.error(f"Failed to load multilingual NER model {model_name}: {str(e)}")
                raise
        
        return _model_cache[cache_key]
    
    def get_spacy_model(self, model_name: Optional[str] = None):
        """
        Get spaCy model with lazy loading.
        
        Args:
            model_name: Name of the spaCy model to load. Defaults to env var SPACY_MODEL.
        
        Returns:
            spaCy Language model
        """
        model_name = model_name or os.getenv("SPACY_MODEL", "en_core_web_lg")
        cache_key = f"spacy_{model_name}"
        
        if cache_key not in _model_cache:
            logger.info(f"Loading spaCy model: {model_name}")
            try:
                nlp = spacy.load(model_name)
                _model_cache[cache_key] = nlp
                logger.info(f"spaCy model {model_name} loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load spaCy model {model_name}: {str(e)}")
                raise
        
        return _model_cache[cache_key]
    
    def get_semantic_model(self, model_name: Optional[str] = None):
        """
        Get sentence transformer model for semantic similarity.
        
        Args:
            model_name: Name of the model to load. Defaults to env var SEMANTIC_MODEL.
        
        Returns:
            SentenceTransformer model
        """
        model_name = model_name or os.getenv(
            "SEMANTIC_MODEL", 
            "sentence-transformers/all-mpnet-base-v2"
        )
        cache_key = f"semantic_{model_name}"
        
        if cache_key not in _model_cache:
            logger.info(f"Loading semantic model: {model_name}")
            try:
                model = SentenceTransformer(model_name)
                
                # Move model to appropriate device
                if self.device == "cuda":
                    model = model.to(self.device)
                
                _model_cache[cache_key] = model
                logger.info(f"Semantic model {model_name} loaded successfully on {self.device}")
            except Exception as e:
                logger.error(f"Failed to load semantic model {model_name}: {str(e)}")
                raise
        
        return _model_cache[cache_key]
    
    def get_multilingual_semantic_model(self, model_name: Optional[str] = None):
        """
        Get multilingual sentence transformer model for semantic similarity.
        
        Args:
            model_name: Name of the model to load. Defaults to paraphrase-multilingual.
        
        Returns:
            SentenceTransformer model
        """
        model_name = model_name or "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
        cache_key = f"semantic_multilingual_{model_name}"
        
        if cache_key not in _model_cache:
            logger.info(f"Loading multilingual semantic model: {model_name}")
            try:
                model = SentenceTransformer(model_name)
                
                # Move model to appropriate device
                if self.device == "cuda":
                    model = model.to(self.device)
                
                _model_cache[cache_key] = model
                logger.info(f"Multilingual semantic model {model_name} loaded successfully on {self.device}")
            except Exception as e:
                logger.error(f"Failed to load multilingual semantic model {model_name}: {str(e)}")
                raise
        
        return _model_cache[cache_key]
    
    def clear_cache(self):
        """Clear all cached models."""
        global _model_cache
        _model_cache.clear()
        logger.info("Model cache cleared")


# Global model manager instance
model_manager = ModelManager()


