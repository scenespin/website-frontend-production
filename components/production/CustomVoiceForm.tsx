'use client';

/**
 * CustomVoiceForm - Form for custom voice assignment with user's ElevenLabs API key
 * 
 * Features:
 * - ElevenLabs API key input (masked)
 * - Voice ID input
 * - Voice name input
 * - Rights confirmation checkbox (required)
 * - Form validation
 */

import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface CustomVoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    elevenLabsApiKey: string;
    elevenLabsVoiceId: string;
    voiceName: string;
    rightsConfirmed: boolean;
  }) => Promise<void>;
  prefilledVoiceId?: string;
  characterId: string;
  screenplayId: string;
}

export function CustomVoiceForm({
  isOpen,
  onClose,
  onSubmit,
  prefilledVoiceId,
  characterId,
  screenplayId,
}: CustomVoiceFormProps) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    elevenLabsApiKey: '',
    elevenLabsVoiceId: prefilledVoiceId || '',
    voiceName: '',
    rightsConfirmed: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate API key
    if (!formData.elevenLabsApiKey.trim()) {
      newErrors.elevenLabsApiKey = 'API key is required';
    } else if (!formData.elevenLabsApiKey.startsWith('sk_')) {
      newErrors.elevenLabsApiKey = 'Invalid API key format (should start with "sk_")';
    }

    // Validate Voice ID
    if (!formData.elevenLabsVoiceId.trim()) {
      newErrors.elevenLabsVoiceId = 'Voice ID is required';
    }

    // Validate Voice Name
    if (!formData.voiceName.trim()) {
      newErrors.voiceName = 'Voice name is required';
    }

    // Validate Rights Confirmation
    if (!formData.rightsConfirmed) {
      newErrors.rightsConfirmed = 'You must confirm that you have the legal rights to use this voice';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        elevenLabsApiKey: '',
        elevenLabsVoiceId: '',
        voiceName: '',
        rightsConfirmed: false,
      });
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to create voice profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        elevenLabsApiKey: '',
        elevenLabsVoiceId: prefilledVoiceId || '',
        voiceName: '',
        rightsConfirmed: false,
      });
      setErrors({});
      onClose();
    }
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
            onClick={handleClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-[60]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-4 md:inset-8 lg:inset-12 max-w-2xl mx-auto bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
              <div>
                <h2 className="text-xl font-bold text-[#FFFFFF]">Custom Voice Assignment</h2>
                <p className="text-sm text-[#808080]">Use your own ElevenLabs voice</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF] disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6 space-y-6">
              {/* Info Alert */}
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Using Your ElevenLabs Account</p>
                    <p className="text-blue-400/80">
                      You'll need to provide your ElevenLabs API key and voice ID. Your API key is encrypted and stored securely. 
                      You must have legal rights to use the voice you're assigning.
                    </p>
                  </div>
                </div>
              </div>

              {/* ElevenLabs API Key */}
              <div>
                <label className="text-sm font-medium text-[#FFFFFF] mb-2 block">
                  ElevenLabs API Key <span className="text-[#DC143C]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.elevenLabsApiKey}
                    onChange={(e) => {
                      setFormData({ ...formData, elevenLabsApiKey: e.target.value });
                      if (errors.elevenLabsApiKey) {
                        setErrors({ ...errors, elevenLabsApiKey: '' });
                      }
                    }}
                    placeholder="sk_..."
                    className={`w-full px-3 py-2 pr-10 bg-[#0A0A0A] border rounded-lg text-[#FFFFFF] text-sm focus:outline-none ${
                      errors.elevenLabsApiKey
                        ? 'border-[#DC143C] focus:border-[#DC143C]'
                        : 'border-[#3F3F46] focus:border-[#DC143C]'
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#808080] hover:text-[#FFFFFF] transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.elevenLabsApiKey && (
                  <p className="mt-1 text-xs text-[#DC143C] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.elevenLabsApiKey}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#808080]">
                  Find your API key in your ElevenLabs account settings
                </p>
              </div>

              {/* Voice ID */}
              <div>
                <label className="text-sm font-medium text-[#FFFFFF] mb-2 block">
                  Voice ID <span className="text-[#DC143C]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.elevenLabsVoiceId}
                  onChange={(e) => {
                    setFormData({ ...formData, elevenLabsVoiceId: e.target.value });
                    if (errors.elevenLabsVoiceId) {
                      setErrors({ ...errors, elevenLabsVoiceId: '' });
                    }
                  }}
                  placeholder="Enter ElevenLabs voice ID"
                  className={`w-full px-3 py-2 bg-[#0A0A0A] border rounded-lg text-[#FFFFFF] text-sm focus:outline-none ${
                    errors.elevenLabsVoiceId
                      ? 'border-[#DC143C] focus:border-[#DC143C]'
                      : 'border-[#3F3F46] focus:border-[#DC143C]'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.elevenLabsVoiceId && (
                  <p className="mt-1 text-xs text-[#DC143C] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.elevenLabsVoiceId}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#808080]">
                  Find your voice ID in your ElevenLabs voice library
                </p>
              </div>

              {/* Voice Name */}
              <div>
                <label className="text-sm font-medium text-[#FFFFFF] mb-2 block">
                  Voice Name <span className="text-[#DC143C]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.voiceName}
                  onChange={(e) => {
                    setFormData({ ...formData, voiceName: e.target.value });
                    if (errors.voiceName) {
                      setErrors({ ...errors, voiceName: '' });
                    }
                  }}
                  placeholder="Enter a friendly name for this voice"
                  className={`w-full px-3 py-2 bg-[#0A0A0A] border rounded-lg text-[#FFFFFF] text-sm focus:outline-none ${
                    errors.voiceName
                      ? 'border-[#DC143C] focus:border-[#DC143C]'
                      : 'border-[#3F3F46] focus:border-[#DC143C]'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.voiceName && (
                  <p className="mt-1 text-xs text-[#DC143C] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.voiceName}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#808080]">
                  This is how the voice will appear in your character settings
                </p>
              </div>

              {/* Rights Confirmation */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rightsConfirmed}
                    onChange={(e) => {
                      setFormData({ ...formData, rightsConfirmed: e.target.checked });
                      if (errors.rightsConfirmed) {
                        setErrors({ ...errors, rightsConfirmed: '' });
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded border-[#3F3F46] bg-[#0A0A0A] text-[#DC143C] focus:ring-[#DC143C] focus:ring-offset-0"
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[#FFFFFF]">
                      I confirm that I have the legal rights to use this voice{' '}
                      <span className="text-[#DC143C]">*</span>
                    </span>
                    {errors.rightsConfirmed && (
                      <p className="mt-1 text-xs text-[#DC143C] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.rightsConfirmed}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[#3F3F46] bg-[#141414] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] disabled:bg-[#3F3F46] disabled:text-[#808080] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91C1C] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Create Voice Profile
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

