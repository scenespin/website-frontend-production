'use client';

import AdminNewsletterDashboard from '@/components/admin/AdminNewsletterDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminNewsletterPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminNewsletterDashboard />
    </div>
  );
}
