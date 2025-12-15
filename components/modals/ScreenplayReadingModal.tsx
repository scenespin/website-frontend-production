'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Headphones, CheckCircle2, AlertCircle, Download, Play, Pause, Volume2, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VoiceBrowserModal } from '@/components/production/VoiceBrowserModal';

interface Scene {
  id: string;
  heading: string;
  synopsis?: string;
  characterCount?: number;
  hasDialogue?: boolean;
}

interface CharacterVoice {
  characterId: string;
  characterName: string;
  voiceName: string | null;
  voiceType: 'custom' | 'auto-matched' | null;
  isManualSelection?: boolean; // True if user manually selected the voice
  hasVoice: boolean;
}

interface ReadingResult {
  audioUrl: string;
  s3Key: string;
  sceneAudios?: Array<{
    sceneId: string;
    audioUrl: string;
    s3Key: string;
    heading?: string;
    creditsUsed: number;
  }>;
  subtitleUrl?: string;
  subtitleS3Key?: string;
  totalDuration?: number;
  creditsUsed: number;
  scenesProcessed: string[];
  scenesFailed?: Array<{
    sceneId: string;
    error: string;
  }>;
  characterVoiceMapping: Record<string, string>;
}

interface ScreenplayReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenplayId: string;
  screenplayTitle?: string;
}

