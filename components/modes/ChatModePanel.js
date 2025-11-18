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
import toast from 'react-hot-toast';

// Helper to clean AI output: strip markdown and remove writing notes
function cleanFountainOutput(text) {
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
    // Remove "REVISION" headers
    /^REVISION\s*$/im,
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines at the start
    if (!foundFirstScreenplayContent && !line) continue;
    
    // If line starts with "NOTE:" or explanation words, stop here
    if (/^NOTE:/i.test(line)) {
      break;
    }
    
    // If line starts with explanation words, stop here (but allow short lines that might be dialogue)
    if (/^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure)/i.test(line) && 
        !/^(INT\.|EXT\.|I\/E\.)/i.test(line) && // But allow scene headings
        !/^[A-Z][A-Z\s]+$/.test(line) && // But allow character names in ALL CAPS
        line.length > 15) { // Only if it's a longer explanation
      break;
    }
    
    // If we find a scene heading, skip it (we don't want scene headings in content generation)
    if (/^(INT\.|EXT\.|I\/E\.)/i.test(line)) {
      continue; // Skip scene headings
    }
    
    // If we find a character name in ALL CAPS, we're in screenplay content
    if (/^[A-Z][A-Z\s]+$/.test(line) && line.length > 2) {
      foundFirstScreenplayContent = true;
    }
    
    // If we've found screenplay content, include this line
    if (foundFirstScreenplayContent || line.length > 0) {
      screenplayLines.push(lines[i]);
    }
  }
  
  cleaned = screenplayLines.join('\n');
  
  // Clean up extra whitespace
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
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext } = useChatContext();
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
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'chat'), state.streamingText, state.isStreaming]);
  
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
      
      // Check if this is a rewrite request (selected text exists)
      let builtPrompt;
      let systemPrompt;
      
      if (state.selectedTextContext && state.selectionRange && editorContent) {
        // REWRITE MODE: Use buildRewritePrompt with surrounding text
        const selectionContext = extractSelectionContext(
          editorContent,
          state.selectionRange.start,
          state.selectionRange.end
        );
        
        if (selectionContext) {
          builtPrompt = buildRewritePrompt(
            prompt,
            state.selectedTextContext,
            sceneContext,
            {
              before: selectionContext.beforeContext,
              after: selectionContext.afterContext
            }
          );
          
          // Simple system prompt for rewrite mode
          systemPrompt = `You are a professional screenwriting assistant. The user has selected text and wants to rewrite it. Provide only the rewritten text in Fountain format.`;
        } else {
          // Fallback: use regular rewrite prompt without surrounding text
          builtPrompt = buildRewritePrompt(
            prompt,
            state.selectedTextContext,
            sceneContext,
            null
          );
          systemPrompt = `You are a professional screenwriting assistant. The user has selected text and wants to rewrite it. Provide only the rewritten selection in Fountain format.`;
        }
      } else {
        // REGULAR MODE: Detect if this is content generation vs advice request
        const isContentRequest = detectContentRequest(prompt);
        
        // Build appropriate prompt using prompt builders
        builtPrompt = isContentRequest 
          ? buildChatContentPrompt(prompt, sceneContext)
          : buildChatAdvicePrompt(prompt, sceneContext);
        
        // Build system prompt - Simple for content, permissive for advice
        if (isContentRequest) {
          // Simple system prompt for content generation (let the user prompt do the work)
          systemPrompt = `You are a professional screenwriting assistant.`;
          
          // Add scene context if available (minimal, just for context)
          if (sceneContext) {
            systemPrompt += `\n\nCurrent Scene: ${sceneContext.heading}`;
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
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'chat'
      });
      
      // Build conversation history (last 10 messages)
      const chatMessages = state.messages.filter(m => m.mode === 'chat').slice(-10);
      const conversationHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
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
            mode: 'chat'
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
            mode: 'chat'
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
                              // Clean the content before inserting (strip markdown, remove notes)
                              const cleanedContent = cleanFountainOutput(message.content);
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
                          // Clean the content before inserting (strip markdown, remove notes)
                          const cleanedContent = cleanFountainOutput(state.streamingText);
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
        
        {/* Auto-scroll anchor */}
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

