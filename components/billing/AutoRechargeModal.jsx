'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Settings, CreditCard, AlertCircle, Check } from 'lucide-react';
import { 
  getAutoRechargeSettings, 
  enableAutoRecharge, 
  disableAutoRecharge,
  getPaymentMethods,
  createCustomerPortalSession,
  CREDIT_PACKAGES 
} from '@/lib/stripe-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const THRESHOLD_OPTIONS = [
  { value: 0, label: '0 credits (when out of credits)' },
  { value: 500, label: '500 credits' },
  { value: 1000, label: '1,000 credits' },
  { value: 2000, label: '2,000 credits' },
];

export default function AutoRechargeModal({ isOpen, onClose, onSuccess, currentSettings }) {
  const { user } = useUser();
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(500);
  const [packageKey, setPackageKey] = useState('booster');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchData();
    }
  }, [isOpen, user]);

  async function fetchData() {
    try {
      setFetching(true);
      setError(null);

      // Load current settings
      const settings = await getAutoRechargeSettings();
      setEnabled(settings?.enabled || false);
      setThreshold(settings?.threshold || 500);
      setPackageKey(settings?.package || 'booster');

      // Load payment methods
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      
      if (methods.length > 0) {
        // Use default payment method or first one
        const defaultMethod = methods.find(m => m.isDefault) || methods[0];
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Failed to fetch auto-recharge data:', error);
      setError('Failed to load settings. Please try again.');
    } finally {
      setFetching(false);
    }
  }

  const handleSave = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (enabled) {
        await enableAutoRecharge(threshold, packageKey, selectedPaymentMethod);
      } else {
        await disableAutoRecharge();
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save auto-recharge:', error);
      setError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePaymentMethods = async () => {
    try {
      const portalUrl = await createCustomerPortalSession(
        `${window.location.origin}/dashboard`
      );
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Failed to open payment portal:', error);
      setError('Failed to open payment settings. Please try again.');
    }
  };

  if (!isOpen) return null;

  const selectedPackage = CREDIT_PACKAGES[packageKey];
  const hasPaymentMethods = paymentMethods.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Auto-Recharge Settings</h2>
            <p className="text-sm text-base-content/60 mt-1">
              Automatically purchase credits when your balance runs low
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-base-content/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <div className="font-semibold text-base-content">Enable Auto-Recharge</div>
                  <div className="text-sm text-base-content/60 mt-1">
                    Never run out of credits mid-project
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-base-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cinema-red rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cinema-red"></div>
                </label>
              </div>

              {enabled && (
                <>
                  {/* Threshold Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-base-content">
                      Recharge Threshold
                    </label>
                    <p className="text-xs text-base-content/60">
                      Buy more credits when balance falls below:
                    </p>
                    <Select
                      value={threshold.toString()}
                      onValueChange={(value) => setThreshold(Number(value))}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THRESHOLD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Package Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-base-content">
                      Credit Package
                    </label>
                    <p className="text-xs text-base-content/60">
                      Package to purchase when threshold is reached:
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
                        <button
                          key={key}
                          onClick={() => setPackageKey(key)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            packageKey === key
                              ? 'border-cinema-red bg-cinema-red/10'
                              : 'border-base-300 hover:border-cinema-red/50 bg-base-200'
                          }`}
                        >
                          <div className="font-semibold text-sm text-base-content">
                            {pkg.label}
                          </div>
                          <div className="text-xs text-base-content/60 mt-1">
                            {pkg.credits.toLocaleString()} credits • ${pkg.priceUSD}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-base-content">
                      Payment Method
                    </label>
                    {hasPaymentMethods ? (
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedPaymentMethod === method.id
                                ? 'border-cinema-red bg-cinema-red/10'
                                : 'border-base-300 hover:border-base-400 bg-base-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                              className="w-4 h-4 text-cinema-red focus:ring-cinema-red"
                            />
                            <CreditCard className="w-5 h-5 text-base-content/60" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-base-content">
                                {method.card.brand.toUpperCase()} •••• {method.card.last4}
                              </div>
                              <div className="text-xs text-base-content/60">
                                Expires {method.card.expMonth}/{method.card.expYear}
                                {method.isDefault && ' • Default'}
                              </div>
                            </div>
                          </label>
                        ))}
                        <button
                          onClick={handleManagePaymentMethods}
                          className="text-sm text-cinema-red hover:underline"
                        >
                          Manage payment methods →
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                              No payment methods saved
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                              You need to save a payment method to enable auto-recharge.
                            </div>
                            <button
                              onClick={handleManagePaymentMethods}
                              className="mt-2 text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium"
                            >
                              Add payment method →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {selectedPackage && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-700 dark:text-green-400">
                            Auto-Recharge Active
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                            When your credits drop below {threshold.toLocaleString()}, we'll automatically charge your payment method ${selectedPackage.priceUSD} for {selectedPackage.credits.toLocaleString()} credits.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-base-content/70 hover:text-base-content transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || (enabled && !selectedPaymentMethod)}
                  className="px-6 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

