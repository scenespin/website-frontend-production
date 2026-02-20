'use client';

import React from 'react';
import { Crown, PenTool, Package, Upload, Eye } from 'lucide-react';

export type ScreenplayRole = 'director' | 'writer' | 'producer' | 'viewer';

interface RoleBadgeProps {
  role: ScreenplayRole | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const roleConfig = {
  director: {
    label: 'Director',
    icon: Crown,
    color: 'bg-base-300',
    textColor: 'text-cinema-red',
    borderColor: 'border-cinema-red/30'
  },
  writer: {
    label: 'Writer',
    icon: PenTool,
    color: 'bg-base-300',
    textColor: 'text-cinema-blue',
    borderColor: 'border-cinema-blue/20'
  },
  producer: {
    label: 'Producer',
    icon: Package,
    color: 'bg-base-300',
    textColor: 'text-cinema-gold',
    borderColor: 'border-cinema-gold/50'
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    color: 'bg-base-300',
    textColor: 'text-base-content/80',
    borderColor: 'border-base-content/20'
  }
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  md: {
    padding: 'px-2.5 py-1',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    icon: 'w-5 h-5'
  }
};

/**
 * RoleBadge - Displays a user's role with icon and color coding
 */
export default function RoleBadge({ 
  role, 
  size = 'md', 
  showIcon = true,
  className = '' 
}: RoleBadgeProps) {
  if (!role) {
    return null;
  }

  const config = roleConfig[role];
  const sizeStyle = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeStyle.padding}
        ${config.color}
        ${config.textColor}
        ${sizeStyle.text}
        font-medium
        rounded-full
        border ${config.borderColor}
        ${className}
      `}
      title={`Role: ${config.label}`}
    >
      {showIcon && <Icon className={sizeStyle.icon} />}
      <span>{config.label}</span>
    </span>
  );
}

