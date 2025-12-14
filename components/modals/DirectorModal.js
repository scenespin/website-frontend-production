'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Film, Plus, Minus } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { buildDirectorModalPrompt } from '@/utils/promptBuilders';
import { validateDirectorModalContent } from '@/utils/jsonValidator';
import { formatFountainSpacing } from '@/utils/fountainSpacing';
import toast from 'react-hot-toast';

// LLM Models for selection
const LLM_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', recommended: true }, // Best for scene generation
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI' }, // Latest - great for scenes
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic' }, // Most powerful
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google' }, // Latest
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' }, // Fast & efficient
  { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google' }, // Fastest & most economical
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic' }, // Fast & economical
  { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI' },
  { id: 'o3', name: 'O3', provider: 'OpenAI' }, // Reasoning - best for analysis
  { id: 'o1', name: 'O1', provider: 'OpenAI' }, // Reasoning - best for analysis
];

export default function DirectorModal({
  isOpen,
  onClose,
  editorContent,
  cursorPosition,
  selectionRange,
  onInsert
}) {
  const { state: chatState } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [sceneCount, setSceneCount] = useState(1);
  const [scenes, setScenes] = useState([
    { location: '', scenario: '', direction: '' }
  ]);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('director-selected-model');
      if (saved) return saved;
    }
    return chatState.selectedModel || 'claude-sonnet-4-5-20250929';
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSceneCount(1);
      setScenes([{ location: '', scenario: '', direction: '' }]);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Auto-detect scene context when modal opens
  useEffect(() => {
    if (isOpen && editorContent && cursorPosition !== undefined) {
      const sceneContext = detectCurrentScene(editorContent, cursorPosition);
      // Could auto-fill first scene location if needed, but let user control it
    }
  }, [isOpen, editorContent, cursorPosition]);

  // Update scenes array when sceneCount changes
  useEffect(() => {
    if (sceneCount > scenes.length) {
      // Add new scenes
      const newScenes = Array(sceneCount - scenes.length).fill(null).map(() => ({
        location: '',
        scenario: '',
        direction: ''
      }));
      setScenes([...scenes, ...newScenes]);
    } else if (sceneCount < scenes.length) {
      // Remove scenes
      setScenes(scenes.slice(0, sceneCount));
    }
  }, [sceneCount]);

  // Save model selection to localStorage
  useEffect(() => {
    if (selectedModel && typeof window !== 'undefined') {
      localStorage.setItem('director-selected-model', selectedModel);
    }
  }, [selectedModel]);

  // Handle Escape key to close modal (always allowed, even during loading)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const updateScene = (index, field, value) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    setScenes(updated);
  };

  const handleGenerate = async () => {
    // Validate all scenes have required fields
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.location.trim()) {
        toast.error(`Scene ${i + 1}: Location is required`);
        return;
      }
      if (!scene.scenario.trim()) {
        toast.error(`Scene ${i + 1}: Scenario is required`);
        return;
      }
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
        const beforeStart = Math.max(0, selectionRange.start - 200);
        contextBefore = editorContent.substring(beforeStart, selectionRange.start).trim();
        sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      } else {
        sceneContext = detectCurrentScene(editorContent, cursorPosition);
        if (sceneContext) {
          contextBefore = sceneContext.contextBeforeCursor || '';
        }
      }

      // Build prompt
      const builtPrompt = buildDirectorModalPrompt(scenes, sceneContext, contextBefore, true);

      // System prompt for director
      const systemPrompt = `You are a professional screenplay director. Generate complete scenes (5-30 lines each) in Fountain format.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, just JSON:
{
  "scenes": [
    {
      "heading": "INT. LOCATION - TIME",
      "content": ["action line", "CHARACTER", "dialogue", ...]
    },
    ...
  ],
  "totalLines": 15
}

Rules:
- MUST include scene headings (INT./EXT. LOCATION - TIME)
- NO markdown formatting
- Character names in ALL CAPS when speaking
- Action lines in normal case
- Each scene: 5-30 lines
- Total: ${sceneCount === 1 ? '5-30' : sceneCount === 2 ? '10-60' : '15-90'} lines across all scenes`;

      // Build structured output format if model supports it
      const { getDirectorSchema } = await import('../../utils/jsonSchemas');
      const { supportsStructuredOutputs } = await import('../../utils/jsonValidator');
      
      const responseFormat = supportsStructuredOutputs(selectedModel) ? {
        type: "json_schema",
        json_schema: {
          name: "director_content",
          schema: getDirectorSchema(sceneCount),
          strict: true
        }
      } : undefined;

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
          accumulatedText += chunk;
        },
        // onComplete
        async (fullContent) => {
          console.log('[DirectorModal] 📝 RAW AI RESPONSE:', fullContent.substring(0, 500));

          // Validate JSON
          const validation = validateDirectorModalContent(fullContent, contextBefore, sceneCount);

          if (!validation.valid) {
            console.error('[DirectorModal] ❌ JSON validation failed:', validation.errors);
            
            // Filter out non-critical errors (like totalLines mismatch)
            const criticalErrors = validation.errors.filter(err => 
              !err.includes('totalLines') && 
              !err.includes('does not match sum')
            );
            
            // Try to extract content anyway if we have rawJson with scenes
            if (validation.rawJson && validation.rawJson.scenes && Array.isArray(validation.rawJson.scenes) && validation.rawJson.scenes.length > 0) {
              console.warn('[DirectorModal] ⚠️ Validation failed but attempting to use content anyway');
              
              // Check if scenes are valid enough to use
              const hasValidScenes = validation.rawJson.scenes.every(scene => 
                scene.heading && 
                typeof scene.heading === 'string' &&
                scene.heading.trim().length > 0 &&
                scene.content && 
                Array.isArray(scene.content) && 
                scene.content.length >= 3  // Reduced from 5 to be more lenient
              );
              
              if (hasValidScenes) {
                console.log('[DirectorModal] ✅ Scenes appear valid, using content despite validation errors');
                // Show warning toast if there were critical errors, but continue
                if (criticalErrors.length > 0) {
                  toast.warning(`Warning: ${criticalErrors[0]}. Using content anyway.`);
                }
                // Continue with content extraction below
              } else {
                toast.error(`Invalid response: ${criticalErrors[0] || validation.errors[0] || 'Unknown error'}`);
                setIsLoading(false);
                return;
              }
            } else {
              toast.error(`Invalid response: ${criticalErrors[0] || validation.errors[0] || 'Unknown error'}`);
              setIsLoading(false);
              return;
            }
          } else {
            console.log('[DirectorModal] ✅ JSON validation passed');
          }

          // Extract scenes from validated JSON or rawJson
          const scenesToUse = validation.rawJson?.scenes || [];
          
          if (!scenesToUse || scenesToUse.length === 0) {
            toast.error('No valid scenes returned');
            setIsLoading(false);
            return;
          }

          // Format content with proper Fountain spacing for each scene
          const formattedScenes = [];
          for (const scene of scenesToUse) {
            // Apply spacing formatting to scene content
            let contentArray = scene.content || [];
            
            // Fix incorrectly capitalized action lines (lines that should be action but are in ALL CAPS)
            // Character introductions like "DR. MARTINEZ, 50s, weathered zookeeper" should be normal case
            contentArray = contentArray.map(line => {
              if (typeof line !== 'string') return line;
              
              const trimmed = line.trim();
              if (!trimmed) return line;
              
              // If line is ALL CAPS but contains description patterns (commas with age, descriptive words)
              // and it's not a scene heading or pure character name, it's likely an action line
              const isAllCaps = /^[A-Z\s.,'!?:;-]+$/.test(trimmed) && trimmed.length > 0;
              const hasDescriptionPattern = /,\s*\d+s|\d+\s*years|weathered|exits|enters|walks|runs|sits|stands|grabs|takes|opens|closes/i.test(trimmed);
              const isSceneHeading = /^(INT\.|EXT\.|I\/E\.)/i.test(trimmed);
              const isPureCharacterName = /^[A-Z][A-Z\s#0-9']+$/.test(trimmed) && 
                                         trimmed.length >= 2 && 
                                         trimmed.length <= 50 &&
                                         !/[a-z]/.test(trimmed) &&
                                         !/\([^)]+\)/.test(trimmed);
              
              // If it's ALL CAPS, has description pattern, and is NOT a scene heading or pure character name
              // Convert to proper sentence case (first letter capitalized, rest lowercase, but preserve proper nouns)
              if (isAllCaps && hasDescriptionPattern && !isSceneHeading && !isPureCharacterName) {
                // Convert to sentence case: first letter capitalized, rest lowercase
                // But preserve common proper nouns and titles
                const converted = trimmed.charAt(0) + trimmed.slice(1).toLowerCase();
                return converted;
              }
              
              return line;
            });
            
            const formattedContent = formatFountainSpacing(contentArray);
            
            // Format: scene heading + double newline + formatted content
            // Ensure formattedContent doesn't have trailing newlines (formatFountainSpacing already trims)
            // So we get: heading + \n\n + content (no trailing newline)
            formattedScenes.push(`${scene.heading}\n\n${formattedContent}`);
          }

          // Join all scenes with DOUBLE newline between them (Fountain spec: 2 blank lines between scenes)
          // This ensures: scene1_content\n\n\n\nscene2_heading\n\nscene2_content
          // Which becomes: scene1_content\n\n\n\nscene2_heading (correct spacing)
          let formattedContent = formattedScenes.join('\n\n');

          // Check spacing context around cursor for proper scene separation
          const textBeforeCursor = editorContent.substring(0, cursorPosition);
          const textAfterCursor = editorContent.substring(cursorPosition);
          
          // Check if cursor is at end of a scene (look for scene heading pattern before cursor)
          const textBeforeTrimmed = textBeforeCursor.trimEnd();
          const endsWithSceneHeading = /(INT\.|EXT\.|I\/E\.)\s+[A-Z\s]+-\s+(DAY|NIGHT|CONTINUOUS|LATER|MOMENTS LATER)/i.test(
            textBeforeTrimmed.substring(Math.max(0, textBeforeTrimmed.length - 100))
          );
          
          const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
          const textOnCurrentLine = lastNewlineIndex >= 0 
            ? textBeforeCursor.substring(lastNewlineIndex + 1)
            : textBeforeCursor;
          const hasTextOnCurrentLine = textOnCurrentLine.trim().length > 0;
          
          // Check if text after cursor starts with a scene heading
          const textAfterTrimmed = textAfterCursor.trimStart();
          const afterStartsWithSceneHeading = /^(INT\.|EXT\.|I\/E\.)\s+[A-Z\s]+-\s+(DAY|NIGHT|CONTINUOUS|LATER|MOMENTS LATER)/i.test(textAfterTrimmed);
          
          const hasTextAfter = textAfterCursor.trim().length > 0;
          const textAfterStartsWithNewline = textAfterCursor.startsWith('\n') || textAfterCursor.startsWith('\r\n');

          // FOUNTAIN SPEC: Two blank lines between scenes
          // Add spacing BEFORE insertion
          if (hasTextOnCurrentLine) {
            // If there's text on current line, we need double newline before first scene heading
            formattedContent = '\n\n' + formattedContent;
          } else if (endsWithSceneHeading) {
            // If cursor is after a scene heading, we need double newline to separate scenes
            formattedContent = '\n\n' + formattedContent;
          } else {
            // Otherwise, single newline is fine (we're continuing or starting fresh)
            formattedContent = '\n\n' + formattedContent;
          }

          // Add spacing AFTER insertion
          if (hasTextAfter) {
            if (afterStartsWithSceneHeading) {
              // If next text is a scene heading, ensure double newline separation
              if (!textAfterStartsWithNewline) {
                formattedContent = formattedContent + '\n\n';
              } else if (textAfterCursor.match(/^\n\n/)) {
                // Already has double newline, don't add more
              } else {
                // Has single newline, add one more
                formattedContent = formattedContent + '\n';
              }
            } else if (!textAfterStartsWithNewline) {
              // Regular text after, add single newline
              formattedContent = formattedContent + '\n';
            }
          }

          // Insert content
          onInsert(formattedContent);

          // Close modal
          onClose();

          // Show success toast
          toast.success(`Generated ${sceneCount} scene${sceneCount > 1 ? 's' : ''}`);
        },
        // onError
        (error) => {
          console.error('[DirectorModal] Error:', error);
          toast.error(error.message || 'Failed to generate content');
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('[DirectorModal] Error:', error);
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
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-700">
                      <Film className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                        Director Agent
                      </Dialog.Title>
                      <p className="text-xs text-base-content/60">
                        Generate complete scenes with scene headings
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
                      className="btn btn-ghost btn-sm btn-circle"
                      title="Close (ESC)"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Scene Count Selector */}
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">Number of Scenes</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setSceneCount(count)}
                            disabled={isLoading}
                            className={`btn btn-sm ${sceneCount === count ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {count} Scene{count > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scene Forms */}
                    {scenes.map((scene, index) => (
                      <div key={index} className="border border-base-300 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-base-content">Scene {index + 1}</h4>
                        </div>
                        
                        <div>
                          <label className="label">
                            <span className="label-text">Location *</span>
                          </label>
                          <input
                            type="text"
                            value={scene.location}
                            onChange={(e) => updateScene(index, 'location', e.target.value)}
                            disabled={isLoading}
                            placeholder="e.g., INT. WAREHOUSE - NIGHT or EXT. PARK - DAY"
                            className="input input-bordered w-full"
                            autoFocus={index === 0 && !scene.location}
                          />
                          <label className="label">
                            <span className="label-text-alt text-base-content/60">
                              Format: INT./EXT. LOCATION - TIME
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text">Scenario/Description *</span>
                          </label>
                          <textarea
                            value={scene.scenario}
                            onChange={(e) => updateScene(index, 'scenario', e.target.value)}
                            disabled={isLoading}
                            placeholder="What happens in this scene? Describe the action, characters, and key events."
                            className="textarea textarea-bordered w-full h-24 resize-none"
                          />
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text">Direction (Optional)</span>
                          </label>
                          <textarea
                            value={scene.direction}
                            onChange={(e) => updateScene(index, 'direction', e.target.value)}
                            disabled={isLoading}
                            placeholder="Tone, pacing, visual style, camera direction, etc."
                            className="textarea textarea-bordered w-full h-20 resize-none"
                          />
                        </div>
                      </div>
                    ))}

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
                        disabled={isLoading || scenes.some(s => !s.location.trim() || !s.scenario.trim())}
                        className="btn btn-primary btn-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          `Generate ${sceneCount} Scene${sceneCount > 1 ? 's' : ''}`
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

