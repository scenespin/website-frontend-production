/**
 * Clip Upload Card
 * 
 * Beautiful card for each clip in a composition showing:
 * - Upload zone (drag & drop or click)
 * - AI generation button
 * - Preview of uploaded/generated video
 * - Cost savings indicator
 * - Status and progress
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Video,
  Sparkles,
  Check,
  X,
  Loader2,
  Play,
  Film,
  DollarSign,
  Clock,
  AlertCircle,
  ImageIcon,
  User
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ClipUploadCardProps {
  clipIndex: number;
  clipRequirement: {
    description: string;
    allowUpload: boolean;
    requiresCharacterRef: boolean;
    suggestedVisibility: string;
    canUseCheaperModel?: boolean;
    estimatedCreditSavings?: number;
  };
  characterAssignment?: {
    characterName: string;
    referenceImageUrl?: string;
    cameraAngle: string;
    action?: string;
  };
  uploadedClip?: {
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
  };
  generatedClip?: {
    videoUrl: string;
    thumbnailUrl?: string;
    status: 'generating' | 'completed' | 'failed';
    progress: number;
    creditsUsed: number;
    duration?: number;
  };
  estimatedCredits: number;
  onUpload: (file: File) => Promise<void>;
  onGenerate: () => Promise<void>;
  onPreview: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ClipUploadCard({
  clipIndex,
  clipRequirement,
  characterAssignment,
  uploadedClip,
  generatedClip,
  estimatedCredits,
  onUpload,
  onGenerate,
  onPreview,
  onRemove,
  disabled = false
}: ClipUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const hasContent = uploadedClip || generatedClip;
  const isGenerating = generatedClip?.status === 'generating';
  const isFailed = generatedClip?.status === 'failed';
  const isCompleted = generatedClip?.status === 'completed' || uploadedClip;
  
  // Calculate savings if uploaded vs generated
  const uploadSavings = uploadedClip ? estimatedCredits : 0;
  const optimizationSavings = clipRequirement.canUseCheaperModel 
    ? Math.floor(estimatedCredits * (clipRequirement.estimatedCreditSavings || 0) / 100)
    : 0;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && clipRequirement.allowUpload) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || !clipRequirement.allowUpload) return;
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      await handleFileUpload(file);
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: clipIndex * 0.1 }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          isDragging && "ring-2 ring-blue-500 scale-[1.02]",
          isCompleted && "border-green-500/50",
          isFailed && "border-red-500/50",
          disabled && "opacity-60"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs font-mono">
                  Clip {clipIndex + 1}
                </Badge>
                
                {/* Visibility badge */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    clipRequirement.suggestedVisibility === 'face-visible' && "border-purple-500 text-purple-700",
                    clipRequirement.suggestedVisibility === 'body-only' && "border-blue-500 text-blue-700",
                    clipRequirement.suggestedVisibility === 'no-character' && "border-green-500 text-green-700"
                  )}
                >
                  {clipRequirement.suggestedVisibility.replace('-', ' ')}
                </Badge>
                
                {/* Status badge */}
                {isCompleted && (
                  <Badge className="text-xs bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    {uploadedClip ? 'Uploaded' : 'Generated'}
                  </Badge>
                )}
                {isGenerating && (
                  <Badge className="text-xs bg-blue-500">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generating
                  </Badge>
                )}
                {isFailed && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
              
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {clipRequirement.description}
              </p>
              
              {/* Character info */}
              {characterAssignment && (
                <div className="flex items-center gap-2 mt-2">
                  {characterAssignment.referenceImageUrl ? (
                    <img 
                      src={characterAssignment.referenceImageUrl} 
                      alt={characterAssignment.characterName}
                      className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-3 h-3 text-base-content" />
                    </div>
                  )}
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {characterAssignment.characterName} • {characterAssignment.cameraAngle}
                  </span>
                </div>
              )}
            </div>
            
            {/* Cost/Savings indicator */}
            <div className="text-right">
              {uploadSavings > 0 && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>-{uploadSavings}</span>
                  <span className="text-xs">saved</span>
                </div>
              )}
              {!uploadedClip && optimizationSavings > 0 && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>Save {clipRequirement.estimatedCreditSavings}%</span>
                </div>
              )}
              {!uploadedClip && !optimizationSavings && (
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{estimatedCredits}</span>
                  <span className="text-xs">credits</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-4">
          {/* Preview or Upload Zone */}
          {hasContent ? (
            // Preview
            <div className="relative group">
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border-2 border-slate-200 dark:border-slate-700">
                {(uploadedClip?.thumbnailUrl || generatedClip?.thumbnailUrl) ? (
                  <img 
                    src={uploadedClip?.thumbnailUrl || generatedClip?.thumbnailUrl} 
                    alt={`Clip ${clipIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={onPreview}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Preview
                  </Button>
                  {!disabled && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={onRemove}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Progress bar for generating */}
              {isGenerating && generatedClip && (
                <div className="mt-3 space-y-1">
                  <Progress value={generatedClip.progress} className="h-2" />
                  <p className="text-xs text-center text-slate-500">
                    Generating... {generatedClip.progress}%
                  </p>
                </div>
              )}
              
              {/* Clip info */}
              {isCompleted && (
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {uploadedClip?.duration || generatedClip?.duration || 0}s
                    </span>
                    {generatedClip && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {generatedClip.creditsUsed} credits
                      </span>
                    )}
                  </div>
                  {uploadedClip && (
                    <Badge variant="outline" className="text-xs">
                      User Upload
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Upload/Generate Options
            <div className="space-y-3">
              {/* Upload Zone */}
              {clipRequirement.allowUpload && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200",
                    isDragging 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-[1.02]"
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
                    disabled && "pointer-events-none opacity-50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled}
                  />
                  
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className={cn(
                        "p-3 rounded-full transition-colors",
                        isDragging 
                          ? "bg-blue-500 text-base-content" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {isDragging ? 'Drop video here' : 'Upload your own footage'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Drag & drop or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                          disabled={disabled}
                        >
                          browse files
                        </button>
                      </p>
                    </div>
                    
                    {/* Upload savings badge */}
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                      <DollarSign className="w-3 h-3" />
                      Save {estimatedCredits} credits by uploading
                    </div>
                  </div>
                </div>
              )}
              
              {/* Divider */}
              {clipRequirement.allowUpload && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">or</span>
                  </div>
                </div>
              )}
              
              {/* Generate Button */}
              <Button
                onClick={onGenerate}
                disabled={disabled}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
                <span className="ml-auto flex items-center gap-1 text-xs opacity-90">
                  <DollarSign className="w-3 h-3" />
                  {clipRequirement.canUseCheaperModel 
                    ? estimatedCredits - optimizationSavings
                    : estimatedCredits}
                </span>
              </Button>
              
              {/* Optimization note */}
              {optimizationSavings > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Smart savings:</strong> This clip will use an optimized AI model, saving you {clipRequirement.estimatedCreditSavings}% ({optimizationSavings} credits)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

