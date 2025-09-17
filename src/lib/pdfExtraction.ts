// PDF Text and Image Extraction Utility
// src/lib/pdfExtraction.ts
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
}

export interface ExtractedPlay {
  name: string;
  pageNumber: number;
  confidence: 'high' | 'medium' | 'low';
  imageDataUrl?: string; // Base64 encoded image
  textContent: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFPage {
  pageNumber: number;
  textContent: string;
  imageDataUrl: string;
  width: number;
  height: number;
}

// Extract all pages with text and images
export const extractPDFPages = async (file: File): Promise<PDFPage[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const pages: PDFPage[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get text content
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str).join(' ');
      
      // Render page to canvas for image
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      const imageDataUrl = canvas.toDataURL('image/png');
      
      pages.push({
        pageNumber: pageNum,
        textContent: textItems,
        imageDataUrl,
        width: viewport.width,
        height: viewport.height
      });
    }
    
    return pages;
  } catch (error) {
    console.error('Error extracting PDF pages:', error);
    throw new Error('Failed to extract PDF pages');
  }
};

// Enhanced play extraction with image association
export const extractPlaysFromPages = (pages: PDFPage[]): ExtractedPlay[] => {
  const extractedPlays: ExtractedPlay[] = [];
  const seenPlays = new Set<string>();

  pages.forEach((page) => {
    const lines = page.textContent.split(/\s+/);
    const playCandidate = analyzePageForPlayName(page, lines);
    
    if (playCandidate && !seenPlays.has(playCandidate.name.toLowerCase())) {
      seenPlays.add(playCandidate.name.toLowerCase());
      extractedPlays.push({
        ...playCandidate,
        pageNumber: page.pageNumber,
        imageDataUrl: page.imageDataUrl,
        textContent: page.textContent
      });
    }
  });

  return extractedPlays;
};

// Analyze a single page for play names
const analyzePageForPlayName = (page: PDFPage, words: string[]): Omit<ExtractedPlay, 'pageNumber' | 'imageDataUrl' | 'textContent'> | null => {
  const text = words.join(' ');
  
  // Skip pages with too little content
  if (words.length < 5) return null;
  
  // Look for play name patterns in the first few lines/words
  const firstWords = words.slice(0, 10).join(' ');
  const playCandidate = analyzeTextForPlayName(firstWords);
  
  if (!playCandidate) {
    // Try to find play names in the full text
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences.slice(0, 3)) { // Check first 3 sentences
      const candidate = analyzeTextForPlayName(sentence.trim());
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }
  
  return playCandidate;
};

// Analyze text for play name characteristics
const analyzeTextForPlayName = (text: string): Omit<ExtractedPlay, 'pageNumber' | 'imageDataUrl' | 'textContent'> | null => {
  const trimmedText = text.trim();
  
  // Skip common non-play patterns
  const skipPatterns = [
    /^(page|chapter|section|table of contents|index|copyright|©)/i,
    /^\d+$/,
    /^[a-z\s]*$/,
    /^(the|and|of|in|on|at|to|for|with|by)[\s\w]*$/i,
    /^\w{1,2}$/,
    /^[.,:;!?-]+$/
  ];
  
  if (skipPatterns.some(pattern => pattern.test(trimmedText))) {
    return null;
  }
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let score = 0;
  
  // Scoring system for play name detection
  const isAllCaps = trimmedText === trimmedText.toUpperCase() && trimmedText.length > 3;
  const isTitleCase = /^[A-Z][a-z]/.test(trimmedText) && /\s[A-Z]/.test(trimmedText);
  const hasFootballTerms = /\b(play|formation|route|pass|run|blitz|coverage|zone|man|option|screen|draw|slant|post|corner|fade|comeback|hitch|out|in|go|curl|dig|cross|wheel|bubble|power|iso|counter|sweep|trap|dive|bootleg|rollout|pocket|shotgun|pistol|wildcat|trips|bunch|stack|spread|i-form|singleback|fullback|wingback|tight end|wide receiver|running back|quarterback|linebacker|safety|cornerback|defensive end|defensive tackle|nose guard)\b/i.test(trimmedText);
  
  if (isAllCaps) score += 3;
  if (isTitleCase) score += 2;
  if (hasFootballTerms) score += 4;
  
  // Word count scoring
  const wordCount = trimmedText.split(/\s+/).length;
  if (wordCount >= 2 && wordCount <= 6) score += 2;
  if (wordCount === 1 && trimmedText.length > 3) score += 1;
  
  // Check for numbered plays
  if (/^\d+[\.\-\s]/.test(trimmedText)) score += 2;
  
  // Formation indicators
  if (/\b(formation|set|personnel|alignment)\b/i.test(trimmedText)) score += 2;
  
  // Determine confidence
  if (score >= 6) confidence = 'high';
  else if (score >= 3) confidence = 'medium';
  else return null;
  
  // Clean up the play name
  let playName = trimmedText
    .replace(/^\d+[\.\-\s]+/, '')
    .replace(/[^\w\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (playName.length < 3) return null;
  
  return {
    name: playName,
    confidence
  };
};