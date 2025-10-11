from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import pytesseract
from PIL import Image
import io
import time
from typing import List, Optional
import logging
from pydantic import BaseModel
from instagram_downloader import InstagramDownloader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Media Analyzer Worker", version="1.0.0")

# Pydantic models for request/response
class InstagramDownloadRequest(BaseModel):
    url: str
    output_path: Optional[str] = None

class InstagramDownloadResponse(BaseModel):
    success: bool
    video_path: Optional[str] = None
    caption: Optional[str] = None
    username: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None

# Initialize Whisper model lazily
model = None

def get_whisper_model():
    global model
    if model is None:
        print("Loading Whisper model...")
        model = WhisperModel("base", compute_type="int8")  # Smaller, faster model
        print("Whisper model loaded!")
    return model

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "worker-python"}

@app.post("/asr")
async def asr(
    file: UploadFile = File(...),
    language: Optional[str] = None
):
    """Speech-to-text transcription using Whisper"""
    start_time = time.time()
    
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Get model (loads on first use)
        whisper_model = get_whisper_model()
        
        # Transcribe
        segments, info = whisper_model.transcribe(
            io.BytesIO(audio_data),
            language=language,
            beam_size=5,
            best_of=5
        )
        
        # Convert segments to list
        segments_list = []
        for segment in segments:
            segments_list.append({
                "tStart": segment.start,
                "tEnd": segment.end,
                "text": segment.text.strip()
            })
        
        timing = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return {
            "language": info.language,
            "segments": segments_list,
            "timing": timing
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
        downloader = InstagramDownloader()
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