export default function ScreenplayReadingModal({
  isOpen,
  onClose,
  screenplayId,
  screenplayTitle
}: ScreenplayReadingModalProps) {
  const { getToken } = useAuth();
  const { characters, scenes: screenplayScenes } = useScreenplay();
  const router = useRouter();
  
  // State
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [characterVoices, setCharacterVoices] = useState<CharacterVoice[]>([]);
  const [narratorVoiceId, setNarratorVoiceId] = useState<string | null>(null);
  const [narratorVoiceName, setNarratorVoiceName] = useState<string | null>(null);
  const [showVoiceBrowser, setShowVoiceBrowser] = useState(false);
  const [characterVoiceBrowserOpen, setCharacterVoiceBrowserOpen] = useState<string | null>(null); // characterId when open
  const [includeNarration, setIncludeNarration] = useState(false);
  const [includeTimestamps, setIncludeTimestamps] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [failedScenes, setFailedScenes] = useState<Array<{ sceneId: string; error: string }>>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isAsyncJob, setIsAsyncJob] = useState(false);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<Array<{
    jobId: string;
    completedAt: string;
    scenesProcessed: number;
    creditsUsed: number;
  }>>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  // Audio player state
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fetch scenes when modal opens
  useEffect(() => {
    if (isOpen && screenplayId) {
      // Use scenes from context first (already loaded), fallback to API if needed
      if (screenplayScenes && screenplayScenes.length > 0) {
        // Transform context scenes to match our format
        const transformedScenes = screenplayScenes.map(scene => ({
          id: scene.id,
          heading: scene.heading || '',
          synopsis: scene.synopsis,
          characterCount: 0, // Scene type doesn't have characters array - will be calculated if needed
          hasDialogue: true // Assume true if scene exists
        }));
        setScenes(transformedScenes);
      } else {
        // Fallback to API if context doesn't have scenes
        fetchScenes();
      }
      fetchCharacterVoices();
    }
  }, [isOpen, screenplayId, screenplayScenes]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSceneIds([]);
      setResult(null);
      setFailedScenes([]);
      setJobId(null);
      setEstimatedTime(null);
      setIsAsyncJob(false);
      setGenerationProgress(null);
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        setAudioElement(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }
    }
  }, [isOpen]);

  // Fetch scenes from API
  const fetchScenes = async () => {
    setIsLoadingScenes(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication failed');
        return;
      }

      const response = await fetch(`/api/screenplay/${screenplayId}/scenes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.scenes) {
        setScenes(data.scenes);
      } else {
        toast.error('Failed to load scenes');
      }
    } catch (error) {
      console.error('[ScreenplayReadingModal] Failed to fetch scenes:', error);
      toast.error('Failed to load scenes');
    } finally {
      setIsLoadingScenes(false);
    }
  };

  // Fetch character voices
  const fetchCharacterVoices = async () => {
    if (!characters || characters.length === 0) return;
    
    setIsLoadingVoices(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        return;
      }

      const voicePromises = characters.map(async (char) => {
        try {
          const response = await fetch(`/api/voice-profile/${char.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          return {
            characterId: char.id,
            characterName: char.name,
            voiceName: data.voiceProfile?.voiceName || data.voiceProfile?.autoMatchedVoiceName || null,
            voiceType: data.voiceProfile?.voiceType || null,
            isManualSelection: data.voiceProfile?.isManualSelection || false,
            hasVoice: !!data.voiceProfile
          };
        } catch (error) {
          console.error(`[ScreenplayReadingModal] Failed to fetch voice for ${char.name}:`, error);
          return {
            characterId: char.id,
            characterName: char.name,
            voiceName: null,
            voiceType: null,
            isManualSelection: false,
            hasVoice: false
          };
        }
      });

      const voices = await Promise.all(voicePromises);
      setCharacterVoices(voices);
    } catch (error) {
      console.error('[ScreenplayReadingModal] Failed to fetch character voices:', error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Get character demographics for voice browser
  const getCharacterDemographics = (characterId: string) => {
    const character = characters?.find(c => c.id === characterId);
    if (!character) return undefined;
    
    const physicalAttributes = (character as any).physicalAttributes || {};
    const metadata = (character as any).metadata || {};
    
    return {
      gender: physicalAttributes.gender || metadata.gender || undefined,
      age: physicalAttributes.age || metadata.age || undefined,
      accent: metadata.accent || undefined,
    };
  };

  // Handle character voice assignment
  const handleCharacterVoiceSelected = async (
    characterId: string,
    voiceId: string,
    voiceName: string,
    isCustom?: boolean
  ) => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication failed');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/select`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId,
            screenplayId,
            voiceId,
            isCustom: isCustom || false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign voice');
      }

      const data = await response.json();
      if (data.success) {
        const character = characters?.find(c => c.id === characterId);
        toast.success(`Voice "${voiceName}" assigned to ${character?.name || 'character'}!`);
        fetchCharacterVoices(); // Refresh the list
        setCharacterVoiceBrowserOpen(null); // Close browser modal
      } else {
        throw new Error(data.error || 'Voice assignment failed');
      }
    } catch (error: any) {
      console.error('[ScreenplayReadingModal] Voice assignment error:', error);
      toast.error(error.message || 'Failed to assign voice');
    }
  };

  // Handle scene selection
  const handleSceneToggle = (sceneId: string) => {
    setSelectedSceneIds(prev => {
      if (prev.includes(sceneId)) {
        return prev.filter(id => id !== sceneId);
      } else {
        return [...prev, sceneId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedSceneIds(scenes.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSceneIds([]);
  };

  // Handle generation
  const handleGenerate = async () => {
    if (selectedSceneIds.length === 0) {
      toast.error('Please select at least one scene');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedSceneIds.length });

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication failed');
        return;
      }

      const response = await fetch(`/api/screenplay/${screenplayId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedSceneIds: selectedSceneIds.length === scenes.length ? [] : selectedSceneIds, // Empty array = all scenes
          includeNarration,
          includeTimestamps,
          narratorVoiceId: narratorVoiceId || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        // Check if async job (has jobId)
        if (data.jobId) {
          // Async job - redirect to jobs tab
          setJobId(data.jobId);
          setEstimatedTime(data.estimatedTime);
          setIsAsyncJob(true);
          
          toast.info('Screenplay reading started', {
            description: `This will take approximately ${data.estimatedTime} minutes. Redirecting to Jobs tab...`
          });
          
          // Close modal and redirect to jobs tab
          onClose();
          router.push(`/production?tab=jobs&jobId=${data.jobId}`);
        } else if (data.result) {
          // Synchronous result - show immediately
          setResult(data.result);
          
          // Handle failed scenes
          if (data.result.scenesFailed && data.result.scenesFailed.length > 0) {
            setFailedScenes(data.result.scenesFailed);
            toast.warning(`Audio generated with ${data.result.scenesFailed.length} failed scene(s)`, {
              description: 'Some scenes could not be processed. Check the error details below.'
            });
          } else {
            toast.success('Audio generated successfully!');
          }
          
          // Show Media Library notification
          toast.info('Files saved to Media Library', {
            description: 'You can access them from the Media Library tab'
          });

          // Initialize audio player
          if (data.result.audioUrl) {
            const audio = new Audio(data.result.audioUrl);
            audio.addEventListener('loadedmetadata', () => {
              setDuration(audio.duration);
            });
            audio.addEventListener('timeupdate', () => {
              setCurrentTime(audio.currentTime);
            });
            audio.addEventListener('ended', () => {
              setIsPlaying(false);
              setCurrentTime(0);
            });
            setAudioElement(audio);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('[ScreenplayReadingModal] Generation failed:', error);
      toast.error('Failed to generate audio', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Audio player controls
  const handlePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioElement) return;
    const newTime = parseFloat(e.target.value);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Download handlers
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isGenerating || showVoiceBrowser || characterVoiceBrowserOpen ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>
        
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-base-300">
                  <div className="flex items-center gap-3">
                    <Headphones className="w-6 h-6 text-primary" />
                    <div>
                      <Dialog.Title className="text-xl font-bold">
                        Read Screenplay
                      </Dialog.Title>
                      {screenplayTitle && (
                        <p className="text-sm text-base-content/60 mt-1">{screenplayTitle}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isGenerating}
                    className="p-2 hover:bg-base-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {result ? (
                    // Result Screen
                    <div className="space-y-6">
                      {/* Success Message */}
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">Audio Generated Successfully!</span>
                      </div>

                      {/* Audio Player */}
                      {result.audioUrl && (
                        <div className="bg-base-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Combined Audio Player</h3>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={handlePlayPause}
                                className="p-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors"
                              >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              </button>
                              <div className="flex-1">
                                <input
                                  type="range"
                                  min="0"
                                  max={duration || 0}
                                  value={currentTime}
                                  onChange={handleSeek}
                                  className="w-full"
                                />
                              </div>
                              <div className="text-sm text-base-content/60 min-w-[80px] text-right">
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="bg-base-200 rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold mb-3">Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-base-content/60">Scenes processed:</span>
                            <span className="ml-2 font-semibold">{result.scenesProcessed.length} of {selectedSceneIds.length || scenes.length}</span>
                          </div>
                          {result.totalDuration && (
                            <div>
                              <span className="text-base-content/60">Duration:</span>
                              <span className="ml-2 font-semibold">{formatTime(result.totalDuration)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-base-content/60">Credits used:</span>
                            <span className="ml-2 font-semibold">{result.creditsUsed.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-base-content/60">Characters:</span>
                            <span className="ml-2 font-semibold">{Object.keys(result.characterVoiceMapping).length}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-base-300">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm">Saved to Media Library</span>
                          </div>
                        </div>
                      </div>

                      {/* Individual Scene Files */}
                      {result.sceneAudios && result.sceneAudios.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold">Individual Scene Files (for QA)</h3>
                          <div className="space-y-2">
                            {result.sceneAudios.map((sceneAudio) => (
                              <div key={sceneAudio.sceneId} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                <div>
                                  <p className="font-medium">{sceneAudio.heading || `Scene ${sceneAudio.sceneId}`}</p>
                                  <p className="text-sm text-base-content/60">{sceneAudio.creditsUsed} credits</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDownload(sceneAudio.audioUrl, `${sceneAudio.heading || sceneAudio.sceneId}.mp3`)}
                                    className="px-3 py-1.5 bg-primary text-primary-content rounded hover:bg-primary-focus transition-colors text-sm flex items-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    MP3
                                  </button>
                                  {result.subtitleUrl && (
                                    <button
                                      onClick={() => {
                                        // TODO: Implement individual scene subtitle download
                                        toast.info('Individual scene subtitle download coming soon');
                                      }}
                                      className="px-3 py-1.5 bg-base-300 hover:bg-base-400 rounded transition-colors text-sm flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      SRT
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Failed Scenes */}
                      {failedScenes.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-yellow-800 mb-3">
                            <AlertCircle className="w-5 h-5" />
                            <h3 className="font-semibold">Failed Scenes</h3>
                          </div>
                          <div className="space-y-2">
                            {failedScenes.map((failed) => (
                              <div key={failed.sceneId} className="text-sm text-yellow-700">
                                <p><strong>Scene {failed.sceneId}:</strong> {failed.error}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Combined Downloads */}
                      <div className="space-y-2">
                        <h3 className="font-semibold">Combined Downloads</h3>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDownload(result.audioUrl, `${screenplayTitle || 'screenplay'}.mp3`)}
                            className="px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors flex items-center gap-2"
                          >
                            <Download className="w-5 h-5" />
                            Download Combined MP3
                          </button>
                          {result.subtitleUrl && (
                            <button
                              onClick={() => handleDownload(result.subtitleUrl!, `${screenplayTitle || 'screenplay'}.srt`)}
                              className="px-4 py-2 bg-base-300 hover:bg-base-400 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Download className="w-5 h-5" />
                              Download Combined SRT
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Configuration Screen
                    <div className="space-y-6">
                      {/* Scene Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            📖 Select Scenes
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSelectAll}
                              className="text-sm px-3 py-1 bg-base-200 hover:bg-base-300 rounded transition-colors"
                            >
                              Select All
                            </button>
                            <button
                              onClick={handleDeselectAll}
                              className="text-sm px-3 py-1 bg-base-200 hover:bg-base-300 rounded transition-colors"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        
                        {isLoadingScenes ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : scenes.length === 0 ? (
                          <div className="text-center p-8 text-base-content/60">
                            No scenes found
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto space-y-2 border border-base-300 rounded-lg p-3">
                            {scenes.map((scene) => (
                              <label
                                key={scene.id}
                                className="flex items-start gap-3 p-3 hover:bg-base-200 rounded cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSceneIds.includes(scene.id)}
                                  onChange={() => handleSceneToggle(scene.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{scene.heading}</p>
                                  {scene.synopsis && (
                                    <p className="text-sm text-base-content/60 mt-1">{scene.synopsis}</p>
                                  )}
                                  <div className="flex gap-4 mt-1 text-xs text-base-content/50">
                                    {scene.characterCount !== undefined && (
                                      <span>Characters: {scene.characterCount}</span>
                                    )}
                                    {scene.hasDialogue !== undefined && (
                                      <span>Dialogue: {scene.hasDialogue ? 'Yes' : 'No'}</span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Narrator Voice */}
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          🎙️ Narrator Voice
                        </h3>
                        <div className="bg-base-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {narratorVoiceName || 'Rachel (default)'}
                              </p>
                              <p className="text-xs text-base-content/60">
                                Voice for action lines and narration
                              </p>
                            </div>
                            <button
                              onClick={() => setShowVoiceBrowser(true)}
                              className="px-3 py-1.5 bg-primary text-primary-content rounded hover:bg-primary-focus transition-colors text-sm flex items-center gap-2"
                            >
                              <Volume2 className="w-4 h-4" />
                              {narratorVoiceId ? 'Change Voice' : 'Select Voice'}
                            </button>
                          </div>
                          {narratorVoiceId && (
                            <button
                              onClick={() => {
                                setNarratorVoiceId(null);
                                setNarratorVoiceName(null);
                              }}
                              className="text-xs text-base-content/60 hover:text-base-content underline"
                            >
                              Reset to default (Rachel)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Recent Completed Jobs */}
                      {completedJobs.length > 0 && (
                        <div className="bg-base-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Recent Completed Jobs
                            </h3>
                            <button
                              onClick={() => router.push('/production?tab=jobs')}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              View All
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {completedJobs.slice(0, 3).map((job) => (
                              <div
                                key={job.jobId}
                                onClick={() => router.push(`/production?tab=jobs&jobId=${job.jobId}`)}
                                className="p-3 bg-base-100 rounded cursor-pointer hover:bg-base-300 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium">
                                      {job.scenesProcessed} scene(s) • {job.creditsUsed.toLocaleString()} credits
                                    </span>
                                  </div>
                                  <span className="text-xs text-base-content/60">
                                    {new Date(job.completedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-base-content/60 pt-2 border-t border-base-300">
                            💡 Completed jobs are saved to Media Library. Files are also available in the Jobs tab for download.
                          </p>
                        </div>
                      )}

                      {/* Async Job Message */}
                      {isAsyncJob && jobId && (
                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2 text-blue-300">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-semibold">Job Started</span>
                          </div>
                          <p className="text-sm text-blue-200">
                            Your screenplay reading is processing. This will take approximately {estimatedTime} minutes.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/production?tab=jobs&jobId=${jobId}`)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                            >
                              View Job Progress
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setIsAsyncJob(false);
                                setJobId(null);
                                setEstimatedTime(null);
                              }}
                              className="px-4 py-2 bg-base-300 hover:bg-base-400 rounded-lg transition-colors text-sm"
                            >
                              Dismiss
                            </button>
                          </div>
                          <p className="text-xs text-blue-300/80">
                            💡 When complete, files will be saved to Media Library and available in the Jobs tab.
                          </p>
                        </div>
                      )}

                      {/* Options */}
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          ⚙️ Options
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeNarration}
                              onChange={(e) => setIncludeNarration(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span>Include narration (action lines)</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeTimestamps}
                              onChange={(e) => setIncludeTimestamps(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span>Include timestamps (for subtitles)</span>
                          </label>
                        </div>
                      </div>

                      {/* Character Voices */}
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          👥 Character Voices
                        </h3>
                        {isLoadingVoices ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        ) : characterVoices.length === 0 ? (
                          <div className="text-center p-4 text-base-content/60 text-sm">
                            No characters found
                          </div>
                        ) : (
                          <div className="space-y-2 bg-base-200 rounded-lg p-4">
                            {characterVoices.map((voice) => (
                              <div key={voice.characterId} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {voice.hasVoice ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium block truncate">{voice.characterName}</span>
                                    <div className="text-xs text-base-content/60">
                                      {voice.hasVoice ? (
                                        <span>
                                          {voice.voiceType === 'custom' 
                                            ? 'Custom' 
                                            : voice.isManualSelection 
                                              ? 'User selected' 
                                              : voice.voiceType === 'auto-matched' 
                                                ? 'Auto-matched' 
                                                : 'Assigned'}: {voice.voiceName}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-600">Will auto-match</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setCharacterVoiceBrowserOpen(voice.characterId)}
                                  className="px-3 py-1.5 bg-primary text-primary-content rounded hover:bg-primary-focus transition-colors text-sm flex items-center gap-1.5 flex-shrink-0"
                                  title={voice.hasVoice ? 'Change voice' : 'Assign voice'}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  {voice.hasVoice ? 'Change' : 'Assign'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!result && (
                  <div className="border-t border-base-300 p-6 flex items-center justify-end gap-3">
                    <button
                      onClick={onClose}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-base-200 hover:bg-base-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || selectedSceneIds.length === 0 || isLoadingScenes}
                      className="px-6 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Headphones className="w-4 h-4" />
                          Generate Audio
                        </>
                      )}
                    </button>
                  </div>
                )}

                {result && (
                  <div className="border-t border-base-300 p-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setResult(null);
                        setFailedScenes([]);
                        setSelectedSceneIds([]);
                        if (audioElement) {
                          audioElement.pause();
                          audioElement.src = '';
                          setAudioElement(null);
                          setIsPlaying(false);
                          setCurrentTime(0);
                          setDuration(0);
                        }
                      }}
                      className="px-4 py-2 bg-base-200 hover:bg-base-300 rounded-lg transition-colors"
                    >
                      Generate Another
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
        
        {/* Voice Browser Modal - Narrator */}
        <VoiceBrowserModal
          isOpen={showVoiceBrowser}
          onClose={() => setShowVoiceBrowser(false)}
          onSelectVoice={(voiceId, voiceName) => {
            setNarratorVoiceId(voiceId);
            setNarratorVoiceName(voiceName);
            setShowVoiceBrowser(false);
            toast.success(`Narrator voice set to ${voiceName}`);
          }}
        />

        {/* Voice Browser Modal - Character */}
        {characterVoiceBrowserOpen && (
          <VoiceBrowserModal
            isOpen={!!characterVoiceBrowserOpen}
            onClose={() => setCharacterVoiceBrowserOpen(null)}
            onSelectVoice={(voiceId, voiceName, isCustom) => {
              if (characterVoiceBrowserOpen) {
                handleCharacterVoiceSelected(characterVoiceBrowserOpen, voiceId, voiceName, isCustom);
              }
            }}
            characterDemographics={characterVoiceBrowserOpen ? getCharacterDemographics(characterVoiceBrowserOpen) : undefined}
          />
        )}
      </Dialog>
    </Transition>
  );
}

