/**
 * Template Selection Card
 * 
 * Beautiful card showing composition templates with:
 * - Visual preview/icon
 * - Cost breakdown and savings
 * - Hybrid capability badge
 * - Clip count and layout type
 * - Premium/Free indicator
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  DollarSign,
  Upload,
  Video,
  Grid3x3,
  Maximize2,
  Zap,
  Crown,
  TrendingDown,
  Percent
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    category: string;
    description: string;
    clipCount: number;
    layout: {
      type: string;
      aspectRatio: string;
    };
    isPremium: boolean;
    clipRequirements?: Array<{
      allowUpload: boolean;
      requiresCharacterRef: boolean;
      suggestedVisibility: string;
    }>;
    optimization?: {
      canUseCheaperModels: boolean;
      estimatedSavings: number; // Percentage
      hybridFriendly: boolean;
    };
  };
  estimatedCredits: number; // Base cost for pure AI
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function TemplateCard({
  template,
  estimatedCredits,
  isSelected,
  isRecommended,
  onSelect,
  disabled = false
}: TemplateCardProps) {
  const optimization = template.optimization;
  const hybridFriendly = optimization?.hybridFriendly || false;
  const estimatedSavings = optimization?.estimatedSavings || 0;
  const optimizedCredits = Math.floor(estimatedCredits * (1 - estimatedSavings / 100));
  const creditsSaved = estimatedCredits - optimizedCredits;
  
  // Calculate how many clips can be uploaded
  const uploadableClips = template.clipRequirements?.filter(r => r.allowUpload).length || 0;
  const maxUploadSavings = uploadableClips > 0 
    ? Math.floor((uploadableClips / template.clipCount) * 100)
    : 0;
  
  // Category colors
  const getCategoryColor = () => {
    switch (template.category) {
      case 'dialogue': return 'from-purple-500 to-pink-500';
      case 'action': return 'from-orange-500 to-red-500';
      case 'vfx-action': return 'from-cyan-500 to-blue-500';
      case 'establishing': return 'from-green-500 to-emerald-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };
  
  // Layout icon
  const getLayoutIcon = () => {
    const type = template.layout.type;
    if (type.includes('2-up')) return <Grid3x3 className="w-5 h-5" />;
    if (type.includes('3-up') || type.includes('4-up')) return <Grid3x3 className="w-5 h-5" />;
    if (type === 'pip') return <Maximize2 className="w-5 h-5" />;
    return <Video className="w-5 h-5" />;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ duration: 0.2 }}
      className="w-full" // Add full width for proper mobile alignment
    >
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300 w-full", // Add w-full
          isSelected && "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20",
          isRecommended && !isSelected && "ring-2 ring-purple-500/50",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => !disabled && onSelect()}
      >
        {/* Top Badge Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 z-10 flex-wrap gap-1">
          {isRecommended && (
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Recommended
            </Badge>
          )}
          {template.isPremium && (
            <Badge variant="secondary" className="ml-auto bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        
        {/* Visual Header */}
        <div className={cn(
          "relative h-32 bg-gradient-to-br",
          getCategoryColor(),
          "flex items-center justify-center"
        )}>
          {/* Layout preview */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full flex items-center justify-center">
              {getLayoutIcon()}
            </div>
          </div>
          
          {/* Icon */}
          <div className="relative z-10 p-4 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/40">
            {getLayoutIcon()}
          </div>
          
          {/* Clip count badge */}
          <Badge className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white border-white/20">
            {template.clipCount} clips
          </Badge>
        </div>
        
        {/* Content */}
        <div className="p-3 sm:p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-1">
              {template.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {template.description}
            </p>
          </div>
          
          {/* Features */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {template.layout.aspectRatio}
            </Badge>
            {hybridFriendly && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                <Upload className="w-3 h-3 mr-1" />
                Hybrid
              </Badge>
            )}
          </div>
          
          {/* Cost Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Pure AI cost */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Pure AI:</span>
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <DollarSign className="w-3 h-3" />
                <span className={cn(
                  estimatedSavings > 0 && "line-through opacity-60"
                )}>{estimatedCredits}</span>
                {estimatedSavings > 0 && (
                  <span className="text-green-600 dark:text-green-400 font-semibold ml-1">
                    {optimizedCredits}
                  </span>
                )}
              </div>
            </div>
            
            {/* Savings info */}
            {estimatedSavings > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                <div className="p-1.5 rounded-lg bg-green-500 text-white">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                    Save {estimatedSavings}% with smart routing
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {creditsSaved} credits saved ({estimatedCredits - creditsSaved} credits)
                  </p>
                </div>
              </div>
            )}
            
            {/* Hybrid savings potential */}
            {hybridFriendly && maxUploadSavings > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800">
                <div className="p-1.5 rounded-lg bg-blue-500 text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Upload {uploadableClips}/{template.clipCount} clips
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Save up to {maxUploadSavings}% more!
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <Button
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "w-full gap-2",
              isSelected && "bg-blue-600 hover:bg-blue-700"
            )}
            disabled={disabled}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" />
                Selected
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Select Template
              </>
            )}
          </Button>
        </div>
        
        {/* Selected checkmark overlay */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 p-2 bg-blue-600 rounded-full shadow-lg z-20"
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

