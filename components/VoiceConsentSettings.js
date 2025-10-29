'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Info, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import VoiceCloningConsentModal from './VoiceCloningConsentModal';

/**
 * Voice Consent Settings Component
 * 
 * Displays user's voice consent status and provides management actions.
 * Can be added to any settings/dashboard/account page.
 * 
 * Features:
 * - View consent status
 * - Download consent agreement
 * - Revoke consent
 * - Provide new consent
 */
export default function VoiceConsentSettings() {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  // Load consent status on mount
  useEffect(() => {
    loadConsentStatus();
  }, []);

  const loadConsentStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/voice-cloning/consent');
      const data = await response.json();

      if (response.ok && data.hasConsent) {
        setConsent(data);
      } else {
        setConsent(null);
      }
    } catch (error) {
      console.error('Error loading consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadConsent = async () => {
    try {
      const response = await fetch('/api/voice-cloning/consent/download');
      const html = await response.text();

      // Open in new tab
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.success('Consent agreement opened in new tab');
    } catch (error) {
      console.error('Error downloading consent:', error);
      toast.error('Failed to download consent agreement');
    }
  };

  const handleRevokeConsent = async () => {
    setIsRevoking(true);
    try {
      const response = await fetch('/api/voice-cloning/revoke', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke consent');
      }

      toast.success('Voice consent revoked successfully. Your voice data will be deleted.');
      setConsent(null);
      setShowRevokeConfirm(false);
    } catch (error) {
      console.error('Error revoking consent:', error);
      toast.error(error.message || 'Failed to revoke consent');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleConsentAccepted = (consentId) => {
    toast.success('Voice cloning consent provided!');
    setShowConsentModal(false);
    loadConsentStatus();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  // User has NO consent
  if (!consent) {
    return (
      <>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="card-title">Voice Cloning Consent</h2>
                <p className="text-sm opacity-70">Required for voice cloning features</p>
              </div>
            </div>

            <div className="alert alert-warning">
              <AlertTriangle className="w-5 h-5" />
              <div className="flex-1">
                <h3 className="font-bold">Consent Not Provided</h3>
                <div className="text-sm mt-1">
                  You have not provided consent for voice cloning. Voice cloning requires 
                  separate consent because your voice is biometric data protected by law.
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="bg-base-100 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold mb-2">Why Consent is Required:</h3>
              <ul className="text-sm space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-info mt-1">•</span>
                  <span>Your voice is biometric data (like a fingerprint)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info mt-1">•</span>
                  <span>Protected by Illinois BIPA and other biometric privacy laws</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info mt-1">•</span>
                  <span>Requires explicit consent before collection or processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info mt-1">•</span>
                  <span>You can revoke consent anytime and data will be deleted</span>
                </li>
              </ul>
            </div>

            <div className="card-actions justify-end mt-4">
              <button
                onClick={() => setShowConsentModal(true)}
                className="btn btn-primary"
              >
                <Shield className="w-5 h-5" />
                Provide Voice Cloning Consent
              </button>
            </div>
          </div>
        </div>

        {/* Consent Modal */}
        <VoiceCloningConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onAccept={handleConsentAccepted}
          onDecline={() => setShowConsentModal(false)}
        />
      </>
    );
  }

  // User HAS consent
  return (
    <>
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/20 rounded-lg">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="card-title">Voice Cloning Consent</h2>
              <p className="text-sm opacity-70">Active and valid</p>
            </div>
            {consent.isActive && (
              <div className="badge badge-success gap-2">
                <CheckCircle className="w-4 h-4" />
                Active
              </div>
            )}
          </div>

          {/* Consent Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-base-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Consent Provided</span>
              </div>
              <p className="font-semibold">{formatDate(consent.agreedAt)}</p>
            </div>

            <div className="bg-base-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Clock className="w-4 h-4" />
                <span>Retention Deadline</span>
              </div>
              <p className="font-semibold">{formatDate(consent.retentionDeadline)}</p>
              {consent.daysUntilExpiration && (
                <p className="text-xs opacity-70 mt-1">
                  {consent.daysUntilExpiration} days remaining
                </p>
              )}
            </div>
          </div>

          {/* Expiration Warning */}
          {consent.daysUntilExpiration && consent.daysUntilExpiration <= 30 && (
            <div className={`alert ${consent.daysUntilExpiration <= 7 ? 'alert-error' : 'alert-warning'}`}>
              <AlertTriangle className="w-5 h-5" />
              <div className="flex-1">
                <h3 className="font-bold">
                  {consent.daysUntilExpiration <= 7 ? 'FINAL NOTICE' : 'Expiration Notice'}
                </h3>
                <div className="text-sm mt-1">
                  Your voice consent will expire in <strong>{consent.daysUntilExpiration} days</strong>. 
                  After expiration, your voice data will be automatically deleted per BIPA requirements.
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-info/10 border border-info rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="mb-2">
                  <strong>Your Rights:</strong>
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• You can revoke consent at any time</li>
                  <li>• Your voice data will be deleted within 30 days of revocation</li>
                  <li>• Data is automatically deleted after 3 years (BIPA requirement)</li>
                  <li>• You can download a copy of your consent agreement anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card-actions justify-end mt-4 gap-2">
            <button
              onClick={handleDownloadConsent}
              className="btn btn-outline btn-sm sm:btn-md"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Consent</span>
            </button>
            <button
              onClick={() => setShowRevokeConfirm(true)}
              className="btn btn-error btn-sm sm:btn-md"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Revoke Consent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-error/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-error" />
                </div>
                <h3 className="text-xl font-bold">Revoke Voice Consent?</h3>
              </div>

              <p className="text-sm opacity-70 mb-4">
                This action will:
              </p>

              <ul className="text-sm space-y-2 mb-6 bg-base-200 p-4 rounded-lg">
                <li className="flex items-start gap-2">
                  <span className="text-error mt-0.5">•</span>
                  <span>Permanently delete all your voice profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-0.5">•</span>
                  <span>Remove all your voice data from our systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-0.5">•</span>
                  <span>Disable voice cloning features until you provide new consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-0.5">•</span>
                  <span>Complete deletion within 30 days</span>
                </li>
              </ul>

              <div className="alert alert-warning mb-4">
                <Info className="w-5 h-5" />
                <span className="text-sm">
                  This action cannot be undone. You can provide new consent later if you change your mind.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevokeConfirm(false)}
                  className="btn btn-ghost flex-1"
                  disabled={isRevoking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeConsent}
                  className="btn btn-error flex-1"
                  disabled={isRevoking}
                >
                  {isRevoking ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Revoking...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Revoke Consent
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

