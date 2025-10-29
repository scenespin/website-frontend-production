'use client';

import { Shield, AlertTriangle, Lock, Info } from 'lucide-react';

/**
 * Consent Required Gate Component
 * 
 * Displays warning and blocks voice cloning features when user lacks consent.
 * Shows educational information about BIPA and why consent is required.
 * 
 * Props:
 *   - onRequestConsent: () => void - Callback to open consent modal
 *   - variant: 'full' | 'compact' | 'inline' - Display style
 */
export default function ConsentRequired({ onRequestConsent, variant = 'full' }) {
  
  // Compact variant (for small spaces)
  if (variant === 'compact') {
    return (
      <div className="alert alert-warning">
        <AlertTriangle className="w-5 h-5" />
        <div className="flex-1">
          <span className="font-semibold">Voice cloning requires consent</span>
        </div>
        <button
          onClick={onRequestConsent}
          className="btn btn-sm btn-warning"
        >
          <Shield className="w-4 h-4" />
          Provide Consent
        </button>
      </div>
    );
  }

  // Inline variant (for inline warnings)
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning rounded-lg">
        <Lock className="w-5 h-5 text-warning" />
        <span className="flex-1 text-sm">
          Voice cloning is locked. Consent required for biometric data.
        </span>
        <button
          onClick={onRequestConsent}
          className="btn btn-xs btn-warning"
        >
          Unlock
        </button>
      </div>
    );
  }

  // Full variant (default - for main display)
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body items-center text-center">
        {/* Icon */}
        <div className="p-4 bg-warning/20 rounded-full mb-4">
          <Shield className="w-16 h-16 text-warning" />
        </div>

        {/* Title */}
        <h2 className="card-title text-2xl mb-2">
          Voice Cloning Consent Required
        </h2>

        {/* Description */}
        <p className="text-base-content/70 max-w-md mb-6">
          Voice cloning requires separate consent because your voice is biometric data 
          protected by law. This is required by the Illinois Biometric Information Privacy Act (BIPA) 
          and other biometric privacy laws.
        </p>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
          <div className="bg-base-100 p-4 rounded-lg text-left">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-info mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">What This Means</h3>
                <p className="text-sm text-base-content/70">
                  Your voice is unique biometric data, like a fingerprint. 
                  We need your explicit consent before collecting or processing it.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 p-4 rounded-lg text-left">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-success mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Your Protection</h3>
                <p className="text-sm text-base-content/70">
                  You can revoke consent anytime, and we&apos;ll delete your voice data within 30 days. 
                  Data is automatically deleted after 3 years.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="bg-info/10 border border-info rounded-lg p-4 w-full max-w-2xl mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5" />
            By Providing Consent You Can:
          </h3>
          <ul className="text-sm text-left space-y-2 ml-7">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-info rounded-full"></span>
              Clone your voice for character voiceovers
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-info rounded-full"></span>
              Generate speech in your voice from text
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-info rounded-full"></span>
              Create consistent voiceovers for your characters
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-info rounded-full"></span>
              Save time on voice recording
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            onClick={onRequestConsent}
            className="btn btn-primary flex-1"
          >
            <Shield className="w-5 h-5" />
            Provide Voice Cloning Consent
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-base-content/50 mt-4 max-w-md">
          You can still use all other platform features without providing voice cloning consent. 
          This consent is only required for voice cloning features.
        </p>
      </div>
    </div>
  );
}

