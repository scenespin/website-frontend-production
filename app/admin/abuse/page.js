'use client';

import AdminAbuseDashboard from '@/components/admin/AdminAbuseDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminAbusePage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminAbuseDashboard />
    </div>
  );
}

