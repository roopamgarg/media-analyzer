from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import pytesseract
from PIL import Image
import io
import time
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Media Analyzer Worker", version="1.0.0")

# Initialize Whisper model
model = WhisperModel("medium", compute_type="int8")

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
        
        # Transcribe
        segments, info = model.transcribe(
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
            "results": results,
            "timing": timing
        }
        
    except Exception as e:
        logger.error(f"OCR failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
