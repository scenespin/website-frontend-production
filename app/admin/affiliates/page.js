'use client';

import AdminAffiliateDashboard from '@/components/admin/AdminAffiliateDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminAffiliatesPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminAffiliateDashboard />
    </div>
  );
}
