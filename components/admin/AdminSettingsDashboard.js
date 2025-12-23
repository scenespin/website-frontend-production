'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { 
  Settings,
  Database,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

/**
 * Admin Settings Dashboard
 * 
 * System configuration, health checks, and environment status
 */
export default function AdminSettingsDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSystemStatus();
    }
  }, [user]);

  async function fetchSystemStatus() {
    setLoading(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.error('[Admin Settings] No auth token available');
        setLoading(false);
        return;
      }
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch detailed system health from admin endpoint
      const response = await fetch('/api/admin/health', { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const healthData = await response.json();
      
      // Transform the backend response to match component expectations
      const tables = healthData.database || [];
      const isHealthy = tables.length > 0 && tables.some(t => t.item_count >= 0);
      
      setSystemStatus({
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: {
          status: isHealthy ? 'healthy' : 'down',
          region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
          tables: tables, // Store all tables
          totalItems: tables.reduce((sum, t) => sum + (t.item_count || 0), 0),
          totalSize: tables.reduce((sum, t) => sum + (t.size_bytes || 0), 0)
        },
        jobQueues: healthData.job_queues || {},
        apiPerformance: healthData.api_performance || {},
        environment: process.env.NODE_ENV || 'production',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Admin Settings] Failed to fetch system status:', error);
      // Set error state
      setSystemStatus({
        status: 'down',
        database: {
          status: 'down',
          region: 'N/A',
          tables: [],
          totalItems: 0,
          totalSize: 0
        },
        error: error.message
      });
    } finally {
      setLoading(false);
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
          <p className="text-base-content/40 mt-1">Monitor system health and configuration</p>
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
                <p className="text-sm text-base-content/40">Overall Status</p>
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
                <p className="text-sm text-base-content/40">Database</p>
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
                <p className="text-sm text-base-content/40">API Services</p>
                <div className="mt-2">
                  <StatusBadge status="healthy" />
                </div>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Database Connection Info */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">Database Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-base-content/40">Region</p>
              <p className="font-bold">{systemStatus?.database?.region || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/40">Connection Status</p>
              <StatusBadge status={systemStatus?.database?.status} />
            </div>
            <div>
              <p className="text-sm text-base-content/40">Total Items</p>
              <p className="font-bold">{systemStatus?.database?.totalItems?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/40">Total Size</p>
              <p className="font-bold">
                {systemStatus?.database?.totalSize 
                  ? `${(systemStatus.database.totalSize / 1024 / 1024).toFixed(2)} MB`
                  : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Tables List */}
          {systemStatus?.database?.tables && systemStatus.database.tables.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-base-content/40 mb-2">Monitored Tables</p>
              <div className="space-y-2">
                {systemStatus.database.tables.map((table, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-base-300 rounded">
                    <div>
                      <p className="font-mono text-sm font-bold">{table.table_name}</p>
                      <p className="text-xs opacity-70">
                        {table.item_count?.toLocaleString() || 0} items
                        {table.size_bytes ? ` • ${(table.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-base-content/40">Environment</p>
              <p className="font-bold">{systemStatus?.environment || 'production'}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/40">Node Version</p>
              <p className="font-bold">{systemStatus?.nodeVersion || process.version}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/40">API Response Time</p>
              <p className="font-bold">
                {systemStatus?.apiPerformance?.avg_response_time_ms 
                  ? `${systemStatus.apiPerformance.avg_response_time_ms}ms` 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/40">Last Checked</p>
              <p className="font-bold">
                {systemStatus?.timestamp 
                  ? new Date(systemStatus.timestamp).toLocaleString() 
                  : new Date().toLocaleString()}
              </p>
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

