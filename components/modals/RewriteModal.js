'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Loader2, Sparkles, Zap, Minus, Plus, MessageSquare, Edit3 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { detectCurrentScene, extractSelectionContext } from '@/utils/sceneDetection';
import { buildRewritePrompt } from '@/utils/promptBuilders';
import toast from 'react-hot-toast';

// Helper to clean AI output: strip markdown and remove writing notes
// Same function as ChatModePanel for consistency
function cleanFountainOutput(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove markdown formatting
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\b\*([^*\n]+)\*\b/g, '$1')
    .replace(/\b_([^_\n]+)_\b/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '');
  
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
    
    // Skip scene headings (rewrite should not include scene headings)
    if (/^(INT\.|EXT\.|I\/E\.)/i.test(line)) {
      continue;
    }
    
    // Skip markdown headers
    if (/^#+\s+(REVISED|REVISION)/i.test(line)) {
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

// Quick action buttons configuration
const QUICK_ACTIONS = [
  {
    id: 'dramatic',
    label: 'Make more dramatic',
    prompt: 'make this more dramatic',
    icon: Zap,
    color: 'btn-error'
  },
  {
    id: 'concise',
    label: 'Make more concise',
    prompt: 'make this more concise',
    icon: Minus,
    color: 'btn-primary'
  },
  {
    id: 'physical',
    label: 'Add physical detail',
    prompt: 'add more physical detail',
    icon: Plus,
    color: 'btn-secondary'
  },
  {
    id: 'dialogue',
    label: 'Improve dialogue',
    prompt: 'improve the dialogue',
    icon: MessageSquare,
    color: 'btn-accent'
  }
];

export default function RewriteModal({
  isOpen,
  onClose,
  selectedText,
  selectionRange,
  editorContent,
  onReplace
}) {
  const { state: chatState } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Get selected model from ChatContext (last used model)
  const selectedModel = chatState.selectedModel || 'claude-sonnet-4-5-20250929';
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCustomPrompt('');
      setShowCustomInput(false);
      setIsLoading(false);
    }
  }, [isOpen]);
  
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);
  
  const handleRewrite = async (prompt) => {
    // 🔥 CRITICAL: Only allow rewrite if text is actually selected (not just cursor position)
    if (!selectedText || !selectionRange || !editorContent) {
      toast.error('Please select text to rewrite');
      return;
    }
    
    // Check if selection has actual content (not just whitespace)
    const trimmedText = selectedText.trim();
    if (!trimmedText || trimmedText.length === 0) {
      toast.error('Please select text to rewrite');
      return;
    }
    
    // Check if selection range has meaningful length (not just cursor position)
    if (selectionRange.start === selectionRange.end) {
      toast.error('Please select text to rewrite');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Extract surrounding context (200 chars before/after)
      const beforeStart = Math.max(0, selectionRange.start - 200);
      const afterEnd = Math.min(editorContent.length, selectionRange.end + 200);
      const textBefore = editorContent.substring(beforeStart, selectionRange.start).trim();
      const textAfter = editorContent.substring(selectionRange.end, afterEnd).trim();
      
      // Detect scene context
      const sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      
      // Build rewrite prompt
      const surroundingText = {
        before: textBefore,
        after: textAfter
      };
      
      // 🔥 PHASE 4: Use JSON format for rewrite (structured output)
      const useJSONFormat = true;
      const builtPrompt = buildRewritePrompt(prompt, selectedText, sceneContext, surroundingText, useJSONFormat);
      
      // System prompt for rewrite
      const systemPrompt = useJSONFormat
        ? "You are a professional screenwriting assistant. The user has selected text and wants to rewrite it. You MUST respond with valid JSON only. No explanations, no markdown, just JSON with the rewritten text."
        : "You are a professional screenwriting assistant. The user has selected text and wants to rewrite it. Provide only the rewritten text in Fountain format.";
      
      // Call API
      let accumulatedText = '';
      
      await api.chat.generateStream(
        {
          userPrompt: builtPrompt,
          systemPrompt: systemPrompt,
          desiredModelId: selectedModel,
          conversationHistory: [], // Empty for rewrite (standalone)
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
        },
        // onComplete
        async (fullContent) => {
          // 🔥 PHASE 4: Validate JSON for rewrite requests
          if (useJSONFormat) {
            const { validateRewriteContent } = await import('@/utils/jsonValidator');
            const validation = validateRewriteContent(fullContent);
            
            if (validation.valid) {
              console.log('[RewriteModal] ✅ JSON validation passed');
              // Use the validated rewritten text
              const cleaned = validation.rewrittenText;
              
              if (!cleaned || cleaned.trim().length === 0) {
                toast.error('No valid content returned from rewrite');
                setIsLoading(false);
                return;
              }
              
              // Replace the selected text
              onReplace(cleaned);
            } else {
              console.warn('[RewriteModal] ❌ JSON validation failed:', validation.errors);
              // Fallback to text cleaning
              const cleaned = cleanFountainOutput(fullContent);
              
              if (!cleaned || cleaned.trim().length === 0) {
                toast.error('No valid content returned from rewrite');
                setIsLoading(false);
                return;
              }
              
              // Replace the selected text
              onReplace(cleaned);
            }
          } else {
            // Fallback: Original text format
            const cleaned = cleanFountainOutput(fullContent);
            
            if (!cleaned || cleaned.trim().length === 0) {
              toast.error('No valid content returned from rewrite');
              setIsLoading(false);
              return;
            }
            
            // Replace the selected text
            onReplace(cleaned);
          }
          
          // Close modal
          onClose();
          
          // Show success toast
          toast.success('Text rewritten successfully');
        },
        // onError
        (error) => {
          console.error('[RewriteModal] Error:', error);
          toast.error(error.message || 'Failed to rewrite text');
          setIsLoading(false);
        }
      );
      
    } catch (error) {
      console.error('[RewriteModal] Error:', error);
      toast.error(error.message || 'Failed to rewrite text');
      setIsLoading(false);
    }
  };
  
  const handleQuickAction = (action) => {
    handleRewrite(action.prompt);
  };
  
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) {
      toast.error('Please enter a rewrite instruction');
      return;
    }
    handleRewrite(customPrompt.trim());
  };
  
  if (!isOpen) return null;
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isLoading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>
        
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cinema-red to-red-800">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                        Rewrite Selected Text
                      </Dialog.Title>
                      <p className="text-xs text-base-content/60">
                        Using {selectedModel.replace('claude-', '').replace('gpt-', '').replace('gemini-', '').split('-')[0]}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="px-6 py-6">
                  {/* Quick Actions */}
                  {!showCustomInput && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-base-content/80">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleQuickAction(action)}
                              disabled={isLoading}
                              className={`btn ${action.color} btn-outline w-full justify-start gap-2`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-xs">{action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Custom Rewrite Button */}
                      <button
                        onClick={() => setShowCustomInput(true)}
                        disabled={isLoading}
                        className="btn btn-ghost btn-block gap-2 border border-base-300"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="text-sm">Custom rewrite...</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Custom Input */}
                  {showCustomInput && (
                    <form onSubmit={handleCustomSubmit} className="space-y-3">
                      <div>
                        <label className="label">
                          <span className="label-text text-sm font-medium">Enter rewrite instruction</span>
                        </label>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          disabled={isLoading}
                          placeholder="e.g., make this more suspenseful, add internal monologue, improve pacing..."
                          className="textarea textarea-bordered w-full h-24 resize-none"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading || !customPrompt.trim()}
                          className="btn btn-primary btn-block gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Rewriting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span>Rewrite</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomPrompt('');
                          }}
                          disabled={isLoading}
                          className="btn btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100/80 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-base-content/60">Rewriting text...</p>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

