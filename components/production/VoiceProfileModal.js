'use client';

import { useState, useEffect } from 'react';
import { X, Mic, AlertCircle, Check, Shield, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import VoiceCloningConsentModal from '../VoiceCloningConsentModal';
import ConsentRequired from '../ConsentRequired';
import { checkVoiceConsent } from '@/libs/voiceConsentUtils';

export default function VoiceProfileModal({ character, isOpen, onClose, onSave }) {
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('');
  const [voiceName, setVoiceName] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [rightsStatement, setRightsStatement] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ BIPA COMPLIANCE: Check voice consent before allowing voice cloning
  const [hasVoiceConsent, setHasVoiceConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Check consent when modal opens
  useEffect(() => {
    if (isOpen) {
      checkConsent();
    }
  }, [isOpen]);

  const checkConsent = async () => {
    setCheckingConsent(true);
    try {
      const { hasConsent } = await checkVoiceConsent();
      setHasVoiceConsent(hasConsent);
    } catch (error) {
      console.error('Error checking consent:', error);
      setHasVoiceConsent(false);
    } finally {
      setCheckingConsent(false);
    }
  };

  const handleConsentAccepted = () => {
    setShowConsentModal(false);
    setHasVoiceConsent(true);
    toast.success('Voice cloning consent provided! You can now proceed.');
  };

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!elevenLabsApiKey || !elevenLabsVoiceId) {
      toast.error('Please enter both API Key and Voice ID');
      return;
    }

    setIsVerifying(true);
    try {
      // TODO: Call backend to verify voice
      // const response = await api.voiceProfile.verify({
      //   elevenLabsApiKey,
      //   elevenLabsVoiceId
      // });
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsVerified(true);
      // setVoiceName(response.voice.name);
      setVoiceName('Verified Voice');
      toast.success('Voice verified successfully!');
    } catch (error) {
      toast.error('Failed to verify voice. Please check your credentials.');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!elevenLabsApiKey || !elevenLabsVoiceId || !voiceName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!rightsConfirmed) {
      toast.error('You must confirm you have the legal rights to use this voice');
      return;
    }

    setIsSaving(true);
    try {
      const voiceProfileData = {
        characterId: character.id,
        projectId: character.projectId,
        elevenLabsApiKey,
        elevenLabsVoiceId,
        voiceName,
        rightsConfirmed: true,
        rightsStatement: rightsStatement || undefined,
      };

      // TODO: Call backend to save
      // const response = await api.voiceProfile.create(voiceProfileData);
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Voice profile saved successfully!');
      onSave?.(voiceProfileData);
      onClose();
    } catch (error) {
      toast.error('Failed to save voice profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cinema-red to-cinema-blue p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add Voice Profile</h2>
                <p className="text-sm text-white/80">Character: {character?.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ✅ BIPA COMPLIANCE: Show consent gate if user hasn't provided consent */}
          {checkingConsent && (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {!checkingConsent && !hasVoiceConsent && (
            <>
              <ConsentRequired 
                onRequestConsent={() => setShowConsentModal(true)}
                variant="full"
              />
            </>
          )}

          {/* Show voice profile setup only if consent is provided */}
          {!checkingConsent && hasVoiceConsent && (
            <>
              {/* Info Banner */}
              <div className="alert alert-info">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <h4 className="font-bold">ElevenLabs Integration</h4>
                  <p className="text-sm">
                    You&apos;ll need your own ElevenLabs account with verified voices. 
                    We only show <strong>minimal branding</strong> during setup.
                  </p>
                </div>
              </div>

              {/* Step 1: ElevenLabs API Key */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="badge badge-primary">Step 1</div>
                    <h3 className="text-lg font-bold">Enter Your ElevenLabs API Key</h3>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">API Key</span>
                      <span className="label-text-alt">
                        <a 
                          href="https://elevenlabs.io/app/settings/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          Get your key →
                        </a>
                      </span>
                    </label>
                    <input
                      type="password"
                      value={elevenLabsApiKey}
                      onChange={(e) => setElevenLabsApiKey(e.target.value)}
                      placeholder="sk_..."
                      className="input input-bordered w-full font-mono"
                      disabled={isVerified}
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        🔒 Your API key is encrypted and stored securely with AWS KMS
                      </span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Voice ID</span>
                      <span className="label-text-alt">
                        <a 
                          href="https://elevenlabs.io/app/voice-lab" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          Find voice ID →
                        </a>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={elevenLabsVoiceId}
                      onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                      placeholder="21m00Tcm4TlvDq8ikWAM"
                      className="input input-bordered w-full font-mono"
                      disabled={isVerified}
                    />
                  </div>

                  {!isVerified && (
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying || !elevenLabsApiKey || !elevenLabsVoiceId}
                      className="btn btn-primary w-full"
                    >
                      {isVerifying ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Verify Voice
                        </>
                      )}
                    </button>
                  )}

                  {isVerified && (
                    <div className="alert alert-success">
                      <Check className="w-5 h-5" />
                      <span>Voice verified: <strong>{voiceName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Voice Name */}
              {isVerified && (
                <div className="card bg-base-200 shadow-lg">
                  <div className="card-body">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="badge badge-primary">Step 2</div>
                      <h3 className="text-lg font-bold">Voice Name</h3>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Display Name</span>
                      </label>
                      <input
                        type="text"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        placeholder="E.g., Hero Voice, Narrator, Character Voice 1"
                        className="input input-bordered w-full"
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          This is how the voice will appear in your project
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Rights Confirmation */}
              {isVerified && (
                <div className="card bg-base-200 shadow-lg border-2 border-warning">
                  <div className="card-body">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="badge badge-warning">Step 3 - REQUIRED</div>
                      <h3 className="text-lg font-bold">Legal Rights Confirmation</h3>
                    </div>
                    
                    <div className="alert alert-warning">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">
                        You must have legal permission to use this voice. Voice verification is handled by ElevenLabs.
                      </span>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input
                          type="checkbox"
                          checked={rightsConfirmed}
                          onChange={(e) => setRightsConfirmed(e.target.checked)}
                          className="checkbox checkbox-warning"
                        />
                        <span className="label-text font-semibold">
                          I confirm that I have the legal rights to use this voice for my creative projects
                        </span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Optional: Rights Statement</span>
                      </label>
                      <textarea
                        value={rightsStatement}
                        onChange={(e) => setRightsStatement(e.target.value)}
                        placeholder="E.g., This is my own voice, I have written permission from the voice owner, etc."
                        className="textarea textarea-bordered w-full h-20"
                      />
                    </div>

                    <div className="text-xs text-base-content/60 mt-2 space-y-1">
                      <p>• ElevenLabs handles voice verification on their platform</p>
                      <p>• You are responsible for ensuring proper voice permissions</p>
                      <p>• Misuse may result in account termination</p>
                      <p>• See our <a href="/legal/voice-cloning" className="link">Voice Cloning Terms</a> for details</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn btn-ghost"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isVerified || !rightsConfirmed || isSaving || !voiceName || !hasVoiceConsent}
            className="btn btn-primary btn-lg"
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Voice Profile
              </>
            )}
          </button>
        </div>
        </div>

      {/* ✅ BIPA COMPLIANCE: Voice Consent Modal */}
      <VoiceCloningConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onAccept={handleConsentAccepted}
        onDecline={() => setShowConsentModal(false)}
      />
    </div>
  );
}

