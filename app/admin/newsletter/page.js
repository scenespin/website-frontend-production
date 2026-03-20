'use client';

import AdminNewsletterDashboard from '@/components/admin/AdminNewsletterDashboard';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminNewsletterPage() {
  return (
    <AdminShell>
      <AdminNav />
      <AdminNewsletterDashboard />
    </AdminShell>
  );
}
