'use client';

import { useState, useEffect } from 'react';
import { X, Mic, AlertCircle, Check, Shield, Upload, Download, Cloud, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import VoiceCloningConsentModal from '../VoiceCloningConsentModal';
import ConsentRequired from '../ConsentRequired';
import { checkVoiceConsent } from '@/libs/voiceConsentUtils';
import { api } from '@/lib/api';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { nanoid } from 'nanoid';

export default function VoiceProfileModal({ character, isOpen, onClose, onSave }) {
  // Screenplay context for dynamic paths
  const { getFolderPath, trackAsset, currentProject } = useScreenplay();
  
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('');
  const [voiceName, setVoiceName] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [rightsStatement, setRightsStatement] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [voiceSampleUrl, setVoiceSampleUrl] = useState(null);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [savedProfileId, setSavedProfileId] = useState(null);
  
  // ✅ BIPA COMPLIANCE: Check voice consent before allowing voice cloning
  const [hasVoiceConsent, setHasVoiceConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  // Get dynamic folder path based on screenplay context
  const getTargetFolderPath = () => {
    return getFolderPath('voice-profile', character?.name);
  };

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

      const response = await api.voiceProfiles.create(voiceProfileData);
      setSavedProfileId(response.data.profileId);
      
      toast.success('Voice profile saved successfully! Generate a test sample to save it to cloud.');
      onSave?.(voiceProfileData);
      
      // Don't close yet - allow user to generate and save sample
    } catch (error) {
      console.error('Failed to save voice profile:', error);
      toast.error('Failed to save voice profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate voice sample for testing
  const handleGenerateSample = async () => {
    if (!savedProfileId) {
      toast.error('Please save the voice profile first');
      return;
    }
    
    setIsGeneratingSample(true);
    try {
      const response = await api.voiceProfiles.generateSample(savedProfileId, {
        text: `Hello, this is ${character.name}. This is a test of the voice profile.`
      });
      
      setVoiceSampleUrl(response.data.audioUrl);
      toast.success('Voice sample generated! Listen and save to cloud storage.');
    } catch (error) {
      console.error('Failed to generate sample:', error);
      toast.error('Failed to generate voice sample');
    } finally {
      setIsGeneratingSample(false);
    }
  };
  
  // Save voice sample to cloud storage with screenplay-centric paths
  const handleSaveSampleToCloud = async (provider) => {
    if (!voiceSampleUrl || !savedProfileId) return;
    
    const targetFolder = getTargetFolderPath();
    const targetFilename = `${character.name}-voice-sample-${Date.now()}.mp3`;
    
    try {
      toast.loading(`Saving to ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'}...`);
      
      const response = await api.voiceProfiles.saveSampleToCloud(savedProfileId, {
        audioUrl: voiceSampleUrl,
        provider,
        folder: targetFolder,
        filename: targetFilename
      });
      
      toast.dismiss();
      toast.success(`Voice sample saved to ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'}!`);
      
      // Track asset in GitHub manifest if project has GitHub integration
      if (currentProject && character) {
        try {
          await trackAsset({
            asset_id: `asset-${nanoid(12)}`,
            asset_type: 'audio',
            entity_type: 'character',
            entity_id: character.id,
            entity_name: character.name,
            filename: targetFilename,
            file_size: response.data?.fileSize || 0,
            mime_type: 'audio/mpeg',
            storage_location: provider,
            storage_metadata: {
              cloud_file_id: response.data?.fileId,
              cloud_folder_id: response.data?.folderId,
              webview_link: response.data?.webViewLink,
            },
            generation_metadata: {
              generated_at: Date.now(),
              model: 'elevenlabs',
            },
            created_at: Date.now(),
            updated_at: Date.now(),
          });
          console.log('[VoiceProfileModal] Voice sample asset tracked in manifest');
        } catch (error) {
          console.warn('[VoiceProfileModal] Failed to track asset:', error);
          // Non-critical - don't show error to user
        }
      }
      
    } catch (error) {
      console.error('Failed to save to cloud:', error);
      toast.dismiss();
      toast.error(`Failed to save to ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'}`);
    }
  };
  
  // Download voice sample locally
  const handleDownloadSample = async () => {
    if (!voiceSampleUrl) return;
    
    try {
      const response = await fetch(voiceSampleUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character.name}-voice-sample.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download');
    }
  };
  
  const targetFolder = getTargetFolderPath();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cinema-red to-cinema-blue p-6 text-base-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add Voice Profile</h2>
                <p className="text-sm text-base-content/80">Character: {character?.name}</p>
                {currentProject && (
                  <p className="text-xs text-base-content/60 font-mono mt-1">
                    📁 {targetFolder}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle text-base-content hover:bg-white/20"
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
                  <h4 className="font-bold">Voice Cloning Setup</h4>
                  <p className="text-sm">
                    Connect your third-party voice cloning account to get started. 
                    Your API keys are encrypted and stored securely with AWS KMS.
                  </p>
                </div>
              </div>

              {/* Step 1: API Key */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="badge badge-primary">Step 1</div>
                    <h3 className="text-lg font-bold">Connect Your Voice Cloning Account</h3>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">API Key</span>
                      <span className="label-text-alt">
                        <a 
                          href="https://elevenlabs.io/app/settings/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary text-xs"
                        >
                          Get API key from provider →
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
                        🔒 Your API key is encrypted and stored securely
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
                          className="link link-primary text-xs"
                        >
                          Find voice ID in your account →
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
                        You must have legal permission to use this voice. Voice verification is handled by your voice cloning provider.
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
                          ✅ I confirm that I have the legal rights to use this voice for my creative projects
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

                    <div className="text-xs text-base-content/60 mt-2 space-y-1 bg-base-300 p-3 rounded">
                      <p className="font-semibold mb-2">📋 Voice Rights Requirements:</p>
                      <p>• Your voice cloning provider handles voice verification</p>
                      <p>• You are responsible for ensuring proper voice permissions</p>
                      <p>• Only use voices you own or have explicit permission to use</p>
                      <p>• Misuse of voice cloning may result in account termination</p>
                      <p className="mt-2">• See our <a href="/legal/voice-cloning" className="link link-primary">Voice Cloning Terms</a> for full details</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Test Voice Sample (After Save) */}
              {savedProfileId && (
                <div className="card bg-base-200 shadow-lg border-2 border-success">
                  <div className="card-body">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="badge badge-success">Step 4 - Optional</div>
                      <h3 className="text-lg font-bold">Generate Test Sample</h3>
                    </div>
                    
                    <p className="text-sm text-base-content/70 mb-4">
                      Generate a test voice sample and save it to cloud storage for permanent access.
                    </p>
                    
                    {!voiceSampleUrl && (
                      <button
                        onClick={handleGenerateSample}
                        disabled={isGeneratingSample}
                        className="btn btn-primary w-full"
                      >
                        {isGeneratingSample ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Generating Sample...
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Generate Test Sample
                          </>
                        )}
                      </button>
                    )}
                    
                    {voiceSampleUrl && (
                      <div className="space-y-3">
                        {/* Audio Player */}
                        <div className="bg-base-300 rounded-lg p-4">
                          <p className="text-xs font-semibold mb-2">Voice Sample Preview</p>
                          <audio 
                            controls 
                            src={voiceSampleUrl} 
                            className="w-full"
                          />
                          <p className="text-xs text-warning mt-2">
                            ⚠️ This sample will expire in 7 days. Save to cloud storage!
                          </p>
                        </div>
                        
                        {/* Download & Save Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleDownloadSample}
                            className="btn btn-sm btn-primary flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                          <button
                            onClick={() => handleSaveSampleToCloud('dropbox')}
                            className="btn btn-sm btn-outline flex-1"
                          >
                            <Droplet className="w-4 h-4 mr-1" />
                            Dropbox
                          </button>
                          <button
                            onClick={() => handleSaveSampleToCloud('google-drive')}
                            className="btn btn-sm btn-outline flex-1"
                          >
                            <Cloud className="w-4 h-4 mr-1" />
                            Drive
                          </button>
                        </div>
                        
                        <p className="text-xs text-base-content/60 text-center">
                          💡 Saved to: /Wryda Screenplays/Voice Profiles/{character.name}/
                        </p>
                      </div>
                    )}
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
            {savedProfileId ? 'Done' : 'Cancel'}
          </button>
          {!savedProfileId && (
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
          )}
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

