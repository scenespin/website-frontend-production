'use client';

/**
 * Workflow Input Form
 * 
 * Dynamic form component that collects inputs based on workflow requirements.
 * Handles scene descriptions, character references, video uploads, etc.
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, Film, Image as ImageIcon, Type, Wand2, 
  AlertCircle, CheckCircle, Loader2 
} from 'lucide-react';
import type { WorkflowDefinition } from '@/config/workflows';

interface WorkflowInputFormProps {
  workflow: WorkflowDefinition;
  projectId: string;
  onSubmit: (inputs: WorkflowInputs) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface WorkflowInputs {
  sceneDescription?: string;
  characterDescription?: string;
  characterImageUrl?: string;
  characterImageFile?: File;
  performanceVideoFile?: File;
  stylePreference?: string;
  additionalPrompts?: string[];
}

export function WorkflowInputForm({
  workflow,
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false
}: WorkflowInputFormProps) {
  // Form state
  const [sceneDescription, setSceneDescription] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterImagePreview, setCharacterImagePreview] = useState<string | null>(null);
  const [performanceVideo, setPerformanceVideo] = useState<File | null>(null);
  const [performanceVideoName, setPerformanceVideoName] = useState<string | null>(null);
  const [stylePreference, setStylePreference] = useState('');
  
  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Handle character image upload
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, characterImage: 'Please upload an image file' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, characterImage: 'Image must be less than 10MB' });
      return;
    }

    setCharacterImage(file);
    setErrors({ ...errors, characterImage: '' });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCharacterImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle performance video upload
   */
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setErrors({ ...errors, performanceVideo: 'Please upload a video file' });
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setErrors({ ...errors, performanceVideo: 'Video must be less than 500MB' });
      return;
    }

    setPerformanceVideo(file);
    setPerformanceVideoName(file.name);
    setErrors({ ...errors, performanceVideo: '' });
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Scene description required for most workflows
    if (!workflow.requiresVideoUpload && !sceneDescription.trim()) {
      newErrors.sceneDescription = 'Please describe your scene';
    }

    // Performance video required for performance capture
    if (workflow.requiresVideoUpload && !performanceVideo) {
      newErrors.performanceVideo = 'Performance video is required for this workflow';
    }

    // Character image or description needed
    if (!workflow.requiresVideoUpload && !characterImage && !characterDescription.trim()) {
      newErrors.character = 'Please provide a character image or description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const inputs: WorkflowInputs = {
      sceneDescription: sceneDescription.trim() || undefined,
      characterDescription: characterDescription.trim() || undefined,
      characterImageFile: characterImage || undefined,
      performanceVideoFile: performanceVideo || undefined,
      stylePreference: stylePreference.trim() || undefined
    };

    onSubmit(inputs);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
          Set Up Your Workflow
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {workflow.name}
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        
        {/* Performance Video Upload (for performance capture workflows) */}
        {workflow.requiresVideoUpload && (
          <div className="space-y-2">
            <label className="block font-semibold text-slate-900 dark:text-white text-sm">
              <Film className="w-4 h-4 inline mr-2" />
              Performance Video *
            </label>
            
            {workflow.videoUploadInstructions && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  📹 {workflow.videoUploadInstructions.title || 'Upload Instructions'}
                </p>
                {workflow.videoUploadInstructions.requirements && (
                  <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 ml-4 list-disc">
                    {workflow.videoUploadInstructions.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600
                       hover:border-primary dark:hover:border-primary transition-colors
                       flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400"
            >
              {performanceVideo ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">{performanceVideoName}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Upload Performance Video (MP4, MOV)</span>
                </>
              )}
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={handleVideoUpload}
              className="hidden"
            />
            {errors.performanceVideo && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.performanceVideo}
              </p>
            )}
          </div>
        )}

        {/* Character Image Upload */}
        {!workflow.requiresVideoUpload && (
          <div className="space-y-2">
            <label className="block font-semibold text-slate-900 dark:text-white text-sm">
              <ImageIcon className="w-4 h-4 inline mr-2" />
              Character Reference Image
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload a character image or provide a description below
            </p>

            {characterImagePreview ? (
              <div className="relative">
                <img 
                  src={characterImagePreview} 
                  alt="Character preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCharacterImage(null);
                    setCharacterImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white
                           hover:bg-red-600 transition-colors text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600
                         hover:border-primary dark:hover:border-primary transition-colors
                         flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Upload Character Image (JPG, PNG)</span>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            {errors.characterImage && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.characterImage}
              </p>
            )}
          </div>
        )}

        {/* Character Description */}
        {!workflow.requiresVideoUpload && (
          <div className="space-y-2">
            <label className="block font-semibold text-slate-900 dark:text-white text-sm">
              <Type className="w-4 h-4 inline mr-2" />
              Character Description {!characterImage && '*'}
            </label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="Describe the character's appearance, clothing, style..."
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary focus:border-transparent
                       resize-none"
              rows={3}
            />
            {errors.character && !characterImage && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.character}
              </p>
            )}
          </div>
        )}

        {/* Scene Description */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-900 dark:text-white text-sm">
            <Wand2 className="w-4 h-4 inline mr-2" />
            Scene Description {!workflow.requiresVideoUpload && '*'}
          </label>
          <textarea
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            placeholder="Describe the scene, setting, action, mood..."
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-primary focus:border-transparent
                     resize-none"
            rows={4}
          />
          {errors.sceneDescription && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.sceneDescription}
            </p>
          )}
        </div>

        {/* Style Preference (optional) */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-900 dark:text-white text-sm">
            <Wand2 className="w-4 h-4 inline mr-2" />
            Style Preference (Optional)
          </label>
          <input
            type="text"
            value={stylePreference}
            onChange={(e) => setStylePreference(e.target.value)}
            placeholder="e.g., cinematic, dramatic lighting, slow motion..."
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Cost Estimate */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Estimated Cost:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {workflow.cost.min}-{workflow.cost.max} credits
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-600 dark:text-slate-400">Estimated Time:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {workflow.time.min}-{workflow.time.max} minutes
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-lg bg-primary text-white font-bold
                   hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting Workflow...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate with Workflow
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-300 font-medium
                   hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

