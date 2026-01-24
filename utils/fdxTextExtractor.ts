/**
 * Final Draft FDX Text Extraction Utility
 * 
 * Extracts text from Final Draft (.fdx) files and converts to Fountain format
 * FDX is an XML-based format, so we parse the XML structure
 * 
 * FDX Format Structure:
 * - Root: <FinalDraft>
 * - Content: <Content>
 * - Paragraphs: <Paragraph Type="...">
 *   - Scene Heading: Type="Scene Heading"
 *   - Action: Type="Action"
 *   - Character: Type="Character"
 *   - Dialogue: Type="Dialogue"
 *   - Parenthetical: Type="Parenthetical"
 *   - Transition: Type="Transition"
 * - Text: <Text>...</Text> or <Text Style="...">...</Text>
 */

export interface FDXExtractionResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Check if a file is an FDX file
 */
export function isFDXFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.fdx') || 
         file.type === 'application/xml' ||
         file.type === 'text/xml';
}

/**
 * Extract text from FDX file and convert to Fountain format
 * @param file - FDX File object
 * @returns Extracted text in Fountain format
 */
export async function extractTextFromFDX(file: File): Promise<FDXExtractionResult> {
  try {
    // Read file as text (FDX is XML, so it's text-based)
    const fileText = await file.text();
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML structure in FDX file');
    }
    
    // Find Content element
    const content = xmlDoc.querySelector('Content');
    if (!content) {
      throw new Error('FDX file does not contain Content element');
    }
    
    // Extract paragraphs and convert to Fountain
    const fountainLines: string[] = [];
    const paragraphs = content.querySelectorAll('Paragraph');
    
    let previousType = '';
    
    paragraphs.forEach((paragraph) => {
      const type = paragraph.getAttribute('Type');
      if (!type) return;
      
      // Extract text from paragraph
      const textNodes = paragraph.querySelectorAll('Text');
      const paragraphText = Array.from(textNodes)
        .map(node => node.textContent || '')
        .join('')
        .trim();
      
      if (!paragraphText) return;
      
      // Convert based on paragraph type
      switch (type) {
        case 'Scene Heading':
          // Add blank line before scene heading (Fountain spec)
          if (fountainLines.length > 0 && fountainLines[fountainLines.length - 1] !== '') {
            fountainLines.push('');
          }
          fountainLines.push(paragraphText);
          fountainLines.push(''); // Blank line after scene heading
          break;
          
        case 'Action':
          // Action lines - preserve as-is
          fountainLines.push(paragraphText);
          break;
          
        case 'Character':
          // Character name - add blank line before (Fountain spec)
          if (previousType !== 'Character' && previousType !== 'Parenthetical') {
            if (fountainLines.length > 0 && fountainLines[fountainLines.length - 1] !== '') {
              fountainLines.push('');
            }
          }
          fountainLines.push(paragraphText.toUpperCase()); // Ensure uppercase
          break;
          
        case 'Dialogue':
          // Dialogue - follows character immediately (no blank line)
          fountainLines.push(paragraphText);
          break;
          
        case 'Parenthetical':
          // Parenthetical - wrapped in parentheses
          const parentheticalText = paragraphText.startsWith('(') 
            ? paragraphText 
            : `(${paragraphText})`;
          fountainLines.push(parentheticalText);
          break;
          
        case 'Transition':
          // Transition - ends with "TO:" or "TO"
          const transitionText = paragraphText.toUpperCase();
          fountainLines.push(transitionText.endsWith(':') ? transitionText : `${transitionText}:`);
          break;
          
        default:
          // Unknown type - treat as action
          fountainLines.push(paragraphText);
      }
      
      previousType = type;
    });
    
    // Join lines and clean up
    let fountainText = fountainLines.join('\n');
    
    // Normalize multiple blank lines to max 2
    fountainText = fountainText.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading/trailing whitespace
    fountainText = fountainText.trim();
    
    return {
      text: fountainText,
      success: true
    };
    
  } catch (error) {
    console.error('[FDXExtractor] Error extracting FDX file:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error extracting FDX file'
    };
  }
}
