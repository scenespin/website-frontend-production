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
  fdxInterop?: {
    schemaVersion: number;
    sourceVersion?: string;
    rawXml: string;
    preservedNodes: Record<string, string>;
    paragraphAttributeIndex: Record<string, {
      attrs: Record<string, string>;
      normalizedTextHash: string;
    }>;
  };
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
    
    // Find screenplay body Content element.
    // Some FDX files include a TitlePage/Content block first; we need the
    // Content block that contains typed screenplay Paragraph nodes.
    const allContentNodes = Array.from(xmlDoc.querySelectorAll('Content'));
    const content = allContentNodes.find((node) => {
      const directChildren = Array.from(node.children);
      return directChildren.some((child) =>
        child.tagName === 'Paragraph' && !!child.getAttribute('Type')
      );
    }) || allContentNodes[0] || null;
    if (!content) {
      throw new Error('FDX file does not contain Content element');
    }
    
    // Extract paragraphs and convert to Fountain
    const fountainLines: string[] = [];
    const paragraphs = content.querySelectorAll('Paragraph');
    const paragraphTypeCounts: Record<string, number> = {};
    const paragraphAttributeIndex: Record<string, {
      attrs: Record<string, string>;
      normalizedTextHash: string;
    }> = {};
    
    let previousType = '';
    
    const normalizeForFingerprint = (value: string): string =>
      value.replace(/\s+/g, ' ').trim();

    const hashString = (value: string): string => {
      let hash = 2166136261;
      for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash +=
          (hash << 1) +
          (hash << 4) +
          (hash << 7) +
          (hash << 8) +
          (hash << 24);
      }
      return (hash >>> 0).toString(16);
    };

    const applyFountainInlineStyles = (rawText: string, style: string | null): string => {
      if (!style || !rawText || rawText.trim().length === 0) {
        return rawText;
      }

      const styleParts = style
        .split('+')
        .map(part => part.trim().toLowerCase())
        .filter(Boolean);

      const hasBold = styleParts.includes('bold');
      const hasItalic = styleParts.includes('italic');
      const hasUnderline = styleParts.includes('underline');
      const hasStrike = styleParts.includes('strikeout');

      let formatted = rawText;

      if (hasBold && hasItalic) {
        formatted = `***${formatted}***`;
      } else if (hasBold) {
        formatted = `**${formatted}**`;
      } else if (hasItalic) {
        formatted = `*${formatted}*`;
      }

      if (hasUnderline) {
        formatted = `_${formatted}_`;
      }

      if (hasStrike) {
        formatted = `~~${formatted}~~`;
      }

      return formatted;
    };

    paragraphs.forEach((paragraph) => {
      const type = paragraph.getAttribute('Type');
      if (!type) return;
      
      // Extract text from paragraph
      const textNodes = paragraph.querySelectorAll('Text');
      const paragraphText = Array.from(textNodes)
        .map((node) => {
          const textContent = node.textContent || '';
          const style = node.getAttribute('Style');
          return applyFountainInlineStyles(textContent, style);
        })
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

      // Build fingerprint index for safe paragraph-attribute passthrough during export.
      const typeCount = paragraphTypeCounts[type] || 0;
      paragraphTypeCounts[type] = typeCount + 1;
      const normalizedText = normalizeForFingerprint(paragraphText);
      const normalizedTextHash = hashString(normalizedText);
      const rawAttrs: Record<string, string> = {};
      for (let attrIndex = 0; attrIndex < paragraph.attributes.length; attrIndex++) {
        const attr = paragraph.attributes.item(attrIndex);
        if (!attr || attr.name === 'Type') continue;
        rawAttrs[attr.name] = attr.value;
      }
      if (Object.keys(rawAttrs).length > 0) {
        paragraphAttributeIndex[`${type}|h:${normalizedTextHash}`] = {
          attrs: rawAttrs,
          normalizedTextHash,
        };
        paragraphAttributeIndex[`${type}|o:${typeCount}`] = {
          attrs: rawAttrs,
          normalizedTextHash,
        };
      }
      
      previousType = type;
    });
    
    // Join lines and clean up
    let fountainText = fountainLines.join('\n');
    
    // Normalize multiple blank lines to max 2
    fountainText = fountainText.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading/trailing whitespace
    fountainText = fountainText.trim();
    
    // Preserve unknown top-level nodes for export passthrough.
    const preservedNodes: Record<string, string> = {};
    const root = xmlDoc.documentElement;
    const serializer = new XMLSerializer();
    const reservedTopLevel = new Set(['Content', 'TitlePage', 'TextState']);
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children.item(i);
      if (!child) continue;
      if (reservedTopLevel.has(child.tagName)) continue;
      preservedNodes[child.tagName] = serializer.serializeToString(child);
    }

    return {
      text: fountainText,
      success: true,
      fdxInterop: {
        schemaVersion: 1,
        sourceVersion: root.getAttribute('Version') || undefined,
        rawXml: fileText,
        preservedNodes,
        paragraphAttributeIndex,
      },
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
