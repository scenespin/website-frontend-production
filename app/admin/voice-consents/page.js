'use client';

import AdminVoiceConsentDashboard from '@/components/admin/AdminVoiceConsentDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminVoiceConsentsPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      <AdminVoiceConsentDashboard />
    </div>
  );
}
