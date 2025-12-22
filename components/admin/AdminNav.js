'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Shield, 
  DollarSign,
  Settings,
  Home,
  TrendingUp,
  Coins
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Main Dashboard' },
    { href: '/admin/revenue', icon: TrendingUp, label: 'Revenue Tracking' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Workflow Analytics' },
    { href: '/admin/pricing', icon: Coins, label: 'API Pricing' },
    { href: '/admin/affiliates', icon: DollarSign, label: 'Affiliate Program' },
    { href: '/admin/voice-consents', icon: Shield, label: 'Voice Consents' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-base-200 rounded-lg shadow-lg mb-6">
      <div className="flex flex-wrap gap-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`btn btn-sm gap-2 ${
                isActive 
                  ? 'btn-primary' 
                  : 'btn-ghost'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

