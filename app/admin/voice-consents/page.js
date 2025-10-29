'use client';

import { useState } from 'react';
import AdminVoiceConsentDashboard from '@/components/admin/AdminVoiceConsentDashboard';
import { Shield, Users, FileText, Settings } from 'lucide-react';

/**
 * Admin Voice Consent Page
 * 
 * Example admin page showing how to integrate the Voice Consent Dashboard.
 * Add this to your admin section at: /app/admin/voice-consents/page.js
 * 
 * SECURITY: Ensure this is protected by admin authentication middleware!
 */
export default function AdminVoiceConsentsPage() {
  return (
    <div className="min-h-screen bg-base-300">
      {/* Top Navigation - Customize as needed */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a href="/admin" className="btn btn-ghost normal-case text-xl">
            <Shield className="w-6 h-6 mr-2" />
            Wryda Admin
          </a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><a href="/admin/users"><Users className="w-4 h-4 mr-2" />Users</a></li>
            <li><a href="/admin/voice-consents" className="active"><Shield className="w-4 h-4 mr-2" />Voice Consents</a></li>
            <li><a href="/admin/content"><FileText className="w-4 h-4 mr-2" />Content</a></li>
            <li><a href="/admin/settings"><Settings className="w-4 h-4 mr-2" />Settings</a></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <AdminVoiceConsentDashboard />
      </div>
    </div>
  );
}

