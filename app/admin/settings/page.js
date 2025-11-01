'use client';

import AdminSettingsDashboard from '@/components/admin/AdminSettingsDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminSettingsDashboard />
    </div>
  );
}

