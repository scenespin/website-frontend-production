'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  MessageSquare,
  Video,
  FileText,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';

export default function Navigation() {
  const { user } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openDrawer } = useDrawer();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Chat', action: () => openDrawer('chat'), icon: MessageSquare },
    { name: 'Workflows', href: '/workflows', icon: Zap },
    { name: 'Generate Video', href: '/production', icon: Video },
    { name: 'Screenplay', href: '/editor', icon: FileText },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-cinema-red rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold">
                Wryda<span className="text-cinema-red">.ai</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              {navigation.map((item) => (
                item.action ? (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-base-content hover:bg-base-300"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-cinema-red text-white'
                        : 'text-base-content hover:bg-base-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user && (
                <Link href="/pricing" className="btn btn-sm gap-2 bg-cinema-red hover:opacity-90 text-white border-none">
                  <Zap className="w-4 h-4 text-cinema-gold" />
                  <span>Add Credits</span>
                </Link>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-base-200 border-b border-base-300">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cinema-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <span className="font-bold">
              Wryda<span className="text-cinema-red">.ai</span>
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-square"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-base-300 p-4 space-y-2">
            {navigation.map((item) => (
              item.action ? (
                <button
                  key={item.name}
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-base-content hover:bg-base-300"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-cinema-red text-white'
                      : 'text-base-content hover:bg-base-300'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            ))}
            <div className="pt-2 border-t border-base-300">
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-block gap-2 bg-cinema-red hover:opacity-90 text-white border-none"
              >
                <Zap className="w-4 h-4 text-cinema-gold" />
                Add Credits
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

