'use client';

/**
 * Clip Generation Panel - Production Page Center Panel
 * 
 * 3-Step Wizard for video clip generation:
 * 1. AI Analysis - Shows composition suggestions
 * 2. Clip Assignment - Upload vs AI, character selection
 * 3. Generation - Progress tracking
 * 
 * Supports hybrid workflows (upload + AI generation)
 */

import React from 'react';
import type { StoryBeat } from '@/types/screenplay';
import type { 
  AISuggestion, 
  ClipAssignment, 
  CharacterProfile 
} from './ProductionPageLayout';
import { 
  Sparkles, 
  Upload, 
  Film, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  DollarSign,
  Zap,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClipGenerationPanelProps {
  selectedBeat: StoryBeat | null;
  aiSuggestion: AISuggestion | null;
  isLoadingSuggestion: boolean;
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  clipAssignments: ClipAssignment[];
  onUpdateAssignment: (clipIndex: number, updates: Partial<ClipAssignment>) => void;
  characters: CharacterProfile[];
  isGenerating: boolean;
  generationProgress: Record<number, number>;
  onGenerate: () => void;
  totalCost: number;
  savings: number;
  onSaveToGallery?: () => void;
  onSendToTimeline?: () => void;
  onSendToComposition?: () => void;
}

export function ClipGenerationPanel({
  selectedBeat,
  aiSuggestion,
  isLoadingSuggestion,
  currentStep,
  onStepChange,
  clipAssignments,
  onUpdateAssignment,
  characters,
  isGenerating,
  generationProgress,
  onGenerate,
  totalCost,
  savings,
  onSaveToGallery,
  onSendToTimeline,
  onSendToComposition
}: ClipGenerationPanelProps) {
  
  // No beat selected
  if (!selectedBeat) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <Film className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Select a Story Beat
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Choose a beat from the left panel to begin planning and generating video clips
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {selectedBeat.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {selectedBeat.description}
        </p>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mt-4">
          {[
            { num: 1, label: 'AI Analysis' },
            { num: 2, label: 'Clip Assignment' },
            { num: 3, label: 'Generation' }
          ].map((step) => (
            <button
              key={step.num}
              onClick={() => onStepChange(step.num as 1 | 2 | 3)}
              disabled={step.num > currentStep || isGenerating}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                step.num === currentStep && 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20',
                step.num < currentStep && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                step.num > currentStep && 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                step.num <= currentStep && !isGenerating && 'hover:opacity-80 cursor-pointer',
                (step.num > currentStep || isGenerating) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className={cn(
                'flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                step.num === currentStep && 'bg-teal-500 text-base-content',
                step.num < currentStep && 'bg-green-500 text-base-content',
                step.num > currentStep && 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
              )}>
                {step.num < currentStep ? '✓' : step.num}
              </span>
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {currentStep === 1 && (
          <Step1AIAnalysis
            aiSuggestion={aiSuggestion}
            isLoading={isLoadingSuggestion}
            onNext={() => onStepChange(2)}
          />
        )}

        {currentStep === 2 && aiSuggestion && (
          <Step2ClipAssignment
            aiSuggestion={aiSuggestion}
            clipAssignments={clipAssignments}
            onUpdateAssignment={onUpdateAssignment}
            characters={characters}
            onNext={() => onStepChange(3)}
            totalCost={totalCost}
            savings={savings}
          />
        )}

        {currentStep === 3 && (
          <Step3Generation
            clipAssignments={clipAssignments}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onGenerate={onGenerate}
            totalCost={totalCost}
            onSaveToGallery={onSaveToGallery}
            onSendToTimeline={onSendToTimeline}
            onSendToComposition={onSendToComposition}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: AI Analysis
// ============================================================================

interface Step1Props {
  aiSuggestion: AISuggestion | null;
  isLoading: boolean;
  onNext: () => void;
}

function Step1AIAnalysis({ aiSuggestion, isLoading, onNext }: Step1Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-2">
          AI is analyzing your story beat...
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          5 credit refundable deposit (refunded when you generate clips)
        </p>
      </div>
    );
  }

  if (!aiSuggestion) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Failed to load AI suggestion
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* AI Suggestion Card */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Recommended Composition
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-sm font-medium text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                {aiSuggestion.templateName}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {aiSuggestion.clipCount} clips
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {aiSuggestion.reasoning}
            </p>
          </div>
        </div>
      </div>

      {/* Clip Requirements */}
      <div>
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Required Clips
        </h4>
        <div className="space-y-3">
          {aiSuggestion.clipRequirements.map((clip) => (
            <div
              key={clip.clipIndex}
              className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold text-sm flex-shrink-0">
                {clip.clipIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {clip.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {clip.suggestedCharacter && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {clip.suggestedCharacter}
                    </span>
                  )}
                  <span>•</span>
                  <span>{clip.suggestedCameraAngle}</span>
                  <span>•</span>
                  <span className="capitalize">{clip.suggestedVisibility.replace('-', ' ')}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {clip.estimatedCredits}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  credits
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Summary */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Estimated Total
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {aiSuggestion.estimatedCost} credits
          </div>
        </div>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-base-content font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Continue to Assignment
          <Zap className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2: Clip Assignment
// ============================================================================

interface Step2Props {
  aiSuggestion: AISuggestion;
  clipAssignments: ClipAssignment[];
  onUpdateAssignment: (clipIndex: number, updates: Partial<ClipAssignment>) => void;
  characters: CharacterProfile[];
  onNext: () => void;
  totalCost: number;
  savings: number;
}

function Step2ClipAssignment({
  aiSuggestion,
  clipAssignments,
  onUpdateAssignment,
  characters,
  onNext,
  totalCost,
  savings
}: Step2Props) {
  
  const allAssigned = clipAssignments.every(clip => 
    clip.source === 'ai-generate' ? !!clip.characterId || !!clip.prompt : !!clip.uploadedFile
  );

  return (
    <div className="p-6 space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Hybrid Workflow:</strong> For each clip, choose to either generate with AI or upload your own footage. 
          You can mix and match to save credits!
        </p>
      </div>

      {/* Clip Assignment Cards */}
      <div className="space-y-4">
        {clipAssignments.map((clip, index) => {
          const requirement = aiSuggestion.clipRequirements[index];
          return (
            <ClipAssignmentCard
              key={index}
              clip={clip}
              requirement={requirement}
              characters={characters}
              onUpdate={(updates) => onUpdateAssignment(index, updates)}
            />
          );
        })}
      </div>

      {/* Cost Summary & Next Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 -mx-6 -mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Total Cost
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {totalCost} credits
              </div>
            </div>
            {savings > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                    You&apos;re saving
                  </div>
                  <div className="text-sm font-bold text-green-800 dark:text-green-200">
                    {savings} credits
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onNext}
            disabled={!allAssigned}
            className={cn(
              'px-6 py-2.5 font-medium rounded-lg transition-colors flex items-center gap-2',
              allAssigned
                ? 'bg-teal-600 hover:bg-teal-700 text-base-content cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            )}
          >
            Start Generation
            <Film className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Clip Assignment Card
// ============================================================================

interface ClipAssignmentCardProps {
  clip: ClipAssignment;
  requirement: any;
  characters: CharacterProfile[];
  onUpdate: (updates: Partial<ClipAssignment>) => void;
}

function ClipAssignmentCard({ clip, requirement, characters, onUpdate }: ClipAssignmentCardProps) {
  const isAI = clip.source === 'ai-generate';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      {/* Clip Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex-shrink-0">
          {clip.clipIndex + 1}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {requirement.description}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {requirement.suggestedCameraAngle} • {requirement.suggestedVisibility.replace('-', ' ')}
          </p>
        </div>
      </div>

      {/* Source Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onUpdate({ source: 'ai-generate', uploadedFile: undefined })}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all',
            isAI 
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
          )}
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
        <button
          onClick={() => onUpdate({ source: 'upload', characterId: undefined, referenceUrl: undefined })}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all',
            !isAI 
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload Own
        </button>
      </div>

      {/* AI Generate Options */}
      {isAI && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Character
            </label>
            <select
              value={clip.characterId || ''}
              onChange={(e) => {
                const char = characters.find(c => c.id === e.target.value);
                onUpdate({
                  characterId: e.target.value,
                  characterName: char?.name,
                  referenceUrl: char?.baseReference?.imageUrl
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="">Select character...</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.name} ({char.referenceCount} refs)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Prompt
            </label>
            <textarea
              value={clip.prompt || ''}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="Describe the shot..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 resize-none"
              rows={2}
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>AI Generation</span>
            <span className="font-semibold">{clip.characterId ? '45' : '15'} credits</span>
          </div>
        </div>
      )}

      {/* Upload Options */}
      {!isAI && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Video File
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpdate({ uploadedFile: file });
              }}
              className="w-full text-sm text-slate-600 dark:text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-teal-50 file:text-teal-700
                dark:file:bg-teal-900/30 dark:file:text-teal-300
                hover:file:bg-teal-100 dark:hover:file:bg-teal-900/50
                file:cursor-pointer"
            />
            {clip.uploadedFile && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {clip.uploadedFile.name}
              </div>
            )}
          </div>

          {/* Enhancement Options */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={clip.enhanceStyle || false}
                onChange={(e) => onUpdate({ enhanceStyle: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Cinematic Style Enhancement (+12 credits)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={clip.reframe || false}
                onChange={(e) => onUpdate({ reframe: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Smart Reframe to 16:9 (+10 credits)
              </span>
            </label>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Upload Cost</span>
            <span className="font-semibold">
              {(clip.enhanceStyle ? 12 : 0) + (clip.reframe ? 10 : 0) || 0} credits
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STEP 3: Generation
// ============================================================================

interface Step3Props {
  clipAssignments: ClipAssignment[];
  isGenerating: boolean;
  generationProgress: Record<number, number>;
  onGenerate: () => void;
  totalCost: number;
  onSaveToGallery?: () => void;
  onSendToTimeline?: () => void;
  onSendToComposition?: () => void;
}

function Step3Generation({
  clipAssignments,
  isGenerating,
  generationProgress,
  onGenerate,
  totalCost,
  onSaveToGallery,
  onSendToTimeline,
  onSendToComposition
}: Step3Props) {
  
  const completedCount = clipAssignments.filter(c => c.status === 'completed').length;
  const hasStarted = clipAssignments.some(c => c.status !== 'pending');

  return (
    <div className="p-6 space-y-6">
      {/* Generation Status */}
      {!hasStarted && (
        <div className="text-center py-12">
          <Film className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Ready to Generate
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {clipAssignments.length} clips • {totalCost} credits
          </p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-base-content font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Zap className="w-5 h-5" />
            Start Generation
          </button>
        </div>
      )}

      {/* Progress Cards */}
      {hasStarted && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Generation Progress
            </h3>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {completedCount} / {clipAssignments.length} completed
            </span>
          </div>

          <div className="space-y-3">
            {clipAssignments.map((clip, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Clip {index + 1}
                      </span>
                      {clip.status === 'pending' && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Waiting...</span>
                      )}
                      {(clip.status === 'generating' || clip.status === 'uploading' || clip.status === 'enhancing') && (
                        <>
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {clip.status === 'uploading' ? 'Uploading...' : 'Generating...'}
                          </span>
                        </>
                      )}
                      {clip.status === 'completed' && (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Complete</span>
                        </>
                      )}
                      {clip.status === 'error' && (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">Error</span>
                        </>
                      )}
                    </div>
                    {(clip.status === 'generating' && generationProgress[index] !== undefined) && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${generationProgress[index]}%` }}
                        />
                      </div>
                    )}
                    {clip.status === 'error' && clip.errorMessage && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        {clip.errorMessage}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {clip.creditsUsed > 0 ? `${clip.creditsUsed} credits` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Completion Message with Actions */}
          {completedCount === clipAssignments.length && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  All Clips Generated!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {clipAssignments.length} clips ready • What would you like to do?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Save to Gallery */}
                {onSaveToGallery && (
                  <button
                    onClick={onSaveToGallery}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-base-content" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-base-content text-sm">Save to Gallery</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Reuse clips later
                      </p>
                    </div>
                  </button>
                )}

                {/* Send to Timeline */}
                {onSendToTimeline && (
                  <button
                    onClick={onSendToTimeline}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Film className="w-6 h-6 text-base-content" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-base-content text-sm">Send to Timeline</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Edit & export
                      </p>
                    </div>
                  </button>
                )}

                {/* Send to Composition */}
                {onSendToComposition && (
                  <button
                    onClick={onSendToComposition}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6 text-base-content" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-base-content text-sm">Send to Composition</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Add layouts & effects
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

