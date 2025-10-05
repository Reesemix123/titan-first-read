// src/lib/pdfExtraction.ts
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface ExtractedPlay {
  name: string;
  pageNumber: number;
  confidence: 'high' | 'medium' | 'low';
  imageDataUrl?: string;
  formation?: string;
  description?: string;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  imageDataUrl?: string;
}

export async function extractPDFPages(file: File): Promise<ExtractedPage[]> {
  try {
    // Dynamic import for client-side only
    const pdfJS = await import('pdfjs-dist/webpack.mjs');
    
    // Set up the worker - Next.js 15 compatible path
    pdfJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfJS.getDocument(arrayBuffer).promise;
    
    const pages: ExtractedPage[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: TextItem) => item.str)
        .join(' ');
      
      // Extract page as image
      let imageDataUrl: string | undefined;
      try {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          imageDataUrl = canvas.toDataURL('image/png');
        }
      } catch (renderError) {
        console.warn(`Could not render page ${pageNum} as image:`, renderError);
      }
      
      pages.push({
        pageNumber: pageNum,
        text: pageText,
        imageDataUrl
      });
    }
    
    return pages;
  } catch (error) {
    console.error('Error extracting PDF pages:', error);
    throw new Error(`Failed to extract PDF pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractPlaysFromPages(pages: ExtractedPage[]): ExtractedPlay[] {
  const plays: ExtractedPlay[] = [];
  
  for (const page of pages) {
    const lines = page.text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and very short lines
      if (trimmedLine.length < 3) continue;
      
      // Look for play patterns - adjust these rules based on your PDF format
      let confidence: 'high' | 'medium' | 'low' = 'low';
      let playName = trimmedLine;
      
      // High confidence: Lines that look like play names
      if (trimmedLine.match(/^[A-Z][a-zA-Z\s\-]{2,30}$/)) {
        confidence = 'high';
      }
      // Medium confidence: Lines with numbers/codes
      else if (trimmedLine.match(/^[A-Z0-9\-\s]{3,20}$/)) {
        confidence = 'medium';
      }
      // Low confidence: Other text that might be plays
      else if (trimmedLine.match(/[A-Za-z]{3,}/)) {
        confidence = 'low';
        // Skip very common words that are unlikely to be play names
        const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will'];
        if (commonWords.some(word => trimmedLine.toLowerCase().includes(word))) {
          continue;
        }
      } else {
        continue; // Skip this line
      }
      
      // Avoid duplicates
      if (plays.some(play => play.name === playName)) {
        continue;
      }
      
      plays.push({
        name: playName,
        pageNumber: page.pageNumber,
        confidence,
        imageDataUrl: page.imageDataUrl,
        formation: 'Unknown',
        description: 'Extracted from PDF'
      });
    }
  }
  
  // Sort by confidence and page number
  return plays.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    }
    return a.pageNumber - b.pageNumber;
  });
}

// Legacy functions for backward compatibility
export async function extractPDFContent(file: File): Promise<{ text: string; images: string[] }> {
  const pages = await extractPDFPages(file);
  return {
    text: pages.map(page => page.text).join('\n'),
    images: pages.map(page => page.imageDataUrl).filter(Boolean) as string[]
  };
}

export async function extractPDFText(file: File): Promise<string> {
  const pages = await extractPDFPages(file);
  return pages.map(page => page.text).join('\n');
}

export function extractPlaysFromText(text: string): Array<{ name: string; formation?: string; description?: string }> {
  const lines = text.split('\n');
  const plays: Array<{ name: string; formation?: string; description?: string }> = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 0 && trimmedLine.match(/^[A-Z][a-zA-Z\s]+$/)) {
      plays.push({
        name: trimmedLine,
        formation: 'Unknown',
        description: 'Extracted from PDF'
      });
    }
  }
  
  return plays;
}