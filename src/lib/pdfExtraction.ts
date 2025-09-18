// src/lib/pdfExtraction.ts
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface ExtractedContent {
  text: string;
  images: string[];
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent: () => Promise<{ items: TextItem[] }>;
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  objs: {
    get: (name: string) => Promise<unknown>;
  };
}

export async function extractPDFContent(file: File): Promise<ExtractedContent> {
  try {
    // Dynamic import for client-side only
    const pdfJS = await import('pdfjs-dist/webpack.mjs');
    
    // Set up the worker - Next.js 15 compatible path
    pdfJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfJS.getDocument(arrayBuffer).promise;
    
    const extractedContent: ExtractedContent = {
      text: '',
      images: []
    };

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: TextItem) => item.str)
        .join(' ');
      
      extractedContent.text += pageText + '\n';

      // Extract images (optional - can be resource intensive)
      try {
        const operators = await page.getOperatorList();
        for (let i = 0; i < operators.fnArray.length; i++) {
          if (operators.fnArray[i] === pdfJS.OPS.paintImageXObject) {
            const imageName = operators.argsArray[i][0];
            try {
              const image = await page.objs.get(imageName);
              if (image) {
                // Convert image to base64 if needed
                // This is a simplified version - you might want to add more processing
                extractedContent.images.push(`image_${pageNum}_${i}`);
              }
            } catch (imageError) {
              console.warn(`Could not extract image ${imageName}:`, imageError);
            }
          }
        }
      } catch (imageError) {
        console.warn(`Could not extract images from page ${pageNum}:`, imageError);
      }
    }

    return extractedContent;
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Alternative simpler version for just text extraction
export async function extractPDFText(file: File): Promise<string> {
  try {
    const pdfJS = await import('pdfjs-dist/webpack.mjs');
    pdfJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfJS.getDocument(arrayBuffer).promise;
    
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: TextItem) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Play extraction function with proper typing
export function extractPlaysFromText(text: string): Array<{ name: string; formation?: string; description?: string }> {
  const plays: Array<{ name: string; formation?: string; description?: string }> = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 0) {
      // Simple play detection - you may want to improve this logic
      if (trimmedLine.match(/^[A-Z][a-zA-Z\s]+$/)) {
        const playName = trimmedLine;
        plays.push({
          name: playName,
          formation: 'Unknown',
          description: 'Extracted from PDF'
        });
      }
    }
  }
  
  return plays;
}