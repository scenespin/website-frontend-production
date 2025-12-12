'use client';

/**
 * VoiceBrowserModal - Browse and preview available voices
 * 
 * Features:
 * - Browse voices from ElevenLabs library
 * - Filter by gender, age, accent
 * - Search voices by name
 * - Preview voice with sample text
 * - Select voice for assignment
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Play, Volume2, Filter, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface Voice {
  voiceId: string;
  voiceName: string;
  description: string;
  gender?: string;
  age?: string;
  accent?: string;
  useCase?: string;
  previewUrl?: string;
  category?: string;
  isCustom?: boolean; // True if this is a custom voice (cloned/generated)
}

interface VoiceBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voiceId: string, voiceName: string) => void;
  characterDemographics?: {
    gender?: string;
    age?: string;
    accent?: string;
  };
}

export function VoiceBrowserModal({
  isOpen,
  onClose,
  onSelectVoice,
  characterDemographics,
}: VoiceBrowserModalProps) {
  const { getToken } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    gender: characterDemographics?.gender || '',
    age: characterDemographics?.age || '',
    accent: characterDemographics?.accent || '',
  });
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('Hello, this is a preview of this voice. How does it sound?');
  const [removingVoiceId, setRemovingVoiceId] = useState<string | null>(null);

  // Fetch voices on mount
  useEffect(() => {
    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen]);

  // Filter voices when search or filters change
  useEffect(() => {
    let filtered = [...voices];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        voice =>
          voice.voiceName.toLowerCase().includes(query) ||
          voice.description.toLowerCase().includes(query) ||
          voice.useCase?.toLowerCase().includes(query)
      );
    }

    // Apply gender filter
    if (filters.gender && filters.gender !== 'unknown') {
      filtered = filtered.filter(voice => voice.gender?.toLowerCase() === filters.gender.toLowerCase());
    }

    // Apply age filter
    if (filters.age && filters.age !== 'unknown') {
      filtered = filtered.filter(voice => voice.age?.toLowerCase() === filters.age.toLowerCase());
    }

    // Apply accent filter
    if (filters.accent) {
      filtered = filtered.filter(voice => voice.accent?.toLowerCase().includes(filters.accent.toLowerCase()));
    }

    setFilteredVoices(filtered);
  }, [voices, searchQuery, filters]);

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const queryParams = new URLSearchParams();
      if (filters.gender && filters.gender !== 'unknown') queryParams.append('gender', filters.gender);
      if (filters.age && filters.age !== 'unknown') queryParams.append('age', filters.age);
      if (filters.accent) queryParams.append('accent', filters.accent);
      queryParams.append('limit', '100');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/browse?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      if (data.success && data.voices) {
        // Debug: Log voices to check isCustom flag
        console.log('[VoiceBrowserModal] Fetched voices:', data.voices.map((v: any) => ({
          name: v.voiceName,
          isCustom: v.isCustom,
          category: v.category,
          voiceId: v.voiceId
        })));
        setVoices(data.voices);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      toast.error(error.message || 'Failed to load voices');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    if (previewingVoiceId === voiceId && previewAudioUrl) {
      // Replay existing preview
      const audio = new Audio(previewAudioUrl);
      audio.addEventListener('ended', () => {
        setPreviewingVoiceId(null);
      });
      audio.play().catch(err => {
        console.error('Audio play failed:', err);
        toast.error('Failed to play audio preview');
        setPreviewingVoiceId(null);
      });
      return;
    }

    setPreviewingVoiceId(voiceId);
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
            voiceId,
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
        audio.addEventListener('ended', () => {
          setPreviewingVoiceId(null);
        });
        audio.addEventListener('error', () => {
          setPreviewingVoiceId(null);
        });
        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          toast.error('Failed to play audio preview');
          setPreviewingVoiceId(null);
        });
      } else {
        throw new Error('No audio URL returned');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(error.message || 'Failed to preview voice');
      setPreviewingVoiceId(null);
    }
  };

  const handleSelectVoice = (voice: Voice) => {
    onSelectVoice(voice.voiceId, voice.voiceName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-[60]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#DC143C]/10 rounded-lg">
                  <Volume2 className="w-6 h-6 text-[#DC143C]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#FFFFFF]">Browse Voices</h2>
                  <p className="text-sm text-[#808080]">Select a voice for your character</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters and Search */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] bg-[#141414] space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#808080]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search voices by name or description..."
                  className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#DC143C] focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <Filter className="w-4 h-4 text-[#808080]" />
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#DC143C] focus:outline-none"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                </select>
                <select
                  value={filters.age}
                  onChange={(e) => setFilters({ ...filters, age: e.target.value })}
                  className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#DC143C] focus:outline-none"
                >
                  <option value="">All Ages</option>
                  <option value="young">Young</option>
                  <option value="middle">Middle</option>
                  <option value="elderly">Elderly</option>
                </select>
                <select
                  value={filters.accent}
                  onChange={(e) => setFilters({ ...filters, accent: e.target.value })}
                  className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#DC143C] focus:outline-none"
                >
                  <option value="">All Accents</option>
                  <option value="american">American</option>
                  <option value="british">British</option>
                  <option value="australian">Australian</option>
                  <option value="irish">Irish</option>
                  <option value="scottish">Scottish</option>
                </select>
                <button
                  onClick={fetchVoices}
                  className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Preview Text Input */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-[#3F3F46] bg-[#141414]">
              <label className="text-xs text-[#808080] uppercase tracking-wide mb-2 block">Preview Text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Enter text to preview voices..."
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#DC143C] focus:outline-none"
                maxLength={5000}
              />
            </div>

            {/* Voices List */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-[#808080]">Loading voices...</div>
                </div>
              ) : filteredVoices.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-[#808080] mb-2">No voices found</p>
                    <p className="text-sm text-[#6B7280]">Try adjusting your filters or search query</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVoices.map((voice) => (
                    <div
                      key={voice.voiceId}
                      className={`bg-[#141414] border rounded-lg p-4 transition-all ${
                        selectedVoiceId === voice.voiceId
                          ? 'border-[#DC143C] ring-2 ring-[#DC143C]/20'
                          : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#FFFFFF] mb-1">{voice.voiceName}</h3>
                          <p className="text-xs text-[#808080] line-clamp-2">{voice.description}</p>
                        </div>
                        {selectedVoiceId === voice.voiceId && (
                          <Check className="w-5 h-5 text-[#DC143C] flex-shrink-0" />
                        )}
                      </div>

                      {/* Voice Metadata */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {voice.gender && (
                          <span className="px-2 py-0.5 bg-[#1F1F1F] text-[#808080] rounded text-xs capitalize">
                            {voice.gender}
                          </span>
                        )}
                        {voice.age && (
                          <span className="px-2 py-0.5 bg-[#1F1F1F] text-[#808080] rounded text-xs capitalize">
                            {voice.age}
                          </span>
                        )}
                        {voice.accent && (
                          <span className="px-2 py-0.5 bg-[#1F1F1F] text-[#808080] rounded text-xs capitalize">
                            {voice.accent}
                          </span>
                        )}
                        {voice.useCase && (
                          <span className="px-2 py-0.5 bg-[#1F1F1F] text-[#808080] rounded text-xs">
                            {voice.useCase}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreviewVoice(voice.voiceId)}
                            disabled={previewingVoiceId === voice.voiceId}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] disabled:bg-[#3F3F46] disabled:text-[#808080] text-[#FFFFFF] rounded-lg text-xs font-medium transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            {previewingVoiceId === voice.voiceId ? 'Playing...' : 'Preview'}
                          </button>
                          <button
                            onClick={() => handleSelectVoice(voice)}
                            className="flex-1 px-3 py-2 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Select
                          </button>
                        </div>
                        {/* Remove from Browse - Only show for custom voices */}
                        {voice.isCustom && (
                          <button
                            onClick={() => handleRemoveFromBrowse(voice)}
                            disabled={removingVoiceId === voice.voiceId}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-[#3F3F46] disabled:text-[#808080] text-yellow-400 rounded-lg text-xs font-medium transition-colors border border-yellow-500/30"
                          >
                            <Trash2 className="w-3 h-3" />
                            {removingVoiceId === voice.voiceId ? 'Removing...' : 'Remove from Browse'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[#3F3F46] bg-[#141414] flex items-center justify-between">
              <p className="text-sm text-[#808080]">
                {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} found
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

