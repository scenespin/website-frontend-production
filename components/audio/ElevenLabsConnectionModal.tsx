'use client';

/**
 * ElevenLabs Connection Modal
 * 
 * Allows users to connect their ElevenLabs account to Wryda.
 * - API key input
 * - Consent checkboxes
 * - Voice discovery
 * 
 * Feature 0037: ElevenLabs Verified Voice Integration
 */

import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, Loader2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ElevenLabsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (voiceCount: number) => void;
}

export function ElevenLabsConnectionModal({
  isOpen,
  onClose,
  onConnected,
}: ElevenLabsConnectionModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [consent, setConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your ElevenLabs API key');
      return;
    }

    if (!consent) {
      setError('You must confirm voice verification consent');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://l9zm95wyxb.execute-api.us-east-1.amazonaws.com/v1';

      const response = await fetch(`${apiUrl}/api/elevenlabs/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          consent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect ElevenLabs account');
      }

      setSuccess(true);
      setVoiceCount(data.voice_count || 0);
      
      // Call parent callback after short delay
      setTimeout(() => {
        onConnected(data.voice_count || 0);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Please check your API key and try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Connected!</h3>
            <p className="text-muted-foreground">
              Successfully connected your ElevenLabs account.
            </p>
            <p className="text-sm text-muted-foreground">
              Found <span className="font-bold text-purple-600">{voiceCount}</span> verified voice{voiceCount !== 1 ? 's' : ''} ✨
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Connect ElevenLabs Account</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Access your verified voices from elevenlabs.io
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-start gap-3">
              <UserCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  🎭 How Voice Verification Works:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-purple-700 dark:text-purple-300">
                  <li>Clone your voice on <strong>elevenlabs.io</strong> (they verify your identity)</li>
                  <li>Connect your ElevenLabs account to Wryda (enter API key below)</li>
                  <li>Use your verified voices in Text-to-Speech</li>
                  <li>All voice verification is handled by ElevenLabs</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 1: Get API Key */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Step 1: Get Your API Key</h3>
            <p className="text-sm text-muted-foreground">
              You'll need an ElevenLabs API key to connect your account.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open('https://elevenlabs.io/app/speech-synthesis/text-to-speech', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Open ElevenLabs Dashboard
            </Button>
            <p className="text-xs text-muted-foreground">
              💡 In ElevenLabs: Click your profile → "API Keys" → Create new API key
            </p>
          </div>

          {/* Step 2: Enter API Key */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Step 2: Enter API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_xxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={connecting}
            />
          </div>

          {/* Step 3: Consent */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Step 3: Confirm Consent</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  disabled={connecting}
                />
                <span className="text-sm text-foreground">
                  I confirm that all voices in my ElevenLabs account are properly verified and I have permission to use them. ElevenLabs has verified voice ownership through their system.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  disabled={connecting}
                />
                <span className="text-sm text-foreground">
                  I agree to the <a href="/terms" target="_blank" className="text-purple-600 hover:underline">Terms of Service</a> and understand that voice verification is managed by ElevenLabs.
                </span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={connecting || !apiKey || !consent || !termsAccepted}
            className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <UserCircle className="w-5 h-5" />
                Connect ElevenLabs Account
              </>
            )}
          </Button>

          {/* Info */}
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>🔒 Your API key is encrypted and stored securely</p>
            <p>✨ You can disconnect anytime from your account settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

