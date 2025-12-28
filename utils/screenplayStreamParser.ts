/**
 * Screenplay Stream Parser
 * Feature 0177: Chunked processing for huge screenplay imports
 * 
 * Processes large screenplays in chunks to prevent memory issues
 * and provide progress feedback during import.
 */

/**
 * Generator function to split screenplay content into chunks
 * Ensures chunks end at complete line boundaries
 */
export function* parseScreenplayInChunks(
  content: string,
  chunkSize: number = 100000 // 100KB default
): Generator<string> {
  let offset = 0;
  
  while (offset < content.length) {
    const chunk = content.slice(offset, offset + chunkSize);
    
    // Find last complete line in chunk (don't split in middle of line)
    const lastNewline = chunk.lastIndexOf('\n');
    
    if (lastNewline === -1) {
      // No newline found - this shouldn't happen in screenplays, but handle it
      yield chunk;
      offset += chunk.length;
    } else {
      // Yield complete chunk ending at line boundary
      const completeChunk = chunk.slice(0, lastNewline + 1);
      yield completeChunk;
      offset += completeChunk.length;
    }
  }
}

/**
 * Process screenplay import with progress callback
 * For large files, shows progress during normalization
 * Note: Normalization must process entire file at once to handle wrapped lines correctly
 */
export async function processChunkedImport(
  content: string,
  normalizeFn: (content: string) => string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const totalLength = content.length;
  const LARGE_FILE_THRESHOLD = 1024 * 1024; // 1MB
  
  // For small files, process immediately
  if (totalLength < LARGE_FILE_THRESHOLD) {
    if (onProgress) onProgress(0.5);
    const normalized = normalizeFn(content);
    if (onProgress) onProgress(1.0);
    return normalized;
  }
  
  // For large files, show progress but normalize in one pass
  // (Normalization needs full file to handle wrapped lines correctly)
  if (onProgress) {
    onProgress(0.1); // Start
  }
  
  // Yield to event loop to show progress
  await new Promise(resolve => setTimeout(resolve, 10));
  
  if (onProgress) {
    onProgress(0.5); // Processing
  }
  
  // Normalize entire file (needed for wrapped line detection)
  const normalized = normalizeFn(content);
  
  if (onProgress) {
    onProgress(1.0); // Complete
  }
  
  return normalized;
}

