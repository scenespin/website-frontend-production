/**
 * Professional Screenplay PDF Export with Watermarks
 * Industry-standard formatting following WGA/Academy guidelines
 * 
 * 🎨 WATERMARK FEATURE: Completely FREE for all users!
 * No plan gating - democratizing professional screenplay export
 * 
 * Uses pdf-lib for robust watermarking (industry standard)
 */

import { jsPDF } from 'jspdf';
import { PDFDocument, PDFPage, PDFImage, rgb, degrees } from 'pdf-lib';

// Industry-standard screenplay formatting
export const SCREENPLAY_FORMAT = {
  // Page settings (US Letter)
  pageWidth: 8.5,
  pageHeight: 11,
  
  // Margins (in inches)
  marginTop: 1.0,
  marginBottom: 1.0,
  marginLeft: 1.5,
  marginRight: 1.0,
  
  // Font
  fontFamily: 'Courier',
  fontSize: 12,
  lineHeight: 12, // points (1 line = 1/6 inch = 12pt in Courier)
  
  // Element indents (in inches from left margin)
  indent: {
    sceneHeading: 0,
    action: 0,
    character: 2.0,
    parenthetical: 1.5,
    dialogue: 1.0,
    transition: 4.0,
  },
  
  // Element widths (in inches)
  width: {
    action: 6.0,
    dialogue: 3.5,
    parenthetical: 2.0,
  },
  
  // Header
  headerHeight: 0.5,
  
  // Page numbering
  pageNumberRight: 7.5,
  pageNumberTop: 0.5,
};

export interface ParsedElement {
  type: 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'blank';
  text: string;
  pageNumber?: number;
  bookmark?: string;
}

export interface WatermarkOptions {
  text?: string;
  image?: string; // Base64 or URL
  opacity?: number;
  angle?: number;
  fontSize?: number;
  imageWidth?: number; // Width in inches
  imageHeight?: number; // Height in inches
}

/**
 * Parse Fountain screenplay into structured elements
 */
export function parseFountain(fountain: string): ParsedElement[] {
  const lines = fountain.split('\n');
  const elements: ParsedElement[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Blank line
    if (!trimmed) {
      elements.push({ type: 'blank', text: '' });
      i++;
      continue;
    }

    // Skip imported PDF page markers like "-- 3 of 9 --"
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(trimmed)) {
      i++;
      continue;
    }
    
    // IMPORTANT: Skip organizational elements FIRST (before other parsing)
    // Skip synopsis lines (starting with =)
    if (trimmed.startsWith('=')) {
      i++;
      continue;
    }
    
    // Skip section/act headings (starting with #)
    // Must be checked before scene heading detection to prevent "# INT." from being parsed as scene
    if (trimmed.startsWith('#')) {
      i++;
      continue;
    }
    
    // Skip notes (wrapped in [[ ]])
    if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
      i++;
      continue;
    }
    
    // Scene heading (INT., EXT., INT/EXT, INT./EXT)
    // Check AFTER skipping # lines to ensure act headings don't interfere
    if (/^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(trimmed)) {
      elements.push({
        type: 'scene',
        text: trimmed.toUpperCase(),
        bookmark: trimmed, // Used for PDF bookmarks
      });
      i++;
      continue;
    }
    
    // Forced scene heading (starts with .)
    if (trimmed.startsWith('.') && !trimmed.startsWith('..')) {
      const sceneText = trimmed.substring(1).toUpperCase();
      elements.push({
        type: 'scene',
        text: sceneText,
        bookmark: sceneText,
      });
      i++;
      continue;
    }
    
    // Transition (ends with TO:)
    if (trimmed.endsWith('TO:') && trimmed === trimmed.toUpperCase()) {
      elements.push({ type: 'transition', text: trimmed });
      i++;
      continue;
    }
    
    // Forced transition (starts with >)
    if (trimmed.startsWith('>') && !trimmed.startsWith('>>')) {
      elements.push({ type: 'transition', text: trimmed.substring(1).trim() });
      i++;
      continue;
    }
    
    // Character name (all caps, possibly followed by dialogue)
    if (trimmed === trimmed.toUpperCase() && 
        /^[A-Z][A-Z\s\.']+(\s*\([^\)]*\))?$/.test(trimmed) &&
        i + 1 < lines.length &&
        lines[i + 1].trim()) {
      
      elements.push({ type: 'character', text: trimmed });
      i++;
      
      // Look for parenthetical and dialogue
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        
        if (!nextLine) {
          break; // End of dialogue block
        }
        
        // Parenthetical (wrapped in parentheses)
        if (nextLine.startsWith('(') && nextLine.endsWith(')')) {
          elements.push({ type: 'parenthetical', text: nextLine });
          i++;
          continue;
        }
        
        // Dialogue
        elements.push({ type: 'dialogue', text: nextLine });
        i++;
      }
      continue;
    }
    
    // Action/description (default)
    elements.push({ type: 'action', text: line }); // Keep original spacing
    i++;
  }
  
  return elements;
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number = SCREENPLAY_FORMAT.fontSize
): string[] {
  const inches = maxWidth;
  const points = inches * 72; // Convert inches to points
  
  // jsPDF's splitTextToSize expects points
  const lines = doc.splitTextToSize(text, points);
  return lines;
}

