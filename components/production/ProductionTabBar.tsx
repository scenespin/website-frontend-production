'use client';

/**
 * Production Tab Bar Component
 * 
 * Horizontal tab navigation matching Creation area styling
 * - Overview, Scene Builder, Scenes, Media, Banks (dropdown), Jobs
 * 
 * Feature: Production Hub Redesign - Option 1
 */

import React, { useState } from 'react';
import { Film, Clapperboard, BriefcaseBusiness, Sparkles, Building2, Users, MapPin, Package, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ProductionTab = 'overview' | 'scene-builder' | 'scenes' | 'media' | 'banks' | 'jobs';
export type BankTab = 'characters' | 'locations' | 'assets';

interface ProductionTabBarProps {
  activeTab: ProductionTab;
  onTabChange: (tab: ProductionTab) => void;
  activeBankId?: BankTab | null;
  onBankChange?: (bankId: BankTab) => void;
  jobCount?: number; // Badge for active jobs
}

const TABS = [
  {
    id: 'overview' as ProductionTab,
    label: 'Overview',
    icon: Sparkles,
    description: 'Project dashboard',
  },
  {
    id: 'scene-builder' as ProductionTab,
    label: 'Scene Builder',
    icon: Clapperboard,
    description: 'Script-based production',
  },
  {
    id: 'scenes' as ProductionTab,
    label: 'Scenes',
    icon: Film,
    description: 'Scene videos & storyboard',
  },
  {
    id: 'media' as ProductionTab,
    label: 'Media',
    icon: Film,
    description: 'Media Library & uploads',
  },
  {
    id: 'jobs' as ProductionTab,
    label: 'Jobs',
    icon: BriefcaseBusiness,
    description: 'Workflow history',
  }
] as const;

const BANKS = [
  {
    id: 'characters' as BankTab,
    label: 'Characters',
    icon: Users,
    description: 'Character bank & references',
  },
  {
    id: 'locations' as BankTab,
    label: 'Locations',
    icon: MapPin,
    description: 'Location bank & references',
  },
  {
    id: 'assets' as BankTab,
    label: 'Assets',
    icon: Package,
    description: 'Props, vehicles & furniture',
  }
] as const;

export function ProductionTabBar({
  activeTab,
  onTabChange,
  activeBankId = null,
  onBankChange,
  jobCount = 0
}: ProductionTabBarProps) {
  const [isBanksDropdownOpen, setIsBanksDropdownOpen] = useState(false);
  const isBanksActive = activeTab === 'banks' && activeBankId !== null;
  const activeBank = BANKS.find(bank => bank.id === activeBankId);

  const handleBanksClick = () => {
    onTabChange('banks');
    setIsBanksDropdownOpen(true); // Auto-open dropdown
  };

  const handleBankSelect = (bankId: BankTab) => {
    onBankChange?.(bankId);
    setIsBanksDropdownOpen(false);
  };

  return (
    <div className="border-b border-white/10 bg-[#141414]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'jobs' && jobCount > 0;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
                  "transition-colors duration-200",
                  "border-b-2 -mb-[2px]",
                  "whitespace-nowrap", // Prevent text wrapping
                  isActive
                    ? cn(
                        "border-[#DC143C]",
                        "bg-[#DC143C]/10",
                        "text-[#DC143C]"
                      )
                    : cn(
                        "border-transparent",
                        "text-white/60",
                        "hover:text-white/90",
                        "hover:bg-white/5"
                      )
                )}
                aria-current={isActive ? 'page' : undefined}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>

                {/* Badge for Jobs count */}
                {showBadge && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full",
                    "text-xs font-bold",
                    "bg-[#DC143C] text-white",
                    "min-w-[18px] text-center"
                  )}>
                    {jobCount > 99 ? '99+' : jobCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Banks Tab with Dropdown */}
          <DropdownMenu open={isBanksDropdownOpen} onOpenChange={setIsBanksDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={handleBanksClick}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
                  "transition-colors duration-200",
                  "border-b-2 -mb-[2px]",
                  "whitespace-nowrap",
                  isBanksActive
                    ? cn(
                        "border-[#DC143C]",
                        "bg-[#DC143C]/10",
                        "text-[#DC143C]"
                      )
                    : cn(
                        "border-transparent",
                        "text-white/60",
                        "hover:text-white/90",
                        "hover:bg-white/5"
                      )
                )}
                aria-current={isBanksActive ? 'page' : undefined}
                title="Character, Location, and Asset banks"
              >
                <Building2 className="w-4 h-4" />
                <span>Banks</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isBanksDropdownOpen && "rotate-180"
                )} />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-48 bg-[#1A1A1A] border-white/10">
              {BANKS.map((bank) => {
                const Icon = bank.icon;
                const isBankActive = activeBankId === bank.id;
                
                return (
                  <DropdownMenuItem
                    key={bank.id}
                    onClick={() => handleBankSelect(bank.id)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      isBankActive && "bg-[#DC143C]/20 text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{bank.label}</span>
                    {isBankActive && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

}

