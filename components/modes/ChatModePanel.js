'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useDrawer } from '@/contexts/DrawerContext';
import { FileText, Sparkles, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt, extractSelectionContext } from '@/utils/sceneDetection';
import { buildChatContentPrompt, buildChatAdvicePrompt, detectContentRequest, buildRewritePrompt } from '@/utils/promptBuilders';
import { validateScreenplayContent, supportsNativeJSON, buildRetryPrompt } from '@/utils/jsonValidator';
import toast from 'react-hot-toast';

// Helper to clean AI output: strip markdown and remove writing notes
// Also removes duplicate content that matches context before cursor
function cleanFountainOutput(text, contextBeforeCursor = null) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove markdown formatting
  cleaned = cleaned
    // Remove bold markdown (**text** or __text__)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic markdown (*text* or _text_) - use word boundaries to avoid issues
    .replace(/\b\*([^*\n]+)\*\b/g, '$1')
    .replace(/\b_([^_\n]+)_\b/g, '$1')
    // Remove horizontal rules (---)
    .replace(/^---+$/gm, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove markdown code blocks
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '');
  
  // Remove common AI response patterns that aren't screenplay content
  const unwantedPatterns = [
    // Remove "Here's..." or "I'll write..." intros
    /^(Here's|Here is|I'll|I will|Let me|This version|Here's the|This is|Here are|Here is the|I've|I have|Perfect|Great|Excellent|Good|Nice|Sure|Okay|OK)[\s:]*/i,
    // Remove "Great emotional note" or similar praise
    /Great (emotional|physical|character|story|writing|detail|note|suggestion|idea).*$/i,
    // Remove "SCREENWRITING NOTE:" or "NOTE:" sections (case insensitive, multiline)
    /(SCREENWRITING\s+)?NOTE:.*$/is,
    // Remove "REVISION" or "REVISED SCENE" headers (with or without markdown, with or without colon)
    /^#?\s*REVISION\s*:?\s*$/im,
    /^#?\s*REVISED\s+SCENE\s*:?\s*$/im,
    // Remove "ALTERNATIVE OPTIONS:" sections
    /ALTERNATIVE OPTIONS?:.*$/is,
    // Remove "Option 1:", "Option 2:", etc.
    /Option \d+[:\-].*$/im,
    // Remove "Which direction..." questions
    /Which direction.*$/is,
    // Remove "This version:" explanations
    /This version:.*$/is,
    // Remove "What comes next?" questions
    /What comes next\?.*$/is,
    // Remove "What feeling..." questions
    /What feeling.*$/is,
    // Remove "Would you like..." questions
    /Would you like.*$/is,
    // Remove "Here are some suggestions:" patterns
    /Here are (some|a few) (suggestions|options|ideas|ways|things).*$/is,
  // Remove writing notes section (everything after "---" or "WRITING NOTE" or similar)
    /---\s*\n\s*\*\*WRITING NOTE\*\*.*$/is,
    /---\s*\n\s*WRITING NOTE.*$/is,
    /\*\*WRITING NOTE\*\*.*$/is,
    /WRITING NOTE.*$/is,
    /---\s*\n\s*\*\*NOTE\*\*.*$/is,
    /---\s*\n\s*NOTE.*$/is,
    /\*\*NOTE\*\*.*$/is,
    /^---\s*$/m,
    // Remove explanations that start with "This version:" or "This Sarah is..."
    /This (version|Sarah|character|scene|moment).*$/is,
    // Remove "Works perfectly for..." explanations
    /Works perfectly.*$/is,
    // Remove "What happens next?" questions
    /What happens next\?.*$/is,
    // Remove "For your scene" or "For this scene" explanations
    /For (your|this) scene.*$/is,
    // Remove "Recommendation:" patterns
    /Recommendation:.*$/is,
    // Remove "Current line:" patterns
    /Current line:.*$/is,
    // Remove "Enhanced options:" patterns
    /Enhanced options?:.*$/is
  ];
  
  for (const pattern of unwantedPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      cleaned = cleaned.substring(0, match.index).trim();
      break;
    }
  }
  
    // Remove lines that are clearly explanations (contain "This", "That", "Which", etc. at start)
    const lines = cleaned.split('\n');
    const screenplayLines = [];
    let foundFirstScreenplayContent = false;
    let sceneHeadingFound = false; // Track if we've seen a scene heading (means full scene was generated)
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines at the start
      if (!foundFirstScreenplayContent && !line) continue;
      
      // If line starts with "NOTE:" or explanation words, stop here
      if (/^NOTE:/i.test(line)) {
        break;
      }
      
      // CRITICAL: Stop on meta-commentary patterns (analysis, explanations about the story)
      // Pattern: "This [verb] [something]" - indicates analysis/explanation, not screenplay content
      if (/^\*?\s*This\s+(adds|creates|raises|builds|establishes|introduces|sets up|develops|enhances|improves|strengthens|deepens|expands|explores|reveals|highlights|emphasizes|underscores|reinforces|supports|connects|links|ties|bridges|transitions|moves|shifts|changes|transforms|evolves|progresses|advances|drives|propels|pushes|pulls|draws|brings|takes|leads|guides|directs|steers|navigates|maneuvers|positions|places|situates|locates|anchors|grounds|roots|bases|founds|sets|puts|makes|turns|converts|becomes)/i.test(line)) {
        break; // Stop on meta-commentary like "This adds immediate digital threat..."
      }
      
      // Also stop on lines that start with asterisk (markdown emphasis) followed by "This"
      if (/^\*\s*This\s+/i.test(line)) {
        break;
      }
      
      // If line starts with explanation words, stop here (but allow short lines that might be dialogue)
      // IMPORTANT: Don't stop on lines that are clearly dialogue (short, or follow a character name)
      const isLikelyDialogue = line.length < 50 && (
        /^[A-Z][A-Z\s]+$/.test(lines[i-1]?.trim() || '') || // Previous line was a character name
        /^\(/.test(line) || // Starts with parenthetical
        /[!?.]$/.test(line) // Ends with punctuation (dialogue markers)
      );
      
      // Stop on questions (especially at the end of responses)
      if (/\?.*$/.test(line) && /(Should|Want|Would|Do you|Can you|Shall|Want me|keep going|continue|next)/i.test(line)) {
        break; // Stop on questions like "Should the footsteps enter, or pass by? Want me to keep going?"
      }
      
      if (!isLikelyDialogue && /^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure)/i.test(line) && 
          !/^(INT\.|EXT\.|I\/E\.)/i.test(line) && // But allow scene headings
          !/^[A-Z][A-Z\s]+$/.test(line) && // But allow character names in ALL CAPS
          line.length > 15) { // Only if it's a longer explanation
        break;
      }
      
      // Skip "REVISED SCENE:" or "REVISION:" headers (with or without colon, with or without markdown)
      if (/^#?\s*REVISED\s+SCENE\s*:?\s*$/i.test(line) || /^#?\s*REVISION\s*:?\s*$/i.test(line)) {
        continue; // Skip revision headers
      }
      
      // Skip markdown headers like "# REVISED SCENE" (must start with #, have space, then REVISED/REVISION)
      // This won't match character names like "REPORTER #1" because # is not at the start
      if (/^#+\s+(REVISED|REVISION)/i.test(line)) {
        continue; // Skip markdown headers
      }
      
      // If we find a scene heading, skip it AND mark that a full scene was generated (we don't want this)
      if (/^(INT\.|EXT\.|I\/E\.|#\s*INT\.|#\s*EXT\.)/i.test(line)) {
        sceneHeadingFound = true;
        continue; // Skip scene headings (including markdown headers like "# INT. NEWS OFFICE - NIGHT")
      }
      
      // If we've seen a scene heading, we're in a full scene - stop processing (user only wanted 1-5 lines)
      if (sceneHeadingFound) {
        break; // Don't include content from full scenes
      }
      
      // 🔥 NEW: Detect and remove duplicate content that matches context before cursor
      // This prevents AI from repeating content that already exists
      if (contextBeforeCursor) {
        const contextLines = contextBeforeCursor.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const currentLineTrimmed = line.trim();
        
        // Check if this line matches any line from context before cursor (exact match)
        // This is best practice: exact match first (simple, reliable, no false positives)
        const isDuplicate = contextLines.some(contextLine => {
          // Exact match (case-insensitive, ignoring extra whitespace)
          const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ').trim();
          const normalizedCurrent = currentLineTrimmed.toLowerCase().replace(/\s+/g, ' ').trim();
          
          // Match if lines are identical (allowing for minor whitespace differences)
          if (normalizedContext === normalizedCurrent) {
            return true;
          }
          
          // Also check if current line is a substring of context line (handles partial matches)
          // This catches cases where AI repeats a phrase that's part of a longer line
          if (normalizedContext.includes(normalizedCurrent) && normalizedCurrent.length > 10) {
            return true;
          }
          
          return false;
        });
        
        if (isDuplicate) {
          continue; // Skip duplicate lines
        }
      }
      
      // If we find a character name in ALL CAPS, we're in screenplay content
      if (/^[A-Z][A-Z\s#0-9']+$/.test(line) && line.length > 2) {
        foundFirstScreenplayContent = true;
      }
      
      // If we've found screenplay content, include this line
      if (foundFirstScreenplayContent || line.length > 0) {
        screenplayLines.push(lines[i]);
      }
    }
  
  cleaned = screenplayLines.join('\n');
  
  // Whitespace normalization
  // 1. Trim trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // 2. Normalize multiple consecutive newlines to single newline (but preserve structure)
  // This ensures consistent spacing without losing line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines (for scene breaks if needed)
  
  // 3. Trim leading/trailing whitespace from entire block
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Helper to parse 3 rewrite options from AI response
function parseRewriteOptions(text) {
  if (!text) return null;
  
  // Look for "Option 1", "Option 2", "Option 3" patterns
  const optionPattern = /Option\s+(\d+)\s*[-:]?\s*([^\n]*)\n([\s\S]*?)(?=Option\s+\d+|$)/gi;
  const options = [];
  let match;
  
  while ((match = optionPattern.exec(text)) !== null && options.length < 3) {
    const optionNum = parseInt(match[1]);
    const description = match[2].trim();
    let content = match[3].trim();
    
    // Clean the content (remove markdown, etc.)
    content = cleanFountainOutput(content);
    
    if (content) {
      options.push({
        number: optionNum,
        description: description || `Option ${optionNum}`,
        content: content
      });
    }
  }
  
  // If we found 3 options, return them
  if (options.length === 3) {
    return options;
  }
  
  // Fallback: try to split by "Option 1", "Option 2", "Option 3" more flexibly
  const lines = text.split('\n');
  const foundOptions = [];
  let currentOption = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const optionMatch = line.match(/Option\s+(\d+)\s*[-:]?\s*(.*)/i);
    
    if (optionMatch) {
      // Save previous option if exists
      if (currentOption && currentOption.content.trim()) {
        foundOptions.push(currentOption);
      }
      
      // Start new option
      currentOption = {
        number: parseInt(optionMatch[1]),
        description: optionMatch[2].trim() || `Option ${optionMatch[1]}`,
        content: ''
      };
    } else if (currentOption) {
      // Add line to current option
      currentOption.content += (currentOption.content ? '\n' : '') + line;
    }
  }
  
  // Add last option
  if (currentOption && currentOption.content.trim()) {
    foundOptions.push(currentOption);
  }
  
  // Clean each option's content
  foundOptions.forEach(opt => {
    opt.content = cleanFountainOutput(opt.content);
  });
  
  return foundOptions.length >= 2 ? foundOptions : null; // Return if we found at least 2 options
}

