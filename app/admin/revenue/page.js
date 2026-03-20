'use client';

export const dynamic = 'force-dynamic';

import AdminRevenueDashboard from '@/components/admin/AdminRevenueDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminRevenuePage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminRevenueDashboard />
    </AdminShell>
  );
}

