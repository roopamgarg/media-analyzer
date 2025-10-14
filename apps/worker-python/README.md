# Media Analyzer Python Worker

FastAPI microservice for media analysis tasks including ASR (Automatic Speech Recognition), OCR (Optical Character Recognition), and Instagram video downloads.

## Features

- **Enhanced ASR**: High-quality speech-to-text transcription using Whisper with audio preprocessing and text post-processing
- **OCR**: Optical Character Recognition on image frames
- **Instagram Downloads**: Download Instagram Reel videos with cookie support
- **Language Support**: Multi-language support with language-specific optimizations
- **Configurable Processing**: Adjustable preprocessing and post-processing levels

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (see Configuration section)

3. Run the service:
```bash
python main.py
```

## Configuration

### Environment Variables

#### Whisper Model Configuration
- `WHISPER_MODEL_SIZE`: Model size for Whisper (default: "medium")
  - Options: `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`
  - Larger models provide better accuracy but require more memory and processing time
- `WHISPER_COMPUTE_TYPE`: Compute type for Whisper (default: "float16")
  - Options: `int8`, `int8_float16`, `int16`, `float16`, `float32`
  - Higher precision provides better accuracy but uses more memory

#### ASR Processing Configuration
- `ASR_ENABLE_PREPROCESSING`: Enable audio preprocessing (default: "true")
- `ASR_PREPROCESSING_LEVEL`: Preprocessing level (default: "standard")
  - Options: `minimal`, `standard`, `aggressive`
  - Higher levels provide better quality but take longer to process
- `ASR_ENABLE_POSTPROCESSING`: Enable text post-processing (default: "true")

### Example Configuration

```bash
# High accuracy configuration
WHISPER_MODEL_SIZE=large-v3
WHISPER_COMPUTE_TYPE=float32
ASR_ENABLE_PREPROCESSING=true
ASR_PREPROCESSING_LEVEL=aggressive
ASR_ENABLE_POSTPROCESSING=true

# Fast processing configuration
WHISPER_MODEL_SIZE=base
WHISPER_COMPUTE_TYPE=int8
ASR_ENABLE_PREPROCESSING=true
ASR_PREPROCESSING_LEVEL=minimal
ASR_ENABLE_POSTPROCESSING=true
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns service status

### ASR (Speech Recognition)
- **POST** `/asr`

#### Parameters
- `file` (required): Audio file to transcribe
- `language` (optional): Language hint (e.g., "en", "hi", "es", "fr")
- `enable_preprocessing` (optional): Enable audio preprocessing (defaults to env var)
- `preprocessing_level` (optional): Preprocessing level - minimal, standard, aggressive
- `enable_postprocessing` (optional): Enable text post-processing (defaults to env var)

#### Response
```json
{
  "language": "en",
  "segments": [
    {
      "tStart": 0.0,
      "tEnd": 2.5,
      "text": "Hello world"
    }
  ],
  "timing": 1500,
  "preprocessing_enabled": true,
  "preprocessing_level": "standard",
  "postprocessing_enabled": true,
  "model_size": "medium",
  "compute_type": "float16"
}
```

#### Example Usage
```bash
# Basic transcription
curl -X POST "http://localhost:8000/asr" \
  -F "file=@audio.wav"

# With language hint and custom processing
curl -X POST "http://localhost:8000/asr?language=en&preprocessing_level=aggressive" \
  -F "file=@audio.wav"
```

### OCR (Optical Character Recognition)
- **POST** `/ocr`

#### Parameters
- `files` (required): Image files for OCR processing

#### Response
```json
{
  "frames": [
    {
      "t": 0,
      "boxes": [
        {
          "box": [100, 200, 300, 50],
          "text": "Sample text"
        }
      ]
    }
  ],
  "timing": 500
}
```

### Instagram Download
- **POST** `/download-instagram`

#### Parameters
```json
{
  "url": "https://www.instagram.com/reel/...",
  "output_path": "/path/to/output",
  "browser_cookies": "chrome",
  "cookies_file": "/path/to/cookies.txt"
}
```

## Supported Languages

The service supports the following languages with optimized parameters:

- **English (en)**: Default language with comprehensive error correction
- **Hindi (hi)**: Indian language support with appropriate frequency ranges
- **Spanish (es)**: European language with Spanish-specific preprocessing
- **French (fr)**: French language support
- **German (de)**: German language support
- **Tamil (ta)**: South Indian language support
- **Telugu (te)**: South Indian language support
- **Bengali (bn)**: Bengali language support
- **Chinese (zh)**: Chinese language support
- **Japanese (ja)**: Japanese language support
- **Korean (ko)**: Korean language support

## Audio Preprocessing

The service includes three levels of audio preprocessing:

### Minimal
- Basic normalization
- DC offset removal
- Simple silence trimming
- Fastest processing

### Standard (Default)
- Full normalization and filtering
- Language-specific frequency filtering
- Noise reduction
- Pre-emphasis filtering
- Good balance of quality and speed

### Aggressive
- Maximum noise reduction
- Advanced filtering
- Wiener filtering
- Aggressive silence trimming
- Best quality, slower processing

## Text Post-Processing

The service includes language-aware text cleaning:

- **Filler Word Removal**: Removes "um", "uh", "er", "ah", etc.
- **Repetition Removal**: Removes repeated words
- **Error Correction**: Fixes common ASR errors
- **Sentence Capitalization**: Proper capitalization
- **Punctuation Normalization**: Standardizes punctuation marks

## Performance Considerations

### Model Size vs Performance
- **tiny**: ~39MB, fastest, lowest accuracy
- **base**: ~74MB, fast, good accuracy
- **small**: ~244MB, moderate speed, better accuracy
- **medium**: ~769MB, slower, high accuracy (default)
- **large**: ~1550MB, slow, very high accuracy
- **large-v2**: ~1550MB, slow, very high accuracy
- **large-v3**: ~1550MB, slow, highest accuracy

### Compute Type vs Performance
- **int8**: Fastest, lowest memory, good accuracy
- **float16**: Balanced speed and accuracy (default)
- **float32**: Slowest, highest memory, best accuracy

## Testing

Run tests with:
```bash
pytest tests/
```

Run specific test categories:
```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# With coverage
pytest tests/ --cov=main --cov-report=html
```

## Docker Support

The service includes Docker support for easy deployment:

```bash
# Build image
docker build -t media-analyzer-worker .

# Run container
docker run -p 8000:8000 \
  -e WHISPER_MODEL_SIZE=medium \
  -e ASR_ENABLE_PREPROCESSING=true \
  media-analyzer-worker
```

## Troubleshooting

### Common Issues

1. **Out of Memory**: Use smaller model size or int8 compute type
2. **Slow Processing**: Enable preprocessing but use minimal level
3. **Poor Accuracy**: Use larger model size and aggressive preprocessing
4. **Language Detection Issues**: Provide explicit language parameter

### Logs

The service provides detailed logging for debugging:
- Audio preprocessing steps
- Model loading information
- Processing timing
- Error details

## Contributing

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation for new features
4. Ensure backward compatibility

## License

This project is part of the Media Analyzer system.

