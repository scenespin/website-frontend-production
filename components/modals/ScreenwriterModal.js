'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Edit3 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { buildScreenwriterPrompt } from '@/utils/promptBuilders';
import { validateScreenwriterContent } from '@/utils/jsonValidator';
import toast from 'react-hot-toast';

// LLM Models for selection
const LLM_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', recommended: true },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
];

export default function ScreenwriterModal({
  isOpen,
  onClose,
  editorContent,
  cursorPosition,
  selectionRange,
  onInsert
}) {
  const { state: chatState } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    // Get from localStorage or default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('screenwriter-selected-model');
      if (saved) return saved;
    }
    return chatState.selectedModel || 'claude-sonnet-4-5-20250929';
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUserPrompt('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Save model selection to localStorage
  useEffect(() => {
    if (selectedModel && typeof window !== 'undefined') {
      localStorage.setItem('screenwriter-selected-model', selectedModel);
    }
  }, [selectedModel]);

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

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      toast.error('Please enter a prompt describing what to generate');
      return;
    }

    if (!editorContent || cursorPosition === undefined) {
      toast.error('Editor content or cursor position not available');
      return;
    }

    setIsLoading(true);

    try {
      // Detect context: use selection if available, otherwise use scene detection
      let contextBefore = '';
      let sceneContext = null;

      if (selectionRange && selectionRange.start !== selectionRange.end) {
        // User selected text - use as context
        const beforeStart = Math.max(0, selectionRange.start - 200);
        contextBefore = editorContent.substring(beforeStart, selectionRange.start).trim();
        sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      } else {
        // No selection - use scene detection
        sceneContext = detectCurrentScene(editorContent, cursorPosition);
        if (sceneContext) {
          contextBefore = sceneContext.contextBeforeCursor || '';
        }
      }

      // Build prompt
      const builtPrompt = buildScreenwriterPrompt(userPrompt, sceneContext, contextBefore, true);

      // System prompt for screenwriter
      const systemPrompt = `You are a professional screenwriting assistant. Generate 1-3 lines of Fountain format screenplay text that continue the scene.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, just JSON:
{
  "content": ["line 1", "line 2", "line 3"],
  "lineCount": 3
}

Rules:
- NO scene headings (INT./EXT.) - this is a continuation
- NO markdown formatting
- Character names in ALL CAPS when speaking
- Action lines in normal case
- Just 1-3 lines total
- Each line should be a complete thought or action`;

      // Call API
      let accumulatedText = '';

      await api.chat.generateStream(
        {
          userPrompt: builtPrompt,
          systemPrompt: systemPrompt,
          desiredModelId: selectedModel,
          conversationHistory: [], // Empty for standalone request
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
          console.log('[ScreenwriterModal] 📝 RAW AI RESPONSE:', fullContent.substring(0, 500));

          // Validate JSON
          const validation = validateScreenwriterContent(fullContent, contextBefore);

          if (!validation.valid) {
            console.error('[ScreenwriterModal] ❌ JSON validation failed:', validation.errors);
            toast.error(`Invalid response: ${validation.errors[0] || 'Unknown error'}`);
            setIsLoading(false);
            return;
          }

          console.log('[ScreenwriterModal] ✅ JSON validation passed');

          if (!validation.content || validation.content.trim().length === 0) {
            toast.error('No valid content returned');
            setIsLoading(false);
            return;
          }

          // Format content for insertion
          let contentToInsert = validation.content.trim();

          // Check spacing context around cursor
          const textBeforeCursor = editorContent.substring(0, cursorPosition);
          const textAfterCursor = editorContent.substring(cursorPosition);
          
          // Check if there's text on the same line before cursor (not just whitespace/newlines)
          const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
          const textOnCurrentLine = lastNewlineIndex >= 0 
            ? textBeforeCursor.substring(lastNewlineIndex + 1)
            : textBeforeCursor;
          const hasTextOnCurrentLine = textOnCurrentLine.trim().length > 0;
          
          // Check if there's text after cursor
          const hasTextAfter = textAfterCursor.trim().length > 0;
          const textAfterStartsWithNewline = textAfterCursor.startsWith('\n') || textAfterCursor.startsWith('\r\n');

          // Add newline BEFORE if there's text on the current line
          if (hasTextOnCurrentLine) {
            contentToInsert = '\n\n' + contentToInsert; // Double newline for proper spacing
            console.log('[ScreenwriterModal] ✅ Added double newline before content (text exists on current line)');
          } else {
            // Even if at start of line, add single newline for spacing
            contentToInsert = '\n' + contentToInsert;
            console.log('[ScreenwriterModal] ✅ Added single newline before content (at start of line)');
          }

          // Add newline AFTER if there's text after cursor and it doesn't start with newline
          if (hasTextAfter && !textAfterStartsWithNewline) {
            contentToInsert = contentToInsert + '\n';
            console.log('[ScreenwriterModal] ✅ Added newline after content (text exists after cursor)');
          }
          
          console.log('[ScreenwriterModal] 📝 Final content to insert - length:', contentToInsert.length, 'startsWith newline:', contentToInsert.startsWith('\n'), 'endsWith newline:', contentToInsert.endsWith('\n'));

          // Insert content
          onInsert(contentToInsert);

          // Close modal
          onClose();

          // Show success toast
          toast.success('Content generated and inserted');
        },
        // onError
        (error) => {
          console.error('[ScreenwriterModal] Error:', error);
          toast.error(error.message || 'Failed to generate content');
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('[ScreenwriterModal] Error:', error);
      toast.error(error.message || 'Failed to generate content');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleGenerate();
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                      <Edit3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                        Screenwriter Agent
                      </Dialog.Title>
                      <p className="text-xs text-base-content/60">
                        Generate 1-3 lines of screenplay content
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={isLoading}
                      className="select select-bordered select-sm text-xs max-w-[140px]"
                      title="Select AI model"
                    >
                      {LLM_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="btn btn-ghost btn-sm btn-circle"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-6 py-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text">What should happen next?</span>
                      </label>
                      <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        disabled={isLoading}
                        placeholder="e.g., Sarah looks up from her screen and sees chaos outside..."
                        className="textarea textarea-bordered w-full h-24 resize-none"
                        autoFocus
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          Tip: Optionally select text before cursor for context
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !userPrompt.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          'Generate'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

