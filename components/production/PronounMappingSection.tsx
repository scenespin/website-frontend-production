'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Character {
  id: string;
  name: string;
}

interface PronounMappingSectionProps {
  pronouns: string[];
  characters: Character[];
  selectedCharacters?: string[]; // Pre-selected characters (e.g., from auto-detection)
  pronounMappings: Record<string, string>; // { "she": "char-123", "he": "char-456" }
  onPronounMappingChange: (pronoun: string, characterId: string | undefined) => void;
  onCharacterSelectionChange?: (characterIds: string[]) => void; // Optional: to auto-select characters when mapped
}

export function PronounMappingSection({
  pronouns,
  characters,
  selectedCharacters = [],
  pronounMappings,
  onPronounMappingChange,
  onCharacterSelectionChange
}: PronounMappingSectionProps) {
  // Auto-select characters when they're mapped (if callback provided)
  React.useEffect(() => {
    if (onCharacterSelectionChange) {
      const mappedCharacterIds = new Set(Object.values(pronounMappings).filter(Boolean));
      if (mappedCharacterIds.size > 0) {
        const newSelection = Array.from(mappedCharacterIds);
        // Only update if selection changed
        const currentSelection = selectedCharacters || [];
        if (newSelection.length !== currentSelection.length || 
            !newSelection.every(id => currentSelection.includes(id))) {
          onCharacterSelectionChange(newSelection);
        }
      }
    }
  }, [pronounMappings, onCharacterSelectionChange, selectedCharacters]); // Trigger when mappings change

  const allMapped = pronouns.every(p => pronounMappings[p.toLowerCase()]);

  return (
    <div className="space-y-3">
      {/* Warning Message */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-yellow-200">
            Pronouns detected: "{pronouns.join('", "')}"
          </p>
          <p className="text-[10px] text-yellow-300/80 mt-1">
            Please map each pronoun to a character below.
          </p>
        </div>
      </div>

      {/* Pronoun Mapping Dropdowns */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">
          Map Pronouns to Characters
        </div>
        {pronouns.map((pronoun) => {
          const mappedCharacterId = pronounMappings[pronoun.toLowerCase()];
          const mappedCharacter = mappedCharacterId 
            ? characters.find(c => c.id === mappedCharacterId)
            : null;

          return (
            <div key={pronoun} className="flex items-center gap-3">
              <label className="text-xs text-[#808080] min-w-[60px]">
                "{pronoun}"
              </label>
              <select
                value={mappedCharacterId || ''}
                onChange={(e) => {
                  const characterId = e.target.value || undefined;
                  onPronounMappingChange(pronoun.toLowerCase(), characterId);
                }}
                className="flex-1 px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
              >
                <option value="">-- Select character --</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
              {mappedCharacter && (
                <span className="text-[10px] text-[#808080]">
                  ✓ {mappedCharacter.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Status */}
      {allMapped && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-2 flex items-center gap-2">
          <span className="text-[10px] text-green-300">
            ✓ All pronouns mapped
          </span>
        </div>
      )}
    </div>
  );
}

