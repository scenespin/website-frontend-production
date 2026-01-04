'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Zap, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QuickPurchaseModal from './QuickPurchaseModal';

/**
 * Global Insufficient Credits Modal
 * Shows when user tries to use a service but doesn't have enough credits
 * Automatically opens QuickPurchaseModal for easy credit purchase
 */
export default function InsufficientCreditsModal({ 
  isOpen, 
  onClose, 
  requiredCredits,
  availableCredits,
  operation 
}) {
  const { user } = useUser();
  const router = useRouter();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(availableCredits || 0);

  // Don't auto-open - let user click the button

  // Fetch current credits when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchCredits();
    }
  }, [isOpen, user]);

  async function fetchCredits() {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.user.getCredits();
      const creditsData = response.data?.data || response.data;
      setCurrentCredits(creditsData?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  }

  const handlePurchaseSuccess = () => {
    fetchCredits(); // Refresh credits
    onClose(); // Close insufficient credits modal
    setShowPurchaseModal(false);
  };

  if (!isOpen) return null;

  const deficit = (requiredCredits || 0) - (availableCredits || 0);
  const friendlyOperation = operation || 'complete this operation';

  return (
    <>
      {/* Insufficient Credits Warning Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full border-2 border-red-500/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-base-content">Insufficient Credits</h2>
                <p className="text-sm text-base-content/60 mt-1">
                  You don't have enough credits to {friendlyOperation}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-base-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-base-content/60" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Credit Summary */}
              <div className="bg-base-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">Current Balance:</span>
                  <span className="font-semibold text-base-content">
                    {currentCredits?.toLocaleString() || availableCredits?.toLocaleString() || '0'} credits
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">Required:</span>
                  <span className="font-semibold text-red-400">
                    {requiredCredits?.toLocaleString() || 'N/A'} credits
                  </span>
                </div>
                {deficit > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-base-300">
                    <span className="text-sm font-semibold text-base-content">You need:</span>
                    <span className="font-bold text-red-500">
                      +{deficit.toLocaleString()} credits
                    </span>
                  </div>
                )}
              </div>

              {/* Message */}
              <p className="text-sm text-base-content/80">
                Purchase credits to continue using AI-powered features like video generation, 
                image creation, and more.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPurchaseModal(true);
                  }}
                  className="flex-1 btn btn-primary bg-cinema-red hover:bg-cinema-red/90 border-none"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Add Credits
                </button>
                <button
                  onClick={() => {
                    router.push('/buy-credits');
                    onClose();
                  }}
                  className="btn btn-outline border-base-300 hover:bg-base-200"
                >
                  View Packages
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Purchase Modal - Auto-opens */}
      {showPurchaseModal && (
        <QuickPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            onClose();
          }}
          onSuccess={handlePurchaseSuccess}
          currentCredits={currentCredits}
        />
      )}
    </>
  );
}

