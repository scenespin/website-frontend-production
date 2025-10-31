// Dialogue Context Selector Component
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Zap, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { Character as ScreenplayCharacter, StoryBeat as ScreenplayStoryBeat } from '../../../types/screenplay';

interface Character {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface DialogueContext {
  sceneHeading: string;
  act: number;
  storyBeat?: ScreenplayStoryBeat;
  characters: Character[];
  conflict: string;
  tone: string;
  subtext?: string;
  desiredOutcome?: string;
  // Advanced options
  characterWants?: { [characterId: string]: string };
  powerDynamics?: string;
  specificLines?: string;
}

interface DialogueContextSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickGenerate: (context: DialogueContext) => void;
  onGuidedInterview: () => void;
  initialContext?: Partial<DialogueContext>;
}

export function DialogueContextSelector({
  isOpen,
  onClose,
  onQuickGenerate,
  onGuidedInterview,
  initialContext
}: DialogueContextSelectorProps) {
  const { characters, beats } = useScreenplay();
  
  const [context, setContext] = useState<DialogueContext>({
    sceneHeading: initialContext?.sceneHeading || '',
    act: initialContext?.act || 1,
    storyBeat: initialContext?.storyBeat,
    characters: initialContext?.characters || [],
    conflict: initialContext?.conflict || '',
    tone: initialContext?.tone || 'tense',
    subtext: initialContext?.subtext || '',
    desiredOutcome: initialContext?.desiredOutcome || '',
    characterWants: {},
    powerDynamics: '',
    specificLines: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<ScreenplayCharacter[]>([]);
  const [availableBeats, setAvailableBeats] = useState<ScreenplayStoryBeat[]>([]);

  useEffect(() => {
    // Load available characters and story beats
    if (characters) {
      setAvailableCharacters(characters);
    }
    if (beats) {
      setAvailableBeats(beats);
    }
  }, [characters, beats]);

  const toggleCharacter = (character: Character) => {
    setContext(prev => ({
      ...prev,
      characters: prev.characters.find(c => c.id === character.id)
        ? prev.characters.filter(c => c.id !== character.id)
        : [...prev.characters, character]
    }));
  };

  const handleQuickGenerate = () => {
    if (!context.conflict.trim()) {
      alert('Please describe the conflict or tension in this scene.');
      return;
    }
    if (context.characters.length === 0) {
      alert('Please select at least one character.');
      return;
    }
    onQuickGenerate(context);
  };

  const toneOptions = [
    'Tense',
    'Playful',
    'Dramatic',
    'Heartbreaking',
    'Comedic',
    'Mysterious',
    'Romantic',
    'Confrontational'
  ];

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Generate Dialogue</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Create professional screenplay dialogue with subtext
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
          {/* Scene Context */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              📍 Scene Heading
            </label>
            <input
              type="text"
              value={context.sceneHeading}
              onChange={(e) => setContext(prev => ({ ...prev, sceneHeading: e.target.value }))}
              placeholder="INT. COFFEE SHOP - DAY"
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Example: INT. COFFEE SHOP - DAY or EXT. CITY STREET - NIGHT</p>
          </div>

          {/* Act */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🎬 Act
            </label>
            <select
              value={context.act}
              onChange={(e) => setContext(prev => ({ ...prev, act: Number(e.target.value) }))}
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            >
              <option value={1}>Act 1 - Setup</option>
              <option value={2}>Act 2 - Confrontation</option>
              <option value={3}>Act 3 - Resolution</option>
            </select>
          </div>

          {/* Story Beat (Optional) */}
          {availableBeats.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                📝 Story Beat (Optional)
              </label>
              <select
                value={context.storyBeat?.id || ''}
                onChange={(e) => {
                  const beat = availableBeats.find(b => b.id === e.target.value);
                  setContext(prev => ({ ...prev, storyBeat: beat }));
                }}
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">Select a story beat...</option>
                {availableBeats.map(beat => (
                  <option key={beat.id} value={beat.id}>
                    {beat.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Characters */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              👥 Characters in Scene *
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 dark:border-slate-700">
              {availableCharacters.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No characters created yet. Add characters to your screenplay first.</p>
              ) : (
                availableCharacters.map(char => (
                  <label key={char.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={context.characters.some(c => c.id === char.id)}
                      onChange={() => toggleCharacter(char)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{char.name}</span>
                    <span className="text-xs text-gray-500">({char.type})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Conflict/Tension */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🎯 What&apos;s the conflict or tension? *
            </label>
            <Textarea
              value={context.conflict}
              onChange={(e) => setContext(prev => ({ ...prev, conflict: e.target.value }))}
              placeholder="Sarah discovers Mike has been lying to her about his past. She confronts him but he's defensive."
              rows={3}
              className="dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              💬 Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {toneOptions.map(tone => (
                <button
                  key={tone}
                  onClick={() => setContext(prev => ({ ...prev, tone: tone.toLowerCase() }))}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    context.tone === tone.toLowerCase()
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={context.tone}
              onChange={(e) => setContext(prev => ({ ...prev, tone: e.target.value }))}
              placeholder="Or type custom tone..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 mt-2"
            />
          </div>

          {/* Subtext (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              💭 Subtext (Optional)
            </label>
            <Textarea
              value={context.subtext}
              onChange={(e) => setContext(prev => ({ ...prev, subtext: e.target.value }))}
              placeholder="What's NOT being said directly? E.g., 'Both trying to protect each other' or 'He knows she knows'"
              rows={2}
              className="dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Options (Optional)
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Desired Outcome
                </label>
                <input
                  type="text"
                  value={context.desiredOutcome}
                  onChange={(e) => setContext(prev => ({ ...prev, desiredOutcome: e.target.value }))}
                  placeholder="How should this conversation end?"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Power Dynamics
                </label>
                <input
                  type="text"
                  value={context.powerDynamics}
                  onChange={(e) => setContext(prev => ({ ...prev, powerDynamics: e.target.value }))}
                  placeholder="Who has the upper hand? Does it shift?"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Specific Lines or Moments
                </label>
                <Textarea
                  value={context.specificLines}
                  onChange={(e) => setContext(prev => ({ ...prev, specificLines: e.target.value }))}
                  placeholder="Any specific lines or moments you're imagining?"
                  rows={2}
                  className="dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 p-6 rounded-b-lg border-t dark:border-slate-700 space-y-3">
          <Button
            onClick={handleQuickGenerate}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6"
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Quick Generate
            <span className="ml-2 text-xs opacity-80">⏱️ Fast</span>
          </Button>

          <Button
            onClick={onGuidedInterview}
            variant="outline"
            className="w-full py-6"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Guided Interview Instead
            <span className="ml-2 text-xs opacity-60">⏱️ Thorough</span>
          </Button>

          <p className="text-xs text-center text-gray-500">
            * Required fields
          </p>
        </div>
    </div>
  );
}