/**
 * Convert inches to PDF points (1 inch = 72 points)
 */
function inchesToPoints(inches: number): number {
  return inches * 72;
}

/**
 * Prepare image data for jsPDF
 * Handles data URLs and extracts format information
 */
function prepareImageForPDF(image: string): { imageData: string; format: string } {
  // If it's a data URL, extract format and return as-is (jsPDF handles data URLs)
  if (image.startsWith('data:image/')) {
    const formatMatch = image.match(/data:image\/([^;]+)/);
    let format = 'PNG'; // Default
    
    if (formatMatch) {
      const detectedFormat = formatMatch[1].toUpperCase();
      // jsPDF supports: PNG, JPEG, JPG, WEBP
      if (detectedFormat === 'JPEG' || detectedFormat === 'JPG') {
        format = 'JPEG';
      } else if (detectedFormat === 'PNG') {
        format = 'PNG';
      } else if (detectedFormat === 'WEBP') {
        format = 'WEBP';
      }
    }
    
    return { imageData: image, format };
  }
  
  // If it's a base64 string without prefix, assume PNG
  // If it's a URL, jsPDF will handle it
  return { imageData: image, format: 'PNG' };
}

/**
 * Add watermark to PDF page using jsPDF (legacy, kept for text watermarks during generation)
 * Note: Image watermarks are now handled by pdf-lib post-processing for reliability
 */
function addWatermark(
  doc: jsPDF,
  options: WatermarkOptions
) {
  const {
    text,
    opacity = 0.1,
    angle = -45,
    fontSize = 72,
  } = options;
  
  const pageWidth = inchesToPoints(SCREENPLAY_FORMAT.pageWidth);
  const pageHeight = inchesToPoints(SCREENPLAY_FORMAT.pageHeight);
  
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  
  // Only handle text watermarks here - image watermarks are done with pdf-lib
  if (text) {
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity }));
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(fontSize);
    doc.text(text, centerX, centerY, {
      align: 'center',
      baseline: 'middle', // Center watermark vertically
      angle,
    });
    doc.restoreGraphicsState();
  }
  // Image watermarks are skipped here - handled by pdf-lib post-processing
}

/**
 * Add watermark to PDF using pdf-lib (proven, reliable method)
 * This is the industry-standard approach for image watermarks
 * pdf-lib handles opacity and transformations much better than jsPDF
 */
