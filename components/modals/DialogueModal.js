'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { api } from '@/lib/api';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { buildDialoguePrompt } from '@/utils/promptBuilders';
import { validateDialogueContent } from '@/utils/jsonValidator';
import { formatFountainSpacing } from '@/utils/fountainSpacing';
import toast from 'react-hot-toast';

// LLM Models for selection
const LLM_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', recommended: true }, // Best for dialogue
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' }, // Excellent for natural dialogue
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI' }, // Latest - great dialogue
  { id: 'claude-opus-4-5-20251124', name: 'Claude Opus 4.5', provider: 'Anthropic' }, // Most powerful
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google' }, // Latest
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic' }, // Fast & economical
  { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'o3', name: 'O3', provider: 'OpenAI' }, // Reasoning - best for analysis
  { id: 'o1', name: 'O1', provider: 'OpenAI' }, // Reasoning - best for analysis
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

    try {
      // Detect context
      let sceneContext = null;
      if (selectionRange && selectionRange.start !== selectionRange.end) {
        sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      } else {
        sceneContext = detectCurrentScene(editorContent, cursorPosition);
      }

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

      // Build prompt
      const builtPrompt = buildDialoguePrompt(formData, sceneContext, true);

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
          console.log('[DialogueModal] 📝 RAW AI RESPONSE:', fullContent.substring(0, 500));

          // Validate JSON
          const validation = validateDialogueContent(fullContent);

          if (!validation.valid) {
            console.error('[DialogueModal] ❌ JSON validation failed:', validation.errors);
            toast.error(`Invalid response: ${validation.errors[0] || 'Unknown error'}`);
            setIsLoading(false);
            return;
          }

          console.log('[DialogueModal] ✅ JSON validation passed');

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

          // Close modal
          onClose();

          // Show success toast
          toast.success('Dialogue generated and inserted');
        },
        // onError
        (error) => {
          console.error('[DialogueModal] Error:', error);
          toast.error(error.message || 'Failed to generate dialogue');
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('[DialogueModal] Error:', error);
      toast.error(error.message || 'Failed to generate dialogue');
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
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                        Dialogue Agent
                      </Dialog.Title>
                      <p className="text-xs text-base-content/60">
                        Generate professional screenplay dialogue
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
                
                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
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
                        value={act}
                        onChange={(e) => setAct(Number(e.target.value))}
                        disabled={isLoading}
                        className="select select-bordered w-full"
                      >
                        <option value={1}>Act 1</option>
                        <option value={2}>Act 2</option>
                        <option value={3}>Act 3</option>
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
                              <span className="text-sm">{char.name}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-base-content/60 col-span-2">No characters found. Add characters to your screenplay first.</p>
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

