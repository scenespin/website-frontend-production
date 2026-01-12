/**
 * PDF Text Extraction Utility
 * 
 * Extracts text from PDF files and converts to Fountain format
 * Uses pdfjs-dist for robust PDF parsing
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for pdfjs-dist
// Use jsdelivr CDN with correct version (better CORS support than unpkg)
if (typeof window !== 'undefined') {
  // jsdelivr has proper CORS headers for cross-origin requests
  // Using exact version from package.json (5.4.530)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs';
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

/**
 * Extract text from PDF file and convert to Fountain-compatible format
 * @param file - PDF File object
 * @returns Extracted text in Fountain format
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pageCount = pdf.numPages;
    const textLines: string[] = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Build text from text items
      let lastY = -1;
      let currentLine = '';
      
      for (const item of textContent.items) {
        if ('str' in item) {
          const textItem = item as any;
          const y = textItem.transform[5]; // Y position
          
          // If Y position changed significantly, start new line
          if (lastY !== -1 && Math.abs(y - lastY) > 2) {
            if (currentLine.trim()) {
              textLines.push(currentLine.trim());
            }
            currentLine = textItem.str;
          } else {
            // Same line - append with space if needed
            if (currentLine && !currentLine.endsWith(' ') && textItem.str && !textItem.str.startsWith(' ')) {
              currentLine += ' ';
            }
            currentLine += textItem.str;
          }
          
          lastY = y;
        }
      }
      
      // Add last line of page
      if (currentLine.trim()) {
        textLines.push(currentLine.trim());
      }
      
      // Add page break (blank line) between pages (except last page)
      if (pageNum < pageCount) {
        textLines.push('');
      }
    }
    
    // Join all lines
    const extractedText = textLines.join('\n');
    
    // Clean up the text for Fountain format
    const cleanedText = cleanPDFTextForFountain(extractedText);
    
    return {
      text: cleanedText,
      pageCount,
      success: true
    };
    
  } catch (error) {
    console.error('[PDFExtractor] Error extracting PDF:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error extracting PDF'
    };
  }
}

/**
 * Clean extracted PDF text to better match Fountain format
 * Handles common PDF extraction issues:
 * - Multiple spaces
 * - Line breaks in dialogue
 * - Page numbers and headers/footers
 * - Extra whitespace
 */
function cleanPDFTextForFountain(text: string): string {
  let cleaned = text;
  
  // Remove page numbers (standalone numbers at start/end of lines)
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');
  
  // Remove common PDF headers/footers
  cleaned = cleaned.replace(/^(THE FUGITIVE|FADE IN|FADE OUT|CONTINUED|CONT'D)\s*$/gmi, '');
  
  // Normalize multiple spaces to single space
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Normalize multiple blank lines to max 2 blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove trailing whitespace from lines
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Remove leading/trailing blank lines
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
