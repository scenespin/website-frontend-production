'use client';

/**
 * Workflow Results Display
 * 
 * Shows generated videos with universal audio enhancement capability.
 * Works with ALL videos regardless of provider (wrapper-compliant).
 */

import React, { useState } from 'react';
import { 
  CheckCircle, Download, Send, FolderOpen, 
  Play, Clock, DollarSign, Share2, Music, Sparkles
} from 'lucide-react';
import { AudioInterviewWizard } from '../audio/AudioInterviewWizard';
import { toast } from 'sonner';
import type { WorkflowResults } from './WorkflowProgressTracker';

interface WorkflowResultsDisplayProps {
  results: WorkflowResults;
  workflowName: string;
  onSaveToGallery: () => void;
  onSendToTimeline: () => void;
  onSendToComposition: () => void;
  onStartNew: () => void;
}

export function WorkflowResultsDisplay({
  results,
  workflowName,
  onSaveToGallery,
  onSendToTimeline,
  onSendToComposition,
  onStartNew
}: WorkflowResultsDisplayProps) {
  // Audio wizard state
  const [showAudioWizard, setShowAudioWizard] = useState(false);
  const [audioContext, setAudioContext] = useState<{
    videoUrl: string;
    videoDescription: string;
    videoIndex: number;
  } | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<Map<number, {
    audioUrl: string;
    audioType: string;
    creditsUsed: number;
  }>>(new Map());
  /**
   * Format time
   */
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  /**
   * Handle "Add Audio" button click - Universal for ALL videos
   */
  const handleAddAudio = (video: typeof results.videos[0], index: number) => {
    setAudioContext({
      videoUrl: video.url,
      videoDescription: video.description,
      videoIndex: index
    });
    setShowAudioWizard(true);
  };

  /**
   * Handle audio generation completion
   */
  const handleAudioGenerated = (result: {
    audioUrl: string;
    audioType: string;
    creditsUsed: number;
  }) => {
    if (!audioContext) return;

    // Store generated audio for this video
    setGeneratedAudio(prev => {
      const updated = new Map(prev);
      updated.set(audioContext.videoIndex, result);
      return updated;
    });

    toast.success('Audio generated!', {
      description: `${result.audioType === 'sfx' ? 'Sound effects' : 'Music'} added (${result.creditsUsed} credits)`
    });

    setShowAudioWizard(false);
    setAudioContext(null);
  };

  /**
   * Send video + audio to Composition for mixing
   */
  const handleSendToCompositionWithAudio = (videoIndex: number) => {
    const video = results.videos[videoIndex];
    const audio = generatedAudio.get(videoIndex);

    if (!audio) {
      toast.error('No audio generated for this video');
      return;
    }

    // Encode both video and audio for composition
    const compositionData = {
      videos: [{ url: video.url, description: video.description }],
      audio: [{ url: audio.audioUrl, type: audio.audioType }]
    };

    const encoded = encodeURIComponent(JSON.stringify(compositionData));
    window.location.href = `/app/composition?preload=${encoded}`;

    toast.success('Opening Composition with video + audio!');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Workflow Complete!
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {workflowName}
        </p>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-slate-700">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-1">
            <Play className="w-4 h-4" />
            <span className="text-xs font-medium">Videos Generated</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {results.videos.length}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Credits Used</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {results.totalCreditsUsed}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Generation Time</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatTime(results.executionTime)}
          </p>
        </div>

        {results.images && results.images.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-1">
              <FolderOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Images Created</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {results.images.length}
            </p>
          </div>
        )}
      </div>

      {/* Video Results */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
          Generated Videos ({results.videos.length})
        </h4>
        {results.videos.map((video, index) => {
          const hasAudio = generatedAudio.has(index);
          const audioData = generatedAudio.get(index);
          
          return (
          <div 
            key={index}
            className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden
                     bg-white dark:bg-slate-800"
          >
            {/* Video Player */}
            <video 
              src={video.url}
              controls
              className="w-full aspect-video bg-slate-900"
              poster={video.url.replace('.mp4', '_thumbnail.jpg')}
            />
            
            {/* Video Info */}
            <div className="p-3 space-y-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {video.description || `Video ${index + 1}`}
              </p>
              
              {/* Audio Badge if generated */}
              {hasAudio && audioData && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                  <Music className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs text-violet-700 dark:text-violet-300">
                    {audioData.audioType === 'sfx' ? 'Sound Effects' : 'Music'} added
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{video.creditsUsed} credits</span>
                <a 
                  href={video.url}
                  download
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
              
              {/* Audio Actions */}
              <div className="flex gap-2 pt-2">
                {!hasAudio ? (
                  <button
                    onClick={() => handleAddAudio(video, index)}
                    className="flex-1 py-2 px-3 rounded-lg border-2 border-violet-300 dark:border-violet-700
                             text-violet-700 dark:text-violet-300 font-medium text-sm
                             hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors
                             flex items-center justify-center gap-2"
                  >
                    <Music className="w-4 h-4" />
                    Add Audio
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendToCompositionWithAudio(index)}
                      className="flex-1 py-2 px-3 rounded-lg bg-violet-600 dark:bg-violet-700
                               text-white font-medium text-sm
                               hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors
                               flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Mix in Composition
                    </button>
                    {audioData && (
                      <a
                        href={audioData.audioUrl}
                        download
                        className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600
                                 text-slate-700 dark:text-slate-300 font-medium text-sm
                                 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                                 flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Audio
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );})}


        {/* Reference Images (if any) */}
        {results.images && results.images.length > 0 && (
          <>
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mt-4 mb-2">
              Reference Images ({results.images.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {results.images.map((image, index) => (
                <div 
                  key={index}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <img 
                    src={image.url}
                    alt={image.description}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-2 bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {image.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSaveToGallery}
            className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-300 font-medium text-sm
                     hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                     flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Save to Gallery
          </button>
          <button
            onClick={onSendToTimeline}
            className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-300 font-medium text-sm
                     hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                     flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send to Timeline
          </button>
        </div>
        
        <button
          onClick={onSendToComposition}
          className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-300 font-medium text-sm
                   hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                   flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Send to Composition
        </button>

        <button
          onClick={onStartNew}
          className="w-full py-3 px-4 rounded-lg bg-primary text-white font-bold
                   hover:bg-primary/90 transition-colors
                   flex items-center justify-center gap-2"
        >
          Start New Workflow
        </button>
      </div>

      {/* Audio Interview Wizard Modal */}
      {showAudioWizard && audioContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-slate-900 rounded-lg shadow-2xl">
            <AudioInterviewWizard
              sceneContext={audioContext.videoDescription}
              videoReference={audioContext.videoUrl}
              onComplete={(result) => {
                handleAudioGenerated({
                  audioUrl: result.audioUrl,
                  audioType: result.type || 'sfx',
                  creditsUsed: result.creditsUsed || 0
                });
              }}
              onCancel={() => {
                setShowAudioWizard(false);
                setAudioContext(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

