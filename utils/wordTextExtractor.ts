/**
 * Word Document Text Extraction Utility
 * 
 * Extracts text from Word (.docx) files and converts to Fountain format
 * Uses mammoth.js for robust Word document parsing
 */

import mammoth from 'mammoth';

export interface WordExtractionResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Extract text from Word document file and convert to Fountain-compatible format
 * @param file - Word .docx File object
 * @returns Extracted text in Fountain format
 */
export async function extractTextFromWord(file: File): Promise<WordExtractionResult> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from Word document
    // mammoth converts .docx to HTML, then we extract plain text
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('[WordExtractor] Extraction warnings:', result.messages);
    }
    
    // Get extracted text
    let extractedText = result.value;
    
    // Clean up the text for Fountain format
    const cleanedText = cleanWordTextForFountain(extractedText);
    
    return {
      text: cleanedText,
      success: true
    };
    
  } catch (error) {
    console.error('[WordExtractor] Error extracting Word document:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error extracting Word document'
    };
  }
}

/**
 * Clean extracted Word text to better match Fountain format
 * Handles common Word extraction issues:
 * - Multiple spaces
 * - Line breaks in dialogue
 * - Extra whitespace
 * - Preserves structure for plain text fountain scripts
 */
function cleanWordTextForFountain(text: string): string {
  let cleaned = text;
  
  // Normalize line breaks (Word can have various line break types)
  cleaned = cleaned.replace(/\r\n/g, '\n'); // Windows
  cleaned = cleaned.replace(/\r/g, '\n');   // Mac old
  
  // Normalize multiple spaces to single space (but preserve intentional spacing)
  // Don't collapse spaces at start of lines (might be intentional indentation)
  cleaned = cleaned.split('\n').map(line => {
    // Preserve leading spaces (might be intentional)
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
 * Check if a file is a Word document
 */
export function isWordFile(file: File): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    || file.name.toLowerCase().endsWith('.docx')
    || file.name.toLowerCase().endsWith('.doc');
}
