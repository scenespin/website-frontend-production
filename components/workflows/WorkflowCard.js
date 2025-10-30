'use client';

import Link from 'next/link';
import { Star, Zap, Image as ImageIcon, Video, Type } from 'lucide-react';

/**
 * WorkflowCard - Reusable workflow card component with Character Consistency badges
 * 
 * Shows:
 * - Workflow name and star rating
 * - Hero description
 * - Input requirements with icons
 * - Character Consistency badges (💡 Optional / ⚠️ Required)
 * - Credit range
 * - Optional help link
 */
export default function WorkflowCard({ workflow, helpLink, compact = false, onClick }) {
  const hasOptionalCharacterConsistency = workflow.tags?.includes('character-consistency-optional');
  const hasRequiredCharacterConsistency = workflow.tags?.includes('character-consistency-required');
  
  const CardContent = (
    <div className={`card-body ${compact ? 'p-4' : 'p-5'}`}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
              {workflow.name}
            </h4>
            {!compact && (
              <div className="flex">
                {[...Array(workflow.stars || 5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
            )}
          </div>
          <p className={`${compact ? 'text-xs' : 'text-sm'} opacity-70 mt-1`}>
            {workflow.heroDescription}
          </p>
        </div>
        
        {/* Credit Badge */}
        <div className="text-right flex-shrink-0">
          <div className={`badge ${compact ? 'badge-sm' : 'badge-md'} badge-primary`}>
            {workflow.creditRange.min === workflow.creditRange.max 
              ? `${workflow.creditRange.min}cr` 
              : `${workflow.creditRange.min}-${workflow.creditRange.max}cr`}
          </div>
          
          {/* Character Consistency Badges */}
          {hasOptionalCharacterConsistency && (
            <div className={`badge ${compact ? 'badge-sm' : 'badge-md'} badge-ghost mt-1 block`} title="Supports optional Character Bank">
              💡 Optional
            </div>
          )}
          {hasRequiredCharacterConsistency && (
            <div className={`badge ${compact ? 'badge-sm' : 'badge-md'} badge-warning mt-1 block`} title="Requires Character Bank images">
              ⚠️ Required
            </div>
          )}
        </div>
      </div>
      
      {/* Input Requirements */}
      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        {workflow.inputRequirements.requiresText && (
          <div className={`badge ${compact ? 'badge-xs' : 'badge-sm'} gap-1`}>
            <Type className="w-3 h-3" />
            Text
          </div>
        )}
        
        {workflow.inputRequirements.requiresImages && (
          <div className={`badge ${compact ? 'badge-xs' : 'badge-sm'} badge-warning gap-1`} title="Images required to run">
            <ImageIcon className="w-3 h-3" />
            Images Required
          </div>
        )}
        
        {workflow.inputRequirements.supportsCharacterBank && !workflow.inputRequirements.requiresImages && (
          <div className={`badge ${compact ? 'badge-xs' : 'badge-sm'} badge-info gap-1`} title="Supports optional Character Bank">
            <ImageIcon className="w-3 h-3" />
            +Character Bank
          </div>
        )}
        
        {workflow.inputRequirements.requiresVideo && (
          <div className={`badge ${compact ? 'badge-xs' : 'badge-sm'} badge-error gap-1`} title="Video required to run">
            <Video className="w-3 h-3" />
            Video Required
          </div>
        )}
        
        {workflow.tags?.includes('fastest') && (
          <div className={`badge ${compact ? 'badge-xs' : 'badge-sm'} badge-accent gap-1`}>
            <Zap className="w-3 h-3" />
            Fast
          </div>
        )}
        
        {workflow.tags?.includes('budget-friendly') && (
          <div className={`badge ${compact ? 'badge-xs' : 'badge-sm'} badge-success gap-1`}>
            💰 Budget
          </div>
        )}
      </div>
      
      {/* Experience Level Badge */}
      {!compact && (
        <div className="mt-2">
          <div className={`badge badge-sm ${
            workflow.experienceLevel === 'beginner' ? 'badge-success' :
            workflow.experienceLevel === 'intermediate' ? 'badge-warning' :
            'badge-error'
          }`}>
            {workflow.experienceLevel === 'beginner' && '🟢'}
            {workflow.experienceLevel === 'intermediate' && '🟡'}
            {workflow.experienceLevel === 'advanced' && '🔴'}
            {' '}
            {workflow.experienceLevel.charAt(0).toUpperCase() + workflow.experienceLevel.slice(1)}
          </div>
        </div>
      )}
      
      {/* Help Link */}
      {helpLink && !compact && (
        <div className="mt-3">
          <span className="text-xs text-[#DC143C] hover:underline cursor-pointer">
            Learn more →
          </span>
        </div>
      )}
    </div>
  );
  
  // If onClick is provided, render as button
  if (onClick) {
    return (
      <button
        onClick={() => onClick(workflow)}
        className="card bg-base-100 border border-base-300 hover:border-primary transition-colors text-left w-full"
      >
        {CardContent}
      </button>
    );
  }
  
  // If helpLink is provided, render as Link
  if (helpLink) {
    return (
      <Link 
        href={helpLink} 
        className="card bg-base-100 border border-base-300 hover:border-primary transition-colors"
      >
        {CardContent}
      </Link>
    );
  }
  
  // Otherwise, render as static card
  return (
    <div className="card bg-base-100 border border-base-300">
      {CardContent}
    </div>
  );
}

