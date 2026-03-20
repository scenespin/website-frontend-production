'use client';

import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';
import AdminPromoDashboard from '@/components/admin/AdminPromoDashboard';

export default function AdminPromoPage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminPromoDashboard />
    </AdminShell>
  );
}
