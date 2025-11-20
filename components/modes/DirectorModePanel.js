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
import toast from 'react-hot-toast';

// Helper to strip markdown formatting from text (for Fountain format compliance)
// Import cleanFountainOutput from ChatModePanel for consistency
// Using the same robust cleaning function that removes analysis, notes, etc.
function cleanFountainOutput(text) {
  if (!text) return text;
  
  let cleaned = text;
  
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
  
  // Remove common AI response patterns that aren't screenplay content
  const unwantedPatterns = [
    /^(Here's|Here is|I'll|I will|Let me|This version|Here's the|This is|Here are|Here is the|I've|I have|Perfect|Great|Excellent|Good|Nice|Sure|Okay|OK)[\s:]*/i,
    /Great (emotional|physical|character|story|writing|detail|note|suggestion|idea).*$/i,
    /(SCREENWRITING\s+)?NOTE:.*$/is,
    /^#?\s*REVISION\s*$/im,
    /^#?\s*REVISED\s+SCENE\s*$/im,
    /ALTERNATIVE OPTIONS?:.*$/is,
    /Option \d+[:\-].*$/im,
    /Which direction.*$/is,
    /This version:.*$/is,
    /What comes next\?.*$/is,
    /What feeling.*$/is,
    /Would you like.*$/is,
    /Here are (some|a few) (suggestions|options|ideas|ways|things).*$/is,
    /---\s*\n\s*\*\*WRITING NOTE\*\*.*$/is,
    /---\s*\n\s*WRITING NOTE.*$/is,
    /\*\*WRITING NOTE\*\*.*$/is,
    /WRITING NOTE.*$/is,
    /---\s*\n\s*\*\*NOTE\*\*.*$/is,
    /---\s*\n\s*NOTE.*$/is,
    /\*\*NOTE\*\*.*$/is,
    /^---\s*$/m,
    /This (version|Sarah|character|scene|moment).*$/is,
    /Works perfectly.*$/is,
    /What happens next\?.*$/is,
    /For (your|this) scene.*$/is,
    /Recommendation:.*$/is,
    /Current line:.*$/is,
    /Enhanced options?:.*$/is
  ];
  
  for (const pattern of unwantedPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      cleaned = cleaned.substring(0, match.index).trim();
      break;
    }
  }
  
  // Remove lines that are clearly explanations
  const lines = cleaned.split('\n');
  const screenplayLines = [];
  let foundFirstScreenplayContent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!foundFirstScreenplayContent && !line) continue;
    
    if (/^NOTE:/i.test(line)) {
      break;
    }
    
    const isLikelyDialogue = line.length < 50 && (
      /^[A-Z][A-Z\s]+$/.test(lines[i-1]?.trim() || '') ||
      /^\(/.test(line) ||
      /[!?.]$/.test(line)
    );
    
    if (!isLikelyDialogue && /^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure)/i.test(line) && 
        !/^(INT\.|EXT\.|I\/E\.)/i.test(line) &&
        !/^[A-Z][A-Z\s]+$/.test(line) &&
        line.length > 15) {
      break;
    }
    
    // Skip markdown headers (already removed above, but double-check)
    if (/^#+\s+(REVISED|REVISION)/i.test(line)) {
      continue;
    }
    
    // 🔥 NEW: Skip standalone asterisks (should already be removed, but catch any remaining)
    if (/^\s*\*\s*$/.test(line)) {
      continue;
    }
    
    if (/^[A-Z][A-Z\s#0-9']+$/.test(line) && line.length > 2) {
      foundFirstScreenplayContent = true;
    }
    
    if (foundFirstScreenplayContent || line.length > 0) {
      screenplayLines.push(lines[i]);
    }
  }
  
  cleaned = screenplayLines.join('\n');
  
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
  
  // Generation length state: 'short' (5-10 lines), 'full' (15-30 lines), 'multiple' (2-3 scenes)
  const [generationLength, setGenerationLength] = useState('full');
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'director'), state.streamingText, state.isStreaming]);
  
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
      
      // Build Director prompt using prompt builder (includes context and full scene instructions)
      // Pass generation length to control output size
      const builtPrompt = buildDirectorPrompt(prompt, sceneContext, generationLength);
      
      // Build system prompt with Director Mode instructions - focused on thorough scene generation
      const lengthDescription = generationLength === 'short' 
        ? '5-10 lines' 
        : generationLength === 'multiple' 
        ? '2-3 complete scenes (15-30 lines each)'
        : '15-30 lines (full scenes)';
      
      let systemPrompt = `You are a professional film director assistant helping a screenwriter create scenes.

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
      
      if (sceneContext) {
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
        conversationHistoryLength: conversationHistory.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: builtPrompt.length
      });
      
      // Call streaming AI API
      setStreaming(true, '');
      let accumulatedText = '';
      
      await api.chat.generateStream(
        {
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
        },
        // onChunk
        (chunk) => {
          accumulatedText += chunk;
          setStreaming(true, accumulatedText);
        },
        // onComplete
        (fullContent) => {
          // Keep streamingText visible briefly so insert button doesn't disappear
          // The message will be added and streamingText will be cleared by the message render
          addMessage({
            role: 'assistant',
            content: fullContent,
            mode: 'director'
          });
          // Clear streaming after a brief delay to allow message to render
          setTimeout(() => {
            setStreaming(false, '');
          }, 100);
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
                      onInsert(cleanFountainOutput(message.content));
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
                  onInsert(cleanFountainOutput(state.streamingText));
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
                  Build complete scenes with dialogue, action, and cinematic direction. Generates longer, more thorough content than the Screenwriter agent.
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
                      🎭 Multiple Scenes (2-3 scenes)
                    </button>
                  </div>
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

