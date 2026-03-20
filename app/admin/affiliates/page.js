'use client';

export const dynamic = 'force-dynamic';

import AdminAffiliateDashboard from '@/components/admin/AdminAffiliateDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminAffiliatesPage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminAffiliateDashboard />
    </AdminShell>
  );
}
