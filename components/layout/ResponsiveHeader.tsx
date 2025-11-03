'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, PlusCircle, Settings, User, LogOut, Bell, Search, History, Monitor } from 'lucide-react'
// ThemeToggle removed - forcing dark mode only
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { isMobileDevice } from '@/utils/deviceDetection'

interface ResponsiveHeaderProps {
  user?: {
    name: string
    email: string
    avatar?: string
    credits?: number
    isAdmin?: boolean
  }
  onLogout?: () => void
}

export function ResponsiveHeader({ user, onLogout }: ResponsiveHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Device detection - Feature 0068
  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', description: 'Overview & quick access', icon: 'dashboard' },
    { name: 'Editor', href: '/editor', description: 'Screenplay editor', icon: 'write' },
    { 
      name: 'Production', 
      href: '/production', 
      description: 'AI video & audio generation',
      desktopRecommended: true,
      icon: 'production'
    },
    { 
      name: 'Composition', 
      href: '/composition', 
      description: 'Layouts & effects studio',
      desktopRecommended: true,
      icon: 'composition'
    },
    { 
      name: 'Timeline', 
      href: '/timeline', 
      description: 'Video editor',
      icon: 'timeline'
    },
    { 
      name: 'Library', 
      href: '/dashboard', 
      description: 'Projects & assets',
      icon: 'library'
    },
  ]

  // Workflow stages for progress tracking
  const workflowStages = ['Write', 'Production', 'Composition', 'Timeline']
  
  const getCurrentWorkflowStage = () => {
    if (pathname?.includes('/write') || pathname?.includes('/editor') || pathname?.includes('/beats') || pathname?.includes('/characters') || pathname?.includes('/locations')) return 0
    if (pathname?.includes('/production')) return 1
    if (pathname?.includes('/composition')) return 2
    if (pathname?.includes('/timeline')) return 3
    return -1
  }
  
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <>
      {/* Desktop & Tablet Header (≥768px) */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#DC143C] to-[#8B0000] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-[#DC143C]/50 transition-all">
                <svg className="w-6 h-6 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="text-xl font-bold text-base-content">
                Wryda<span className="text-[#DC143C]">.ai</span>
              </div>
            </Link>

            {/* Workflow Progress Indicator - Only show when in production workflow */}
            {getCurrentWorkflowStage() >= 0 && (
              <div className="hidden xl:flex items-center gap-2 ml-6 px-4 py-2 bg-white/5 rounded-lg">
                {workflowStages.map((stage, index) => (
                  <React.Fragment key={stage}>
                    <div className={`flex items-center gap-2 ${
                      index === getCurrentWorkflowStage() 
                        ? 'text-[#DC143C] font-semibold' 
                        : index < getCurrentWorkflowStage()
                        ? 'text-[#B3B3B3]'
                        : 'text-[#808080]'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        index === getCurrentWorkflowStage()
                          ? 'bg-[#DC143C] animate-pulse'
                          : index < getCurrentWorkflowStage()
                          ? 'bg-[#B3B3B3]'
                          : 'bg-[#808080]/30'
                      }`} />
                      <span className="text-xs">{stage}</span>
                    </div>
                    {index < workflowStages.length - 1 && (
                      <ChevronDown className="w-3 h-3 text-[#808080] rotate-[-90deg]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive(item.href)
                      ? 'bg-[#DC143C]/10 text-[#DC143C]'
                      : 'text-[#B3B3B3] hover:bg-white/5 hover:text-base-content'
                  }`}
                >
                  {item.name}
                  {/* Desktop Recommended Badge - Feature 0068 */}
                  {item.desktopRecommended && isMobile && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500 text-amber-600 dark:text-amber-400">
                      <Monitor className="w-2.5 h-2.5 mr-0.5" />
                      Desktop
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Search Button - Desktop only */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden xl:flex hover:bg-white/5 text-[#B3B3B3] hover:text-base-content"
                aria-label="Search projects"
                title="Search (Coming Soon)"
                disabled
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-white/5 text-[#B3B3B3] hover:text-base-content" 
                aria-label="Notifications"
                title="Notifications (Coming Soon)"
                disabled
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#DC143C] opacity-50" />
              </Button>

              {/* Theme Toggle - REMOVED: Force dark mode only */}
              {/* <ThemeToggle /> */}

              {/* New Project Button */}
              <Button
                asChild
                size="sm"
                className="hidden lg:flex items-center gap-2 bg-gradient-to-br from-[#DC143C] to-[#8B0000] hover:shadow-lg hover:shadow-[#DC143C]/50 transition-all hover:scale-105 active:scale-95"
              >
                <Link href="/dashboard">
                  <PlusCircle className="w-4 h-4" />
                  New Project
                </Link>
              </Button>

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        {user.credits !== undefined && (
                          <Badge variant="secondary" className="w-fit mt-1">
                            {user.credits} credits
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/app/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {user?.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/app/admin" className="text-purple-600">
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/app/billing">
                        <User className="mr-2 h-4 w-4" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Hamburger for Tablet */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header (< 768px) */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base-content font-bold text-xs">
              W
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-base-content">
              Wryda.ai
            </span>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 relative hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Notifications"
              title="Notifications (Coming Soon)"
              disabled
            >
              <Bell className="h-4 w-4 opacity-50" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Slide-out Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-base-content">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-base-content truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {user.credits !== undefined && (
                    <Badge variant="secondary" className="w-full justify-center">
                      {user.credits} credits remaining
                    </Badge>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <nav className="p-4 space-y-1">
                <Button
                  asChild
                  className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 mb-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/dashboard">
                    <PlusCircle className="w-4 h-4" />
                    New Project
                  </Link>
                </Button>

                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col px-4 py-3 rounded-lg transition-all ${
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </nav>

              {/* Menu Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>
                {user?.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-4 py-2 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Panel
                  </Link>
                )}
                {/* Theme Toggle - REMOVED: Force dark mode only */}
                {/* <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
                  <ThemeToggle />
                </div> */}
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Log out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

