'use client';

import AdminPricingDashboard from '@/components/admin/AdminPricingDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminPricingPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Price Management</h1>
        <p className="text-base-content/70">
          Monitor provider pricing, approve changes, and protect margins
        </p>
      </div>

      <AdminPricingDashboard />
    </div>
  );
}

