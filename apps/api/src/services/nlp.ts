export interface TimedDocument {
  fullText: string;
  timeline: Array<{
    t: number;
    text: string;
    source: 'caption' | 'asr' | 'ocr';
  }>;
}

export interface Entities {
  brands: string[];
  competitors: string[];
  regulated: string[];
}

export function buildTimedDoc({
  caption,
  asr,
  ocr,
}: {
  caption?: string | null;
  asr: { segments: Array<{ tStart: number; tEnd: number; text: string }> };
  ocr: { frames: Array<{ t: number; boxes: Array<{ text: string }> }> };
}): TimedDocument {
  const timeline: TimedDocument['timeline'] = [];
  let fullText = '';
  
  // Add caption
  if (caption) {
    timeline.push({
      t: 0,
      text: caption,
      source: 'caption',
    });
    fullText += caption + ' ';
  }
  
  // Add ASR segments
  if (asr?.segments) {
    asr.segments.forEach((segment) => {
      timeline.push({
        t: segment.tStart,
        text: segment.text,
        source: 'asr',
      });
      fullText += segment.text + ' ';
    });
  }
  
  // Add OCR text
  if (ocr?.frames) {
    ocr.frames.forEach((frame) => {
      frame.boxes.forEach((box) => {
        timeline.push({
          t: frame.t,
          text: box.text,
          source: 'ocr',
        });
        fullText += box.text + ' ';
      });
    });
  }
  
  return {
    fullText: fullText.trim(),
    timeline,
  };
}

export function ner(text: string): Entities {
  // Simple NER implementation
  // In production, use a proper NER library like spaCy or similar
  
  const brands: string[] = [];
  const competitors: string[] = [];
  const regulated: string[] = [];
  
  // Simple keyword matching for demo
  const brandKeywords = ['nike', 'adidas', 'apple', 'google', 'microsoft'];
  const competitorKeywords = ['competitor', 'rival', 'alternative'];
  const regulatedKeywords = ['guaranteed', 'promise', 'cure', 'treat', 'heal'];
  
  const lowerText = text.toLowerCase();
  
  brandKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      brands.push(keyword);
    }
  });
  
  competitorKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      competitors.push(keyword);
    }
  });
  
  regulatedKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      regulated.push(keyword);
    }
  });
  
  return {
    brands,
    competitors,
    regulated,
  };
}
