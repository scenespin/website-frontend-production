'use client';

import AdminSettingsDashboard from '@/components/admin/AdminSettingsDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminSettingsDashboard />
    </AdminShell>
  );
}