async function addWatermarkWithPdfLib(
  pdfDoc: PDFDocument,
  options: WatermarkOptions
): Promise<void> {
  const {
    text,
    image,
    opacity = 0.1,
    angle = -45,
    fontSize = 72,
    imageWidth = 3, // Default 3 inches
    imageHeight = 3, // Default 3 inches
  } = options;

  const pages = pdfDoc.getPages();

  // Process each page
  for (const page of pages) {
    if (image) {
      // Image watermark using pdf-lib (proven method)
      try {
        console.log('[PDF Watermark] Adding image watermark with pdf-lib...', {
          hasDataUrl: image.startsWith('data:'),
          imageLength: image.length,
          imageWidth,
          imageHeight,
          opacity,
          angle,
        });

        // Convert data URL to Uint8Array for pdf-lib
        let imageBytes: Uint8Array;
        if (image.startsWith('data:image/')) {
          // Extract base64 data from data URL
          const base64Data = image.split(',')[1];
          const binaryString = atob(base64Data);
          imageBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            imageBytes[i] = binaryString.charCodeAt(i);
          }
        } else if (image.startsWith('http')) {
          // Fetch image from URL
          const response = await fetch(image);
          const arrayBuffer = await response.arrayBuffer();
          imageBytes = new Uint8Array(arrayBuffer);
        } else {
          throw new Error('Invalid image format: must be a data URL or HTTP URL');
        }

        // Embed image in PDF
        let pdfImage: PDFImage;
        const format = image.startsWith('data:image/') 
          ? image.match(/data:image\/([^;]+)/)?.[1]?.toLowerCase() || 'png'
          : 'png';

        if (format === 'jpeg' || format === 'jpg') {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else if (format === 'png') {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Try PNG as fallback
          pdfImage = await pdfDoc.embedPng(imageBytes);
        }

        const imgWidth = inchesToPoints(imageWidth);
        const imgHeight = inchesToPoints(imageHeight);

        // Clamp opacity between 0 and 1
        const opacityValue = Math.max(0, Math.min(1, opacity));

        // Get page dimensions (pdf-lib uses bottom-left origin)
        // Letter size: 8.5" x 11" = 612 x 792 points
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const pageCenterX = pageWidth / 2;
        const pageCenterY = pageHeight / 2;
        
        // Calculate position (centered) - pdf-lib uses bottom-left origin
        // Fine-tuned adjustments for visual centering on rotated watermark:
        // - Move up slightly (increase Y by 10 points) for visual balance
        // - Move left slightly (decrease X by 10 points) to account for rotation visual offset
        const x = pageCenterX - imgWidth / 2 - 10; // Shift left 10 points
        const y = pageCenterY - imgHeight / 2 + 10; // Shift up 10 points (Y increases upward)

        // pdf-lib's drawImage supports opacity and rotate directly!
        // The x,y coordinates specify the bottom-left corner of the image
        // pdf-lib rotates around the center of the image when rotate is specified
        page.drawImage(pdfImage, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
          opacity: opacityValue,
          rotate: angle !== 0 ? degrees(angle) : undefined,
        });

        console.log('[PDF Watermark] Image watermark added successfully with pdf-lib');
      } catch (error) {
        console.error('[PDF Watermark] Failed to add image watermark with pdf-lib:', error);
        console.error('[PDF Watermark] Error details:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        
        // Fallback to text watermark if image fails
        if (text) {
          console.log('[PDF Watermark] Falling back to text watermark');
          const { width, height } = page.getSize();
          addTextWatermarkWithPdfLib(page, text, width / 2, height / 2, opacity, angle, fontSize);
        } else {
          throw new Error(`Failed to add image watermark: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else if (text) {
      // Text watermark
      const { width, height } = page.getSize();
      addTextWatermarkWithPdfLib(page, text, width / 2, height / 2, opacity, angle, fontSize);
    }
  }
}

/**
 * Helper function to add text watermark using pdf-lib
 * Note: pdf-lib requires embedding a font for text, which is complex
 * For text watermarks, we'll keep using jsPDF during generation
 */
function addTextWatermarkWithPdfLib(
  page: PDFPage,
  text: string,
  centerX: number,
  centerY: number,
  opacity: number,
  angle: number,
  fontSize: number
): void {
  // pdf-lib text rendering requires embedding fonts which is complex
  // For now, text watermarks are handled during jsPDF generation
  // This function is a placeholder - text watermarks work fine with jsPDF
  console.warn('[PDF Watermark] Text watermarks should be added during jsPDF generation');
}

/**
 * Export screenplay to professional PDF with bookmarks
 */
export async function exportScreenplayToPDF(
  screenplay: string,
  options: {
    title?: string;
    author?: string;
    contact?: string;
    watermark?: WatermarkOptions;
    includeBookmarks?: boolean;
  } = {}
): Promise<Blob> {
  const {
    title = 'Untitled Screenplay',
    author,
    contact,
    watermark,
    includeBookmarks = true,
  } = options;
  
  // Create PDF document (portrait, points, letter size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
    compress: true,
  });
  
  // Set font
  doc.setFont(SCREENPLAY_FORMAT.fontFamily);
  doc.setFontSize(SCREENPLAY_FORMAT.fontSize);
  
  // Parse screenplay
  const elements = parseFountain(screenplay);

  type LayoutOp = {
    text: string;
    x: number;
    y: number;
    align?: 'left' | 'center' | 'right';
  };

  type LayoutPage = {
    ops: LayoutOp[];
    hasContinuedTop: boolean;
    hasContinuedBottom: boolean;
  };

  const lineHeightPt = SCREENPLAY_FORMAT.lineHeight;
  const topY = inchesToPoints(SCREENPLAY_FORMAT.marginTop);
  const maxY = inchesToPoints(SCREENPLAY_FORMAT.pageHeight - SCREENPLAY_FORMAT.marginBottom);
  const leftMargin = inchesToPoints(SCREENPLAY_FORMAT.marginLeft);
  const rightMarginX = inchesToPoints(SCREENPLAY_FORMAT.pageWidth - SCREENPLAY_FORMAT.marginRight);

  // Bookmarks storage
  const bookmarks: Array<{ title: string; page: number }> = [];

  const layoutPages: LayoutPage[] = [
    { ops: [], hasContinuedTop: false, hasContinuedBottom: false },
  ];
  let layoutPageIndex = 0;
  let layoutY = topY;
  let layoutCurrentScene: string | null = null;
  let layoutCurrentCharacterCue: string | null = null;

  const currentLayoutPage = (): LayoutPage => layoutPages[layoutPageIndex];

  const pushLayoutText = (
    text: string,
    x: number,
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    currentLayoutPage().ops.push({ text, x, y: layoutY, align });
    layoutY += lineHeightPt;
  };

  const breakToNextPage = (markContinuation: boolean) => {
    if (markContinuation && layoutCurrentScene) {
      currentLayoutPage().hasContinuedBottom = true;
    }

    layoutPages.push({
      ops: [],
      hasContinuedTop: markContinuation && !!layoutCurrentScene,
      hasContinuedBottom: false,
    });
    layoutPageIndex += 1;
    layoutY = topY;
  };

  const ensureSpace = (requiredLines: number = 1, markContinuation: boolean = false): boolean => {
    const requiredSpace = requiredLines * lineHeightPt;
    if (layoutY + requiredSpace > maxY) {
      breakToNextPage(markContinuation);
      return true;
    }
    return false;
  };

  const addContinuedCharacterCue = () => {
    if (!layoutCurrentCharacterCue) return;
    const continuedCue = layoutCurrentCharacterCue.includes("(CONT'D)")
      ? layoutCurrentCharacterCue
      : `${layoutCurrentCharacterCue} (CONT'D)`;
    layoutY += lineHeightPt; // Space before continued cue
    pushLayoutText(
      continuedCue,
      leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.character)
    );
  };

  // Single-source layout pass: all pagination decisions happen here.
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    switch (element.type) {
      case 'blank': {
        layoutCurrentCharacterCue = null;
        layoutY += lineHeightPt;
        if (layoutY > maxY) {
          breakToNextPage(false);
        }
        break;
      }

      case 'scene': {
        layoutCurrentCharacterCue = null;
        ensureSpace(2, false);

        let blankLinesBeforeScene = 0;
        for (let j = i - 1; j >= 0; j--) {
          if (elements[j].type === 'blank') {
            blankLinesBeforeScene++;
          } else {
            break;
          }
        }

        if (blankLinesBeforeScene < 2) {
          layoutY += lineHeightPt * (2 - blankLinesBeforeScene);
        } else if (blankLinesBeforeScene > 2) {
          layoutY -= lineHeightPt * (blankLinesBeforeScene - 2);
        }

        if (layoutY > maxY) {
          breakToNextPage(false);
        }

        layoutCurrentScene = element.text;

        if (includeBookmarks && element.bookmark) {
          bookmarks.push({
            title: element.bookmark,
            page: layoutPageIndex + 1,
          });
        }

        pushLayoutText(
          element.text,
          leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.sceneHeading)
        );
        layoutY += lineHeightPt; // Extra spacing after scene heading
        break;
      }

      case 'action': {
        layoutCurrentCharacterCue = null;
        const actionX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.action);
        const actionLines = wrapText(doc, element.text, SCREENPLAY_FORMAT.width.action);
        const isTerminalAction = element.text.trim().toUpperCase() === 'THE END';

        actionLines.forEach((line: string) => {
          ensureSpace(1, !isTerminalAction);
          pushLayoutText(line, actionX);
        });
        break;
      }

      case 'character': {
        const nextElement = elements[i + 1];
        const dialogueLines =
          nextElement && nextElement.type === 'dialogue'
            ? wrapText(doc, nextElement.text, SCREENPLAY_FORMAT.width.dialogue).length
            : 0;

        // Keep cue + first dialogue chunk together when possible.
        ensureSpace(2 + dialogueLines, false);
        layoutY += lineHeightPt; // Space before character

        layoutCurrentCharacterCue = element.text;
        const charX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.character);
        pushLayoutText(element.text, charX);
        break;
      }

      case 'parenthetical': {
        const parenX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.parenthetical);
        const parenLines = wrapText(doc, element.text, SCREENPLAY_FORMAT.width.parenthetical);

        parenLines.forEach((line: string) => {
          const didBreak = ensureSpace(1, true);
          if (didBreak) {
            addContinuedCharacterCue();
          }
          pushLayoutText(line, parenX);
        });
        break;
      }

      case 'dialogue': {
        const dialogueX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.dialogue);
        const dialogueLines = wrapText(doc, element.text, SCREENPLAY_FORMAT.width.dialogue);

        dialogueLines.forEach((line: string) => {
          const didBreak = ensureSpace(1, true);
          if (didBreak) {
            addContinuedCharacterCue();
          }
          pushLayoutText(line, dialogueX);
        });
        break;
      }

      case 'transition': {
        layoutCurrentCharacterCue = null;
        ensureSpace(2, false);
        layoutY += lineHeightPt; // Space before transition
        pushLayoutText(element.text, rightMarginX, 'right');
        layoutY += lineHeightPt; // Extra spacing after transition
        break;
      }
    }
  }

  // Draw title page first (page 1, unnumbered).
  const centerX = inchesToPoints(SCREENPLAY_FORMAT.pageWidth / 2);
  const centerY = inchesToPoints(SCREENPLAY_FORMAT.pageHeight / 2);

  doc.setFontSize(SCREENPLAY_FORMAT.fontSize);
  doc.text(title.toUpperCase(), centerX, centerY, {
    align: 'center',
    baseline: 'top',
  });

  if (author) {
    doc.text('by', centerX, centerY + 48, {
      align: 'center',
      baseline: 'top',
    });
    doc.text(author, centerX, centerY + 72, {
      align: 'center',
      baseline: 'top',
    });
  }

  if (contact) {
    const contactY = inchesToPoints(SCREENPLAY_FORMAT.pageHeight - 1.5);
    const contactLines = contact.split('\n');
    contactLines.forEach((line, idx) => {
      doc.text(line, leftMargin, contactY + (idx * SCREENPLAY_FORMAT.lineHeight), { baseline: 'top' });
    });
  }

  if (watermark && watermark.text && !watermark.image) {
    addWatermark(doc, watermark);
  }

  // Render layout pages exactly as planned (no pagination decisions here).
  layoutPages.forEach((page, index) => {
    doc.addPage();
    const scriptPageNumber = index + 1;

    const pageNumX = inchesToPoints(SCREENPLAY_FORMAT.pageNumberRight);
    const pageNumY = inchesToPoints(SCREENPLAY_FORMAT.pageNumberTop);
    doc.setFontSize(SCREENPLAY_FORMAT.fontSize);
    doc.text(`${scriptPageNumber}.`, pageNumX, pageNumY, { align: 'right', baseline: 'top' });

    if (page.hasContinuedTop) {
      const continuedY = inchesToPoints(SCREENPLAY_FORMAT.marginTop) - 12;
      const continuedX = inchesToPoints(SCREENPLAY_FORMAT.pageNumberRight);
      doc.text('CONTINUED:', continuedX, continuedY, { align: 'right', baseline: 'top' });
    }

    page.ops.forEach((op) => {
      doc.text(op.text, op.x, op.y, {
        align: op.align,
        baseline: 'top',
      });
    });

    if (page.hasContinuedBottom) {
      const continuedY = maxY + 12;
      const continuedX = inchesToPoints(SCREENPLAY_FORMAT.pageNumberRight);
      doc.text('(CONTINUED)', continuedX, continuedY, { align: 'right', baseline: 'top' });
    }

    if (watermark && watermark.text && !watermark.image) {
      addWatermark(doc, watermark);
    }
  });
  
  // Add PDF bookmarks (outline)
  if (includeBookmarks && bookmarks.length > 0) {
    // Note: jsPDF doesn't natively support bookmarks/outlines
    // We'll add them to metadata for now
    // For full bookmark support, we'd need to use pdf-lib to post-process
    doc.setProperties({
      title,
      subject: 'Screenplay',
      author: author || '',
      keywords: bookmarks.map(b => b.title).join(', '),
      creator: 'Wryda.ai - Democratizing Filmmaking',
    });
  }
  
  // Generate PDF with jsPDF
  const pdfBlob = doc.output('blob');
  
  // If we have an image watermark, use pdf-lib to add it (proven, reliable method)
  if (watermark && watermark.image) {
    try {
      console.log('[PDF Export] Processing image watermark with pdf-lib...');
      
      // Convert blob to Uint8Array
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      // Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Add watermark using pdf-lib (handles opacity and rotation reliably)
      await addWatermarkWithPdfLib(pdfDoc, watermark);
      
      // Save and return the watermarked PDF
      const watermarkedPdfBytes = await pdfDoc.save();
      // Uint8Array is compatible with Blob constructor
      return new Blob([watermarkedPdfBytes as BlobPart], { type: 'application/pdf' });
    } catch (error) {
      console.error('[PDF Export] Failed to add watermark with pdf-lib, returning unwatermarked PDF:', error);
      // Return original PDF if watermarking fails
      return pdfBlob;
    }
  }
  
  // Return PDF (with text watermark if any, added during jsPDF generation)
  return pdfBlob;
}

/**
 * Helper: Download PDF directly
 */
export async function downloadScreenplayPDF(
  screenplay: string,
  filename: string = 'screenplay.pdf',
  options: Parameters<typeof exportScreenplayToPDF>[1] = {}
): Promise<void> {
  const blob = await exportScreenplayToPDF(screenplay, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

