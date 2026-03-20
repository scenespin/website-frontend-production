'use client';

import WorkflowAnalyticsDashboard from '@/components/admin/WorkflowAnalyticsDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminAnalyticsPage() {
  return (
    <AdminShell>
      <AdminNav />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Workflow Analytics</h1>
        <p className="text-base-content/40">
          Track user interactions with workflows and understand usage patterns.
        </p>
      </div>

      <WorkflowAnalyticsDashboard />
    </AdminShell>
  );
}
