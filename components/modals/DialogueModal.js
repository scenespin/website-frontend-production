'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { api } from '@/lib/api';
import { detectCurrentScene, extractRecentDialogue, extractSceneAction } from '@/utils/sceneDetection';
import { buildDialoguePrompt } from '@/utils/promptBuilders';
import { buildCharacterSummaries } from '@/utils/characterContextBuilder';
import { validateDialogueContent } from '@/utils/jsonValidator';
import { formatFountainSpacing } from '@/utils/fountainSpacing';
import { getTimingMessage } from '@/utils/modelTiming';
import { createClientLogger } from '@/utils/clientLogger';
import toast from 'react-hot-toast';
// ModelSelect removed - using DaisyUI select instead
const ENABLE_EDITOR_AGENT_DEBUG_LOGS =
  process.env.NODE_ENV !== 'production' &&
  (process.env.NEXT_PUBLIC_ENABLE_EDITOR_AGENT_DEBUG === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_REWRITE_DEBUG === 'true');
const logger = createClientLogger('DialogueModal', {
  debugEnabled: ENABLE_EDITOR_AGENT_DEBUG_LOGS,
  warnEnabled: ENABLE_EDITOR_AGENT_DEBUG_LOGS
});

// LLM Models - Same order and list as UnifiedChatPanel for consistency
// Curated list: 8 models across 3 providers (latest flagship + fast option + premium option per provider)
// Order: Anthropic (Claude) → OpenAI (GPT) → Google (Gemini)
const LLM_MODELS = [
  // Claude (Anthropic) - Best for Creative Writing
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: '⭐ Best for creative writing & screenplays', recommended: true },
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', provider: 'Anthropic', description: 'Most powerful - Enhanced coding & reasoning (3x cheaper pricing!)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast & economical' },
  // GPT (OpenAI) - Good for Creative Writing
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Latest - Excellent for creative writing' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Balanced - Good for dialogue & scenes' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', description: 'Reasoning model - Best for analysis' },
  // Gemini (Google) - Good for Complex Narratives
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Latest - Most intelligent, advanced reasoning' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient' },
  // Grok (xAI) - Strong Reasoning & Creative
  { id: 'grok-4-0709', name: 'Grok 4', provider: 'xAI', description: 'Flagship - Deep reasoning & analysis' },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Fast with reasoning capabilities' },
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Lite', provider: 'xAI', description: 'Ultra-fast & economical' },
];

const TONE_OPTIONS = [
  'tense', 'dramatic', 'comedic', 'romantic', 'suspenseful', 'casual', 'formal', 'other'
];

