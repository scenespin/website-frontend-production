'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useDrawer } from '@/contexts/DrawerContext';
import { Film, Camera, Clapperboard, FileText, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt } from '@/utils/sceneDetection';
import { buildDirectorPrompt } from '@/utils/promptBuilders';
import { validateDirectorContent, supportsNativeJSON, buildRetryPrompt } from '@/utils/jsonValidator';
import toast from 'react-hot-toast';

// Helper to strip markdown formatting from text (for Fountain format compliance)
// Import cleanFountainOutput from ChatModePanel for consistency
// Using the same robust cleaning function that removes analysis, notes, etc.
function cleanFountainOutput(text, sceneContext = null) {
  if (!text) return text;
  
  let cleaned = text;
  
  // 🔥 CRITICAL: Remove "[SCREENWRITING ASSISTANT]" headers FIRST (before other processing)
  // This ensures they don't interfere with content extraction
  cleaned = cleaned
    .replace(/^\[SCREENWRITING ASSISTANT\]\s*$/gim, '')
    .replace(/^SCREENWRITING ASSISTANT\s*$/gim, '')
    .replace(/\[SCREENWRITING ASSISTANT\]\s*/gi, ''); // Also remove if it appears in the middle of a line
  
  // Remove markdown formatting
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+__)/g, '$1')
    .replace(/\b\*([^*\n]+)\*\b/g, '$1')
    .replace(/\b_([^_\n]+)_\b/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '')
    // 🔥 NEW: Remove markdown headers (## or ###) and convert to action lines
    // Example: "## A FEW BLOCKS LATER" -> "A FEW BLOCKS LATER"
    .replace(/^#+\s+(.+)$/gm, '$1')
    // 🔥 NEW: Remove trailing asterisks (standalone * at end of line or end of content)
    .replace(/\s*\*\s*$/gm, '') // Remove * at end of lines
    .replace(/\s*\*$/, ''); // Remove * at very end of content
  
  // 🔥 FIX: Process line by line to handle headers properly
  // Split into lines first, then filter out unwanted patterns
  const lines = cleaned.split('\n');
  const screenplayLines = [];
  let foundFirstScreenplayContent = false;
  
  // Patterns that indicate we should stop processing (end of screenplay content)
  // These are analysis/outline patterns that should NEVER be in screenplay content
  const stopPatterns = [
    /^NOTE:/i,
    /Would you like/i,
    /What happens next\?/i,
    /What feeling/i,
    /For (your|this) scene/i,
    /Recommendation:/i,
    /Enhanced options?:/i,
    /ALTERNATIVE OPTIONS?:/i,
    /Option \d+[:\-]/i,
    /Which direction/i,
    /Here are (some|a few) (suggestions|options|ideas|ways|things)/i,
    // 🔥 NEW: Analysis/outline patterns from Director agent
    /^SCENE \d+:/i,  // "SCENE 2:", "SCENE 3:", etc.
    /^Setup & Discovery/i,
    /^The Chase & Escalating/i,
    /^The Capture/i,
    /^Key Beats?:/i,
    /^Story Integration Notes?:/i,
    /^Screenplay Development/i,
    /^Based on your setup/i,
    /^This tiger subplot serves/i,
    /^Would you like me to:/i,
    /^Write out the full scene/i,
    /^Adjust the tone/i,
    /^Change the tiger/i,
    /^Connect this more/i,
    /^🎬 Generate complete scenes/i,  // The prompt text at the end
    // 🔥 NEW: Meta-commentary about the scenes (analysis, not screenplay content)
    // Match even if not at start of line (may have leading whitespace or dashes)
    /These scenes (escalate|build|develop|show|reveal|highlight|emphasize|underscore|reinforce|support|connect|link|tie|bridge|transition|move|shift|change|transform|evolve|progress|advance|drive|propel|push|pull|draw|bring|take|lead|guide|direct|steer|navigate|maneuver|position|place|situate|locate|anchor|ground|root|base|found|set|put|make|turn|convert|become)/i,
    /while keeping.*character arc/i,
    /this is her (redemption|journey|arc|transformation|development|growth|evolution)/i,
    /captured through her (determination|instinct|skill|talent|ability|expertise)/i,
    /^Here are the next/i,  // "Here are the next three scenes..."
    /^Here are the/i,  // "Here are the scenes..."
    // 🔥 NEW: Stop on analysis comments like "*This revision adds..."
    /^\*.*(revision|adds|creates|builds|develops|enhances|improves|strengthens)/i,
    /^This revision/i,
    /^This adds/i
  ];
  
  // Patterns for lines to skip (but continue processing after them)
  const skipPatterns = [
    /^#+\s*(REVISED|REVISION|NEW SCENE ADDITION)\s*$/i,
    /^#?\s*REVISED\s+SCENE\s*$/i,
    /^#?\s*REVISION\s*$/i,
    /^\s*---\s*$/,
    /^\s*\*\s*$/,
    /^FADE OUT\.?\s*$/i,  // Skip "FADE OUT" lines (shouldn't be in middle of screenplay)
    /^THE END\.?\s*$/i,    // Skip "THE END" lines (shouldn't be in middle of screenplay)
    /^\[SCREENWRITING ASSISTANT\]\s*$/i,  // Skip "[SCREENWRITING ASSISTANT]" headers
    /^SCREENWRITING ASSISTANT\s*$/i,        // Skip "SCREENWRITING ASSISTANT" headers
    // 🔥 NEW: Skip analysis/outline section headers
    /^Screenplay Development/i,
    /^Based on your setup/i,
    /^Story Integration Notes?:/i,
    /^This tiger subplot serves/i,
    /^🎬 Generate complete scenes/i,
    // 🔥 NEW: Skip scene sequence headers (like "NEW SCENES: TIGER CHASE SEQUENCE")
    /^NEW SCENES?:/i,
    /^SCENE SEQUENCE:/i,
    /^SEQUENCE:/i,
    // 🔥 NEW: Skip "CUT TO:" transitions (not standard Fountain format)
    /^CUT TO:?\s*$/i,
    // 🔥 NEW: Skip analysis comments like "*This revision adds..."
    /^\*.*(revision|adds|creates|builds|develops|enhances|improves|strengthens)/i,
    /^This revision/i,
    /^This adds/i
  ];
  
  // Patterns for lines that are clearly explanations (stop here)
  const explanationPatterns = [
    /^(Here's|Here is|I'll|I will|Let me|This version|Here's the|This is|Here are|Here is the|I've|I have|Perfect|Great|Excellent|Good|Nice|Sure|Okay|OK)[\s:]/i,
    /Great (emotional|physical|character|story|writing|detail|note|suggestion|idea)/i,
    /This (version|Sarah|character|scene|moment).*$/i,
    /Works perfectly/i,
    /Current line:/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines until we find content
    if (!foundFirstScreenplayContent && !trimmedLine) continue;
    
    // Check if this is a line we should skip (but continue processing)
    let shouldSkip = false;
    for (const pattern of skipPatterns) {
      if (pattern.test(trimmedLine)) {
        shouldSkip = true;
        break;
      }
    }
    if (shouldSkip) {
      continue; // Skip this line but keep processing
    }
    
    // 🔥 CRITICAL FIX: Check for scene headings (INT./EXT.) even if we haven't found content yet
    // This handles cases where "[SCREENWRITING ASSISTANT]" or headers appear before actual screenplay content
    // Scene headings can have "- CONTINUOUS", "- DAY", "- NIGHT", etc. after the location
    if (!foundFirstScreenplayContent && /^(INT\.|EXT\.|I\/E\.)/i.test(trimmedLine)) {
      foundFirstScreenplayContent = true;
      // Include this scene heading (even if it has "- CONTINUOUS" or other modifiers)
      screenplayLines.push(line);
      continue;
    }
    
    // Check if we should stop processing (end of screenplay content)
    // BUT: Don't stop if we haven't found screenplay content yet - keep looking
    let shouldStop = false;
    if (foundFirstScreenplayContent) {
      // 🔥 NEW: Check for line of dashes (often precedes analysis text)
      // If we see a line that's mostly dashes, stop before it (it's a separator before analysis)
      if (/^-{10,}\s*$/.test(trimmedLine)) {
        shouldStop = true;
      } else {
        // Check all stop patterns
        for (const pattern of stopPatterns) {
          if (pattern.test(trimmedLine)) {
            shouldStop = true;
            break;
          }
        }
      }
    }
    if (shouldStop) {
      break; // Stop processing, don't include this or any following lines
    }
    
    // Check if this is an explanation (stop here)
    // BUT: Don't stop if we haven't found screenplay content yet - keep looking for it
    let isExplanation = false;
    if (foundFirstScreenplayContent) {
      for (const pattern of explanationPatterns) {
        if (pattern.test(trimmedLine)) {
          isExplanation = true;
          break;
        }
      }
    }
    if (isExplanation && foundFirstScreenplayContent) {
      break; // Stop if we've already found screenplay content and now see explanation
    }
    
    // Check if this looks like dialogue or character name
    const isLikelyDialogue = trimmedLine.length < 50 && (
      /^[A-Z][A-Z\s]+$/.test(lines[i-1]?.trim() || '') ||
      /^\(/.test(trimmedLine) ||
      /[!?.]$/.test(trimmedLine)
    );
    
    // Check if this is an explanation line (but allow if we've already found screenplay content)
    if (!isLikelyDialogue && !foundFirstScreenplayContent && 
        /^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure)/i.test(trimmedLine) && 
        !/^(INT\.|EXT\.|I\/E\.)/i.test(trimmedLine) &&
        !/^[A-Z][A-Z\s]+$/.test(trimmedLine) &&
        trimmedLine.length > 15) {
      // This might be an explanation, but if it's after screenplay content, allow it
      // Only break if we haven't found screenplay content yet
      continue; // Skip this line but continue
    }
    
    // Mark that we've found screenplay content
    // Look for scene headings, character names, or substantial action lines
    // 🔥 CRITICAL: Skip duplicate scene headings that match the current scene
    if (/^(INT\.|EXT\.|I\/E\.)/i.test(trimmedLine)) {
      // Check if this matches the current scene (duplicate)
      const currentSceneHeading = sceneContext?.heading || '';
      if (currentSceneHeading) {
        const currentLocation = currentSceneHeading.toLowerCase().split(' - ')[0].trim();
        const newLocation = trimmedLine.toLowerCase().split(' - ')[0].trim();
        const currentFull = currentSceneHeading.toLowerCase().trim();
        const newFull = trimmedLine.toLowerCase().trim();
        
        if (currentLocation === newLocation || currentFull === newFull) {
          console.log('[DirectorModePanel] Skipping duplicate scene heading in main loop:', trimmedLine);
          continue; // Skip duplicate scene heading
        }
      }
      foundFirstScreenplayContent = true;
    } else if (/^[A-Z][A-Z\s#0-9']+$/.test(trimmedLine) && trimmedLine.length > 2 && trimmedLine.length < 50) {
      // Character name (ALL CAPS, reasonable length)
      foundFirstScreenplayContent = true;
    } else if (trimmedLine.length > 10 && !/^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure|Great|Perfect|Excellent|Good|Nice|Sure|Okay|OK)/i.test(trimmedLine)) {
      // Substantial action line (not an explanation)
      foundFirstScreenplayContent = true;
    }
    
    // Include this line if we've found screenplay content, or if it looks like screenplay content
    if (foundFirstScreenplayContent || /^(INT\.|EXT\.|I\/E\.|[A-Z][A-Z\s#0-9']+$)/.test(trimmedLine)) {
      screenplayLines.push(line);
    }
  }
  
  // 🔥 CRITICAL FIX: If we didn't find any screenplay content, try a more aggressive extraction
  // Look for scene headings anywhere in the text, even after explanation text
  if (screenplayLines.length === 0 || !foundFirstScreenplayContent) {
    console.warn('[DirectorModePanel] No screenplay content found with standard extraction, trying aggressive extraction...');
    screenplayLines = [];
    foundFirstScreenplayContent = false;
    
    // Find the first scene heading or character name
    // 🔥 CRITICAL: Skip duplicate scene headings that match the current scene
    let firstContentIndex = -1;
    const currentSceneHeading = sceneContext?.heading || '';
    let skippedDuplicateScene = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      // Check if it's a scene heading
      if (/^(INT\.|EXT\.|I\/E\.)/i.test(trimmedLine)) {
        // Skip if it matches the current scene (duplicate)
        if (currentSceneHeading) {
          const currentLocation = currentSceneHeading.toLowerCase().split(' - ')[0].trim();
          const newLocation = trimmedLine.toLowerCase().split(' - ')[0].trim();
          // Also check if the full scene heading matches (more accurate)
          const currentFull = currentSceneHeading.toLowerCase().trim();
          const newFull = trimmedLine.toLowerCase().trim();
          
          if (currentLocation === newLocation || currentFull === newFull) {
            console.log('[DirectorModePanel] Skipping duplicate scene heading:', trimmedLine);
            skippedDuplicateScene = true;
            continue; // Skip duplicate scene heading
          }
        }
        firstContentIndex = i;
        foundFirstScreenplayContent = true;
        break;
      } else if (/^[A-Z][A-Z\s#0-9']+$/.test(trimmedLine) && trimmedLine.length > 2 && trimmedLine.length < 50) {
        // Character name - but only if we haven't skipped a duplicate scene
        // (if we skipped a duplicate scene, we should find the next scene heading)
        if (!skippedDuplicateScene) {
          firstContentIndex = i;
          foundFirstScreenplayContent = true;
          break;
        }
      }
    }
    
    // If we found screenplay content, extract everything from that point forward
    if (firstContentIndex >= 0) {
      for (let i = firstContentIndex; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip explanation patterns (headers, etc.)
        let shouldSkip = false;
        for (const pattern of skipPatterns) {
          if (pattern.test(trimmedLine)) {
            shouldSkip = true;
            break;
          }
        }
        if (shouldSkip) continue;
        
        // Stop on clear explanation patterns (but only after we've found content)
        // These indicate the end of screenplay content and start of analysis
        if (foundFirstScreenplayContent) {
          let shouldStop = false;
          for (const pattern of stopPatterns) {
            if (pattern.test(trimmedLine)) {
              shouldStop = true;
              break;
            }
          }
          if (shouldStop) break;
        }
        
        // Include this line (it's screenplay content)
        screenplayLines.push(line);
      }
    }
  }
  
  cleaned = screenplayLines.join('\n');
  
  // 🔥 CRITICAL: Ensure 2 newlines between scenes (Fountain format standard)
  // Pattern: scene heading should have 2 newlines before it (except the first one)
  cleaned = cleaned.replace(/(\n)(INT\.|EXT\.|I\/E\.)/gi, (match, newline, heading) => {
    // Check if this is the first scene heading (at start of content)
    const beforeMatch = cleaned.substring(0, cleaned.indexOf(match));
    if (beforeMatch.trim().length === 0) {
      return heading; // First scene heading, no extra newline needed
    }
    // Check if there's already 2+ newlines before this scene heading
    const beforeNewlines = beforeMatch.match(/\n+$/);
    if (beforeNewlines && beforeNewlines[0].length >= 2) {
      return match; // Already has 2+ newlines, keep as is
    }
    // Add extra newline to make it 2 newlines total before scene heading
    return '\n\n' + heading;
  });
  
  // Remove duplicate "FADE OUT. THE END" patterns
  // Match patterns like "FADE OUT.\n\nTHE END" or "FADE OUT.\nTHE END" (with or without periods)
  cleaned = cleaned.replace(/(FADE OUT\.?\s*\n\s*THE END\.?\s*\n\s*)+/gi, ''); // Remove all instances
  // Also remove standalone "FADE OUT" or "THE END" at the end
  cleaned = cleaned.replace(/\n\s*(FADE OUT\.?|THE END\.?)\s*$/gi, '');
  
  // Whitespace normalization
  // 1. Trim trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // 2. Normalize multiple consecutive newlines to single newline (but preserve structure)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines (for scene breaks if needed)
  
  // 3. Trim leading/trailing whitespace from entire block
  cleaned = cleaned.trim();
  
  return cleaned;
}

export function DirectorModePanel({ editorContent, cursorPosition, onInsert }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext } = useChatContext();
  const { isScreenplayContent } = useChatMode();
  const { closeDrawer } = useDrawer();
  
  // Use model from ChatContext (set by UnifiedChatPanel's LLMModelSelector)
  const selectedModel = state.selectedModel || 'claude-sonnet-4-5-20250929';
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Generation length state: 'short' (5-10 lines), 'full' (15-30 lines), 'multiple' (with scene count)
  const [generationLength, setGenerationLength] = useState('full');
  // Scene count for multiple scenes mode (2, 3, 5, 10, etc.)
  const [sceneCount, setSceneCount] = useState(3);
  
  // Auto-scroll to bottom ONLY while streaming (so user can see new content)
  // Once streaming stops, don't auto-scroll (allows copy/paste without chat jumping)
  useEffect(() => {
    if (state.isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.isStreaming, state.streamingText]); // Only trigger when streaming state or streaming text changes
  
  // Detect scene context when drawer opens or editor content/cursor changes
  // If cursorPosition is undefined, try to detect from editor content (find last scene heading)
  useEffect(() => {
    if (editorContent) {
      // If cursor position is available, use it; otherwise, try to detect from content
      let detectedContext = null;
      
      if (cursorPosition !== undefined) {
        detectedContext = detectCurrentScene(editorContent, cursorPosition);
      } else {
        // Fallback: find the last scene heading in the content
        const lines = editorContent.split('\n');
        let lastSceneLine = -1;
        const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;
        
        for (let i = lines.length - 1; i >= 0; i--) {
          if (sceneHeadingRegex.test(lines[i])) {
            lastSceneLine = i;
            break;
          }
        }
        
        if (lastSceneLine >= 0) {
          // Calculate approximate cursor position at the last scene heading
          const approximateCursor = editorContent.split('\n').slice(0, lastSceneLine + 1).join('\n').length;
          detectedContext = detectCurrentScene(editorContent, approximateCursor);
        }
      }
      
      if (detectedContext) {
        setSceneContext({
          heading: detectedContext.heading,
          act: detectedContext.act,
          characters: detectedContext.characters,
          pageNumber: detectedContext.pageNumber,
          totalPages: detectedContext.totalPages
        });
        console.log('[DirectorModePanel] Scene context detected:', detectedContext.heading, 'cursorPosition:', cursorPosition);
      } else {
        console.warn('[DirectorModePanel] No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
      }
    }
  }, [editorContent, cursorPosition, setSceneContext]);
  
  // Director agent focuses on scene generation - no quick actions needed
  // User provides prompts and agent creates scenes/parts of scenes
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // ALWAYS detect current scene for context (re-detect on each message)
      let sceneContext = detectCurrentScene(editorContent, cursorPosition);
      
      // Fallback to state scene context if detection fails
      if (!sceneContext && state.sceneContext) {
        console.log('[DirectorModePanel] Using state scene context as fallback');
        // Reconstruct full scene context from state (we need content for the prompt)
        sceneContext = {
          heading: state.sceneContext.heading,
          act: state.sceneContext.act,
          characters: state.sceneContext.characters || [],
          pageNumber: state.sceneContext.pageNumber,
          totalPages: state.sceneContext.totalPages || 100,
          content: editorContent ? editorContent.substring(0, 1000) : ''
        };
      }
      
      // Update global scene context state (for banner display)
      if (sceneContext) {
        setSceneContext({
          heading: sceneContext.heading,
          act: sceneContext.act,
          characters: sceneContext.characters,
          pageNumber: sceneContext.pageNumber,
          totalPages: sceneContext.totalPages
        });
        console.log('[DirectorModePanel] Scene context:', sceneContext.heading, 'Act:', sceneContext.act, 'Characters:', sceneContext.characters?.length || 0);
      } else {
        console.warn('[DirectorModePanel] No scene context detected. editorContent:', !!editorContent, 'cursorPosition:', cursorPosition);
      }
      
      // 🔥 SIMPLIFIED: Make JSON optional - use when it works, but text cleaning is primary
      const modelSupportsNativeJSON = supportsNativeJSON(selectedModel);
      const useJSONFormat = modelSupportsNativeJSON; // Only use JSON for models that support it well
      
      // Build Director prompt using prompt builder (includes context and full scene instructions)
      // Pass generation length to control output size and useJSON flag
      console.log('[DirectorModePanel] Building prompt with generationLength:', generationLength, 'sceneCount:', sceneCount);
      const builtPrompt = buildDirectorPrompt(prompt, sceneContext, generationLength, useJSONFormat, sceneCount);
      
      // Build system prompt with Director Mode instructions - focused on thorough scene generation
      const lengthDescription = generationLength === 'short' 
        ? '5-10 lines' 
        : generationLength === 'multiple' 
        ? '2-3 complete scenes (15-30 lines each)'
        : '15-30 lines (full scenes)';
      
      // 🔥 PHASE 4: System prompt for JSON format - Matching Screenwriter agent format
      let systemPrompt = '';
      if (useJSONFormat) {
        systemPrompt = `You are a professional film director assistant helping a screenwriter create scenes. 

🚫 CRITICAL RULES - ABSOLUTELY FORBIDDEN:
- NO questions (no "Should...?", "Want me to...?", "Would you like...?", "Which direction...?", etc.)
- NO suggestions or alternatives
- NO analysis, critique, or feedback about the story
- NO lists of options or "Here are some ideas..."
- NO meta-commentary about writing or storytelling
- NO explanations about why something is good or bad

✅ YOU MUST:
- ALWAYS generate screenplay content in JSON format
- Take the user's request and IMMEDIATELY write the scene
- If user says "new story about a heist" → Write a scene about a museum heist
- If user says "two characters argue" → Write the argument scene
- NEVER ask what they want - just write it

You MUST respond with valid JSON only. No explanations, no markdown, no code blocks, just raw JSON with screenplay content.`;
      } else {
        systemPrompt = `You are a professional film director assistant helping a screenwriter create scenes.

DIRECTOR MODE - THOROUGH SCENE GENERATION:
- Generate ${lengthDescription} of screenplay content
- User provides basic info, you write COMPLETE, THOROUGH screenplay content
- This is the Director agent - be MORE comprehensive than the Screenwriter agent
- Include: action lines, dialogue (when appropriate), parentheticals, atmosphere, visual direction
- Write in Fountain screenplay format (CRITICAL: NO MARKDOWN)
- Character names in ALL CAPS (NOT bold/markdown like **SARAH**)
- Parentheticals in parentheses (NOT italics/markdown)
- Dialogue in plain text below character name
- NO markdown formatting (no **, no *, no ---, no markdown of any kind)
- Be thorough and detailed - generate MORE content, not less
- Context-aware: Use current scene, characters, and story context when available`;
      }
      
      if (sceneContext) {
        if (useJSONFormat) {
          systemPrompt += `\n\nCurrent Scene: ${sceneContext.heading} (for context only - do NOT include in output)`;
          if (sceneContext.characters && sceneContext.characters.length > 0) {
            systemPrompt += `\nCharacters: ${sceneContext.characters.join(', ')}`;
          }
        } else {
          systemPrompt += `\n\n[SCENE CONTEXT - Use this to provide contextual responses]\n`;
          systemPrompt += `Current Scene: ${sceneContext.heading}\n`;
          systemPrompt += `Act: ${sceneContext.act}\n`;
          systemPrompt += `Page: ${sceneContext.pageNumber} of ${sceneContext.totalPages}\n`;
          if (sceneContext.characters && sceneContext.characters.length > 0) {
            systemPrompt += `Characters in scene: ${sceneContext.characters.join(', ')}\n`;
          }
          systemPrompt += `\nScene Content:\n${sceneContext.content.substring(0, 1000)}${sceneContext.content.length > 1000 ? '...' : ''}\n`;
          systemPrompt += `\nIMPORTANT: Use this scene context to provide relevant, contextual direction. Reference the scene, characters, and content when appropriate.`;
        }
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'director'
      });
      
      // CRITICAL: Use EMPTY conversation history for Director agent
      // Director always generates content (never advice), so we want fresh context each time
      // This prevents previous messages from influencing scene generation
      const conversationHistory = [];
      
      console.log('[DirectorModePanel] API call params:', {
        useJSONFormat,
        modelSupportsNativeJSON,
        generationLength,
        conversationHistoryLength: conversationHistory.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: builtPrompt.length
      });
      
      // Call streaming AI API
      setStreaming(true, '');
      let accumulatedText = '';
      const maxRetries = 1; // Only retry once
      const retryState = { attempts: 0 };
      
      const makeApiCall = async (isRetry = false, retryErrors = []) => {
        const requestData = isRetry && useJSONFormat && retryErrors.length > 0
          ? {
              userPrompt: buildRetryPrompt(builtPrompt, retryErrors),
              systemPrompt: systemPrompt,
              desiredModelId: selectedModel,
              conversationHistory,
              sceneContext: sceneContext ? {
                heading: sceneContext.heading,
                act: sceneContext.act,
                characters: sceneContext.characters,
                pageNumber: sceneContext.pageNumber
              } : null
            }
          : {
              userPrompt: builtPrompt,
              systemPrompt: systemPrompt,
              desiredModelId: selectedModel,
              conversationHistory,
              sceneContext: sceneContext ? {
                heading: sceneContext.heading,
                act: sceneContext.act,
                characters: sceneContext.characters,
                pageNumber: sceneContext.pageNumber
              } : null
            };
        
        await api.chat.generateStream(
          requestData,
          // onChunk
          (chunk) => {
            accumulatedText += chunk;
            setStreaming(true, accumulatedText);
          },
          // onComplete
          async (fullContent) => {
            // 🔥 PHASE 4: Validate JSON for Director agent
            if (useJSONFormat) {
              console.log('[DirectorModePanel] Validating JSON response...');
              const contextBeforeCursor = sceneContext?.contextBeforeCursor || null;
              // Pass sceneCount for multiple scenes mode
              const validation = validateDirectorContent(fullContent, contextBeforeCursor, generationLength, generationLength === 'multiple' ? sceneCount : undefined);
              
              if (validation.valid) {
                console.log('[DirectorModePanel] ✅ JSON validation passed');
                console.log('[DirectorModePanel] Extracted content length:', validation.content?.length || 0);
                console.log('[DirectorModePanel] Extracted content preview:', validation.content?.substring(0, 500) || '(empty)');
                // Clean the JSON-extracted content to remove any headers that might have slipped through
                // (e.g., "NEW SCENES:" headers that the AI might have included in the JSON)
                const cleanedJsonContent = cleanFountainOutput(validation.content, sceneContext);
                console.log('[DirectorModePanel] Cleaned JSON content length:', cleanedJsonContent?.length || 0);
                // Use the cleaned content from JSON
                addMessage({
                  role: 'assistant',
                  content: cleanedJsonContent || validation.content, // Use cleaned content, fallback to original if cleaning fails
                  mode: 'director'
                });
                setTimeout(() => {
                  setStreaming(false, '');
                }, 100);
              } else {
                console.warn('[DirectorModePanel] ❌ JSON validation failed:', validation.errors);
                console.warn('[DirectorModePanel] Raw JSON:', validation.rawJson);
                
                // 🔥 SIMPLIFIED: Don't retry JSON - just fall back to text cleaning immediately
                // JSON is optional, text cleaning is the reliable primary path
                console.warn('[DirectorModePanel] JSON validation failed, using text cleaning (primary path)...');
                console.log('[DirectorModePanel] Full content length:', fullContent.length);
                console.log('[DirectorModePanel] Full content preview:', fullContent.substring(0, 1000));
                
                // 🔥 NEW: Detect if response is analysis/outline before cleaning
                const isAnalysisResponse = /(Screenplay Development|Based on your setup|SCENE \d+:|Key Beats|Story Integration Notes|Would you like me to|Setup & Discovery|The Chase & Escalating|The Capture)/i.test(fullContent);
                const hasSceneHeadings = /^(INT\.|EXT\.|I\/E\.)/im.test(fullContent);
                
                if (isAnalysisResponse && !hasSceneHeadings) {
                  console.error('[DirectorModePanel] ❌ Response is analysis/outline, not screenplay content');
                  toast.error('AI generated analysis instead of screenplay content. Please try rephrasing your request to be more direct (e.g., "Write three scenes about..." instead of "In the next three scenes...").');
                  addMessage({
                    role: 'assistant',
                    content: '❌ The AI generated analysis/outline instead of screenplay content. Please try rephrasing your request to be more direct. Example: "Write three scenes about a tiger chase" instead of "In the next three scenes a tiger...".',
                    mode: 'director'
                  });
                  setTimeout(() => {
                    setStreaming(false, '');
                  }, 100);
                  return; // Don't continue with cleaning
                }
                
                const cleanedContent = cleanFountainOutput(fullContent, sceneContext);
                console.log('[DirectorModePanel] Cleaned content length:', cleanedContent?.length || 0);
                console.log('[DirectorModePanel] Cleaned content preview:', cleanedContent?.substring(0, 500) || '(empty)');
                
                // 🔥 FIX: Don't use raw content as fallback - it contains analysis/outline
                // Only use cleaned content if it has substantial screenplay content
                if (!cleanedContent || cleanedContent.trim().length < 10) {
                  console.error('[DirectorModePanel] ❌ No valid screenplay content extracted from response');
                  console.error('[DirectorModePanel] Response appears to be analysis/outline, not screenplay content');
                  toast.error('No valid screenplay content found. The response may contain analysis instead of Fountain format content. Please try rephrasing your request to be more direct.');
                  addMessage({
                    role: 'assistant',
                    content: '❌ No valid screenplay content could be extracted. The response may contain analysis/outline instead of Fountain format content. Please try rephrasing your request to be more direct. Example: "Write three scenes about a tiger chase" instead of "In the next three scenes a tiger...".',
                    mode: 'director'
                  });
                } else {
                  // Use cleaned content (Fountain format only)
                  addMessage({
                    role: 'assistant',
                    content: cleanedContent,
                    mode: 'director'
                  });
                }
                setTimeout(() => {
                  setStreaming(false, '');
                }, 100);
              }
            } else {
              // Fallback: Original text format (clean and insert)
              const cleanedContent = cleanFountainOutput(fullContent);
              addMessage({
                role: 'assistant',
                content: cleanedContent || fullContent,
                mode: 'director'
              });
              setTimeout(() => {
                setStreaming(false, '');
              }, 100);
            }
          },
          // onError
          (error) => {
            console.error('Error in streaming:', error);
            setStreaming(false, '');
            toast.error(error.message || 'Failed to get AI response');
            addMessage({
              role: 'assistant',
              content: '❌ Sorry, I encountered an error. Please try again.',
              mode: 'director'
            });
          }
        );
      };
      
      await makeApiCall();
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setStreaming(false, '');
      toast.error(error.response?.data?.message || error.message || 'Failed to get AI response');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        mode: 'director'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Generation Length Controls - Always visible when messages exist */}
      {state.messages.filter(m => m.mode === 'director').length > 0 && (
        <div className="px-4 py-2 border-b border-base-300 bg-base-200/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-base-content/70">Length:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setGenerationLength('short')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors border ${
                  generationLength === 'short'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300'
                }`}
                title="5-10 lines"
              >
                Short
              </button>
              <button
                onClick={() => setGenerationLength('full')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors border ${
                  generationLength === 'full'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300'
                }`}
                title="15-30 lines"
              >
                Full
              </button>
              <button
                onClick={() => setGenerationLength('multiple')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors border ${
                  generationLength === 'multiple'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300'
                }`}
                title="2-3 scenes"
              >
                Multiple
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 chat-scroll-container px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'director')
          .map((message, index) => {
            const isUser = message.role === 'user';
            const directorMessages = state.messages.filter(m => m.mode === 'director');
            const isLastAssistantMessage = 
              !isUser && 
              index === directorMessages.length - 1;
            
            // Director always generates screenplay content, so always show insert button for last assistant message
            const showInsertButton = 
              !isUser && 
              isLastAssistantMessage && 
              message.content.trim().length > 0;
            
            return (
              <div
                key={index}
                className={`group flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <div className={`max-w-[85%] rounded-lg px-4 py-3 relative ${
                  isUser 
                    ? 'bg-cinema-red text-base-content' 
                    : 'bg-base-200 text-base-content'
                }`}>
                  <div className="flex items-start gap-2">
                    {!isUser && <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0 chat-message-content">
                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                    {isUser && <User className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  </div>
                  
                </div>
                
                {/* Insert Button */}
                {showInsertButton && onInsert && (
                  <button
                    onClick={() => {
                      console.log('[DirectorModePanel] Insert button clicked');
                      console.log('[DirectorModePanel] Message content length:', message.content?.length);
                      console.log('[DirectorModePanel] Message content preview:', message.content?.substring(0, 500));
                      
                      // Get current scene context for duplicate detection
                      const currentSceneContext = detectCurrentScene(editorContent, cursorPosition) || state.sceneContext;
                      
                      // Content should already be clean (extracted from JSON or cleaned on receipt)
                      // Clean again as safeguard to remove any headers like "NEW SCENES:" that might have slipped through
                      const cleanedContent = cleanFountainOutput(message.content, currentSceneContext);
                      
                      console.log('[DirectorModePanel] Cleaned content length:', cleanedContent?.length || 0);
                      console.log('[DirectorModePanel] Cleaned content preview:', cleanedContent?.substring(0, 500) || '(empty)');
                      console.log('[DirectorModePanel] Full cleaned content:', cleanedContent);
                      
                      // Validate content before inserting
                      if (!cleanedContent || cleanedContent.trim().length < 10) {
                        console.error('[DirectorModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                        console.error('[DirectorModePanel] Original content preview:', message.content?.substring(0, 500));
                        console.error('[DirectorModePanel] Original content length:', message.content?.length);
                        console.error('[DirectorModePanel] Cleaned content:', cleanedContent);
                        console.error('[DirectorModePanel] Cleaned content length:', cleanedContent?.length);
                        
                        // 🔥 FIX: Don't use raw content as fallback - it likely contains analysis
                        // Show error message instead
                        toast.error('No valid screenplay content found. The response may contain analysis instead of Fountain format content. Please try again with a more direct request.');
                        return; // Don't insert empty or invalid content
                      }
                      
                      console.log('[DirectorModePanel] ✅ Inserting content, length:', cleanedContent.length);
                      onInsert(cleanedContent);
                      closeDrawer();
                    }}
                    className="btn btn-xs btn-outline gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Insert into script
                  </button>
                )}
              </div>
            );
          })}
        
        {/* Streaming text - show insert button while streaming AND after streaming completes */}
        {state.streamingText && state.streamingText.trim().length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="max-w-[85%] rounded-lg px-4 py-3 bg-base-200 text-base-content">
              <div className="flex items-start gap-2">
                <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 chat-message-content">
                  <MarkdownRenderer content={state.streamingText} />
                  {state.isStreaming && (
                    <span className="inline-block w-0.5 h-5 ml-1 bg-purple-500 animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Insert button for streaming text (Director always generates screenplay content) */}
            {onInsert && (
              <button
                onClick={() => {
                  // 🔥 PHASE 4: Validate JSON for streaming text (if JSON format is enabled)
                  const useJSONFormat = true; // Director agent always uses JSON
                  let contentToInsert = state.streamingText;
                  
                  if (useJSONFormat) {
                    const contextBeforeCursor = detectCurrentScene(editorContent, cursorPosition)?.contextBeforeCursor || null;
                    const validation = validateDirectorContent(state.streamingText, contextBeforeCursor, generationLength, generationLength === 'multiple' ? sceneCount : undefined);
                    
                    if (validation.valid) {
                      console.log('[DirectorModePanel] ✅ JSON validation passed for streaming text');
                      contentToInsert = validation.content;
                    } else {
                      console.warn('[DirectorModePanel] ❌ JSON validation failed for streaming text, falling back to cleaning');
                      // Fallback to cleaning if JSON validation fails
                      // Get current scene context for duplicate detection
                      const currentSceneContext = detectCurrentScene(editorContent, cursorPosition) || state.sceneContext;
                      contentToInsert = cleanFountainOutput(state.streamingText, currentSceneContext);
                    }
                  } else {
                    // Fallback: Clean the content before inserting (strip markdown, remove notes)
                    // Get current scene context for duplicate detection
                    const currentSceneContext = detectCurrentScene(editorContent, cursorPosition) || state.sceneContext;
                    contentToInsert = cleanFountainOutput(state.streamingText, currentSceneContext);
                  }
                  
                  // Validate content before inserting
                  if (!contentToInsert || contentToInsert.trim().length < 10) {
                    console.error('[DirectorModePanel] ❌ Cannot insert: content is empty or too short');
                    console.error('[DirectorModePanel] Original content preview:', state.streamingText?.substring(0, 500));
                    console.error('[DirectorModePanel] Original content length:', state.streamingText?.length);
                    console.error('[DirectorModePanel] Final content:', contentToInsert);
                    console.error('[DirectorModePanel] Final content length:', contentToInsert?.length);
                    toast.error('No valid screenplay content found. The response may contain analysis instead of Fountain format content. Please wait for the response to complete or try again.');
                    return; // Don't insert empty or invalid content
                  }
                  
                  onInsert(contentToInsert);
                  closeDrawer();
                }}
                className="btn btn-xs btn-outline gap-2 self-start"
              >
                <FileText className="h-4 w-4" />
                Insert into script
              </button>
            )}
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Empty state - Simple prompt for scene generation */}
        {state.messages.filter(m => m.mode === 'director').length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="max-w-md text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 text-pink-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-base-content mb-2">Director Agent</h3>
                <p className="text-sm text-base-content/70 mb-4">
                  <strong>Purpose:</strong> Creates NEW scenes that continue your story forward. Does NOT continue the current scene (use Screenwriter agent for that).<br/>
                  <strong>Single Scene Mode:</strong> Creates 1 NEW scene (5-30 lines) with its own scene heading that comes AFTER your current scene.<br/>
                  <strong>Multiple Scenes Mode:</strong> Creates 2-10 NEW scenes, each with its own scene heading, that come AFTER your current scene.
                </p>
                <div className="text-xs text-base-content/50 space-y-1 mb-4">
                  <p>Try: "Write a full confrontation scene between Sarah and John"</p>
                  <p>or "Generate dialogue for this moment"</p>
                  <p>or "Create a complete action sequence"</p>
                </div>
                
                {/* Generation Length Buttons */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-medium text-base-content/70 mb-2">Generation Length:</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => setGenerationLength('short')}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors border ${
                        generationLength === 'short'
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300'
                      }`}
                    >
                      📝 Short Scene (5-10 lines)
                    </button>
                    <button
                      onClick={() => setGenerationLength('full')}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors border ${
                        generationLength === 'full'
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300'
                      }`}
                    >
                      🎬 Full Scene (15-30 lines)
                    </button>
                    <button
                      onClick={() => setGenerationLength('multiple')}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors border ${
                        generationLength === 'multiple'
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300'
                      }`}
                    >
                      🎭 Multiple Scenes
                    </button>
                  </div>
                  {generationLength === 'multiple' && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-xs font-medium text-base-content/70">Number of scenes:</span>
                      <select
                        value={sceneCount}
                        onChange={(e) => setSceneCount(parseInt(e.target.value))}
                        className="px-2 py-1 text-xs rounded-md border border-base-300 bg-base-100 text-base-content focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                        <option value={10}>10</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer with New Chat button */}
      <div className="px-4 py-2 border-t border-base-300 flex items-center justify-between">
        <p className="text-xs text-base-content/60">🎬 Generate complete scenes with dialogue, action, and cinematic direction</p>
        {state.messages.filter(m => m.mode === 'director').length > 0 && (
          <button
            onClick={() => clearMessagesForMode('director')}
            className="btn btn-xs btn-ghost gap-1.5 text-base-content/60 hover:text-base-content"
            title="Start new chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs">New Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}

