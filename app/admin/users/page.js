'use client';

import AdminUsersDashboard from '@/components/admin/AdminUsersDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminUsersDashboard />
    </AdminShell>
  );
}

