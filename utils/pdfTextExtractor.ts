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
 * - Title page metadata
 * - Page numbers and headers/footers
 * - CONTINUED markers (we add our own)
 * - Multiple spaces
 * - Line breaks in dialogue
 * - Extra whitespace
 */
function cleanPDFTextForFountain(text: string): string {
  let cleaned = text;
  
  // Split into lines for processing
  const lines = cleaned.split('\n');
  const cleanedLines: string[] = [];
  let foundFirstScene = false; // Track if we've found the actual screenplay content
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines (we'll normalize later)
    if (!trimmed) {
      cleanedLines.push('');
      continue;
    }
    
    // Detect first scene heading to mark start of actual screenplay
    if (!foundFirstScene && /^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(trimmed)) {
      foundFirstScene = true;
    }
    
    // Before first scene: Remove title page metadata
    if (!foundFirstScene) {
      // Skip common title page patterns
      if (
        /^by\s*$/i.test(trimmed) ||
        /^written\s+by/i.test(trimmed) ||
        /^early\s+draft/i.test(trimmed) ||
        /^draft\s+date/i.test(trimmed) ||
        /^for\s+educational\s+purposes\s+only/i.test(trimmed) ||
        /^copyright/i.test(trimmed) ||
        /^\d{4}/.test(trimmed) && trimmed.length < 50 // Likely a date line
      ) {
        continue; // Skip this line
      }
      
      // Skip author names (all caps, 2-4 words, not a scene heading)
      if (
        trimmed === trimmed.toUpperCase() &&
        !/^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(trimmed) &&
        trimmed.split(/\s+/).length >= 2 &&
        trimmed.split(/\s+/).length <= 4 &&
        trimmed.length < 50
      ) {
        continue; // Likely author name
      }
    }
    
    // Remove page numbers (standalone numbers, optionally with period)
    // Pattern: "2." or "2" on its own line
    // Replace with blank line to preserve spacing structure
    if (/^\d+\.?\s*$/.test(trimmed)) {
      cleanedLines.push(''); // Preserve blank line for spacing
      continue;
    }
    
    // Remove CONTINUED markers (we add our own during export)
    // Replace with blank line to preserve spacing structure
    if (
      /^\(?CONTINUED\)?:?\s*$/i.test(trimmed) ||
      /^CONT'D\.?\s*$/i.test(trimmed)
    ) {
      cleanedLines.push(''); // Preserve blank line for spacing
      continue;
    }
    
    // Remove common PDF headers/footers (but keep if they're part of actual content)
    // Only remove if they're on their own line
    // Replace with blank line to preserve spacing structure
    if (
      /^(THE FUGITIVE|FADE IN|FADE OUT)\s*$/i.test(trimmed) &&
      !foundFirstScene // Only remove before screenplay starts
    ) {
      cleanedLines.push(''); // Preserve blank line for spacing
      continue;
    }
    
    // Keep the line
    cleanedLines.push(line);
  }
  
  // Join lines back
  cleaned = cleanedLines.join('\n');
  
  // Normalize multiple spaces to single space (but preserve line structure)
  cleaned = cleaned.split('\n').map(line => {
    // Preserve leading spaces (might be intentional indentation)
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
    const content = line.trimStart();
    // Collapse multiple spaces in content to single space
    const normalizedContent = content.replace(/[ \t]+/g, ' ');
    return leadingSpaces + normalizedContent;
  }).join('\n');
  
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
