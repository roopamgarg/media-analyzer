from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import pytesseract
from PIL import Image
import io
import time
import os
from typing import List, Optional, Dict, Any
import logging
from pydantic import BaseModel
from instagram_downloader import InstagramDownloader
from audio_preprocessing import preprocess_audio
from text_postprocessing import post_process_transcript
from language_config import get_language_whisper_params
from services.ner_service import ner_service
from services.semantic_service import semantic_service

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("Environment variables loaded from .env file")
except ImportError:
    logger.warning("python-dotenv not installed. Install with: pip install python-dotenv")
except Exception as e:
    logger.warning(f"Could not load .env file: {e}")

app = FastAPI(title="Media Analyzer Worker", version="1.0.0")

# Pydantic models for request/response
class InstagramDownloadRequest(BaseModel):
    url: str
    output_path: Optional[str] = None
    browser_cookies: Optional[str] = None  # e.g., 'chrome', 'firefox', 'safari'
    cookies_file: Optional[str] = None     # Path to cookies.txt file

class InstagramDownloadResponse(BaseModel):
    success: bool
    video_path: Optional[str] = None
    caption: Optional[str] = None
    username: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None

# NER request/response models
class NERRequest(BaseModel):
    text: str
    language: Optional[str] = 'en'
    include_relationships: Optional[bool] = True

class NERResponse(BaseModel):
    entities: Dict[str, List[Dict[str, Any]]]
    relationships: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    timing: float

# Semantic similarity request/response models
class SemanticSimilarityRequest(BaseModel):
    keywords: List[str]
    language: Optional[str] = 'en'
    cluster: Optional[bool] = True

class SemanticSimilarityResponse(BaseModel):
    clusters: List[Dict[str, Any]]
    similarity_matrix: List[List[float]]
    grouped_keywords: Dict[str, List[Any]]
    embeddings_shape: tuple
    metadata: Dict[str, Any]
    timing: float
    error: Optional[str] = None

# Initialize Whisper model lazily
model = None

def get_whisper_model(model_size: Optional[str] = None, compute_type: Optional[str] = None):
    """
    Get Whisper model with configurable size and compute type.
    
    Args:
        model_size: Model size (base, small, medium, large-v3). Defaults to env var WHISPER_MODEL_SIZE or "medium"
        compute_type: Compute type (int8, float16, float32). Defaults to env var WHISPER_COMPUTE_TYPE or "float16"
    
    Returns:
        WhisperModel instance
    """
    global model
    
    # Get configuration from environment variables or parameters
    model_size = model_size or os.getenv("WHISPER_MODEL_SIZE", "medium")
    compute_type = compute_type or os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    
    # Validate model size
    valid_sizes = ["tiny", "base", "small", "medium", "large", "large-v2", "large-v3"]
    if model_size not in valid_sizes:
        logger.warning(f"Invalid model size: {model_size}, using medium")
        model_size = "medium"
    
    # Validate compute type
    valid_compute_types = ["int8", "int8_float16", "int16", "float16", "float32"]
    if compute_type not in valid_compute_types:
        logger.warning(f"Invalid compute type: {compute_type}, using float16")
        compute_type = "float16"
    
    # Create model key for caching
    model_key = f"{model_size}_{compute_type}"
    
    if model is None or not hasattr(model, '_model_key') or model._model_key != model_key:
        print(f"Loading Whisper model: {model_size} with {compute_type}...")
        model = WhisperModel(model_size, compute_type=compute_type)
        model._model_key = model_key  # Store model key for caching
        print(f"Whisper model {model_size} loaded with {compute_type}!")
    
    return model

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "worker-python"}

@app.post("/asr")
async def asr(
    file: UploadFile = File(...),
    language: Optional[str] = None,
    enable_preprocessing: Optional[bool] = None,
    preprocessing_level: Optional[str] = None,
    enable_postprocessing: Optional[bool] = None
):
    """
    Enhanced Speech-to-text transcription using Whisper with preprocessing and post-processing.
    
    Args:
        file: Audio file to transcribe
        language: Language hint for transcription and processing
        enable_preprocessing: Whether to apply audio preprocessing (defaults to env var ASR_ENABLE_PREPROCESSING)
        preprocessing_level: Preprocessing level - minimal, standard, aggressive (defaults to env var ASR_PREPROCESSING_LEVEL)
        enable_postprocessing: Whether to apply text post-processing (defaults to env var ASR_ENABLE_POSTPROCESSING)
    """
    start_time = time.time()
    
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Get configuration from environment variables or parameters
        enable_preprocessing = enable_preprocessing if enable_preprocessing is not None else os.getenv("ASR_ENABLE_PREPROCESSING", "true").lower() == "true"
        preprocessing_level = preprocessing_level or os.getenv("ASR_PREPROCESSING_LEVEL", "standard")
        enable_postprocessing = enable_postprocessing if enable_postprocessing is not None else os.getenv("ASR_ENABLE_POSTPROCESSING", "true").lower() == "true"
        
        # Apply audio preprocessing if enabled
        if enable_preprocessing:
            logger.info(f"Applying audio preprocessing with level: {preprocessing_level}")
            audio_data = preprocess_audio(audio_data, language_hint=language, preprocessing_level=preprocessing_level)
        
        # Get model (loads on first use)
        whisper_model = get_whisper_model()
        
        # Get language-specific parameters
        lang_params = get_language_whisper_params(language) if language else {}
        
        # Enhanced transcription parameters
        transcribe_params = {
            "language": language,
            "beam_size": 5,
            "best_of": 5,
            "temperature": lang_params.get("temperature", 0.0),
            "vad_filter": True,
            "vad_parameters": {
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 400
            },
            "word_timestamps": True,
            "condition_on_previous_text": True,
            "initial_prompt": lang_params.get("initial_prompt", ""),
            "compression_ratio_threshold": lang_params.get("compression_ratio_threshold", 2.4),
            "log_prob_threshold": lang_params.get("log_prob_threshold", -1.0),
            "no_speech_threshold": lang_params.get("no_speech_threshold", 0.6)
        }
        
        # Transcribe
        segments, info = whisper_model.transcribe(
            io.BytesIO(audio_data),
            **transcribe_params
        )
        
        # Convert segments to list
        segments_list = []
        for segment in segments:
            segments_list.append({
                "tStart": segment.start,
                "tEnd": segment.end,
                "text": segment.text.strip()
            })
        
        # Apply text post-processing if enabled
        if enable_postprocessing:
            logger.info("Applying text post-processing")
            segments_list = post_process_transcript(segments_list, language=language)
        
        timing = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return {
            "language": info.language,
            "segments": segments_list,
            "timing": timing,
            "preprocessing_enabled": enable_preprocessing,
            "preprocessing_level": preprocessing_level,
            "postprocessing_enabled": enable_postprocessing,
            "model_size": os.getenv("WHISPER_MODEL_SIZE", "medium"),
            "compute_type": os.getenv("WHISPER_COMPUTE_TYPE", "int8")
        }
        
    except Exception as e:
        logger.error(f"ASR failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ASR processing failed: {str(e)}")

