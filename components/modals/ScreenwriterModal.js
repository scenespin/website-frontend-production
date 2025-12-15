'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Edit3 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { api } from '@/lib/api';
import { detectCurrentScene, extractRecentDialogue } from '@/utils/sceneDetection';
import { buildScreenwriterPrompt } from '@/utils/promptBuilders';
import { validateScreenwriterContent } from '@/utils/jsonValidator';
import { getCharactersInScene, buildCharacterSummaries } from '@/utils/characterContextBuilder';
import { getTimingMessage } from '@/utils/modelTiming';
import toast from 'react-hot-toast';

// LLM Models - Same order and list as UnifiedChatPanel for consistency
// Order: Anthropic (Claude) → OpenAI (GPT) → Google (Gemini)
const LLM_MODELS = [
  // Claude (Anthropic) - Best for Creative Writing
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: '⭐ Best for creative writing & screenplays', recommended: true },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic', description: 'Most powerful - Enhanced coding & reasoning' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast & economical' },
  // GPT (OpenAI) - Good for Creative Writing
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Latest - Excellent for creative writing' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', description: 'Advanced - Great for storytelling' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Balanced - Good for dialogue & scenes' },
  { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI', description: 'Fast and capable' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', description: 'Reasoning model - Best for analysis' },
  { id: 'o1', name: 'O1', provider: 'OpenAI', description: 'Reasoning model - Best for analysis' },
  // Gemini (Google) - Good for Complex Narratives
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Latest - Most intelligent, advanced reasoning' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Advanced reasoning - Complex narratives' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient' },
  { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Fastest & most economical' },
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
  const { characters } = useScreenplay();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null); // 'building' | 'generating' | null
  const [abortController, setAbortController] = useState(null);
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
      setLoadingStage(null);
      // Cancel any ongoing request
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
    }
  }, [isOpen, abortController]);
  
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setLoadingStage(null);
      setAbortController(null);
      toast('Generation cancelled');
    }
  };

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
    setLoadingStage('building');
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    const isCancelledRef = { current: false };
    
    // Set up abort handler
    controller.signal.addEventListener('abort', () => {
      isCancelledRef.current = true;
    });
    
    // Track when building stage started for minimum duration
    const buildingStartTime = Date.now();
    const MIN_BUILDING_DURATION = 2000; // 2 seconds minimum for visual balance

    try {
      // Detect context: use selection if available, otherwise use scene detection
      let sceneContext = null;

      if (selectionRange && selectionRange.start !== selectionRange.end) {
        sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      } else {
        sceneContext = detectCurrentScene(editorContent, cursorPosition);
      }

      // Enhanced context: Get full current scene up to cursor, recent dialogue, and character summaries
      let fullCurrentSceneUpToCursor = '';
      let contextBefore = null; // For validation (content before cursor)
      if (sceneContext && sceneContext.content) {
        // Calculate cursor position relative to scene start
        const sceneStartPosition = sceneContext.startLine !== undefined 
          ? editorContent.split('\n').slice(0, sceneContext.startLine).join('\n').length + 1
          : 0;
        const cursorInScene = cursorPosition - sceneStartPosition;
        
        // Get full scene content up to cursor
        if (cursorInScene > 0 && cursorInScene <= sceneContext.content.length) {
          fullCurrentSceneUpToCursor = sceneContext.content.substring(0, cursorInScene);
        } else {
          fullCurrentSceneUpToCursor = sceneContext.content;
        }
        
        // Extract context before cursor for duplicate checking
        contextBefore = editorContent.substring(0, cursorPosition);
      }
      
      const recentDialogue = fullCurrentSceneUpToCursor ? extractRecentDialogue(fullCurrentSceneUpToCursor, 3) : [];
      
      // Get character summaries for characters in scene
      const sceneCharacters = getCharactersInScene(characters || [], sceneContext);
      const characterSummaries = buildCharacterSummaries(sceneCharacters, sceneContext);

      // Build prompt with enhanced context
      const builtPrompt = buildScreenwriterPrompt(
        userPrompt, 
        sceneContext, 
        fullCurrentSceneUpToCursor,
        recentDialogue,
        characterSummaries,
        true
      );

      // System prompt for screenwriter
      const systemPrompt = `You are a professional screenwriting assistant. Generate 1-3 content elements (action, character, dialogue) of Fountain format screenplay text that continue the scene.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, just JSON:
{
  "content": ["action line", "", "CHARACTER", "(parenthetical)", "dialogue", ""],
  "lineCount": 6
}

Note: The content array can include blank lines (empty strings) for proper Fountain spacing. Up to 10 items total allowed.

Rules:
- NO scene headings (INT./EXT.) - this is a continuation
- NO markdown formatting
- Character names in ALL CAPS when speaking
- Action lines in normal case
- Generate 1-3 content elements (action, character/dialogue, or both)
- Include blank lines for proper Fountain spacing (empty strings in array)
- Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
- Double dashes (--) are valid in Fountain but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
- Character extensions are valid: CHARACTER (O.S.), CHARACTER (V.O.), CHARACTER (CONT'D)

CRITICAL SPACING RULES (Fountain.io spec):
- Character: ONE blank line BEFORE, NO blank line AFTER
- Dialogue: NO blank line before, ONE blank line AFTER
- Parenthetical: NO blank lines before/after
- Action: ONE blank line BEFORE Character (if next is Character)`;

      // Build structured output format if model supports it
      // Use same pattern as RewriteModal (working with Anthropic beta)
      let responseFormat = undefined;
      const { getScreenwriterSchema } = await import('../../utils/jsonSchemas');
      const { supportsStructuredOutputs } = await import('../../utils/jsonValidator');
      
      if (supportsStructuredOutputs(selectedModel)) {
        responseFormat = {
          type: "json_schema",
          json_schema: {
            schema: getScreenwriterSchema(),
            strict: true
          }
        };
      }

      // Ensure minimum duration for building stage (for visual balance)
      const buildingElapsed = Date.now() - buildingStartTime;
      const remainingTime = Math.max(0, MIN_BUILDING_DURATION - buildingElapsed);
      
      if (remainingTime > 0) {
        // Wait for remaining time before transitioning
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Check if cancelled during wait
      if (controller.signal.aborted) {
        setIsLoading(false);
        setLoadingStage(null);
        setAbortController(null);
        return;
      }
      
      // Move to generating stage
      setLoadingStage('generating');

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
          } : null,
          responseFormat: responseFormat // Structured output format (if supported)
        },
        // onChunk
        (chunk) => {
          // Ignore chunks if cancelled
          if (controller.signal.aborted || isCancelledRef.current) return;
          accumulatedText += chunk;
        },
        // onComplete
        async (fullContent) => {
          // Check if cancelled
          if (controller.signal.aborted || isCancelledRef.current) {
            setIsLoading(false);
            setLoadingStage(null);
            setAbortController(null);
            toast('Generation cancelled - changes not applied');
            return;
          }
          
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

          // Format content with proper Fountain spacing
          // Get the raw content array from validation (prefer rawJson.content for original array structure)
          let contentArray = validation.rawJson?.content || validation.content.split('\n').filter(l => l.trim());
          
          // If array items contain newlines, split them into individual lines
          // This handles cases where AI returns multi-line strings in array items
          const expandedArray = [];
          for (const item of contentArray) {
            if (typeof item === 'string' && item.includes('\n')) {
              // Split multi-line items
              const lines = item.split('\n').map(l => l.trim()).filter(l => l);
              expandedArray.push(...lines);
            } else {
              expandedArray.push(item);
            }
          }
          contentArray = expandedArray;
          
          let formattedLines = [];
          
          console.log('[ScreenwriterModal] 📝 Content array (after expansion):', contentArray);
          console.log('[ScreenwriterModal] 📝 Content array length:', contentArray.length);
          console.log('[ScreenwriterModal] 📝 Content array items:', contentArray.map((item, idx) => `${idx}: "${item}"`));
          
          for (let i = 0; i < contentArray.length; i++) {
            const line = contentArray[i].trim();
            // Handle empty strings (blank lines) - preserve them
            if (!line) {
              formattedLines.push('');
              continue;
            }
            
            const prevLine = i > 0 ? contentArray[i - 1].trim() : '';
            const nextLine = i < contentArray.length - 1 ? contentArray[i + 1].trim() : '';
            
            // Check if this is a character name (ALL CAPS, not a scene heading, 2-50 chars)
            // EXCLUDE lines that contain lowercase letters (like "SARAH CHEN (30s)" - that's action, not character)
            // EXCLUDE lines that contain parentheses with content (character extensions are on same line as name)
            const isCharacterName = /^[A-Z][A-Z\s#0-9']+$/.test(line) && 
                                   line.length >= 2 && 
                                   line.length <= 50 && 
                                   !/^(INT\.|EXT\.|I\/E\.)/i.test(line) &&
                                   !/[a-z]/.test(line) && // No lowercase letters
                                   !/\([^)]+\)/.test(line); // No parenthetical content (like "(30s)")
            
            // Check if this is a parenthetical (wrapped in parentheses)
            const isParenthetical = /^\(.+\)$/.test(line);
            
            // Check if previous line was character name
            const prevIsCharacterName = prevLine && /^[A-Z][A-Z\s#0-9']+$/.test(prevLine) && 
                                       prevLine.length >= 2 && 
                                       prevLine.length <= 50 && 
                                       !/^(INT\.|EXT\.|I\/E\.)/i.test(prevLine);
            
            // Check if previous line was parenthetical
            const prevIsParenthetical = prevLine && /^\(.+\)$/.test(prevLine);
            
            // Check if this is dialogue (follows character name or parenthetical)
            const isDialogue = (prevIsCharacterName || prevIsParenthetical) && !isParenthetical && !isCharacterName;
            
            // Check if this is action (not character name, not dialogue, not parenthetical)
            const isAction = !isCharacterName && !isDialogue && !isParenthetical;
            
            // Check if next line is character name
            const nextIsCharacterName = nextLine && /^[A-Z][A-Z\s#0-9']+$/.test(nextLine) && 
                                       nextLine.length >= 2 && 
                                       nextLine.length <= 50 && 
                                       !/^(INT\.|EXT\.|I\/E\.)/i.test(nextLine);
            
            // Check if next line is parenthetical
            const nextIsParenthetical = nextLine && /^\(.+\)$/.test(nextLine);
            
            // Check if next line is dialogue (follows this character name or parenthetical)
            const nextIsDialogue = (isCharacterName || isParenthetical) && nextLine && !nextIsCharacterName && !nextIsParenthetical;
            
            // Check if next line is action (not character, not dialogue, not parenthetical)
            const nextIsAction = nextLine && !nextIsCharacterName && !nextIsDialogue && !nextIsParenthetical;
            
            // Check if previous line was action (not character, not dialogue, not parenthetical)
            const prevIsAction = prevLine && !prevIsCharacterName && !prevIsParenthetical && 
                                !/^\(.+\)$/.test(prevLine) && // Not parenthetical
                                !(/^[A-Z][A-Z\s#0-9']+$/.test(prevLine) && prevLine.length >= 2 && prevLine.length <= 50 && !/^(INT\.|EXT\.|I\/E\.)/i.test(prevLine)); // Not character
            
            console.log(`[ScreenwriterModal] Line ${i}: "${line}" | isChar:${isCharacterName} isParen:${isParenthetical} isDial:${isDialogue} isAction:${isAction} | prevIsAction:${prevIsAction} nextIsChar:${nextIsCharacterName} nextIsParen:${nextIsParenthetical} nextIsDial:${nextIsDialogue}`);
            
            // FOUNTAIN SPEC: Character has blank line BEFORE, NO blank line AFTER
            // Add blank line BEFORE character name if previous was action (or any non-character, non-parenthetical line)
            // We add it BEFORE the character (not after action) to avoid duplicates
            if (isCharacterName && prevLine && (prevIsAction || (!prevIsCharacterName && !prevIsParenthetical))) {
              // Only add if last line in formattedLines is not already empty
              if (formattedLines.length === 0 || formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
                console.log(`[ScreenwriterModal] ✅ Added blank line BEFORE character name (prev was action/non-character)`);
              } else {
                console.log(`[ScreenwriterModal] ℹ️ Skipped blank line BEFORE character (already exists)`);
              }
            }
            
            // Add the line
            formattedLines.push(line);
            
            // FOUNTAIN SPEC: Action → blank line → Character
            // Don't add blank line here - we add it BEFORE the character to avoid duplicates
            if (isAction && nextIsCharacterName) {
              // Don't add here - the character's "before" logic will handle it
              console.log(`[ScreenwriterModal] ℹ️ Action before character - blank line will be added by character's "before" logic`);
            }
            // FOUNTAIN SPEC: Character → NO blank line → Parenthetical/Dialogue
            // Character has "without an empty line after it" - dialogue/parenthetical follows immediately
            else if (isCharacterName && (nextIsParenthetical || nextIsDialogue)) {
              // No blank line - parenthetical/dialogue follows immediately on next line
              console.log(`[ScreenwriterModal] ℹ️ Character name - NO blank line after (next is parenthetical/dialogue)`);
            }
            // FOUNTAIN SPEC: Parenthetical → NO blank line → Dialogue
            // Parenthetical flows directly to dialogue
            else if (isParenthetical && nextIsDialogue) {
              // No blank line - dialogue follows immediately on next line
              console.log(`[ScreenwriterModal] ℹ️ Parenthetical - NO blank line after (next is dialogue)`);
            }
            // FOUNTAIN SPEC: Dialogue → blank line → Action/Character
            // Add blank line AFTER dialogue if next is action or character
            else if (isDialogue && nextLine && (nextIsAction || nextIsCharacterName)) {
              // Only add if last line is not already empty
              if (formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
                console.log(`[ScreenwriterModal] ✅ Added blank line AFTER dialogue (next is action/character)`);
              }
            }
          }
          
          // Join lines with newlines (empty strings create blank lines)
          // Then normalize: remove multiple consecutive blank lines (max 2 blank lines = 1 blank line)
          let formattedContent = formattedLines.join('\n');
          
          // Normalize excessive blank lines: replace 3+ consecutive newlines with just 2 (one blank line)
          formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
          
          console.log('[ScreenwriterModal] 📝 Formatted content:', formattedContent);
          console.log('[ScreenwriterModal] 📝 Formatted content (with newlines shown):', JSON.stringify(formattedContent.substring(0, 200)));
          
          // Format content for insertion
          let contentToInsert = formattedContent.trim();

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
          // Don't show error if cancelled
          if (controller.signal.aborted || isCancelledRef.current) {
            setIsLoading(false);
            setLoadingStage(null);
            setAbortController(null);
            return;
          }
          console.error('[ScreenwriterModal] Error:', error);
          toast.error(error.message || 'Failed to generate content');
          setIsLoading(false);
          setLoadingStage(null);
          setAbortController(null);
        }
      );

    } catch (error) {
      // Don't show error if cancelled
      if (controller.signal.aborted || isCancelledRef.current) {
        setIsLoading(false);
        setLoadingStage(null);
        setAbortController(null);
        return;
      }
      console.error('[ScreenwriterModal] Error:', error);
      toast.error(error.message || 'Failed to generate content');
      setIsLoading(false);
      setLoadingStage(null);
      setAbortController(null);
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
                      {/* Group by provider for better organization */}
                      <optgroup label="Anthropic (Claude)">
                        {LLM_MODELS.filter(m => m.provider === 'Anthropic').map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} {model.recommended ? '⭐' : ''}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="OpenAI (GPT)">
                        {LLM_MODELS.filter(m => m.provider === 'OpenAI').map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Google (Gemini)">
                        {LLM_MODELS.filter(m => m.provider === 'Google').map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </optgroup>
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
                <div className="relative px-6 py-6">
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
                  
                  {/* Enhanced Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100/90 backdrop-blur-sm z-10">
                      <div className="flex flex-col items-center gap-4 p-6 bg-base-200 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        
                        {/* Two-stage loading indicator with smooth animations */}
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div className="flex items-center gap-2 w-full">
                            {/* Building stage progress bar - CSS handles smooth animation */}
                            <div className="h-2 flex-1 rounded-full bg-base-300 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${
                                  loadingStage === 'building' || loadingStage === 'generating' 
                                    ? 'bg-primary w-full' 
                                    : 'bg-primary/30 w-0'
                                }`}
                              />
                            </div>
                            {/* Generating stage progress bar - CSS handles smooth animation */}
                            <div className="h-2 flex-1 rounded-full bg-base-300 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                  loadingStage === 'generating' 
                                    ? 'bg-primary w-full' 
                                    : 'bg-base-300 w-0'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between w-full text-xs text-base-content/60">
                            <span className={`transition-all duration-300 ${
                              loadingStage === 'building' || loadingStage === 'generating' 
                                ? 'text-primary font-medium' 
                                : ''
                            }`}>
                              Building context...
                            </span>
                            <span className={`transition-all duration-300 ${
                              loadingStage === 'generating' 
                                ? 'text-primary font-medium' 
                                : ''
                            }`}>
                              Generating...
                            </span>
                          </div>
                        </div>
                        
                        {/* Model-specific timing */}
                        <p className="text-xs text-base-content/50 text-center">
                          {getTimingMessage(selectedModel)}
                        </p>
                        
                        {/* Cancel button */}
                        <button
                          onClick={handleCancel}
                          className="btn btn-ghost btn-sm mt-2"
                          disabled={!isLoading}
                        >
                          Cancel
                        </button>
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

