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
      // Use pdf.js getTextContent with options for better text extraction
      // normalizeWhitespace: false keeps original spacing to detect line breaks
      // disableCombineTextItems: false allows pdf.js to combine text items when possible
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });
      
      // Build text from text items
      // Key insight: PDF text extraction creates new text items when text wraps
      // Wrapped text has small Y differences (2-8px), real line breaks have large differences (12-20px+)
      // We need to merge items with small Y differences (wrapped) and break on large differences (new lines)
      let lastY = -1;
      let currentLine = '';
      const yDifferences: number[] = []; // Track all Y differences to calculate median line height
      
      for (const item of textContent.items) {
        if ('str' in item) {
          const textItem = item as any;
          const y = textItem.transform[5]; // Y position
          
          // Track Y differences to calculate line height
          if (lastY !== -1) {
            const yDiff = Math.abs(y - lastY);
            yDifferences.push(yDiff);
          }
          
          // Calculate median line height from observed Y differences
          // Median is more robust than average (less affected by outliers)
          // Only use differences > 5px (likely real line breaks, not wrapped text)
          const significantDiffs = yDifferences.filter(diff => diff > 5);
          const medianLineHeight = significantDiffs.length > 0
            ? significantDiffs.sort((a, b) => a - b)[Math.floor(significantDiffs.length / 2)]
            : 12; // Default to 12px if no data yet
          
          // Calculate Y difference for current item
          const yDiff = lastY !== -1 ? Math.abs(y - lastY) : Infinity;
          
          // Break on new line if Y position changed significantly
          // Use 40% of median line height as threshold - this catches real breaks but merges wrapped text
          // Minimum threshold of 10px to handle various font sizes
          const threshold = Math.max(medianLineHeight * 0.4, 10);
          
          if (lastY !== -1 && yDiff > threshold) {
            // Significant Y change - new line
            if (currentLine.trim()) {
              textLines.push(currentLine.trim());
            }
            currentLine = textItem.str;
          } else {
            // Same logical line (wrapped text) - append with space if needed
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
          // Single blank line - might be PDF wrapping artifact
          // Look ahead to see if next line is dialogue continuation
          const nextLine = i < lines.length - 1 ? lines[i + 1]?.trim() : '';
          const nextIsDialogue = nextLine !== '' 
            && !/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(nextLine)
            && !(nextLine === nextLine.toUpperCase() && nextLine.length >= 2 && nextLine.length <= 50)
            && !nextLine.startsWith('(')
            && !(/^[A-Z]/.test(nextLine) && /^(He|She|They|The|A|An|In|On|At|From|To|With|And|But|It's|It|That|This|Already|Another|CAMERA|EXT|INT)\s/i.test(nextLine) && nextLine.length > 45);
          
          // If next line looks like dialogue continuation, skip this blank (PDF artifact)
          if (nextIsDialogue && dialogueLines.length > 0) {
            i++;
            continue; // Skip blank, continue merging dialogue
          }
          
          // Not a continuation - end dialogue block
          if (dialogueLines.length > 0) {
            mergedLines.push(dialogueLines.join(' '));
            dialogueLines.length = 0;
          }
          mergedLines.push('');
          i++;
          break;
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
        
        // Check if we've hit a new character name (all caps, short)
        // More aggressive: check if it's a character name even without preceding blank line
        // (because PDF wrapping might have removed the blank line)
        const prevDialogueLine = dialogueLines.length > 0 ? dialogueLines[dialogueLines.length - 1] : '';
        const prevLineEndsSentence = /[.!?]$/.test(prevDialogueLine);
        const nextIsCharacter = dialogueTrimmed === dialogueTrimmed.toUpperCase() &&
                               dialogueTrimmed.length >= 2 &&
                               dialogueTrimmed.length <= 50 &&
                               !/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(dialogueTrimmed) &&
                               !dialogueTrimmed.startsWith('(') && // Not a parenthetical
                               (consecutiveBlankLines > 0 || prevLineEndsSentence); // Preceded by blank OR previous dialogue ended with sentence
        
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
        
        // NO action detection in dialogue merging
        // Key insight: If there's no blank line between lines, merge them as dialogue
        // Action lines will be handled separately by mergeWrappedActionLines after dialogue is merged
        // Only break dialogue on special elements (scene heading, character name, parenthetical) or blank lines
        
        // This is a dialogue continuation line - accumulate it
        // Even if it starts with capital, if it doesn't look like action, it's dialogue
        // Merge consecutive dialogue lines even without blank lines (PDF wrapping)
        dialogueLines.push(dialogueTrimmed);
        i++;
        
        // Continue merging if next line is also dialogue (no blank line between)
        // This handles PDF wrapping where dialogue is split across lines without blank lines
        // BE VERY AGGRESSIVE - merge everything unless it's CLEARLY not dialogue
        while (i < lines.length) {
          const nextDialogueLine = lines[i];
          const nextDialogueTrimmed = nextDialogueLine.trim();
          
          // Stop if blank line (dialogue block ends)
          if (nextDialogueTrimmed === '') {
            break;
          }
          
          // Stop if special element (scene heading, character name, parenthetical)
          const isSceneHeading = /^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(nextDialogueTrimmed);
          const isCharacterName = nextDialogueTrimmed === nextDialogueTrimmed.toUpperCase() 
            && nextDialogueTrimmed.length >= 2 
            && nextDialogueTrimmed.length <= 50 
            && !nextDialogueTrimmed.startsWith('(')
            && !isSceneHeading;
          const isParenthetical = nextDialogueTrimmed.startsWith('(') && nextDialogueTrimmed.endsWith(')');
          
          if (isSceneHeading || isCharacterName || isParenthetical) {
            break;
          }
          
          // Check if dialogue ended and next line is clearly action
          // Only break if previous dialogue ended with sentence AND next line starts with clear action word
          const lastDialogue = dialogueLines.length > 0 ? dialogueLines[dialogueLines.length - 1] : '';
          const lastEndsSentence = /[.!?]$/.test(lastDialogue);
          const nextStartsWithActionWord = /^(In|The|A|An|He|She|They|It|This|That|Already|Another|CAMERA|EXT|INT|CLOSE|FADE|CUT|DISSOLVE)\s/i.test(nextDialogueTrimmed);
          const nextIsMixedCase = /[a-z]/.test(nextDialogueTrimmed) && /[A-Z]/.test(nextDialogueTrimmed);
          
          // Break ONLY if: previous dialogue ended with sentence AND next is clearly action (starts with action word, mixed case)
          // This prevents merging "Thanks." with "In the shadows..."
          if (lastEndsSentence && nextStartsWithActionWord && nextIsMixedCase) {
            break;
          }
          
          // Default: This is dialogue continuation - merge it
          // Be ULTRA aggressive - if there's no blank line and it's not clearly action, merge it
          dialogueLines.push(nextDialogueTrimmed);
          i++;
        }
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