@app.post("/ocr")
async def ocr(files: List[UploadFile] = File(...)):
    """Optical Character Recognition on image frames"""
    start_time = time.time()
    
    try:
        results = []
        
        for file in files:
            # Read image
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(image, lang='eng')
            
            # Get bounding boxes
            boxes = []
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 30:  # Confidence threshold
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    text_content = data['text'][i].strip()
                    
                    if text_content:
                        boxes.append({
                            "box": [x, y, w, h],
                            "text": text_content
                        })
            
            results.append({
                "filename": file.filename,
                "boxes": boxes,
                "full_text": text.strip()
            })
        
        timing = (time.time() - start_time) * 1000
        
        return {
            "frames": [{
                "t": i,
                "boxes": result["boxes"]
            } for i, result in enumerate(results)],
            "timing": timing
        }
        
    except Exception as e:
        logger.error(f"OCR failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.post("/download-instagram", response_model=InstagramDownloadResponse)
async def download_instagram(request: InstagramDownloadRequest):
    """Download Instagram Reel video"""
    start_time = time.time()
    
    try:
        # Initialize downloader with cookie options
        downloader = InstagramDownloader(
            browser_cookies=request.browser_cookies,
            cookies_file=request.cookies_file
        )
        
        # Download the Instagram Reel
        result = downloader.download_reel(request.url, request.output_path)
        
        processing_time = time.time() - start_time
        logger.info(f"Instagram download completed in {processing_time:.2f}s")
        
        return InstagramDownloadResponse(
            success=True,
            video_path=result['video_path'],
            caption=result['caption'],
            username=result['username'],
            duration=result['duration']
        )
        
    except Exception as e:
        logger.error(f"Instagram download failed: {str(e)}")
        return InstagramDownloadResponse(
            success=False,
            error=str(e)
        )

@app.post("/ner", response_model=NERResponse)
async def extract_entities(request: NERRequest):
    """
    Extract named entities from text using ML-based NER models.
    
    Args:
        request: NER request containing text, language, and options
    
    Returns:
        Extracted entities, relationships, and metadata
    """
    start_time = time.time()
    
    try:
        logger.info(f"NER request received for {len(request.text)} characters in {request.language}")
        
        # Extract entities
        result = ner_service.extract_entities(
            text=request.text,
            language=request.language,
            include_relationships=request.include_relationships
        )
        
        timing = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        logger.info(f"NER completed in {timing:.2f}ms")
        
        return NERResponse(
            entities=result['entities'],
            relationships=result['relationships'],
            metadata=result['metadata'],
            timing=timing
        )
        
    except Exception as e:
        logger.error(f"NER failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"NER processing failed: {str(e)}")

@app.post("/semantic-similarity", response_model=SemanticSimilarityResponse)
async def compute_semantic_similarity(request: SemanticSimilarityRequest):
    """
    Compute semantic similarity between keywords and cluster them.
    
    Args:
        request: Semantic similarity request containing keywords and options
    
    Returns:
        Keyword clusters, similarity matrix, and grouped keywords
    """
    start_time = time.time()
    
    try:
        logger.info(f"Semantic similarity request received for {len(request.keywords)} keywords in {request.language}")
        
        # Compute similarity and clustering
        result = semantic_service.compute_similarity(
            keywords=request.keywords,
            language=request.language,
            cluster=request.cluster
        )
        
        timing = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        logger.info(f"Semantic similarity computed in {timing:.2f}ms")
        
        return SemanticSimilarityResponse(
            clusters=result['clusters'],
            similarity_matrix=result['similarity_matrix'],
            grouped_keywords=result['grouped_keywords'],
            embeddings_shape=result['embeddings_shape'],
            metadata=result.get('metadata', {}),
            timing=timing,
            error=result.get('error')
        )
        
    except Exception as e:
        logger.error(f"Semantic similarity failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Semantic similarity processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
