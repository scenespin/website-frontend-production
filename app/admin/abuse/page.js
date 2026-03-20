'use client';

import AdminAbuseDashboard from '@/components/admin/AdminAbuseDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminAbusePage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminAbuseDashboard />
    </AdminShell>
  );
}

