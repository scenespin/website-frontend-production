'use client';

/**
 * DialogueConfirmationPanel - Feature 0158
 * 
 * Two-mode dialogue review system:
 * - Issue Detection Mode: Only shows when issues detected (duplicates, action lines)
 * - Full Review Mode: Shows all dialogue blocks (paginated for large scenes)
 * 
 * Since dialogue blocks are stored in database anyway, full review is cost-free
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface DialogueBlock {
  character: string;
  parenthetical?: string;
  dialogue: string;
  precedingAction?: string;
  lineNumber?: number;
}

interface DialogueConfirmationPanelProps {
  dialogue: {
    hasDialogue: boolean;
    blocks: DialogueBlock[];
    characterMapping: Array<{
      characterId: string;
      characterName: string;
      blocks: DialogueBlock[];
      totalLength: number;
      matchingConfidence: 'exact' | 'fuzzy' | 'uncertain';
      hasDuplicates: boolean;
      duplicateBlocks?: Array<{ blockIndex: number; duplicateOf: number }>;
      hasActionLines: boolean;
      actionLineBlocks?: Array<{ blockIndex: number; reason: string }>;
    }>;
    needsReview: boolean;
  };
  mode?: 'issue-detection' | 'full-review';
  userPreference?: 'always-review' | 'review-issues-only';
  onConfirm: (confirmedDialogue: {
    characterMapping: Array<{
      characterId: string;
      blocks: DialogueBlock[];
    }>;
  }) => void;
  onSkip: () => void;
  onToggleMode?: () => void;
}

const BLOCKS_PER_PAGE = 10;

export function DialogueConfirmationPanel({
  dialogue,
  mode: initialMode,
  userPreference = 'review-issues-only',
  onConfirm,
  onSkip,
  onToggleMode
}: DialogueConfirmationPanelProps) {
  // Determine initial mode
  const defaultMode = userPreference === 'always-review' ? 'full-review' : 'issue-detection';
  const [mode, setMode] = useState<'issue-detection' | 'full-review'>(initialMode || defaultMode);
  const [removedBlockIndices, setRemovedBlockIndices] = useState<Set<string>>(new Set());
  const [characterPages, setCharacterPages] = useState<Map<string, number>>(new Map());
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter characters based on mode
  const displayCharacters = useMemo(() => {
    if (mode === 'full-review') {
      return dialogue.characterMapping;
    }
    // Issue Detection Mode: Only show characters with issues or uncertain matches
    return dialogue.characterMapping.filter(
      char => char.hasDuplicates || char.hasActionLines || char.matchingConfidence === 'uncertain'
    );
  }, [dialogue.characterMapping, mode]);

  // Get paginated blocks for a character
  const getPaginatedBlocks = (character: typeof dialogue.characterMapping[0]) => {
    const blocks = character.blocks.filter((_, idx) => {
      const blockKey = `${character.characterId}-${idx}`;
      return !removedBlockIndices.has(blockKey);
    });
    
    const currentPage = characterPages.get(character.characterId) || 1;
    const totalPages = Math.ceil(blocks.length / BLOCKS_PER_PAGE);
    const startIndex = (currentPage - 1) * BLOCKS_PER_PAGE;
    const endIndex = startIndex + BLOCKS_PER_PAGE;
    const paginatedBlocks = blocks.slice(startIndex, endIndex);

    return {
      blocks: paginatedBlocks,
      totalPages,
      currentPage,
      originalIndices: blocks.map((_, idx) => {
        // Map back to original indices
        let originalIdx = 0;
        for (let i = 0; i <= idx; i++) {
          const blockKey = `${character.characterId}-${originalIdx}`;
          while (removedBlockIndices.has(blockKey)) {
            originalIdx++;
          }
          if (i < idx) originalIdx++;
        }
        return originalIdx;
      })
    };
  };

  const handleRemoveBlock = (characterId: string, blockIndex: number) => {
    const blockKey = `${characterId}-${blockIndex}`;
    setRemovedBlockIndices(prev => new Set([...prev, blockKey]));
    toast.success('Block removed');
  };

  const handlePageChange = (characterId: string, page: number) => {
    setCharacterPages(prev => new Map([...prev, [characterId, page]]));
  };

  const handleConfirm = () => {
    const confirmedMapping = dialogue.characterMapping.map(character => {
      const cleanedBlocks = character.blocks.filter((_, idx) => {
        const blockKey = `${character.characterId}-${idx}`;
        return !removedBlockIndices.has(blockKey);
      });

      return {
        characterId: character.characterId,
        blocks: cleanedBlocks
      };
    });

    onConfirm({ characterMapping: confirmedMapping });
  };

  const handleToggleMode = () => {
    const newMode = mode === 'issue-detection' ? 'full-review' : 'issue-detection';
    setMode(newMode);
    if (onToggleMode) {
      onToggleMode();
    }
  };

  if (!dialogue.hasDialogue || displayCharacters.length === 0) {
    return null;
  }

  const totalBlocks = dialogue.characterMapping.reduce((sum, char) => sum + char.blocks.length, 0);
  const totalLength = dialogue.characterMapping.reduce((sum, char) => sum + char.totalLength, 0);
  const estimatedCredits = Math.ceil(totalLength / 100) * 10; // Rough estimate: 10 credits per 100 chars

  return (
    <Card className="bg-[#141414] border-2 border-[#DC143C]/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dialogue.needsReview ? (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            <CardTitle className="text-lg text-[#FFFFFF]">
              {mode === 'full-review' ? 'Review All Dialogue Blocks' : '⚠️ Issues Detected'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onToggleMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleMode}
                className="text-[#808080] hover:text-[#FFFFFF]"
              >
                {mode === 'issue-detection' ? (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Review All
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Issues Only
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#808080] hover:text-[#FFFFFF]"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        <CardDescription className="text-[#808080]">
          {mode === 'full-review'
            ? `Review all ${totalBlocks} dialogue blocks across ${dialogue.characterMapping.length} character${dialogue.characterMapping.length > 1 ? 's' : ''}`
            : 'Review and remove duplicate blocks or action lines mistaken as dialogue'}
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {displayCharacters.map((character) => {
            const { blocks: paginatedBlocks, totalPages, currentPage, originalIndices } = getPaginatedBlocks(character);
            const hasIssues = character.hasDuplicates || character.hasActionLines || character.matchingConfidence === 'uncertain';

            return (
              <div key={character.characterId} className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg border border-[#3F3F46]">
                  <div>
                    <div className="font-semibold text-sm text-[#FFFFFF]">
                      {character.characterName}
                      {hasIssues && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {character.hasDuplicates && 'Duplicates'}
                          {character.hasDuplicates && character.hasActionLines && ' + '}
                          {character.hasActionLines && 'Action Lines'}
                          {character.matchingConfidence === 'uncertain' && ' + Uncertain Match'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[#808080] mt-1">
                      {character.blocks.length} block{character.blocks.length !== 1 ? 's' : ''} • {character.totalLength} characters
                      {character.matchingConfidence !== 'exact' && (
                        <span className="ml-2">
                          ({character.matchingConfidence === 'fuzzy' ? 'Fuzzy match' : 'Uncertain match'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(character.characterId, Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-[#808080] hover:text-[#FFFFFF]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-xs text-[#808080]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(character.characterId, Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-[#808080] hover:text-[#FFFFFF]"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Dialogue Blocks */}
                <div className="space-y-2">
                  {paginatedBlocks.map((block, idx) => {
                    const originalIndex = originalIndices[idx];
                    const blockKey = `${character.characterId}-${originalIndex}`;
                    const isRemoved = removedBlockIndices.has(blockKey);
                    
                    // Check if this block is a duplicate
                    const isDuplicate = character.duplicateBlocks?.some(
                      dup => dup.blockIndex === originalIndex
                    );
                    const duplicateOf = character.duplicateBlocks?.find(
                      dup => dup.blockIndex === originalIndex
                    )?.duplicateOf;

                    // Check if this block is an action line
                    const isActionLine = character.actionLineBlocks?.some(
                      action => action.blockIndex === originalIndex
                    );
                    const actionReason = character.actionLineBlocks?.find(
                      action => action.blockIndex === originalIndex
                    )?.reason;

                    if (isRemoved) return null;

                    return (
                      <div
                        key={`${character.characterId}-${originalIndex}`}
                        className={`p-3 rounded-lg border-2 ${
                          isActionLine
                            ? 'bg-red-500/10 border-red-500/50'
                            : isDuplicate
                            ? 'bg-yellow-500/10 border-yellow-500/50'
                            : 'bg-[#1F1F1F] border-[#3F3F46]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {block.lineNumber && (
                              <div className="text-xs text-[#808080] mb-1">
                                Line {block.lineNumber}
                              </div>
                            )}
                            {isDuplicate && (
                              <Badge variant="outline" className="mb-2 text-xs border-yellow-500 text-yellow-500">
                                Duplicate of Block {duplicateOf! + 1}
                              </Badge>
                            )}
                            {isActionLine && (
                              <Badge variant="outline" className="mb-2 text-xs border-red-500 text-red-500">
                                {actionReason || 'Action Line'}
                              </Badge>
                            )}
                            <div className="text-sm text-[#FFFFFF] whitespace-pre-wrap">
                              "{block.dialogue}"
                            </div>
                            {block.parenthetical && (
                              <div className="text-xs text-[#808080] mt-1 italic">
                                ({block.parenthetical})
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBlock(character.characterId, originalIndex)}
                            className="text-[#808080] hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="p-3 bg-[#1F1F1F] rounded-lg border border-[#3F3F46]">
            <div className="text-xs text-[#808080] space-y-1">
              <div>
                <strong className="text-[#FFFFFF]">Total:</strong> {totalBlocks} blocks, {totalLength} characters
              </div>
              <div>
                <strong className="text-[#FFFFFF]">Estimated Credits:</strong> ~{estimatedCredits} credits
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1 bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              Skip - Use All
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white"
            >
              {mode === 'full-review' ? 'Confirm & Continue' : 'Remove Issues & Continue'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

