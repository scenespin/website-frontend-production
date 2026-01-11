'use client';

/**
 * Style Profiles Panel
 * 
 * Dedicated page for analyzing video styles and managing style profiles.
 * Located at: Direct → Style Profiles
 * 
 * Features:
 * - Analyze videos (upload or paste URL)
 * - List all style profiles
 * - Delete/manage profiles
 * - Pricing: 15 credits per profile
 * - "How It Works" help section
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Upload, 
  Loader2, 
  AlertCircle, 
  X,
  Sparkles,
  Film,
  Palette,
  Camera,
  Lightbulb,
  Trash2,
  Eye,
  HelpCircle,
  ExternalLink,
  Video,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import StyleAnalyzer from './StyleAnalyzer';
import { useCreateFolder, useUploadMedia } from '@/hooks/useMediaLibrary';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

interface StyleProfile {
  profileId: string;
  projectId: string;
  videoUrl: string;
  sceneId?: string;
  createdAt: string;
  updatedAt: string;
  attributes: {
    lighting: {
      type: string;
      intensity: string;
      colorTemperature: string;
      direction: string;
    };
    color: {
      palette: string[];
      saturation: string;
      contrast: string;
      mood: string;
    };
    composition: {
      framingStyle: string;
      depthOfField: string;
      symmetry: string;
      ruleOfThirds: boolean;
    };
    cameraStyle: {
      movement: string;
      anglePreference: string;
      stabilization: string;
      lens: string;
    };
    texture: {
      grainLevel: string;
      sharpness: string;
      filmicQuality: string;
    };
  };
  suggestedPromptAdditions: string[];
  confidence: number;
}

interface StyleProfilesPanelProps {
  projectId: string;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StyleProfilesPanel({
  projectId,
  className = '',
}: StyleProfilesPanelProps) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzerMode, setAnalyzerMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [styleProfilesFolderId, setStyleProfilesFolderId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Hooks
  const createFolderMutation = useCreateFolder(projectId);
  const uploadMediaMutation = useUploadMedia(projectId);

  // Fetch style profiles
  const { data: styleProfiles = { profiles: [] }, isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery<{ profiles: StyleProfile[] }>({
    queryKey: ['style-profiles', projectId],
    queryFn: async () => {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/style/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { profiles: [] };
        }
        throw new Error(`Failed to fetch style profiles: ${response.status}`);
      }

      return await response.json();
    },
  });

  // Get or create "Style Profiles" folder
  const getOrCreateStyleProfilesFolder = async (): Promise<string | null> => {
    if (styleProfilesFolderId) return styleProfilesFolderId;

    try {
      // Create folder in root (no parentFolderId)
      const folder = await createFolderMutation.mutateAsync({
        screenplayId: projectId,
        folderName: 'Style Profiles',
        parentFolderId: undefined, // Root folder
      });

      setStyleProfilesFolderId(folder.folderId);
      return folder.folderId;
    } catch (error: any) {
      // Folder might already exist - try to find it
      console.warn('[StyleProfilesPanel] Folder creation error:', error.message);
      // For now, return null and upload will still work (just won't be in folder)
      // TODO: Query existing folders to find "Style Profiles" folder
      return null;
    }
  };

  // Check credits before analysis
  const checkCredits = async (requiredCredits: number = 15): Promise<boolean> => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/credits/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: requiredCredits }),
      });

      if (!response.ok) {
        throw new Error('Failed to check credits');
      }

      const data = await response.json();
      return data.sufficient;
    } catch (error: any) {
      console.error('[StyleProfilesPanel] Credit check error:', error);
      return false;
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size exceeds 500MB limit');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMutationError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Get or create Style Profiles folder
      const folderId = await getOrCreateStyleProfilesFolder();

      // Step 1: Get presigned URL
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` + 
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&screenplayId=${encodeURIComponent(projectId)}` +
        `&projectId=${encodeURIComponent(projectId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!presignedResponse.ok) {
        throw new Error(`Failed to get upload URL: ${presignedResponse.status}`);
      }

      const { url, fields, s3Key } = await presignedResponse.json();

      // Step 2: Upload to S3
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      setUploadProgress(100);

      // Step 3: Register file in Media Library with folder
      await uploadMediaMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        s3Key: s3Key,
        folderId: folderId || undefined,
      });

      // Step 4: Get presigned download URL for analysis
      const downloadUrlResponse = await fetch('/api/s3/download-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
          expiresIn: 3600
        }),
      });

      if (!downloadUrlResponse.ok) {
        throw new Error('Failed to get download URL');
      }

      const { downloadUrl } = await downloadUrlResponse.json();

      // Set video URL and show analyzer
      setVideoUrl(downloadUrl);
      setAnalyzerMode('url');
      setShowAnalyzer(true);
      toast.success('Video uploaded! Starting style analysis...');

    } catch (error: any) {
      console.error('[StyleProfilesPanel] Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    handleFileUpload(file);
  };

  const handleAnalysisComplete = async (profile: StyleProfile) => {
    toast.success('Style profile created successfully!');
    setShowAnalyzer(false);
    setVideoUrl('');
    await refetchProfiles();
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this style profile?')) {
      return;
    }

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/style/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      toast.success('Style profile deleted');
      await refetchProfiles();
    } catch (error: any) {
      console.error('[StyleProfilesPanel] Delete error:', error);
      toast.error(error.message || 'Failed to delete profile');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0A0A0A] ${className}`}>
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[#3F3F46] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] flex items-center gap-3">
              <Palette className="w-8 h-8 text-[#DC143C]" />
              Style Profiles
            </h1>
            <p className="text-sm text-[#808080] mt-1">
              Analyze video styles for consistent generation
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-lg bg-[#141414] hover:bg-[#1F1F1F] text-[#808080] hover:text-[#FFFFFF] transition-colors"
            title="How it works"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* How It Works Section */}
        {showHelp && (
          <div className="mt-4 p-4 bg-[#141414] border border-[#3F3F46] rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFFFFF] mb-3">How Style Profiles Work</h3>
            <div className="space-y-3 text-sm text-[#B3B3B3]">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DC143C] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <p className="font-medium text-[#FFFFFF]">Analyze a video</p>
                  <p>Upload a video file or paste a video URL. We extract key frames and analyze the visual style.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DC143C] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <p className="font-medium text-[#FFFFFF]">Style profile is created</p>
                  <p>We capture lighting, color, composition, camera style, and texture attributes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DC143C] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <p className="font-medium text-[#FFFFFF]">Use in Scene Builder</p>
                  <p>Select the profile in Scene Builder generation settings. Your new videos will match the analyzed style.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DC143C] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">4</span>
                </div>
                <div>
                  <p className="font-medium text-[#FFFFFF]">Reuse profiles</p>
                  <p>Create multiple profiles for different looks and switch between them for different scenes.</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#3F3F46]">
                <p className="text-xs text-[#808080]">
                  <strong>Tip:</strong> Best results with high-quality, well-lit footage. Analyze videos with the style you want to replicate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        {!showAnalyzer && (
          <button
            onClick={() => setShowAnalyzer(true)}
            className="mt-4 w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold text-base md:text-lg min-h-[44px]"
          >
            Analyze New Video
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        {/* Analyzer Section */}
        {showAnalyzer && (
          <div className="mb-6 p-4 bg-[#141414] border border-[#3F3F46] rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#FFFFFF]">Analyze Video Style</h2>
              <button
                onClick={() => {
                  setShowAnalyzer(false);
                  setVideoUrl('');
                  setAnalyzerMode('url');
                }}
                className="p-1.5 text-[#808080] hover:text-[#FFFFFF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: URL or Upload */}
            <div className="flex gap-2 mb-4 border-b border-[#3F3F46]">
              <button
                onClick={() => setAnalyzerMode('url')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${
                  analyzerMode === 'url'
                    ? 'border-[#DC143C] text-[#FFFFFF]'
                    : 'border-transparent text-[#808080] hover:text-[#FFFFFF]'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Paste URL
              </button>
              <button
                onClick={() => setAnalyzerMode('upload')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${
                  analyzerMode === 'upload'
                    ? 'border-[#DC143C] text-[#FFFFFF]'
                    : 'border-transparent text-[#808080] hover:text-[#FFFFFF]'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Video
              </button>
            </div>

            {/* URL Input */}
            {analyzerMode === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                    className="w-full px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#0A0A0A] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
                  />
                  <p className="text-xs text-[#808080] mt-1">
                    Paste any video URL (YouTube, Vimeo, or direct video link)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#808080]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cost: 15 credits per analysis</span>
                  <Link 
                    href="/buy-credits" 
                    className="text-[#DC143C] hover:text-[#B91238] underline text-xs"
                    target="_blank"
                  >
                    View pricing →
                  </Link>
                </div>
              </div>
            )}

            {/* Upload Input */}
            {analyzerMode === 'upload' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                    Upload Video File
                  </label>
                  <div className="border-2 border-dashed border-[#3F3F46] rounded-lg p-6 text-center">
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto" />
                        <p className="text-sm text-[#FFFFFF]">Uploading... {uploadProgress}%</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-8 h-8 text-[#808080] mx-auto" />
                        <div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Choose File
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-[#808080]">
                          Max file size: 500MB. Video will be saved to Media Library → Style Profiles folder.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#808080]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cost: 15 credits per analysis</span>
                  <Link 
                    href="/buy-credits" 
                    className="text-[#DC143C] hover:text-[#B91238] underline text-xs"
                    target="_blank"
                  >
                    View pricing →
                  </Link>
                </div>
              </div>
            )}

            {/* Style Analyzer Component */}
            {videoUrl && analyzerMode === 'url' && (
              <div className="mt-4">
                <StyleAnalyzer
                  projectId={projectId}
                  videoUrl={videoUrl}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {mutationError && (
          <div className="mb-4 p-4 bg-[#DC143C]/20 border border-[#DC143C] rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-[#FFFFFF]">Error</p>
              <p className="text-sm text-[#B3B3B3]">{mutationError}</p>
            </div>
            <button
              onClick={() => setMutationError(null)}
              className="text-[#DC143C] hover:text-[#B91238]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Style Profiles List */}
        <div>
          <h2 className="text-xl font-semibold text-[#FFFFFF] mb-4">
            Your Style Profiles ({styleProfiles.profiles?.length || 0})
          </h2>

          {isLoadingProfiles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#808080]" />
            </div>
          ) : !styleProfiles.profiles || styleProfiles.profiles.length === 0 ? (
            <div className="text-center py-12 bg-[#141414] border border-[#3F3F46] rounded-lg">
              <Palette className="w-12 h-12 text-[#808080] mx-auto mb-4" />
              <p className="text-[#B3B3B3] mb-2">No style profiles yet</p>
              <p className="text-sm text-[#808080]">
                Analyze a video to create your first style profile
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {styleProfiles.profiles.map((profile) => (
                <div
                  key={profile.profileId}
                  className="bg-[#141414] border border-[#3F3F46] rounded-lg p-4 hover:border-[#DC143C]/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#FFFFFF] truncate">
                        {profile.videoUrl.split('/').pop() || 'Style Profile'}
                      </h3>
                      <p className="text-xs text-[#808080] mt-1">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteProfile(profile.profileId)}
                      className="p-1.5 text-[#808080] hover:text-[#DC143C] transition-colors flex-shrink-0"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile Preview */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-3 h-3 text-[#808080]" />
                      <span className="text-[#B3B3B3]">
                        {profile.attributes.lighting.type} lighting
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-3 h-3 text-[#808080]" />
                      <span className="text-[#B3B3B3]">
                        {profile.attributes.color.mood} mood
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-3 h-3 text-[#808080]" />
                      <span className="text-[#B3B3B3]">
                        {profile.attributes.cameraStyle.movement} camera
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#3F3F46]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#808080]">Confidence</span>
                        <span className="text-[#DC143C] font-medium">
                          {Math.round(profile.confidence)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
