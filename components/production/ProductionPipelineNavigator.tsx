/**
 * Production Pipeline Navigator
 * 
 * Unified navigation showing the complete production workflow
 * Allows users to move between stages: Screenplay → Shot List → Timeline → Composition → Export
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ListChecks,
  Film,
  Layers,
  Download,
  CheckCircle2,
  Circle,
  ChevronRight,
  Clapperboard,
  HelpCircle
} from 'lucide-react';
import { PipelineHelpModal } from './PipelineHelpModal';

export type ProductionStage = 
  | 'screenplay'
  | 'shotlist'
  | 'timeline'
  | 'composition'
  | 'export';

interface ProductionStageConfig {
  id: ProductionStage;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const PRODUCTION_STAGES: ProductionStageConfig[] = [
  {
    id: 'screenplay',
    label: 'Screenplay',
    icon: <FileText className="w-5 h-5" />,
    description: 'Write your script in Fountain format',
    color: 'bg-[#DC143C]'
  },
  {
    id: 'shotlist',
    label: 'Shot List',
    icon: <ListChecks className="w-5 h-5" />,
    description: 'AI-generated cinematography breakdown',
    color: 'bg-[#DC143C]'
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: <Film className="w-5 h-5" />,
    description: 'Arrange and edit your video clips',
    color: 'bg-green-500'
  },
  {
    id: 'composition',
    label: 'Composition',
    icon: <Layers className="w-5 h-5" />,
    description: 'Apply layouts, pacing, and effects',
    color: 'bg-orange-500'
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="w-5 h-5" />,
    description: 'Render and download final video',
    color: 'bg-red-500'
  }
];

interface ProductionPipelineNavigatorProps {
  currentStage: ProductionStage;
  completedStages: ProductionStage[];
  onStageChange: (stage: ProductionStage) => void;
  projectName?: string;
  userPlan?: 'free' | 'pro' | 'ultra' | 'studio';
}

export function ProductionPipelineNavigator({
  currentStage,
  completedStages,
  onStageChange,
  projectName = 'Untitled Project',
  userPlan = 'free'
}: ProductionPipelineNavigatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const currentStageIndex = PRODUCTION_STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shadow-lg">
      {/* Clapboard Header */}
      <div className="h-10 flex shadow-inner">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? 'flex-1 bg-black' : 'flex-1 bg-white'}
          />
        ))}
      </div>

      {/* Main Navigation */}
      <div className="p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clapperboard className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-base-content font-mono">
                PRODUCTION PIPELINE
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {projectName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHelpModal(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400"
              title="How to use the Production Pipeline"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2">
            {PRODUCTION_STAGES.map((stage, index) => {
              const isCompleted = completedStages.includes(stage.id);
              const isCurrent = stage.id === currentStage;
              const isAccessible = index <= currentStageIndex || isCompleted;

              return (
                <React.Fragment key={stage.id}>
                  {/* Stage Card */}
                  <button
                    onClick={() => isAccessible && onStageChange(stage.id)}
                    disabled={!isAccessible}
                    className={`
                      flex-1 relative group transition-all
                      ${isCurrent
                        ? 'scale-105 shadow-lg shadow-yellow-500/50'
                        : isCompleted
                        ? 'hover:scale-102'
                        : 'opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <Card
                      className={`
                        p-4 border-2 transition-all
                        ${isCurrent
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : isCompleted
                          ? 'border-green-400 bg-white dark:bg-slate-800 hover:border-green-500'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                        }
                      `}
                    >
                      {/* Status Badge */}
                      <div className="absolute -top-2 -right-2">
                        {isCompleted ? (
                          <div className="p-1 bg-green-500 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-base-content" />
                          </div>
                        ) : isCurrent ? (
                          <div className="p-1 bg-yellow-400 rounded-full animate-pulse">
                            <Circle className="w-4 h-4 text-black fill-current" />
                          </div>
                        ) : (
                          <div className="p-1 bg-slate-300 dark:bg-slate-600 rounded-full">
                            <Circle className="w-4 h-4 text-base-content" />
                          </div>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={`
                          w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2
                          ${isCurrent
                            ? 'bg-yellow-400 text-black'
                            : isCompleted
                            ? `${stage.color} text-base-content`
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }
                        `}
                      >
                        {stage.icon}
                      </div>

                      {/* Label */}
                      <div className="text-center">
                        <div
                          className={`
                            font-bold text-sm mb-1
                            ${isCurrent
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : isCompleted
                              ? 'text-slate-900 dark:text-base-content'
                              : 'text-slate-400 dark:text-slate-600'
                            }
                          `}
                        >
                          {stage.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {stage.description}
                        </div>
                      </div>

                      {/* Current Stage Indicator */}
                      {isCurrent && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-b" />
                      )}
                    </Card>
                  </button>

                  {/* Arrow */}
                  {index < PRODUCTION_STAGES.length - 1 && (
                    <ChevronRight
                      className={`
                        w-6 h-6 flex-shrink-0
                        ${isCompleted
                          ? 'text-green-500'
                          : 'text-slate-300 dark:text-slate-600'
                        }
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Condensed View */}
        {!isExpanded && (
          <div className="flex items-center gap-2">
            {PRODUCTION_STAGES.map((stage, index) => {
              const isCompleted = completedStages.includes(stage.id);
              const isCurrent = stage.id === currentStage;

              return (
                <React.Fragment key={stage.id}>
                  <button
                    onClick={() => onStageChange(stage.id)}
                    className={`
                      p-2 rounded-lg transition-all
                      ${isCurrent
                        ? 'bg-yellow-400 text-black scale-110'
                        : isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }
                    `}
                    title={stage.label}
                  >
                    {stage.icon}
                  </button>
                  {index < PRODUCTION_STAGES.length - 1 && (
                    <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Progress
            </span>
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
              {Math.round((completedStages.length / PRODUCTION_STAGES.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
              style={{
                width: `${(completedStages.length / PRODUCTION_STAGES.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <PipelineHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        currentStage={currentStage}
        userPlan={userPlan}
      />
    </div>
  );
}

