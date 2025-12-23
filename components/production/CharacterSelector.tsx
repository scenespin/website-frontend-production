'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, User, Check } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  references?: string[];
  hasReferences?: boolean;
}

interface CharacterSelectorProps {
  characters: Character[];
  selectedCharacterIds: string[];
  onSelectionChange: (characterIds: string[]) => void;
  maxSelection?: number;
  isRequired?: boolean;
  warningMessage?: string;
}

export function CharacterSelector({
  characters,
  selectedCharacterIds,
  onSelectionChange,
  maxSelection = 5,
  isRequired = false,
  warningMessage
}: CharacterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCharacter = (characterId: string) => {
    if (selectedCharacterIds.includes(characterId)) {
      // Deselect
      onSelectionChange(selectedCharacterIds.filter(id => id !== characterId));
    } else {
      // Select (if under max)
      if (selectedCharacterIds.length < maxSelection) {
        onSelectionChange([...selectedCharacterIds, characterId]);
      }
    }
  };

  const selectedCharacters = characters.filter(char => selectedCharacterIds.includes(char.id));
  const availableCharacters = characters.filter(char => !selectedCharacterIds.includes(char.id));

  return (
    <div className="space-y-2">
      {/* Warning Message */}
      {warningMessage && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200 flex-1">
            {warningMessage}
          </p>
        </div>
      )}

      {/* Selected Characters */}
      {selectedCharacters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#FFFFFF]">
              Selected Characters ({selectedCharacters.length}/{maxSelection})
            </span>
            {isRequired && (
              <Badge variant="outline" className="border-[#DC143C] text-[#DC143C] text-xs">
                Required
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {selectedCharacters.map((char) => (
              <Card key={char.id} className="bg-[#1A1A1A] border-[#3F3F46]">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#3F3F46] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#808080]" />
                      </div>
                      <span className="text-xs text-[#FFFFFF] truncate">{char.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCharacter(char.id)}
                      className="h-6 w-6 p-0 hover:bg-[#3F3F46]"
                    >
                      <X className="w-3 h-3 text-[#808080]" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Character Browser */}
      <div>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border-[#3F3F46] text-[#FFFFFF] hover:bg-[#3F3F46] text-xs"
        >
          {isOpen ? 'Hide' : 'Browse'} Characters ({availableCharacters.length} available)
        </Button>

        {isOpen && (
          <Card className="mt-2 bg-[#1A1A1A] border-[#3F3F46]">
            <CardContent className="p-3">
              {availableCharacters.length === 0 ? (
                <p className="text-xs text-[#808080] text-center py-2">
                  No more characters available
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableCharacters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      disabled={selectedCharacterIds.length >= maxSelection}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-[#3F3F46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#3F3F46] flex items-center justify-center">
                          <User className="w-3 h-3 text-[#808080]" />
                        </div>
                        <span className="text-xs text-[#FFFFFF]">{char.name}</span>
                      </div>
                      {selectedCharacterIds.length < maxSelection && (
                        <Check className="w-4 h-4 text-[#808080]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Max Selection Warning */}
      {selectedCharacterIds.length >= maxSelection && (
        <p className="text-xs text-[#808080]">
          Maximum {maxSelection} characters selected
        </p>
      )}
    </div>
  );
}

