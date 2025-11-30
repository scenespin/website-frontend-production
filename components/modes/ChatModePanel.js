'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useDrawer } from '@/contexts/DrawerContext';
import { FileText, Sparkles, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt, extractSelectionContext } from '@/utils/sceneDetection';
import { buildChatContentPrompt, buildRewritePrompt } from '@/utils/promptBuilders';
import { validateScreenplayContent, supportsNativeJSON, buildRetryPrompt } from '@/utils/jsonValidator';
import toast from 'react-hot-toast';

// 🔥 MINIMAL: Just clean obvious markdown and stop on obvious analysis
function cleanFountainOutput(text, contextBeforeCursor = null, sceneContext = null) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove obvious markdown
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
    .replace(/^#+\s*/gm, '') // Remove markdown headers
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '');
  
  // Process line by line to skip headers and duplicate scenes
  const lines = cleaned.split('\n');
  const result = [];
  let foundFirstContent = false;
  let skippedHeader = false;
  
  // Get current scene heading for duplicate detection
  const currentSceneHeading = sceneContext?.heading || '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines until we find content
    if (!foundFirstContent && !trimmedLine) continue;
    
    // Skip "REVISED SCENE" or "REVISION" headers
    if (/^#?\s*(REVISED\s+SCENE|REVISION)\s*:?\s*$/i.test(trimmedLine)) {
      skippedHeader = true;
      continue;
    }
    
    // Skip duplicate scene headings (same as current scene)
    if (/^(INT\.|EXT\.|I\/E\.)/i.test(trimmedLine) && currentSceneHeading) {
      const normalizeHeading = (heading) => {
        return heading.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\s*-\s*/g, ' - ')
          .trim();
      };
      
      const currentNormalized = normalizeHeading(currentSceneHeading);
      const newNormalized = normalizeHeading(trimmedLine);
      const currentLocation = currentNormalized.split(' - ')[0].trim();
      const newLocation = newNormalized.split(' - ')[0].trim();
      
      // Skip if it matches current scene (exact match or same location)
      if (currentNormalized === newNormalized || (currentLocation === newLocation && currentLocation.length > 0)) {
        continue; // Skip duplicate scene heading
      }
    }
    
    // Stop on obvious analysis/questions (but NOT on "---" - that's just user formatting)
    // Stop on patterns like "Note: This raises..." or "This raises the stakes..."
    if (/^(Note:|This raises|This adds|This creates|This shows|Was it deliberate|Option \d+|Here are|Here's some|Would you like|What tone|Which direction|Does this capture|Who might)/i.test(trimmedLine)) {
      break;
    }
    
    foundFirstContent = true;
    result.push(line); // Keep original line (with spacing)
  }
  
  cleaned = result.join('\n');
  
  // Remove "FADE OUT" and "THE END" at the end
  cleaned = cleaned.replace(/\n\s*(FADE OUT\.?|THE END\.?)\s*$/gi, '');
  
  return cleaned.trim();
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
    content = cleanFountainOutput(content, null, null);
    
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
    opt.content = cleanFountainOutput(opt.content, null, null);
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
      
      // 🔥 SIMPLIFIED: Screenwriter agent ONLY generates 1-3 lines of Fountain format text
      // No advice mode, no questions, no analysis - just text generation
      let builtPrompt;
      let systemPrompt;
      
      // 🔥 SIMPLIFIED: No JSON for Screenwriter agent - just simple text, aggressive cleaning
      // JSON adds complexity and the AI often ignores it anyway
      const useJSONFormat = false; // Always use simple text format
      
      // Build prompt - ALWAYS content generation (no advice mode)
      builtPrompt = buildChatContentPrompt(prompt, sceneContext, useJSONFormat);
      
      // Build system prompt - ABSOLUTE MINIMUM
      systemPrompt = `Write 3 lines of Fountain format screenplay text that continue the scene.`;
      
      // Add scene context if available (minimal, just for context)
      if (sceneContext) {
        systemPrompt += `\n\nCurrent Scene: ${sceneContext.heading} (for context only - do NOT include in output)`;
        if (sceneContext.characters && sceneContext.characters.length > 0) {
          systemPrompt += `\nCharacters: ${sceneContext.characters.join(', ')}`;
        }
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'chat'
      });
      
      // 🔥 SIMPLIFIED: Screenwriter agent uses EMPTY history to prevent confusion
      // Always generate fresh content, don't continue previous conversations
      let conversationHistory = [];
      
      console.log('[ChatModePanel] API call params:', {
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
      if (useJSONFormat && modelSupportsNativeJSON) {
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
        const requestData = isRetry && useJSONFormat && retryErrors.length > 0
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
          // 🔥 PHASE 4: Validate JSON for content requests (currently disabled, but keeping structure)
          if (useJSONFormat) {
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
              console.warn('[ChatModePanel] Full content (first 1000 chars):', fullContent.substring(0, 1000));
              console.warn('[ChatModePanel] Full content length:', fullContent.length);
              
              // 🔥 SIMPLIFIED: Don't retry JSON - just fall back to text cleaning immediately
              // JSON is optional, text cleaning is the reliable primary path
              console.warn('[ChatModePanel] JSON validation failed, using text cleaning (primary path)...');
              console.warn('[ChatModePanel] Full content before cleaning:', fullContent.substring(0, 500));
              const cleanedContent = cleanFountainOutput(fullContent, sceneContext?.contextBeforeCursor || null, sceneContext);
              console.warn('[ChatModePanel] Cleaned content length:', cleanedContent?.length || 0);
              console.warn('[ChatModePanel] Cleaned content preview:', cleanedContent?.substring(0, 500) || '(empty)');
              
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
            // Fallback: use text cleaning
            const cleanedContent = cleanFountainOutput(fullContent, sceneContext?.contextBeforeCursor || null, sceneContext);
            
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
                Generates 1-3 lines of Fountain format text that continue your scene from the cursor. No scene headings. No analysis. Just screenplay content.
              </p>
              <div className="text-xs text-base-content/50 space-y-1 mb-3">
                <p>Try: "Sarah enters the room"</p>
                <p>or "She's terrified and ready to leave"</p>
                <p>or "Write one line where he discovers the truth"</p>
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
            // 🔥 SIMPLIFIED: Screenwriter agent always generates content, so always show insert button if there's content
            const showInsertButton = 
              !isUser && 
              isLastAssistantMessage && 
              !activeWorkflow && 
              !workflowCompletionData &&
              (isScreenplayContent(message.content) || message.content.trim().length > 20);
            
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
                        <div className="flex items-center gap-2 flex-wrap relative z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('[ChatModePanel] Insert button clicked (completed message)');
                              console.log('[ChatModePanel] onInsert function:', typeof onInsert);
                              console.log('[ChatModePanel] Message content length:', message.content?.length);
                              console.log('[ChatModePanel] Message content preview:', message.content?.substring(0, 500));
                              
                              // Clean the content before inserting (strip markdown, remove notes, remove duplicates)
                              // Get scene context for duplicate detection
                              const currentSceneContext = detectCurrentScene(editorContent, cursorPosition);
                              const cleanedContent = cleanFountainOutput(message.content, currentSceneContext?.contextBeforeCursor || null, currentSceneContext);
                              
                              console.log('[ChatModePanel] Cleaned content length:', cleanedContent?.length || 0);
                              console.log('[ChatModePanel] Cleaned content preview:', cleanedContent?.substring(0, 500) || '(empty)');
                              
                              // 🔥 PHASE 1 FIX: Validate content before inserting
                              if (!cleanedContent || cleanedContent.trim().length < 3) {
                                console.error('[ChatModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                                console.error('[ChatModePanel] Original content full:', message.content);
                                console.error('[ChatModePanel] Original content length:', message.content?.length);
                                console.error('[ChatModePanel] Cleaned content:', cleanedContent);
                                console.error('[ChatModePanel] Cleaned content length:', cleanedContent?.length);
                                
                                // Try using raw content if cleaned is empty
                                if (message.content && message.content.trim().length > 10) {
                                  console.warn('[ChatModePanel] Using raw content as fallback');
                                  onInsert(message.content);
                                  closeDrawer();
                                  return;
                                }
                                
                                toast.error('Content is empty after cleaning. Please try again or use the original response.');
                                return; // Don't insert empty content
                              }
                              
                              console.log('[ChatModePanel] ✅ Calling onInsert with cleaned content');
                              
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
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200 cursor-pointer relative z-10"
                            type="button"
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
                  
                  {/* Insert button for streaming text (always show if there's content) */}
                  {onInsert && state.streamingText && state.streamingText.trim().length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap relative z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[ChatModePanel] Insert button clicked (streaming)');
                          console.log('[ChatModePanel] onInsert function:', typeof onInsert);
                          console.log('[ChatModePanel] Streaming text length:', state.streamingText?.length);
                          
                          // Clean the content before inserting (strip markdown, remove notes, remove duplicates)
                          // Get scene context for duplicate detection
                          const currentSceneContext = detectCurrentScene(editorContent, cursorPosition);
                          const cleanedContent = cleanFountainOutput(state.streamingText, currentSceneContext?.contextBeforeCursor || null, currentSceneContext);
                          
                          console.log('[ChatModePanel] Cleaned content length:', cleanedContent?.length || 0);
                          
                          // 🔥 PHASE 1 FIX: Validate content before inserting
                          if (!cleanedContent || cleanedContent.trim().length < 3) {
                            console.error('[ChatModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                            console.error('[ChatModePanel] Original content length:', state.streamingText?.length);
                            console.error('[ChatModePanel] Cleaned content length:', cleanedContent?.length);
                            toast.error('Content is empty after cleaning. Please try again or use the original response.');
                            return; // Don't insert empty content
                          }
                          
                          console.log('[ChatModePanel] ✅ Calling onInsert with cleaned content');
                          
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200 cursor-pointer relative z-10"
                        type="button"
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
            'Write 1-3 lines that continue the scene'
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

