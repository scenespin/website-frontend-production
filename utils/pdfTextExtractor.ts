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
    // CRITICAL: Order matters! More specific patterns (INT./EXT., I./E.) must come BEFORE simpler ones (INT, EXT)
    if (!foundFirstScene && /^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(trimmed)) {
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
  
  // Fix INT./EXT. scene headings that may have been split during PDF extraction
  // Pattern: "/EXT. LOCATION" should become "INT./EXT. LOCATION"
  // This handles cases where "INT." was on a different line or lost during extraction
  cleaned = cleaned.split('\n').map((line, index, lines) => {
    const trimmed = line.trim();
    
    // Check if this line starts with "/EXT." and looks like a scene heading
    // (has location and time pattern, or just location)
    if (/^\/EXT\.\s+[A-Z]/i.test(trimmed)) {
      // Check if previous line might have been "INT." or if this is clearly a scene heading
      const prevLine = index > 0 ? lines[index - 1].trim() : '';
      const looksLikeSceneHeading = /^\/EXT\.\s+.+?-\s*(DAY|NIGHT|CONTINUOUS|LATER|MOMENTS LATER|DAWN|DUSK)/i.test(trimmed) ||
                                    /^\/EXT\.\s+[A-Z][A-Z\s]+$/i.test(trimmed);
      
      // If previous line is "INT." or empty, or this clearly looks like a scene heading
      if (prevLine === 'INT.' || prevLine === '' || looksLikeSceneHeading) {
        // Reconstruct as "INT./EXT."
        return line.replace(/^(\s*)\/EXT\./i, '$1INT./EXT.');
      }
    }
    
    return line;
  }).join('\n');
  
  // Merge wrapped dialogue lines
  // PDF extraction often splits dialogue across multiple lines with blank lines between them
  // This breaks Fountain format where dialogue continues until a blank line
  // Solution: Detect CHARACTER NAME, then merge all subsequent non-blank lines as dialogue
  cleaned = mergeDialogueLines(cleaned);
  
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
 * Merge wrapped dialogue lines that were split during PDF extraction
 * 
 * PDF extraction often breaks dialogue into multiple lines with blank lines between them.
 * Per Fountain spec, dialogue should continue until a blank line is encountered.
 * 
 * This function:
 * 1. Detects CHARACTER NAME (all caps, preceded by blank line, short)
 * 2. Merges all subsequent lines as dialogue (including skipping single blank lines that are PDF artifacts)
 * 3. Stops at: multiple consecutive blank lines, new character name, scene heading
 * 4. Preserves parentheticals (lines wrapped in parentheses)
 * 
 * @param text - Extracted text from PDF
 * @returns Text with dialogue lines properly merged
 */
function mergeDialogueLines(text: string): string {
  const lines = text.split('\n');
  const mergedLines: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this is a character name
    // Per Fountain spec: ALL CAPS, preceded by blank line, typically 2-50 chars, not a scene heading
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const isCharacterName = trimmed.length > 0 &&
                           trimmed === trimmed.toUpperCase() &&
                           trimmed.length >= 2 &&
                           trimmed.length <= 50 &&
                           !/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(trimmed) &&
                           (prevLine === '' || i === 0); // Preceded by blank line (or start of script)
    
    if (isCharacterName) {
      // Add character name
      mergedLines.push(line);
      i++;
      
      // Look ahead and merge dialogue lines
      const dialogueLines: string[] = [];
      let consecutiveBlankLines = 0;
      
      while (i < lines.length) {
        const dialogueLine = lines[i];
        const dialogueTrimmed = dialogueLine.trim();
        
        // Check for blank lines
        if (dialogueTrimmed === '') {
          consecutiveBlankLines++;
          // If we see 2+ consecutive blank lines, dialogue block is definitely over
          if (consecutiveBlankLines >= 2) {
            // Add dialogue if we have any
            if (dialogueLines.length > 0) {
              mergedLines.push(dialogueLines.join(' '));
              dialogueLines.length = 0;
            }
            // Add one blank line (preserve paragraph spacing)
            mergedLines.push('');
            i++;
            break;
          }
          // Single blank line - might be PDF wrapping artifact, look ahead
          i++;
          continue;
        }
        
        // Reset blank line counter
        consecutiveBlankLines = 0;
        
        // Check if we've hit a new scene heading
        if (/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(dialogueTrimmed)) {
          // Add accumulated dialogue first
          if (dialogueLines.length > 0) {
            mergedLines.push(dialogueLines.join(' '));
            dialogueLines.length = 0;
          }
          // Add blank line before scene heading
          mergedLines.push('');
          // Don't consume the scene heading line
          break;
        }
        
        // Check if we've hit a new character name (all caps, short, preceded by blank line)
        const nextIsCharacter = dialogueTrimmed === dialogueTrimmed.toUpperCase() &&
                               dialogueTrimmed.length >= 2 &&
                               dialogueTrimmed.length <= 50 &&
                               !/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(dialogueTrimmed) &&
                               !dialogueTrimmed.startsWith('(') && // Not a parenthetical
                               consecutiveBlankLines > 0; // Must be preceded by blank line
        
        if (nextIsCharacter) {
          // Add accumulated dialogue first
          if (dialogueLines.length > 0) {
            mergedLines.push(dialogueLines.join(' '));
            dialogueLines.length = 0;
          }
          // Add blank line before next character
          mergedLines.push('');
          // Don't consume the character line
          break;
        }
        
        // Check if this is a parenthetical - preserve it as a separate line
        if (/^\(.+\)$/.test(dialogueTrimmed)) {
          // If we have accumulated dialogue, add it first
          if (dialogueLines.length > 0) {
            mergedLines.push(dialogueLines.join(' '));
            dialogueLines.length = 0;
          }
          // Add parenthetical as its own line
          mergedLines.push(dialogueTrimmed);
          i++;
          continue;
        }
        
        // Check if this might be an action line (mixed case, descriptive)
        // Action lines typically:
        // - Start with capital letter (He, She, The, etc.)
        // - Have mixed case
        // - Are longer/more descriptive OR start with common action words
        const hasLowerCase = /[a-z]/.test(dialogueTrimmed);
        const hasUpperCase = /[A-Z]/.test(dialogueTrimmed);
        const isMixedCase = hasLowerCase && hasUpperCase;
        const startsWithActionWord = /^(He|She|They|The|A|An|In|On|At|From|To|With|And|But|It's|It|That|This)\s/.test(dialogueTrimmed);
        const isLong = dialogueTrimmed.length > 45;
        
        // Only treat as action if we already have some dialogue AND this looks clearly like action
        const looksLikeAction = dialogueLines.length > 0 &&
                               isMixedCase &&
                               (isLong || startsWithActionWord);
        
        if (looksLikeAction) {
          // This is probably an action line, not dialogue continuation
          // Add accumulated dialogue first
          mergedLines.push(dialogueLines.join(' '));
          dialogueLines.length = 0;
          // Add blank line before action
          mergedLines.push('');
          // Don't consume the action line
          break;
        }
        
        // This is a dialogue continuation line - accumulate it
        dialogueLines.push(dialogueTrimmed);
        i++;
      }
      
      // Add any remaining accumulated dialogue
      if (dialogueLines.length > 0) {
        mergedLines.push(dialogueLines.join(' '));
      }
    } else {
      // Not a character name - keep line as-is
      mergedLines.push(line);
      i++;
    }
  }
  
  return mergedLines.join('\n');
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
