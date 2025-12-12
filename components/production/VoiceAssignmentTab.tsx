'use client';

/**
 * VoiceAssignmentTab - Voice profile management UI for Character Bank
 * 
 * Features:
 * - Display current voice profile status
 * - Auto-match voice assignment
 * - Custom voice assignment
 * - Voice preview with custom text
 * - Delete/change voice assignment
 */

import React, { useState } from 'react';
import { Volume2, Play, Trash2, Edit, Mic, Search, X, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface VoiceProfile {
  id: string;
  characterId: string;
  voiceName: string;
  voiceType: 'custom' | 'auto-matched';
  elevenLabsVoiceId?: string;
  autoMatchedVoiceId?: string;
  matchScore?: number;
  createdAt: string;
}

interface VoiceAssignmentTabProps {
  characterId: string;
  screenplayId: string;
  character: any; // CharacterProfile type
  voiceProfile: VoiceProfile | null;
  onVoiceUpdate: () => void;
  onOpenVoiceBrowser: () => void;
  onOpenCustomVoiceForm: () => void;
}

export function VoiceAssignmentTab({
  characterId,
  screenplayId,
  character,
  voiceProfile,
  onVoiceUpdate,
  onOpenVoiceBrowser,
  onOpenCustomVoiceForm,
}: VoiceAssignmentTabProps) {
  const { getToken } = useAuth();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewText, setPreviewText] = useState('Hello, this is a preview of this voice. How does it sound?');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingFromBrowse, setIsRemovingFromBrowse] = useState(false);

  // Get character demographics for auto-match
  const getCharacterDemographics = () => {
    const physicalAttributes = character.physicalAttributes || {};
    const metadata = character.metadata || {};
    
    return {
      gender: physicalAttributes.gender || metadata.gender || 'unknown',
      age: physicalAttributes.age || metadata.age || 'unknown',
      accent: metadata.accent || undefined,
    };
  };


  // Handle auto-match voice assignment
  const handleAutoMatch = async () => {
    if (isAutoMatching) return;
    
    setIsAutoMatching(true);
    try {
      const token = await getToken();
      const demographics = getCharacterDemographics();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/auto-match`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId,
            screenplayId,
            characterDemographics: demographics,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to auto-match voice');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Voice auto-matched successfully!');
        onVoiceUpdate();
      } else {
        throw new Error(data.error || 'Auto-match failed');
      }
    } catch (error: any) {
      console.error('Auto-match error:', error);
      toast.error(error.message || 'Failed to auto-match voice');
    } finally {
      setIsAutoMatching(false);
    }
  };

  // Handle voice preview
  const handlePreviewVoice = async () => {
    // Get voice ID based on voice type
    const voiceId = voiceProfile?.voiceType === 'auto-matched' 
      ? voiceProfile.autoMatchedVoiceId 
      : voiceProfile?.elevenLabsVoiceId;
    
    if (!voiceId || !previewText.trim()) {
      toast.error('Please enter text to preview');
      return;
    }

    setIsPreviewing(true);
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/preview`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            voiceId: voiceId,
            sampleText: previewText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preview voice');
      }

      const data = await response.json();
      if (data.success && data.audioUrl) {
        setPreviewAudioUrl(data.audioUrl);
        // Auto-play preview
        const audio = new Audio(data.audioUrl);
        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          toast.error('Failed to play audio preview');
        });
      } else {
        throw new Error('No audio URL returned');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(error.message || 'Failed to preview voice');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Handle delete voice (removes from character only)
  const handleDeleteVoice = async () => {
    if (!voiceProfile || isDeleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this voice profile? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/${characterId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete voice profile');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Voice profile deleted successfully');
        onVoiceUpdate();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete voice profile');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle remove voice from Browse (removes from all characters and Browse list)
  const handleRemoveFromBrowse = async () => {
    if (!voiceProfile || !voiceProfile.elevenLabsVoiceId || isRemovingFromBrowse) return;
    
    const confirmed = window.confirm(
      `Remove "${voiceProfile.voiceName}" from Browse?\n\nThis will remove this voice from all characters and it will no longer appear in the Browse Voices list. This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsRemovingFromBrowse(true);
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/remove-from-browse/${voiceProfile.elevenLabsVoiceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove voice from Browse');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Voice removed from Browse. Deleted ${data.deletedCount} voice profile(s).`);
        onVoiceUpdate();
      } else {
        throw new Error(data.error || 'Remove failed');
      }
    } catch (error: any) {
      console.error('Remove from browse error:', error);
      toast.error(error.message || 'Failed to remove voice from Browse');
    } finally {
      setIsRemovingFromBrowse(false);
    }
  };

  return (
    <div className="space-y-6">
      {voiceProfile ? (
        <>
          {/* Voice Profile Status */}
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Volume2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#FFFFFF]">Voice Assigned</h3>
                  <p className="text-sm text-[#808080]">
                    {voiceProfile.voiceType === 'auto-matched' ? 'Auto-matched voice' : 'Custom voice'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Voice Name</label>
                <p className="text-[#FFFFFF] font-medium">{voiceProfile.voiceName || 'Unnamed Voice'}</p>
              </div>
              <div>
                <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Voice Type</label>
                <p className="text-[#FFFFFF] capitalize">{voiceProfile.voiceType || 'Custom'}</p>
              </div>
              {voiceProfile.matchScore && (
                <div>
                  <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Match Score</label>
                  <p className="text-[#FFFFFF]">{voiceProfile.matchScore}%</p>
                </div>
              )}
            </div>

            {/* Voice Preview Section */}
            <div className="border-t border-[#3F3F46] pt-6 mt-6">
              <h4 className="text-sm font-semibold text-[#FFFFFF] mb-3">Preview Voice</h4>
              <div className="space-y-3">
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Enter text to preview..."
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#DC143C] focus:outline-none resize-none"
                  rows={3}
                  maxLength={5000}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePreviewVoice}
                    disabled={isPreviewing || !previewText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#DC143C] hover:bg-[#B91C1C] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {isPreviewing ? 'Generating...' : 'Preview Voice'}
                  </button>
                  {previewAudioUrl && (
                    <audio
                      controls
                      src={previewAudioUrl}
                      className="flex-1 h-10"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-6 pt-6 border-t border-[#3F3F46]">
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenVoiceBrowser}
                  className="flex-1 px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  Change Voice
                </button>
                <button
                  onClick={handleDeleteVoice}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#DC143C] hover:bg-[#B91C1C] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Voice'}
                </button>
              </div>
              
              {/* Remove from Browse - Only show for custom voices */}
              {voiceProfile.voiceType === 'custom' && voiceProfile.elevenLabsVoiceId && (
                <button
                  onClick={handleRemoveFromBrowse}
                  disabled={isRemovingFromBrowse}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-[#3F3F46] disabled:text-[#808080] text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-500/30"
                >
                  <Unlink className="w-4 h-4" />
                  {isRemovingFromBrowse ? 'Removing...' : 'Remove from Browse'}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* No Voice Assigned */}
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Mic className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#FFFFFF]">No Voice Assigned</h3>
                  <p className="text-sm text-[#808080]">Assign a voice to enable dialogue generation</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium">
                Not Assigned
              </span>
            </div>

            <p className="text-[#808080] mb-6">
              Choose how you want to assign a voice to this character. Auto-match uses AI to find the best voice based on character demographics, or you can provide your own ElevenLabs voice.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAutoMatch}
                disabled={isAutoMatching}
                className="w-full px-4 py-3 bg-[#DC143C] hover:bg-[#B91C1C] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isAutoMatching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Matching Voice...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Auto-Match Voice
                  </>
                )}
              </button>
              <button
                onClick={onOpenCustomVoiceForm}
                className="w-full px-4 py-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
              >
                Use Custom Voice (Your ElevenLabs API Key)
              </button>
              <button
                onClick={onOpenVoiceBrowser}
                className="w-full px-4 py-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Browse Available Voices
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