export default function DialogueModal({
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
  const [sceneHeading, setSceneHeading] = useState('');
  const [act, setAct] = useState(1);
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [conflict, setConflict] = useState('');
  const [tone, setTone] = useState('tense');
  const [customTone, setCustomTone] = useState('');
  const [subtext, setSubtext] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [characterWants, setCharacterWants] = useState('');
  const [powerDynamics, setPowerDynamics] = useState('');
  const [specificLines, setSpecificLines] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dialogue-selected-model');
      if (saved) return saved;
    }
    return chatState.selectedModel || 'claude-sonnet-4-5-20250929';
  });

  // Simple handler - Headless UI doesn't have the infinite loop issues that Radix UI had
  const handleModelChange = (value) => {
    setSelectedModel(value);
  };

  // Auto-detect scene context when modal opens
  useEffect(() => {
    if (isOpen && editorContent && cursorPosition !== undefined) {
      const sceneContext = detectCurrentScene(editorContent, cursorPosition);
      if (sceneContext) {
        if (sceneContext.heading) {
          setSceneHeading(sceneContext.heading);
        }
        if (sceneContext.act) {
          setAct(sceneContext.act);
        }
        if (sceneContext.characters && sceneContext.characters.length > 0) {
          // Auto-select characters that are in the current scene
          const characterNames = sceneContext.characters;
          const matchingCharacters = characters.filter(c => 
            characterNames.includes(c.name.toUpperCase())
          );
          setSelectedCharacters(matchingCharacters.map(c => c.name));
        }
      }
    }
  }, [isOpen, editorContent, cursorPosition, characters]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSceneHeading('');
      setAct(1);
      setSelectedCharacters([]);
      setConflict('');
      setTone('tense');
      setCustomTone('');
      setSubtext('');
      setShowAdvanced(false);
      setCharacterWants('');
      setPowerDynamics('');
      setSpecificLines('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Save model selection to localStorage
  useEffect(() => {
    if (selectedModel && typeof window !== 'undefined') {
      localStorage.setItem('dialogue-selected-model', selectedModel);
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
  
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setLoadingStage(null);
      setAbortController(null);
      toast('Generation cancelled');
    }
  };

  const toggleCharacter = (characterName) => {
    setSelectedCharacters(prev => 
      prev.includes(characterName)
        ? prev.filter(c => c !== characterName)
        : [...prev, characterName]
    );
  };

  const handleGenerate = async () => {
    // Validation
    if (!conflict.trim()) {
      toast.error('Conflict/Tension is required');
      return;
    }
    if (selectedCharacters.length === 0) {
      toast.error('Please select at least one character');
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
      // Detect context
      let sceneContext = null;
      if (selectionRange && selectionRange.start !== selectionRange.end) {
        sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      } else {
        sceneContext = detectCurrentScene(editorContent, cursorPosition);
      }

      // Enhanced context: Get full current scene, recent dialogue, scene action, and character summaries
      const fullCurrentScene = sceneContext?.content || '';
      const recentDialogue = fullCurrentScene ? extractRecentDialogue(fullCurrentScene, 5) : [];
      const sceneAction = fullCurrentScene ? extractSceneAction(fullCurrentScene) : [];
      
      // Get character summaries for selected characters
      const selectedCharacterObjects = (characters || []).filter(char => 
        selectedCharacters.includes(char.name)
      );
      const characterSummaries = buildCharacterSummaries(selectedCharacterObjects, sceneContext);

      // Build form data
      const formData = {
        sceneHeading: sceneHeading || sceneContext?.heading || '',
        act: act,
        characters: selectedCharacters,
        conflict: conflict,
        tone: tone === 'other' ? customTone : tone,
        subtext: subtext,
        characterWants: characterWants,
        powerDynamics: powerDynamics,
        specificLines: specificLines
      };

      // Build prompt with enhanced context
      const builtPrompt = buildDialoguePrompt(
        formData, 
        sceneContext, 
        fullCurrentScene,
        recentDialogue,
        sceneAction,
        characterSummaries,
        true
      );

      // System prompt for dialogue
      const systemPrompt = `You are a professional screenwriting dialogue assistant. Generate compelling dialogue with subtext.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, just JSON:
{
  "dialogue": [
    {"character": "CHARACTER", "line": "dialogue text", "subtext": "optional subtext"},
    ...
  ],
  "breakdown": "optional analysis"
}

Rules:
- Character names in ALL CAPS
- Natural, realistic dialogue
- Subtext where appropriate
- NO markdown formatting
- Each dialogue exchange should advance the scene`;

      // Call API
      let accumulatedText = '';

      // Build structured output format if model supports it
      // Use same pattern as RewriteModal (working with Anthropic beta)
      let responseFormat = undefined;
      const { getDialogSchema } = await import('../../utils/jsonSchemas');
      const { supportsStructuredOutputs } = await import('../../utils/jsonValidator');
      
      if (supportsStructuredOutputs(selectedModel)) {
        responseFormat = {
          type: "json_schema",
          json_schema: {
            schema: getDialogSchema(),
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
          logger.debug('Raw AI response:', fullContent.substring(0, 500));

          // Validate JSON
          const validation = validateDialogueContent(fullContent);

          if (!validation.valid) {
            logger.error('JSON validation failed:', validation.errors);
            toast.error(`Invalid response: ${validation.errors[0] || 'Unknown error'}`);
            setIsLoading(false);
            return;
          }

          logger.debug('JSON validation passed');

          if (!validation.content || validation.content.trim().length === 0) {
            toast.error('No valid content returned');
            setIsLoading(false);
            return;
          }

          // Format dialogue with proper Fountain spacing
          const dialogueArray = validation.rawJson.dialogue || [];
          const formattedExchanges = [];
          
          for (const exchange of dialogueArray) {
            const characterName = exchange.character.toUpperCase();
            let dialogueText = exchange.line;
            
            // If subtext exists, add as parenthetical
            if (exchange.subtext && exchange.subtext.trim()) {
              formattedExchanges.push(characterName);
              formattedExchanges.push(`(${exchange.subtext.trim()})`);
              formattedExchanges.push(dialogueText);
            } else {
              formattedExchanges.push(characterName);
              formattedExchanges.push(dialogueText);
            }
          }

          // Apply Fountain spacing formatting
          const formattedContent = formatFountainSpacing(formattedExchanges);

          // Check spacing context around cursor
          const textBeforeCursor = editorContent.substring(0, cursorPosition);
          const textAfterCursor = editorContent.substring(cursorPosition);
          
          const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
          const textOnCurrentLine = lastNewlineIndex >= 0 
            ? textBeforeCursor.substring(lastNewlineIndex + 1)
            : textBeforeCursor;
          const hasTextOnCurrentLine = textOnCurrentLine.trim().length > 0;
          
          const hasTextAfter = textAfterCursor.trim().length > 0;
          const textAfterStartsWithNewline = textAfterCursor.startsWith('\n') || textAfterCursor.startsWith('\r\n');

          // Add newline BEFORE if there's text on the current line
          let contentToInsert = formattedContent.trim();
          if (hasTextOnCurrentLine) {
            contentToInsert = '\n\n' + contentToInsert;
          } else {
            contentToInsert = '\n' + contentToInsert;
          }

          // Add newline AFTER if there's text after cursor and it doesn't start with newline
          if (hasTextAfter && !textAfterStartsWithNewline) {
            contentToInsert = contentToInsert + '\n';
          }

          // Insert content
          onInsert(contentToInsert);

          // Show success toast
          toast.success('Dialogue generated and inserted');

          // Refresh credits immediately after Dialogue completes
          if (typeof window !== 'undefined' && window.refreshCredits) {
            window.refreshCredits();
          }

          // Wait for state update to complete before closing modal (prevents mobile refresh issue)
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            setTimeout(() => {
              // Close modal after state update completes
              onClose();

              // Restore focus to editor (mobile-safe: only use focus, not click)
              setTimeout(() => {
                const textarea = document.querySelector('textarea[placeholder*="screenplay"]') || 
                               document.querySelector('textarea');
                if (textarea) {
                  // On mobile, only use focus() - click() can cause page refresh
                  const isMobile = window.innerWidth < 768;
                  if (isMobile) {
                    textarea.focus();
                  } else {
                    textarea.focus();
                    textarea.click();
                  }
                }
              }, 100);
            }, 100);
          });
        },
        // onError
        (error) => {
          logger.error('Error:', error);
          toast.error(error.message || 'Failed to generate dialogue');
          setIsLoading(false);
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
      logger.error('Error:', error);
      toast.error(error.message || 'Failed to generate dialogue');
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
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-base-300 px-6 py-4 flex-shrink-0">
                  {/* Desktop: Horizontal layout with icon */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg relative overflow-hidden backdrop-blur-lg border-2 border-white/30"
                        style={{
                          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)',
                        }}
                      >
                        {/* Glass overlay with shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                        <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/20 rounded-full blur-xl pointer-events-none" />
                        <span className="text-xl relative z-10">💬</span>
                      </div>
                      <div className="flex-1">
                        <Dialog.Title as="h3" className="text-base font-semibold text-base-content">
                          Dialogue Agent
                        </Dialog.Title>
                        <p className="text-xs text-base-content/60">
                          Generate professional screenplay dialogue
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Model Selector - DaisyUI select */}
                      <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={isLoading}
                        className="select select-bordered select-sm max-w-[140px]"
                      >
                        {(() => {
                          const grouped = LLM_MODELS.reduce((acc, model) => {
                            if (!acc[model.provider]) acc[model.provider] = [];
                            acc[model.provider].push(model);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([provider, models]) => (
                            <optgroup key={provider} label={provider}>
                              {models.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.name}
                                </option>
                              ))}
                            </optgroup>
                          ));
                        })()}
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
                  
                  {/* Mobile: Vertical layout without icon */}
                  <div className="md:hidden flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Dialog.Title as="h3" className="text-base font-semibold text-base-content">
                          Dialogue Agent
                        </Dialog.Title>
                        <p className="text-xs text-base-content/60">
                          Generate professional screenplay dialogue
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn btn-ghost btn-sm btn-circle"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Model Selector - Full width on mobile */}
                    <select
                      value={selectedModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      disabled={isLoading}
                      className="select select-bordered select-sm w-full"
                    >
                      {(() => {
                        const grouped = LLM_MODELS.reduce((acc, model) => {
                          if (!acc[model.provider]) acc[model.provider] = [];
                          acc[model.provider].push(model);
                          return acc;
                        }, {});
                        return Object.entries(grouped).map(([provider, models]) => (
                          <optgroup key={provider} label={provider}>
                            {models.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name}
                              </option>
                            ))}
                          </optgroup>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
                
                {/* Content - Scrollable */}
                <div className="relative flex-1 overflow-y-auto px-6 py-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Scene Heading */}
                    <div>
                      <label className="label">
                        <span className="label-text">Scene Heading</span>
                      </label>
                      <input
                        type="text"
                        value={sceneHeading}
                        onChange={(e) => setSceneHeading(e.target.value)}
                        disabled={isLoading}
                        placeholder="e.g., INT. WAREHOUSE - NIGHT"
                        className="input input-bordered w-full"
                      />
                    </div>

                    {/* Act */}
                    <div>
                      <label className="label">
                        <span className="label-text">Act</span>
                      </label>
                      <select
                        value={act.toString()}
                        onChange={(e) => setAct(Number(e.target.value))}
                        disabled={isLoading}
                        className="select select-bordered w-full"
                      >
                        <option value="1">Act 1</option>
                        <option value="2">Act 2</option>
                        <option value="3">Act 3</option>
                      </select>
                    </div>

                    {/* Characters */}
                    <div>
                      <label className="label">
                        <span className="label-text">Characters *</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-base-300 rounded-lg p-3">
                        {characters && characters.length > 0 ? (
                          characters.map((char) => (
                            <label key={char.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedCharacters.includes(char.name)}
                                onChange={() => toggleCharacter(char.name)}
                                disabled={isLoading}
                                className="checkbox checkbox-sm"
                              />
                              <span className="text-xs">{char.name}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-xs text-base-content/60 col-span-2">No characters found. Add characters to your screenplay first.</p>
                        )}
                      </div>
                    </div>

                    {/* Conflict/Tension */}
                    <div>
                      <label className="label">
                        <span className="label-text">Conflict/Tension *</span>
                      </label>
                      <textarea
                        value={conflict}
                        onChange={(e) => setConflict(e.target.value)}
                        disabled={isLoading}
                        placeholder="Describe the conflict, tension, or what's at stake in this dialogue..."
                        className="textarea textarea-bordered w-full h-24 resize-none"
                        required
                      />
                    </div>

                    {/* Tone */}
                    <div>
                      <label className="label">
                        <span className="label-text">Tone</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {TONE_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setTone(option)}
                            disabled={isLoading}
                            className={`btn btn-sm ${tone === option ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </button>
                        ))}
                      </div>
                      {tone === 'other' && (
                        <input
                          type="text"
                          value={customTone}
                          onChange={(e) => setCustomTone(e.target.value)}
                          disabled={isLoading}
                          placeholder="Describe the tone..."
                          className="input input-bordered w-full"
                        />
                      )}
                    </div>

                    {/* Subtext */}
                    <div>
                      <label className="label">
                        <span className="label-text">Subtext (Optional)</span>
                      </label>
                      <textarea
                        value={subtext}
                        onChange={(e) => setSubtext(e.target.value)}
                        disabled={isLoading}
                        placeholder="What's really being communicated beneath the surface?"
                        className="textarea textarea-bordered w-full h-20 resize-none"
                      />
                    </div>

                    {/* Advanced Options */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm font-medium text-base-content/70 hover:text-base-content"
                      >
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Advanced Options
                      </button>
                      {showAdvanced && (
                        <div className="mt-2 space-y-4 pl-6 border-l-2 border-base-300">
                          <div>
                            <label className="label">
                              <span className="label-text">Character Wants</span>
                            </label>
                            <textarea
                              value={characterWants}
                              onChange={(e) => setCharacterWants(e.target.value)}
                              disabled={isLoading}
                              placeholder="What does each character want in this dialogue?"
                              className="textarea textarea-bordered w-full h-20 resize-none"
                            />
                          </div>
                          <div>
                            <label className="label">
                              <span className="label-text">Power Dynamics</span>
                            </label>
                            <textarea
                              value={powerDynamics}
                              onChange={(e) => setPowerDynamics(e.target.value)}
                              disabled={isLoading}
                              placeholder="Who has power in this scene? How does it shift?"
                              className="textarea textarea-bordered w-full h-20 resize-none"
                            />
                          </div>
                          <div>
                            <label className="label">
                              <span className="label-text">Specific Lines</span>
                            </label>
                            <textarea
                              value={specificLines}
                              onChange={(e) => setSpecificLines(e.target.value)}
                              disabled={isLoading}
                              placeholder="Any specific dialogue lines you want to include?"
                              className="textarea textarea-bordered w-full h-20 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
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
                        disabled={isLoading || !conflict.trim() || selectedCharacters.length === 0}
                        className="btn btn-primary btn-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          'Generate Dialogue'
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

