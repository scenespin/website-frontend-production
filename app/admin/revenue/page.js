'use client';

export const dynamic = 'force-dynamic';

import AdminRevenueDashboard from '@/components/admin/AdminRevenueDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminRevenuePage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminRevenueDashboard />
    </div>
  );
}

