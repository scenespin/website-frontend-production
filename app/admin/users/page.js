'use client';

import AdminUsersDashboard from '@/components/admin/AdminUsersDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminUsersDashboard />
    </div>
  );
}

