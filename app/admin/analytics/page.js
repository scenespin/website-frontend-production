'use client';

import WorkflowAnalyticsDashboard from '@/components/admin/WorkflowAnalyticsDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Workflow Analytics</h1>
        <p className="text-gray-600">
          Track user interactions with workflows and understand usage patterns.
        </p>
      </div>

      <WorkflowAnalyticsDashboard />
    </div>
  );
}