export function ChatModePanel({ onInsert, onWorkflowComplete, editorContent, cursorPosition }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext, setSelectedTextContext } = useChatContext();
  const { closeDrawer } = useDrawer();
  const {
    activeWorkflow,
    workflowCompletionData,
    clearWorkflowCompletion,
    isScreenplayContent
  } = useChatMode();
  
  // Model selection for AI chat
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom ONLY while streaming (so user can see new content)
  // Once streaming stops, don't auto-scroll (allows copy/paste without chat jumping)
  useEffect(() => {
    if (state.isStreaming) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.isStreaming, state.streamingText]); // Only trigger when streaming state or streaming text changes
  
  // Auto-send rewrite request when selected text context is set (but no messages yet)
  const hasAutoSentRef = useRef(false);
  useEffect(() => {
    // If we have selected text context but no messages and no input, auto-generate 3 options
    if (state.selectedTextContext && 
        state.messages.filter(m => m.mode === 'chat').length === 0 && 
        !state.input && 
        !isSending && 
        !hasAutoSentRef.current) {
      console.log('[ChatModePanel] Auto-generating 3 rewrite options for selected text');
        hasAutoSentRef.current = true;
      
      // Auto-send empty string to trigger generic rewrite (will generate 3 options)
      setTimeout(() => {
        handleSend(''); // Empty string triggers generic rewrite with 3 options
        // Reset flag after sending completes
          setTimeout(() => {
            hasAutoSentRef.current = false;
        }, 3000);
      }, 300);
    }
  }, [state.selectedTextContext, state.messages, state.input, isSending]);
  
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
        console.log('[ChatModePanel] Scene context detected:', detectedContext.heading, 'cursorPosition:', cursorPosition);
      } else {
        console.warn('[ChatModePanel] No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
      }
    }
  }, [editorContent, cursorPosition, setSceneContext]);
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    // Allow empty prompt for auto-rewrite (will generate 3 options)
    if (isSending) return;
    if (!prompt || !prompt.trim()) {
      // If empty prompt and in rewrite mode, use generic rewrite request
      if (state.selectedTextContext) {
        prompt = ''; // Will trigger generic rewrite in buildRewritePrompt
      } else {
        return; // Don't send empty prompts in regular mode
      }
    }
    
    setIsSending(true);
    
    try {
      // ALWAYS detect current scene for context (re-detect on each message)
      let sceneContext = detectCurrentScene(editorContent, cursorPosition);
      
      // Fallback to state scene context if detection fails
      if (!sceneContext && state.sceneContext) {
        console.log('[ChatModePanel] Using state scene context as fallback');
        // Try to extract actual scene content from editorContent based on scene heading
        let sceneContent = '';
        if (editorContent && state.sceneContext.heading) {
          const lines = editorContent.split('\n');
          const headingIndex = lines.findIndex(line => 
            line.trim().toUpperCase().includes(state.sceneContext.heading.toUpperCase())
          );
          if (headingIndex >= 0) {
            // Extract content from this scene heading to the next scene heading (or end)
            const sceneLines = [];
            for (let i = headingIndex; i < lines.length; i++) {
              const line = lines[i];
              // Stop at next scene heading (but not the current one)
              if (i > headingIndex && /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i.test(line)) {
                break;
              }
              sceneLines.push(line);
            }
            sceneContent = sceneLines.join('\n').substring(0, 1000);
          } else {
            // Fallback to first 1000 chars if scene heading not found
            sceneContent = editorContent.substring(0, 1000);
          }
        }
        // Reconstruct full scene context from state (we need content for the prompt)
        sceneContext = {
          heading: state.sceneContext.heading,
          act: state.sceneContext.act,
          characters: state.sceneContext.characters || [],
          pageNumber: state.sceneContext.pageNumber,
          totalPages: state.sceneContext.totalPages || 100,
          content: sceneContent
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
        console.log('[ChatModePanel] Scene context:', sceneContext.heading, 'Act:', sceneContext.act, 'Characters:', sceneContext.characters?.length || 0);
      } else {
        console.warn('[ChatModePanel] No scene context detected. editorContent:', !!editorContent, 'cursorPosition:', cursorPosition);
      }
      
      // 🔥 CRITICAL: Rewrite is now handled by RewriteModal, NOT the chat window
      // The chat window is ONLY for content generation (continuing the scene) or advice
      // If selectedTextContext exists, clear it and use regular content generation
      if (state.selectedTextContext) {
        console.warn('[ChatModePanel] selectedTextContext detected in chat window - rewrite should use RewriteModal, clearing context');
        // Clear the selected text context - rewrite should be done via modal
        setSelectedTextContext(null, null);
      }
      
      // REGULAR MODE: Detect if this is content generation vs advice request
      let builtPrompt;
      let systemPrompt;
      const isContentRequest = detectContentRequest(prompt);
      
      // DEBUG: Log detection result
      console.log('[ChatModePanel] Content detection:', {
        prompt,
        isContentRequest,
        hasActionVerb: /explodes|enters|leaves|says|does|runs|walks|sees|hears|finds|comes|goes|arrives|exits|sits|stands|turns|looks|grabs|takes|opens|closes|attacks|fights|dies|falls|jumps|screams|whispers|shouts|morphs|transforms|becomes|changes|appears|disappears|moves|flies|crashes|breaks|shatters/i.test(prompt),
        isNarrativeDescription: /^(her|his|the|a|an)\s+(monitor|tv|phone|door|window|car|computer|screen|robot|desk|wall|floor|ceiling|room)/i.test(prompt)
      });
      
      // 🔥 PHASE 4: Use JSON format for content requests (structured output)
      // Check if model supports native JSON (for OpenAI models)
      const useJSONFormat = isContentRequest; // Always use JSON for content requests
      const modelSupportsNativeJSON = supportsNativeJSON(selectedModel);
      
      // Build appropriate prompt using prompt builders
      builtPrompt = isContentRequest 
        ? buildChatContentPrompt(prompt, sceneContext, useJSONFormat) // Pass useJSON flag
        : buildChatAdvicePrompt(prompt, sceneContext);
      
      // Build system prompt - Simple for content, permissive for advice
      if (isContentRequest) {
        // 🔥 PHASE 4: System prompt for JSON format
        if (useJSONFormat) {
          systemPrompt = `You are a professional screenwriting assistant. You MUST respond with valid JSON only. No explanations, no markdown, just JSON.`;
        } else {
          // Fallback: Original text format
          systemPrompt = `You are a professional screenwriting assistant. The user wants you to WRITE SCREENPLAY CONTENT, not analyze or critique. Write only the screenplay content they requested - no explanations, no suggestions, no alternatives.`;
        }
        
        // Add scene context if available (minimal, just for context)
        if (sceneContext) {
          systemPrompt += `\n\nCurrent Scene: ${sceneContext.heading} (for context only - do NOT include in output)`;
          if (sceneContext.characters && sceneContext.characters.length > 0) {
            systemPrompt += `\nCharacters: ${sceneContext.characters.join(', ')}`;
          }
        }
      } else {
        // Permissive system prompt for advice/discussion
        systemPrompt = `You are a professional screenwriting assistant helping a screenwriter with their screenplay.`;
        
        // Add scene context if available
        if (sceneContext) {
          systemPrompt += `\n\n[SCENE CONTEXT - Use this to provide contextual responses]\n`;
          systemPrompt += `Current Scene: ${sceneContext.heading}\n`;
          systemPrompt += `Act: ${sceneContext.act}\n`;
          systemPrompt += `Page: ${sceneContext.pageNumber} of ${sceneContext.totalPages}\n`;
          if (sceneContext.characters && sceneContext.characters.length > 0) {
            systemPrompt += `Characters in scene: ${sceneContext.characters.join(', ')}\n`;
          }
          systemPrompt += `\nScene Content:\n${sceneContext.content.substring(0, 1000)}${sceneContext.content.length > 1000 ? '...' : ''}\n`;
          systemPrompt += `\nIMPORTANT: Use this scene context to provide relevant, contextual responses. Reference the scene, characters, and content when appropriate.`;
        }
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'chat'
      });
      
      // Build conversation history
      // CRITICAL: For content requests, use EMPTY history to prevent AI from continuing in advice mode
      // Only include history for advice/discussion requests
      let conversationHistory = [];
      if (!isContentRequest) {
        // For advice requests, include last 10 messages for context
      const chatMessages = state.messages.filter(m => m.mode === 'chat').slice(-10);
        conversationHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      }
      // For content requests, conversationHistory stays empty (fresh conversation)
      
      console.log('[ChatModePanel] API call params:', {
        isContentRequest,
        useJSONFormat,
        modelSupportsNativeJSON,
        conversationHistoryLength: conversationHistory.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: builtPrompt.length
      });
      
      // 🔥 PHASE 4: Prepare API request with JSON format support
      const apiRequestData = {
          userPrompt: builtPrompt, // Use built prompt instead of raw prompt
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
      
      // 🔥 PHASE 4: Note: Backend doesn't support responseFormat yet
      // For now, we use prompt engineering (works for all models)
      // TODO: Add backend support for responseFormat when available
      if (isContentRequest && useJSONFormat && modelSupportsNativeJSON) {
        console.log('[ChatModePanel] Model supports native JSON, but backend support pending. Using prompt engineering.');
        // apiRequestData.responseFormat = { type: 'json_object' }; // Will work when backend supports it
      }
      
      // Call streaming AI API
      setStreaming(true, '');
      let accumulatedText = '';
      const maxRetries = 1; // Only retry once
      
      // Use a ref-like object to track retry attempts across async callbacks
      const retryState = { attempts: 0 };
      
      const makeApiCall = async (isRetry = false, retryErrors = []) => {
        const requestData = isRetry && isContentRequest && useJSONFormat && retryErrors.length > 0
          ? {
              ...apiRequestData,
              userPrompt: buildRetryPrompt(builtPrompt, retryErrors)
            }
          : apiRequestData;
        
        await api.chat.generateStream(
          requestData,
        // onChunk
        (chunk) => {
          accumulatedText += chunk;
          setStreaming(true, accumulatedText);
        },
        // onComplete
        async (fullContent) => {
          // 🔥 PHASE 4: Validate JSON for content requests
          if (isContentRequest && useJSONFormat) {
            console.log('[ChatModePanel] Validating JSON response...');
            const validation = validateScreenplayContent(fullContent, sceneContext?.contextBeforeCursor || null);
            
            if (validation.valid) {
              console.log('[ChatModePanel] ✅ JSON validation passed');
              addMessage({
                role: 'assistant',
                content: validation.content,
                mode: 'chat'
              });
              setTimeout(() => {
                setStreaming(false, '');
              }, 100);
            } else {
              console.warn('[ChatModePanel] ❌ JSON validation failed:', validation.errors);
              console.warn('[ChatModePanel] Raw JSON:', validation.rawJson);
              
              // Retry with more explicit instructions if we haven't retried yet
              if (retryState.attempts < maxRetries) {
                retryState.attempts++;
                console.log('[ChatModePanel] Retrying with more explicit JSON instructions... (attempt', retryState.attempts, 'of', maxRetries, ')');
                setStreaming(true, '');
                accumulatedText = '';
                await makeApiCall(true, validation.errors);
                return; // Don't continue with error handling
              }
              
              // If retry failed or we've already retried, fallback to text cleaning
              console.warn('[ChatModePanel] Falling back to text cleaning...');
              const cleanedContent = cleanFountainOutput(fullContent, sceneContext?.contextBeforeCursor || null);
              
              if (!cleanedContent || cleanedContent.trim().length < 3) {
                toast.error('Failed to generate valid content. Please try again.');
                addMessage({
                  role: 'assistant',
                  content: '❌ Sorry, I encountered an error generating content. Please try again.',
                  mode: 'chat'
                });
              } else {
                addMessage({
                  role: 'assistant',
                  content: cleanedContent,
                  mode: 'chat'
                });
              }
              setTimeout(() => {
                setStreaming(false, '');
              }, 100);
            }
          } else {
            // For advice requests or fallback: use text cleaning
            const cleanedContent = cleanFountainOutput(fullContent, sceneContext?.contextBeforeCursor || null);
            
            // 🔥 PHASE 1 FIX: Validate content before adding message
            if (!cleanedContent || cleanedContent.trim().length < 3) {
              console.warn('[ChatModePanel] ⚠️ Cleaned content is empty or too short. Original length:', fullContent?.length, 'Cleaned length:', cleanedContent?.length);
              console.warn('[ChatModePanel] Original content preview:', fullContent?.substring(0, 200));
              const fallbackContent = fullContent?.trim() || 'No content generated';
              addMessage({
                role: 'assistant',
                content: fallbackContent,
                mode: 'chat'
              });
            } else {
          addMessage({
            role: 'assistant',
                content: cleanedContent,
            mode: 'chat'
          });
            }
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
            mode: 'chat'
          });
        }
      );
      };
      
      // Make the initial API call
      await makeApiCall(false);
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setStreaming(false, '');
      toast.error(error.response?.data?.message || error.message || 'Failed to get AI response');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        mode: 'chat'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleInsertAndCreate = () => {
    if (!workflowCompletionData || !onWorkflowComplete) return;
    
    console.log('[ChatModePanel] Insert & Create clicked:', workflowCompletionData);
    
    // Trigger parent callback
    onWorkflowComplete(workflowCompletionData.type, workflowCompletionData.parsedData);
    
    // Clear completion data
    clearWorkflowCompletion();
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workflow Completion Banner */}
      {workflowCompletionData && (
        <div className="flex items-center justify-between px-4 py-3 bg-base-300 border-b border-cinema-red/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cinema-gold" />
            <span className="text-base-content">
              {workflowCompletionData.type.charAt(0).toUpperCase() + workflowCompletionData.type.slice(1)} profile complete!
            </span>
          </div>
          <button
            onClick={handleInsertAndCreate}
            className="btn btn-sm btn-primary"
          >
            Insert & Create
          </button>
        </div>
      )}
      
      {/* Active Workflow Indicator */}
      {activeWorkflow && (
        <div className="px-4 py-2 border-b border-base-300 flex items-center gap-2 bg-base-200">
          <div className="w-2 h-2 rounded-full animate-pulse bg-cinema-blue" />
          <span className="text-sm text-base-content/80">
            AI Interview in progress: {activeWorkflow.type.charAt(0).toUpperCase() + activeWorkflow.type.slice(1)} creation
          </span>
        </div>
      )}
      
      {/* Quick Action Buttons for Rewrite Mode */}
      {state.selectedTextContext && state.messages.filter(m => m.mode === 'chat').length === 0 && !state.input && (
        <div className="px-4 py-3 border-b border-base-300 bg-base-200/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-medium text-base-content/70 mb-2">Quick Actions:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSend('Make this more concise')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                ✂️ Make Concise
              </button>
              <button
                onClick={() => handleSend('Expand this with more detail')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                📝 Expand Detail
              </button>
              <button
                onClick={() => handleSend('Make this more dramatic and intense')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                🎭 More Dramatic
              </button>
              <button
                onClick={() => handleSend('Improve the dialogue to sound more natural')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                💬 Polish Dialogue
              </button>
              <button
                onClick={() => handleSend('Fix any grammar or formatting issues')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                ✅ Fix Grammar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instruction Messages */}
      {state.messages.filter(m => m.mode === 'chat').length === 0 && !state.input && !state.selectedTextContext && (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-2">Screenwriter Agent</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Your writing partner for ideas, advice, and short snippets. Perfect for brainstorming, getting feedback, and quick fixes.
              </p>
              <div className="text-xs text-base-content/50 space-y-1 mb-3">
                <p>Try: "How do I make this better?"</p>
                <p>or "Write one line where Sarah enters"</p>
                <p>or "What's the problem with this structure?"</p>
              </div>
              <div className="text-xs text-base-content/40 pt-3 border-t border-base-300">
                <p>💡 <strong>Tip:</strong> Select any text in your screenplay to enable <strong>Rewrite mode</strong> with quick action buttons</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Messages Area - ChatGPT/Claude Style */}
      <div className="flex-1 chat-scroll-container">
        {state.messages
          .filter(m => m.mode === 'chat')
          .map((message, index) => {
            const isUser = message.role === 'user';
            const isLastAssistantMessage = 
              !isUser && 
              index === state.messages.filter(m => m.mode === 'chat').length - 1;
            
            // Show insert button for screenplay content
            // Also check if user's previous message was a content request (not a question)
            const previousUserMessage = state.messages
              .filter(m => m.mode === 'chat')
              .slice(0, index + 1)
              .reverse()
              .find(m => m.role === 'user');
            const wasContentRequest = previousUserMessage ? detectContentRequest(previousUserMessage.content) : false;
            
            const showInsertButton = 
              !isUser && 
              isLastAssistantMessage && 
              !activeWorkflow && 
              !workflowCompletionData &&
              (isScreenplayContent(message.content) || (wasContentRequest && message.content.trim().length > 50));
            
            // Check if this message contains 3 rewrite options
            const rewriteOptions = !isUser && state.selectedTextContext ? parseRewriteOptions(message.content) : null;
            
            return (
              <div
                key={index}
                className={`group w-full ${isUser ? 'bg-transparent' : 'bg-base-200/30'} hover:bg-base-200/50 transition-colors`}
              >
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 relative">
                  <div className="flex gap-4 md:gap-6">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'bg-gradient-to-br from-cinema-red to-cinema-red/80 text-base-content' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600 text-base-content'
                    }`}>
                      {isUser ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Only show raw message content if we're not displaying parsed rewrite options */}
                      {!rewriteOptions && (
                      <div className="prose prose-sm md:prose-base max-w-none chat-message-content">
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words text-base-content">
                            {message.content}
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                      </div>
                      )}
                      
                      {/* Rewrite Options with Individual Insert Buttons */}
                      {rewriteOptions && rewriteOptions.length >= 2 && onInsert && (
                        <div className="space-y-4 mt-4">
                          {rewriteOptions.map((option, optIndex) => (
                            <div key={optIndex} className="bg-base-100 border border-base-300 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-base-content">
                                  {option.description || `Option ${option.number}`}
                                </h4>
                                <button
                                  onClick={() => {
                                    // If in rewrite mode, pass selection range info
                                    if (state.selectedTextContext && state.selectionRange) {
                                      onInsert(option.content, {
                                        isRewrite: true,
                                        selectionRange: state.selectionRange
                                      });
                                    } else {
                                      onInsert(option.content);
                                    }
                                    closeDrawer();
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Insert into script
                                </button>
                              </div>
                              <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-wrap font-mono text-xs bg-base-200 p-3 rounded border border-base-300">
                                {option.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Single Insert Button (if not showing rewrite options) */}
                      {showInsertButton && !rewriteOptions && onInsert && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              // Clean the content before inserting (strip markdown, remove notes, remove duplicates)
                              // Get scene context for duplicate detection
                              const currentSceneContext = detectCurrentScene(editorContent, cursorPosition);
                              const cleanedContent = cleanFountainOutput(message.content, currentSceneContext?.contextBeforeCursor || null);
                              
                              // 🔥 PHASE 1 FIX: Validate content before inserting
                              if (!cleanedContent || cleanedContent.trim().length < 3) {
                                console.error('[ChatModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                                console.error('[ChatModePanel] Original content length:', message.content?.length);
                                console.error('[ChatModePanel] Cleaned content length:', cleanedContent?.length);
                                toast.error('Content is empty after cleaning. Please try again or use the original response.');
                                return; // Don't insert empty content
                              }
                              
                              // If in rewrite mode, pass selection range info
                              if (state.selectedTextContext && state.selectionRange) {
                                onInsert(cleanedContent, {
                                  isRewrite: true,
                                  selectionRange: state.selectionRange
                                });
                              } else {
                              onInsert(cleanedContent);
                              }
                              closeDrawer();
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Insert into script
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Streaming text - show insert button while streaming AND after streaming completes if it's screenplay content */}
        {state.streamingText && state.streamingText.trim().length > 0 && (
          <div className="group w-full bg-base-200/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <div className="flex gap-4 md:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-base-content">
                  <Bot className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                
                {/* Streaming Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="prose prose-sm md:prose-base max-w-none chat-message-content">
                    <MarkdownRenderer content={state.streamingText} />
                    {state.isStreaming && (
                      <span className="inline-block w-0.5 h-5 ml-1 bg-purple-500 animate-pulse"></span>
                    )}
                  </div>
                  
                  {/* Insert button for streaming text (when it's screenplay content) */}
                  {onInsert && isScreenplayContent(state.streamingText) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          // Clean the content before inserting (strip markdown, remove notes, remove duplicates)
                          // Get scene context for duplicate detection
                          const currentSceneContext = detectCurrentScene(editorContent, cursorPosition);
                          const cleanedContent = cleanFountainOutput(state.streamingText, currentSceneContext?.contextBeforeCursor || null);
                          
                          // 🔥 PHASE 1 FIX: Validate content before inserting
                          if (!cleanedContent || cleanedContent.trim().length < 3) {
                            console.error('[ChatModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                            console.error('[ChatModePanel] Original content length:', state.streamingText?.length);
                            console.error('[ChatModePanel] Cleaned content length:', cleanedContent?.length);
                            toast.error('Content is empty after cleaning. Please try again or use the original response.');
                            return; // Don't insert empty content
                          }
                          
                          // If in rewrite mode, pass selection range info
                          if (state.selectedTextContext && state.selectionRange) {
                            onInsert(cleanedContent, {
                              isRewrite: true,
                              selectionRange: state.selectionRange
                            });
                          } else {
                          onInsert(cleanedContent);
                          }
                          closeDrawer();
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Insert into script
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor - only scrolls while streaming */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Placeholder Info with New Chat button */}
      <div className="px-4 py-2 border-t border-base-300 flex items-center justify-between">
        <span className="text-xs text-base-content/60">
          {activeWorkflow ? (
            'Answer the question to continue the interview...'
          ) : (
            'Ask me anything about your screenplay'
          )}
        </span>
        {state.messages.filter(m => m.mode === 'chat').length > 0 && (
          <button
            onClick={() => clearMessagesForMode('chat')}
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

