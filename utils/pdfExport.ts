/**
 * Professional Screenplay PDF Export with Watermarks
 * Industry-standard formatting following WGA/Academy guidelines
 * 
 * 🎨 WATERMARK FEATURE: Completely FREE for all users!
 * No plan gating - democratizing professional screenplay export
 */

import { jsPDF } from 'jspdf';

// Industry-standard screenplay formatting
const SCREENPLAY_FORMAT = {
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

interface ParsedElement {
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
function parseFountain(fountain: string): ParsedElement[] {
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
    
    // Scene heading (INT., EXT., INT/EXT, INT./EXT)
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
 * Add watermark to PDF page (text or image)
 * 🎨 FREE FOR ALL USERS - No plan restrictions!
 */
function addWatermark(
  doc: jsPDF,
  options: WatermarkOptions
) {
  const {
    text,
    image,
    opacity = 0.1,
    angle = -45,
    fontSize = 72,
    imageWidth = 3, // Default 3 inches
    imageHeight = 3, // Default 3 inches
  } = options;
  
  const pageWidth = inchesToPoints(SCREENPLAY_FORMAT.pageWidth);
  const pageHeight = inchesToPoints(SCREENPLAY_FORMAT.pageHeight);
  
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  
  if (image) {
    // Image watermark
    try {
      // Prepare image data and format
      const { imageData, format } = prepareImageForPDF(image);
      
      const imgWidth = inchesToPoints(imageWidth);
      const imgHeight = inchesToPoints(imageHeight);
      
      // Save graphics state for opacity and transformation
      doc.saveGraphicsState();
      
      // Set opacity using GState
      doc.setGState(doc.GState({ opacity }));
      
      if (angle !== 0) {
        // Rotate around center using transformation matrix
        const radians = (angle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        // Apply transformation: translate to center, rotate, then position image
        // Transformation matrix array: [a, b, c, d, e, f]
        // a = cos, b = sin, c = -sin, d = cos (rotation)
        // e, f = translation to center
        doc.setCurrentTransformationMatrix([cos, sin, -sin, cos, centerX, centerY]);
        
        // Draw image centered at origin (after transformation)
        // Position is relative to the transformed coordinate system
        doc.addImage(imageData, format, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      } else {
        // No rotation - simple centered placement
        const x = centerX - imgWidth / 2;
        const y = centerY - imgHeight / 2;
        doc.addImage(imageData, format, x, y, imgWidth, imgHeight);
      }
      
      // Restore graphics state
      doc.restoreGraphicsState();
    } catch (error) {
      console.error('[PDF Watermark] Failed to add image:', error);
      console.error('[PDF Watermark] Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        imageType: typeof image,
        imageLength: image?.length,
        imagePreview: image?.substring(0, 100),
        hasDataUrl: image?.startsWith('data:')
      });
      
      // Restore state before fallback
      try {
        doc.restoreGraphicsState();
      } catch (e) {
        // Ignore restore errors
      }
      
      // Fallback to text watermark if image fails
      if (text) {
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity }));
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(fontSize);
        doc.text(text, centerX, centerY, {
          align: 'center',
          angle,
        });
        doc.restoreGraphicsState();
      }
    }
  } else if (text) {
    // Text watermark
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity }));
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(fontSize);
    doc.text(text, centerX, centerY, {
      align: 'center',
      angle,
    });
    doc.restoreGraphicsState();
  }
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
  
  // Track position
  let currentY = inchesToPoints(SCREENPLAY_FORMAT.marginTop);
  const maxY = inchesToPoints(SCREENPLAY_FORMAT.pageHeight - SCREENPLAY_FORMAT.marginBottom);
  const leftMargin = inchesToPoints(SCREENPLAY_FORMAT.marginLeft);
  let pageNumber = 1;
  let firstPage = true;
  
  // Bookmarks storage
  const bookmarks: Array<{ title: string; page: number }> = [];
  
  /**
   * Add a new page
   */
  function addNewPage() {
    doc.addPage();
    pageNumber++;
    currentY = inchesToPoints(SCREENPLAY_FORMAT.marginTop);
    
    // Add page number (not on first page)
    const pageNumX = inchesToPoints(SCREENPLAY_FORMAT.pageNumberRight);
    const pageNumY = inchesToPoints(SCREENPLAY_FORMAT.pageNumberTop);
    doc.setFontSize(SCREENPLAY_FORMAT.fontSize);
    doc.text(`${pageNumber}.`, pageNumX, pageNumY, { align: 'right' });
    
    // Add watermark if specified (FREE for all users!)
    if (watermark) {
      addWatermark(doc, watermark);
    }
  }
  
  /**
   * Check if we need a new page
   */
  function checkPageBreak(requiredLines: number = 1) {
    const lineHeightPt = SCREENPLAY_FORMAT.lineHeight;
    const requiredSpace = requiredLines * lineHeightPt;
    
    if (currentY + requiredSpace > maxY) {
      addNewPage();
      return true;
    }
    return false;
  }
  
  /**
   * Add title page
   */
  function addTitlePage() {
    const centerX = inchesToPoints(SCREENPLAY_FORMAT.pageWidth / 2);
    const centerY = inchesToPoints(SCREENPLAY_FORMAT.pageHeight / 2);
    
    doc.setFontSize(SCREENPLAY_FORMAT.fontSize);
    
    // Title (centered, middle of page)
    doc.text(title.toUpperCase(), centerX, centerY, {
      align: 'center',
    });
    
    // Author (if provided)
    if (author) {
      doc.text(`by`, centerX, centerY + 48, {
        align: 'center',
      });
      doc.text(author, centerX, centerY + 72, {
        align: 'center',
      });
    }
    
    // Contact info (bottom left)
    if (contact) {
      const contactY = inchesToPoints(SCREENPLAY_FORMAT.pageHeight - 1.5);
      const contactLines = contact.split('\n');
      contactLines.forEach((line, idx) => {
        doc.text(line, leftMargin, contactY + (idx * SCREENPLAY_FORMAT.lineHeight));
      });
    }
    
    // Add watermark if specified (FREE for all users!)
    if (watermark) {
      addWatermark(doc, watermark);
    }
    
    // Start screenplay on new page
    addNewPage();
    firstPage = false;
  }
  
  // Add title page
  addTitlePage();
  
  /**
   * Process each element
   */
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const lineHeightPt = SCREENPLAY_FORMAT.lineHeight;
    
    switch (element.type) {
      case 'blank':
        currentY += lineHeightPt;
        checkPageBreak();
        break;
        
      case 'scene':
        // Scene headings should not be orphaned
        checkPageBreak(2);
        
        // Add bookmark
        if (includeBookmarks && element.bookmark) {
          bookmarks.push({
            title: element.bookmark,
            page: pageNumber,
          });
        }
        
        doc.setFont(SCREENPLAY_FORMAT.fontFamily, 'bold');
        doc.text(
          element.text,
          leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.sceneHeading),
          currentY
        );
        doc.setFont(SCREENPLAY_FORMAT.fontFamily, 'normal');
        
        currentY += lineHeightPt * 2; // Extra space after scene heading
        break;
        
      case 'action':
        const actionX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.action);
        const actionLines = wrapText(doc, element.text, SCREENPLAY_FORMAT.width.action);
        
        checkPageBreak(actionLines.length);
        
        actionLines.forEach((line: string) => {
          doc.text(line, actionX, currentY);
          currentY += lineHeightPt;
        });
        break;
        
      case 'character':
        // Character names should not be orphaned from dialogue
        const nextElement = elements[i + 1];
        const dialogueLines = nextElement && nextElement.type === 'dialogue' 
          ? wrapText(doc, nextElement.text, SCREENPLAY_FORMAT.width.dialogue).length
          : 0;
        
        checkPageBreak(2 + dialogueLines);
        
        currentY += lineHeightPt; // Space before character
        
        const charX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.character);
        doc.text(element.text, charX, currentY);
        currentY += lineHeightPt;
        break;
        
      case 'parenthetical':
        const parenX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.parenthetical);
        const parenLines = wrapText(doc, element.text, SCREENPLAY_FORMAT.width.parenthetical);
        
        parenLines.forEach((line: string) => {
          doc.text(line, parenX, currentY);
          currentY += lineHeightPt;
        });
        break;
        
      case 'dialogue':
        const dialogueX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.dialogue);
        const dialogueWrapped = wrapText(doc, element.text, SCREENPLAY_FORMAT.width.dialogue);
        
        dialogueWrapped.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, dialogueX, currentY);
          currentY += lineHeightPt;
        });
        break;
        
      case 'transition':
        checkPageBreak(2);
        
        currentY += lineHeightPt; // Space before transition
        
        const transX = leftMargin + inchesToPoints(SCREENPLAY_FORMAT.indent.transition);
        doc.text(element.text, transX, currentY);
        currentY += lineHeightPt * 2; // Extra space after transition
        break;
    }
  }
  
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
  
  // Generate blob
  const pdfBlob = doc.output('blob');
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

