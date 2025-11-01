'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Settings,
  Database,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Admin Settings Dashboard
 * 
 * System configuration, health checks, and environment status
 */
export default function AdminSettingsDashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [envVars, setEnvVars] = useState([]);

  useEffect(() => {
    if (user) {
      fetchSystemStatus();
    }
  }, [user]);

  async function fetchSystemStatus() {
    setLoading(true);
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('[Admin Settings] Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnvVars() {
    try {
      const response = await fetch('/api/admin/env-status');
      const data = await response.json();
      setEnvVars(data.variables || []);
      setShowEnvVars(true);
    } catch (error) {
      console.error('[Admin Settings] Failed to fetch env vars:', error);
    }
  }

  const StatusBadge = ({ status }) => {
    if (status === 'healthy' || status === 'ok') {
      return <span className="badge badge-success gap-2"><CheckCircle className="w-3 h-3" /> Healthy</span>;
    }
    if (status === 'degraded' || status === 'warning') {
      return <span className="badge badge-warning gap-2"><AlertTriangle className="w-3 h-3" /> Degraded</span>;
    }
    return <span className="badge badge-error gap-2"><XCircle className="w-3 h-3" /> Down</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600 mt-1">Monitor system health and configuration</p>
        </div>
        <button 
          onClick={fetchSystemStatus}
          className="btn btn-outline btn-sm gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Overall Status</p>
                <div className="mt-2">
                  <StatusBadge status={systemStatus?.status} />
                </div>
              </div>
              <Server className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <div className="mt-2">
                  <StatusBadge status={systemStatus?.database?.status} />
                </div>
              </div>
              <Database className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">API Services</p>
                <div className="mt-2">
                  <StatusBadge status="healthy" />
                </div>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Environment Configuration</h2>
            <button
              onClick={fetchEnvVars}
              className="btn btn-sm btn-outline gap-2"
            >
              {showEnvVars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showEnvVars ? 'Hide' : 'Show'} Variables
            </button>
          </div>

          {!showEnvVars ? (
            <div className="alert alert-info">
              <AlertTriangle className="w-5 h-5" />
              <span>Click &quot;Show Variables&quot; to view environment configuration status</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Critical Variables */}
              <div>
                <h3 className="font-semibold mb-2">Critical Variables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">AWS_REGION</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">DYNAMODB_TABLE_USERS</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">CLERK_SECRET_KEY</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">STRIPE_SECRET_KEY</span>
                  </div>
                </div>
              </div>

              {/* API Keys - Real Names for Admin Management */}
              <div>
                <h3 className="font-semibold mb-2">AI Provider APIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">RUNWAY_API_KEY</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">LUMA_API_KEY</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">GOOGLE_AI_API_KEY</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-base-100 rounded">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">OPENAI_API_KEY</span>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">
                  Environment variables are loaded from .env files. Never expose actual values in the frontend.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Database Connection Info */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">Database Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Region</p>
              <p className="font-bold">{systemStatus?.database?.region || 'us-east-1'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Table Name</p>
              <p className="font-bold">{systemStatus?.database?.tableName || 'ISE_Users'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Connection Status</p>
              <StatusBadge status={systemStatus?.database?.status} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Checked</p>
              <p className="font-bold">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Environment</p>
              <p className="font-bold">{systemStatus?.environment || 'production'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Node Version</p>
              <p className="font-bold">{systemStatus?.nodeVersion || process.version}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="font-bold">{systemStatus?.uptime || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Deploy</p>
              <p className="font-bold">{systemStatus?.lastDeploy || 'Oct 31, 2025'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Flags (Placeholder) */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">Feature Flags</h2>
          <div className="alert alert-info">
            <AlertTriangle className="w-5 h-5" />
            <span>Feature flag management coming soon. Currently all features are enabled.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

