'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X as CloseIcon
} from 'lucide-react';
import * as adminPricingApi from '@/lib/adminPricingApi';

/**
 * Admin Pricing Dashboard Component
 * 
 * Manages API provider pricing, approves changes, monitors margins
 */
export default function AdminPricingDashboard() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [priceRegistry, setPriceRegistry] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [lowMarginWorkflows, setLowMarginWorkflows] = useState([]);
  const [expandedChange, setExpandedChange] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [allProviders, setAllProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editFormData, setEditFormData] = useState({
    base_cost_usd: 0,
    retail_credits: 0,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (getToken) {
      fetchPricingData();
    }
  }, [getToken]);

  async function fetchPricingData() {
    setLoading(true);
    try {
      // Get auth token
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required. Please refresh the page.');
        return;
      }

      // Fetch price registry
      const registryResult = await adminPricingApi.getPriceRegistry(token);
      if (registryResult.success) {
        setPriceRegistry(registryResult.prices || []);
      }

      // Fetch pending changes
      const pendingResult = await adminPricingApi.getPriceChanges('pending', undefined, token);
      if (pendingResult.success) {
        setPendingChanges(pendingResult.changes || []);
      }

      // Fetch recent changes
      const recentResult = await adminPricingApi.getPriceChanges(undefined, 10, token);
      if (recentResult.success) {
        setRecentChanges(recentResult.changes || []);
      }

      // Fetch low margin workflows
      const marginsResult = await adminPricingApi.getLowMarginWorkflows(70, token);
      if (marginsResult.success) {
        setLowMarginWorkflows(marginsResult.workflows || []);
      }

      // Fetch all providers (comprehensive list)
      const allProvidersResult = await adminPricingApi.getAllProviders(token);
      if (allProvidersResult.success) {
        setAllProviders(allProvidersResult.all || []);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      alert('Failed to load pricing data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveChange(changeId) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      const result = await adminPricingApi.approvePriceChange(changeId, token);
      if (result.success) {
        alert('Price change approved successfully!');
        fetchPricingData();
      } else {
        alert(`Failed to approve: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving change:', error);
      alert('Failed to approve price change');
    }
  }

  async function handleRejectChange(changeId) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      const result = await adminPricingApi.rejectPriceChange(changeId, undefined, token);
      if (result.success) {
        alert('Price change rejected');
        fetchPricingData();
      } else {
        alert(`Failed to reject: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rejecting change:', error);
      alert('Failed to reject price change');
    }
  }

  async function handleManualScrape() {
    setScraping(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        setScraping(false);
        return;
      }
      const result = await adminPricingApi.triggerPriceScraping(token);
      if (result.success) {
        alert('Price scraping started. Results will appear shortly.');
        setTimeout(() => {
          fetchPricingData();
          setScraping(false);
        }, 3000);
      } else {
        alert(`Scraping failed: ${result.error}`);
        setScraping(false);
      }
    } catch (error) {
      console.error('Error triggering scrape:', error);
      alert('Failed to trigger price scraping');
      setScraping(false);
    }
  }

  function handleEditPrice(price) {
    setEditingPrice(price);
    setEditFormData({
      base_cost_usd: price.base_cost_usd,
      retail_credits: price.retail_credits,
      notes: price.notes || ''
    });
  }

  async function handleSavePrice() {
    if (!editingPrice) return;
    
    setSaving(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        setSaving(false);
        return;
      }
      const result = await adminPricingApi.updateProviderPrice(
        editingPrice.provider_id,
        editFormData.base_cost_usd,
        'manual',
        token
      );
      
      if (result.success) {
        await fetchPricingData();
        setEditingPrice(null);
        alert('Price updated successfully!');
      } else {
        alert(`Failed to update price: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Error updating price. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditingPrice(null);
    setEditFormData({
      base_cost_usd: 0,
      retail_credits: 0,
      notes: ''
    });
  }

  // Calculate stats
  const totalProviders = priceRegistry.length;
  const avgMargin = priceRegistry.length > 0 
    ? priceRegistry.reduce((sum, p) => sum + (p.margin_percent || 0), 0) / priceRegistry.length 
    : 0;
  const needsVerification = priceRegistry.filter(p => {
    const lastVerified = p.last_verified || p.verified_at || 0;
    return Date.now() - lastVerified > 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalProviders}</div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div className="text-sm opacity-70">API Providers Tracked</div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{pendingChanges.length}</div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <div className="text-sm opacity-70">Pending Approvals</div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{avgMargin.toFixed(1)}%</div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
            <div className="text-sm opacity-70">Average Margin</div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{needsVerification}</div>
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <div className="text-sm opacity-70">Needs Verification</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleManualScrape}
          disabled={scraping}
          className="btn btn-primary"
        >
          {scraping ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Scraper Now
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Price Registry
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Changes
          {pendingChanges.length > 0 && (
            <span className="badge badge-warning ml-2">{pendingChanges.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Change History
        </button>
        <button
          className={`tab ${activeTab === 'margins' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('margins')}
        >
          Low Margins
          {lowMarginWorkflows.length > 0 && (
            <span className="badge badge-error ml-2">{lowMarginWorkflows.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'all-apis' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('all-apis')}
        >
          All APIs
          <span className="badge badge-info ml-2">{allProviders.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {/* Price Registry Tab */}
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="mt-4">Loading pricing data...</p>
                </div>
              ) : priceRegistry.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-base-content/70">No pricing data available</p>
                </div>
              ) : (
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Operation</th>
                      <th className="text-right">Cost (USD)</th>
                      <th className="text-right">Retail Credits</th>
                      <th className="text-right">Margin</th>
                      <th className="text-center">Last Updated</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceRegistry.map((price) => {
                      const margin = price.margin_percent || 0;
                      const marginClass = margin < 60 
                        ? 'badge-error' 
                        : margin < 70 
                        ? 'badge-warning' 
                        : 'badge-success';
                      
                      return (
                        <tr key={`${price.provider_id}-${price.operation_type}`}>
                          <td className="font-medium">{price.provider_id}</td>
                          <td className="text-sm opacity-70">{price.operation_type}</td>
                          <td className="text-right font-mono">
                            ${(price.base_cost_usd || 0).toFixed(4)}
                          </td>
                          <td className="text-right font-mono">{price.retail_credits || 0}</td>
                          <td className="text-right">
                            <span className={`badge ${marginClass}`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-center text-sm opacity-70">
                            {new Date(price.last_updated || price.effective_date || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => handleEditPrice(price)}
                              className="btn btn-sm btn-ghost"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Pending Changes Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="mt-4">Loading pending changes...</p>
                </div>
              ) : pendingChanges.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="font-medium mb-1">All Clear!</p>
                  <p className="text-sm opacity-70">No pending price changes to review</p>
                </div>
              ) : (
                pendingChanges.map((change) => (
                  <div key={change.change_id} className="card bg-base-200 shadow">
                    <div className="card-body">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold">{change.provider_id}</h3>
                            <span className={`badge ${
                              Math.abs(change.change_percent) > 20 
                                ? 'badge-error' 
                                : Math.abs(change.change_percent) > 10 
                                ? 'badge-warning' 
                                : 'badge-info'
                            }`}>
                              {change.change_percent > 0 ? '+' : ''}{change.change_percent.toFixed(1)}%
                            </span>
                            <span className="badge badge-outline">
                              {change.source === 'web_scraper' ? '🤖 Auto' : '👤 Manual'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm opacity-70 mb-1">Old Price</p>
                              <p className="text-lg font-mono">${(change.old_price || 0).toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-sm opacity-70 mb-1">New Price</p>
                              <p className="text-lg font-mono">${(change.new_price || 0).toFixed(4)}</p>
                            </div>
                          </div>

                          {change.impact_summary && expandedChange === change.change_id && (
                            <div className="bg-base-300 rounded-lg p-4 mb-4">
                              <h4 className="font-semibold mb-2">Impact Analysis</h4>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="opacity-70">Annual Impact</p>
                                  <p className="font-semibold">
                                    ${(change.impact_summary.annual_impact_usd || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="opacity-70">Workflows Affected</p>
                                  <p className="font-semibold">
                                    {change.impact_summary.affected_workflows || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="opacity-70">Recommendation</p>
                                  <p className="font-semibold">
                                    {change.impact_summary.recommended_action || 'Review'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm opacity-70">
                            <Clock className="w-4 h-4" />
                            Detected {new Date(change.detected_at || Date.now()).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleApproveChange(change.change_id)}
                            className="btn btn-sm btn-success"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectChange(change.change_id)}
                            className="btn btn-sm btn-error"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>

                      {change.impact_summary && (
                        <button
                          onClick={() => setExpandedChange(
                            expandedChange === change.change_id ? null : change.change_id
                          )}
                          className="btn btn-sm btn-ghost mt-2"
                        >
                          {expandedChange === change.change_id ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show Impact Analysis
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Change History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="mt-4">Loading history...</p>
                </div>
              ) : recentChanges.length === 0 ? (
                <div className="text-center py-8">
                  <p className="opacity-70">No recent changes</p>
                </div>
              ) : (
                recentChanges.map((change) => (
                  <div
                    key={change.change_id}
                    className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {change.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-error" />
                      )}
                      <div>
                        <p className="font-medium">{change.provider_id}</p>
                        <p className="text-sm opacity-70">
                          ${(change.old_price || 0).toFixed(4)} → ${(change.new_price || 0).toFixed(4)}
                          <span className={change.change_percent > 0 ? 'text-error' : 'text-success'}>
                            {' '}({change.change_percent > 0 ? '+' : ''}{(change.change_percent || 0).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        change.status === 'approved' 
                          ? 'badge-success' 
                          : 'badge-error'
                      }`}>
                        {change.status}
                      </span>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(change.detected_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* All APIs Tab - Comprehensive Manual Editing */}
          {activeTab === 'all-apis' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="mt-4">Loading all APIs...</p>
                </div>
              ) : (
                <>
                  {/* Category Filter */}
                  <div className="flex gap-2 mb-4">
                    <button
                      className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      All ({allProviders.length})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedCategory === 'video' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedCategory('video')}
                    >
                      Video ({allProviders.filter(p => p.category === 'video').length})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedCategory === 'image' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedCategory('image')}
                    >
                      Image ({allProviders.filter(p => p.category === 'image').length})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedCategory === 'audio' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedCategory('audio')}
                    >
                      Audio ({allProviders.filter(p => p.category === 'audio').length})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedCategory === 'llm' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedCategory('llm')}
                    >
                      LLM ({allProviders.filter(p => p.category === 'llm').length})
                    </button>
                  </div>

                  {/* Providers Table */}
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Provider ID</th>
                          <th>Label</th>
                          <th className="text-right">Config Cost (USD)</th>
                          <th className="text-right">Registry Cost (USD)</th>
                          <th className="text-right">Config Credits</th>
                          <th className="text-right">Registry Credits</th>
                          <th className="text-right">Config Margin</th>
                          <th className="text-right">Registry Margin</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProviders
                          .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
                          .map((provider) => {
                            const hasRegistry = provider.has_registry_entry;
                            const costDiff = provider.registry_cost_usd !== null 
                              ? ((provider.registry_cost_usd - provider.config_cost_usd) / provider.config_cost_usd * 100).toFixed(1)
                              : null;
                            
                            return (
                              <tr 
                                key={`${provider.provider_id}-${provider.operation_type}`}
                                className={!hasRegistry ? 'opacity-60' : ''}
                              >
                                <td className="font-mono text-sm">{provider.provider_id}</td>
                                <td>
                                  <div className="font-medium">{provider.label}</div>
                                  <div className="text-xs opacity-70">{provider.description}</div>
                                </td>
                                <td className="text-right font-mono">
                                  ${(provider.config_cost_usd || 0).toFixed(4)}
                                </td>
                                <td className="text-right font-mono">
                                  {provider.registry_cost_usd !== null ? (
                                    <span className={costDiff && Math.abs(costDiff) > 5 ? 'text-warning' : ''}>
                                      ${(provider.registry_cost_usd || 0).toFixed(4)}
                                    </span>
                                  ) : (
                                    <span className="text-error">Not in registry</span>
                                  )}
                                </td>
                                <td className="text-right font-mono">
                                  {provider.config_credits || '-'}
                                </td>
                                <td className="text-right font-mono">
                                  {provider.registry_credits !== null ? provider.registry_credits : '-'}
                                </td>
                                <td className="text-right">
                                  {provider.config_margin !== null ? (
                                    <span className="badge badge-info">{provider.config_margin.toFixed(1)}%</span>
                                  ) : '-'}
                                </td>
                                <td className="text-right">
                                  {provider.registry_margin !== null ? (
                                    <span className={`badge ${
                                      provider.registry_margin < 60 ? 'badge-error' :
                                      provider.registry_margin < 70 ? 'badge-warning' :
                                      'badge-success'
                                    }`}>
                                      {provider.registry_margin.toFixed(1)}%
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="text-center">
                                  <div className="flex flex-col gap-1">
                                    {provider.enabled && (
                                      <span className="badge badge-success badge-sm">Enabled</span>
                                    )}
                                    {provider.launchReady && (
                                      <span className="badge badge-info badge-sm">Launch Ready</span>
                                    )}
                                    {!hasRegistry && (
                                      <span className="badge badge-error badge-sm">No Registry Entry</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center">
                                  <button
                                    onClick={() => {
                                      // Create a price entry if it doesn't exist, or edit existing
                                      const priceToEdit = hasRegistry ? {
                                        provider_id: provider.provider_id,
                                        operation_type: provider.operation_type,
                                        base_cost_usd: provider.registry_cost_usd,
                                        retail_credits: provider.registry_credits,
                                        margin_percent: provider.registry_margin,
                                        notes: ''
                                      } : {
                                        provider_id: provider.provider_id,
                                        operation_type: provider.operation_type,
                                        base_cost_usd: provider.config_cost_usd,
                                        retail_credits: provider.config_credits,
                                        margin_percent: provider.config_margin,
                                        notes: 'Initial entry from config'
                                      };
                                      handleEditPrice(priceToEdit);
                                    }}
                                    className="btn btn-sm btn-ghost"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="text-2xl font-bold">{allProviders.length}</div>
                        <div className="text-sm opacity-70">Total APIs</div>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="text-2xl font-bold text-success">
                          {allProviders.filter(p => p.has_registry_entry).length}
                        </div>
                        <div className="text-sm opacity-70">In Registry</div>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="text-2xl font-bold text-error">
                          {allProviders.filter(p => !p.has_registry_entry).length}
                        </div>
                        <div className="text-sm opacity-70">Missing from Registry</div>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="text-2xl font-bold text-info">
                          {allProviders.filter(p => p.enabled && p.launchReady).length}
                        </div>
                        <div className="text-sm opacity-70">Enabled & Launch Ready</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Low Margins Tab */}
          {activeTab === 'margins' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="mt-4">Analyzing margins...</p>
                </div>
              ) : lowMarginWorkflows.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="font-medium mb-1">Healthy Margins!</p>
                  <p className="text-sm opacity-70">All workflows have margins above 70%</p>
                </div>
              ) : (
                lowMarginWorkflows.map((workflow) => (
                  <div
                    key={workflow.workflow_id}
                    className="p-4 bg-error/10 border border-error rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{workflow.name || workflow.workflow_id}</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="opacity-70">Cost</p>
                            <p className="font-mono">${(workflow.total_cost_usd || 0).toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="opacity-70">Retail</p>
                            <p className="font-mono">{workflow.retail_credits || 0} credits</p>
                          </div>
                          <div>
                            <p className="opacity-70">Margin</p>
                            <p className="font-semibold text-error">
                              {(workflow.margin_percent || 0).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="opacity-70">Monthly Usage</p>
                            <p className="font-mono">{workflow.monthly_usage || 0}</p>
                          </div>
                        </div>
                      </div>
                      <AlertCircle className="w-6 h-6 text-error ml-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingPrice && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Edit Price</h3>
              <button onClick={handleCancelEdit} className="btn btn-sm btn-circle btn-ghost">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Provider Info */}
              <div className="bg-base-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-70 mb-1">Provider</p>
                    <p className="font-semibold">{editingPrice.provider_id}</p>
                  </div>
                  <div>
                    <p className="opacity-70 mb-1">Operation</p>
                    <p className="font-semibold">{editingPrice.operation_type}</p>
                  </div>
                </div>
              </div>

              {/* Cost Input */}
              <div>
                <label className="label">
                  <span className="label-text">Base Cost (USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={editFormData.base_cost_usd}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      base_cost_usd: parseFloat(e.target.value) || 0
                    })}
                    className="input input-bordered w-full pl-8 font-mono"
                    placeholder="0.0000"
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt opacity-70">
                    Current: ${(editingPrice.base_cost_usd || 0).toFixed(4)}
                  </span>
                </label>
              </div>

              {/* Retail Credits Input */}
              <div>
                <label className="label">
                  <span className="label-text">Retail Credits</span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={editFormData.retail_credits}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    retail_credits: parseInt(e.target.value) || 0
                  })}
                  className="input input-bordered w-full font-mono"
                  placeholder="0"
                />
                <label className="label">
                  <span className="label-text-alt opacity-70">
                    Current: {editingPrice.retail_credits || 0} credits
                  </span>
                </label>
              </div>

              {/* New Margin Preview */}
              {editFormData.base_cost_usd > 0 && editFormData.retail_credits > 0 && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">New Margin Preview</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-primary">
                      {(((editFormData.retail_credits * 0.01 - editFormData.base_cost_usd) / (editFormData.retail_credits * 0.01)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm opacity-70">(assuming $0.01 per credit)</p>
                  </div>
                </div>
              )}

              {/* Notes Input */}
              <div>
                <label className="label">
                  <span className="label-text">Notes (Optional)</span>
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    notes: e.target.value
                  })}
                  rows={3}
                  className="textarea textarea-bordered w-full resize-none"
                  placeholder="Add notes about this price change..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-action">
              <button
                onClick={handleCancelEdit}
                className="btn btn-ghost"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={handleCancelEdit}></div>
        </div>
      )}
    </div>
  );
}

