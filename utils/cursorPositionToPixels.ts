/**
 * Cursor Position to Pixel Coordinates Utility
 * Feature 0134: Cursor Position Sharing for Collaborative Editing
 * 
 * Converts character offset positions to pixel coordinates for rendering cursor indicators
 * over the textarea element.
 */

/**
 * Calculate pixel coordinates for a cursor position in a textarea
 * 
 * Algorithm:
 * 1. Create a hidden div with same content and styling as textarea
 * 2. Insert a span marker at the cursor position
 * 3. Measure the span's position relative to the textarea
 * 4. Return pixel coordinates
 * 
 * @param textarea - The textarea element
 * @param content - The text content (displayContent, not raw content)
 * @param position - Character offset (0-based)
 * @returns Pixel coordinates { x, y } relative to textarea, or null if calculation fails
 */
export function getCursorPixelPosition(
  textarea: HTMLTextAreaElement | null,
  content: string,
  position: number
): { x: number; y: number } | null {
  if (!textarea || position < 0 || position > content.length) {
    return null;
  }

  try {
    // Get textarea styles
    const styles = window.getComputedStyle(textarea);
    const {
      fontFamily,
      fontSize,
      fontStyle,
      fontWeight,
      letterSpacing,
      lineHeight,
      paddingLeft,
      paddingTop,
      paddingRight,
      paddingBottom,
      borderLeftWidth,
      borderTopWidth,
      boxSizing,
    } = styles;

    // Create a hidden div with same styling
    const measureDiv = document.createElement('div');
    measureDiv.style.position = 'absolute';
    measureDiv.style.visibility = 'hidden';
    measureDiv.style.whiteSpace = 'pre-wrap';
    measureDiv.style.wordWrap = 'break-word';
    measureDiv.style.fontFamily = fontFamily;
    measureDiv.style.fontSize = fontSize;
    measureDiv.style.fontStyle = fontStyle;
    measureDiv.style.fontWeight = fontWeight;
    measureDiv.style.letterSpacing = letterSpacing;
    measureDiv.style.lineHeight = lineHeight;
    measureDiv.style.paddingLeft = paddingLeft;
    measureDiv.style.paddingTop = paddingTop;
    measureDiv.style.paddingRight = paddingRight;
    measureDiv.style.paddingBottom = paddingBottom;
    measureDiv.style.borderLeftWidth = borderLeftWidth;
    measureDiv.style.borderTopWidth = borderTopWidth;
    measureDiv.style.width = `${textarea.offsetWidth}px`;
    measureDiv.style.boxSizing = boxSizing;

    // Split content at cursor position
    const beforeCursor = content.substring(0, position);
    const afterCursor = content.substring(position);

    // Insert span marker at cursor position
    measureDiv.innerHTML = escapeHtml(beforeCursor) + '<span id="cursor-marker"></span>' + escapeHtml(afterCursor);

    // Append to body temporarily
    document.body.appendChild(measureDiv);

    // Find the marker span
    const marker = measureDiv.querySelector('#cursor-marker');
    if (!marker) {
      document.body.removeChild(measureDiv);
      return null;
    }

    // Get marker position
    // getBoundingClientRect() returns viewport-relative coordinates
    // The hidden div shows content from the top (not scrolled), so markerRect gives us
    // the position in the full content relative to the viewport
    const markerRect = marker.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    // Calculate position relative to textarea's top-left corner
    // Since the hidden div is positioned at the top of the content (not scrolled),
    // these coordinates represent the position in the FULL CONTENT, not the viewport.
    // The overlay will need to subtract scroll to get the viewport position.
    const x = markerRect.left - textareaRect.left;
    const y = markerRect.top - textareaRect.top;
    
    // Debug logging to understand coordinate calculation
    console.log('[cursorPositionToPixels] Calculated position', {
      position,
      contentLength: content.length,
      x,
      y,
      markerRect: { left: markerRect.left, top: markerRect.top },
      textareaRect: { left: textareaRect.left, top: textareaRect.top },
      textareaScrollTop: textarea.scrollTop,
      textareaScrollLeft: textarea.scrollLeft
    });

    // Cleanup
    document.body.removeChild(measureDiv);

    return { x, y };
  } catch (error) {
    console.error('[cursorPositionToPixels] Error calculating cursor position:', error);
    return null;
  }
}

/**
 * Escape HTML to prevent XSS and preserve text content
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get selection range pixel coordinates
 * Returns start and end positions for highlighting selected text
 * 
 * @param textarea - The textarea element
 * @param content - The text content
 * @param selectionStart - Selection start position
 * @param selectionEnd - Selection end position
 * @returns Pixel coordinates for selection, or null if calculation fails
 */
export function getSelectionPixelRange(
  textarea: HTMLTextAreaElement | null,
  content: string,
  selectionStart: number,
  selectionEnd: number
): { start: { x: number; y: number }; end: { x: number; y: number } } | null {
  if (!textarea || selectionStart < 0 || selectionEnd < 0 || selectionStart > selectionEnd) {
    return null;
  }

  const startPos = getCursorPixelPosition(textarea, content, selectionStart);
  const endPos = getCursorPixelPosition(textarea, content, selectionEnd);

  if (!startPos || !endPos) {
    return null;
  }

  return { start: startPos, end: endPos };
}

