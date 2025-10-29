'use client';

import { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, FileText, CheckCircle, Info, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { VOICE_CONSENT_AGREEMENT_TEXT as CONSENT_TEXT, VOICE_CONSENT_TEXT_VERSION as CONSENT_VERSION } from '@/libs/voiceConsentText';

/**
 * Voice Cloning Consent Modal
 * 
 * CRITICAL: Must be shown BEFORE allowing any voice cloning.
 * Required for BIPA (Illinois Biometric Information Privacy Act) compliance.
 * 
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - onAccept: (consentId) => void
 *   - onDecline: () => void
 */
export default function VoiceCloningConsentModal({ isOpen, onClose, onAccept, onDecline }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    isOwner: true,
    hasReadAgreement: false,
    isOver18: false,
    providesConsent: false,
    canRevoke: false,
    hasThirdPartyConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [thirdPartyFile, setThirdPartyFile] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        email: '',
        isOwner: true,
        hasReadAgreement: false,
        isOver18: false,
        providesConsent: false,
        canRevoke: false,
        hasThirdPartyConsent: false,
      });
      setHasScrolledToBottom(false);
      setThirdPartyFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConsentScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    // Validate all required fields
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate all checkboxes
    if (!formData.hasReadAgreement || !formData.isOver18 || 
        !formData.providesConsent || !formData.canRevoke) {
      toast.error('Please check all required consent boxes');
      return;
    }

    // If cloning someone else's voice, require third-party consent
    if (!formData.isOwner && !formData.hasThirdPartyConsent) {
      toast.error('Please confirm you have third-party consent');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/voice-cloning/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          consentVersion: CONSENT_VERSION,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record consent');
      }

      toast.success('Consent recorded successfully!');
      onAccept?.(data.consentId);

    } catch (error) {
      console.error('Consent submission error:', error);
      toast.error(error.message || 'Failed to record consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    onDecline?.();
    onClose?.();
  };

  const allChecked = formData.hasReadAgreement && formData.isOver18 && 
                     formData.providesConsent && formData.canRevoke &&
                     (formData.isOwner || formData.hasThirdPartyConsent);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cinema-red to-cinema-blue p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Voice Cloning Consent</h2>
                <p className="text-sm text-white/90">Required for BIPA Compliance</p>
              </div>
            </div>
            <button
              onClick={handleDecline}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning Alert */}
          <div className="alert alert-warning shadow-lg">
            <AlertTriangle className="w-6 h-6" />
            <div className="flex-1">
              <h3 className="font-bold">Your Voice is Biometric Data</h3>
              <div className="text-sm">
                Voice data is protected by Illinois BIPA and other biometric privacy laws. 
                Please read this agreement carefully before providing consent.
              </div>
            </div>
          </div>

          {/* Consent Agreement Text */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Consent Agreement
                </h3>
                <span className="badge badge-info">{CONSENT_VERSION}</span>
              </div>

              <div 
                className="bg-base-100 p-4 rounded-lg border border-base-300 max-h-64 overflow-y-auto text-sm whitespace-pre-wrap font-mono leading-relaxed"
                onScroll={handleConsentScroll}
              >
                {CONSENT_TEXT}
              </div>

              {!hasScrolledToBottom && (
                <div className="alert alert-info mt-2">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Please scroll to read the entire agreement</span>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h3 className="text-lg font-bold mb-4">Your Information</h3>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Full Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input input-bordered w-full"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email Address *</span>
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="input input-bordered w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Voice Ownership */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h3 className="text-lg font-bold mb-4">Whose Voice Are You Cloning?</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-base-100 transition-colors">
                  <input
                    type="radio"
                    name="voiceOwner"
                    className="radio radio-primary"
                    checked={formData.isOwner}
                    onChange={() => setFormData({ ...formData, isOwner: true, hasThirdPartyConsent: false })}
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">My Own Voice</div>
                    <div className="text-sm opacity-70">I am providing samples of my own voice</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-base-100 transition-colors">
                  <input
                    type="radio"
                    name="voiceOwner"
                    className="radio radio-primary"
                    checked={!formData.isOwner}
                    onChange={() => setFormData({ ...formData, isOwner: false })}
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Someone Else&apos;s Voice</div>
                    <div className="text-sm opacity-70">I have written consent from the voice owner</div>
                  </div>
                </label>
              </div>

              {/* Third-Party Warning */}
              {!formData.isOwner && (
                <div className="alert alert-error mt-4">
                  <AlertTriangle className="w-6 h-6" />
                  <div className="flex-1">
                    <h4 className="font-bold">⚠️ Third-Party Voice Requirements</h4>
                    <p className="text-sm mt-1">
                      Cloning someone else&apos;s voice without their consent is illegal. 
                      You MUST have written authorization from the voice owner.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h3 className="text-lg font-bold mb-4">Consent Statement</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mt-1"
                    checked={formData.hasReadAgreement}
                    onChange={(e) => setFormData({ ...formData, hasReadAgreement: e.target.checked })}
                    disabled={isSubmitting || !hasScrolledToBottom}
                  />
                  <span className="flex-1">
                    I have read and understood the entire consent agreement above *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mt-1"
                    checked={formData.isOver18}
                    onChange={(e) => setFormData({ ...formData, isOver18: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <span className="flex-1">
                    I am 18 years or older (OR have parental consent) *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mt-1"
                    checked={formData.providesConsent}
                    onChange={(e) => setFormData({ ...formData, providesConsent: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <span className="flex-1">
                    I voluntarily provide my voice data for the purposes described above *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mt-1"
                    checked={formData.canRevoke}
                    onChange={(e) => setFormData({ ...formData, canRevoke: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <span className="flex-1">
                    I understand I can revoke this consent at any time and my voice data will be deleted within 30 days *
                  </span>
                </label>

                {!formData.isOwner && (
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-error/10 rounded-lg">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-error mt-1"
                      checked={formData.hasThirdPartyConsent}
                      onChange={(e) => setFormData({ ...formData, hasThirdPartyConsent: e.target.checked })}
                      disabled={isSubmitting}
                    />
                    <span className="flex-1 font-semibold">
                      I confirm I have obtained proper written consent from the voice owner and accept full legal responsibility *
                    </span>
                  </label>
                )}
              </div>

              <div className="divider"></div>

              <div className="flex items-start gap-2 text-sm opacity-70">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  By providing consent, you agree to the collection and processing of your voice biometric data 
                  under the Illinois Biometric Information Privacy Act (BIPA) and other applicable laws.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-base-200 border-t border-base-300 p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="text-sm opacity-70 text-center sm:text-left">
              {allChecked ? (
                <span className="text-success flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Ready to submit consent
                </span>
              ) : (
                <span>Please complete all required fields and checkboxes</span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleDecline}
                className="btn btn-ghost flex-1 sm:flex-none"
                disabled={isSubmitting}
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className={`btn btn-primary flex-1 sm:flex-none ${!allChecked ? 'btn-disabled' : ''}`}
                disabled={!allChecked || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    I Agree - Provide Consent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

