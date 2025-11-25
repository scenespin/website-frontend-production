'use client';

import React from 'react';
import { Crown, PenTool, Package, Upload, Eye } from 'lucide-react';

export type ScreenplayRole = 'director' | 'writer' | 'asset-manager' | 'contributor' | 'viewer';

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
    color: 'bg-purple-500',
    textColor: 'text-purple-100',
    borderColor: 'border-purple-400'
  },
  writer: {
    label: 'Writer',
    icon: PenTool,
    color: 'bg-blue-500',
    textColor: 'text-blue-100',
    borderColor: 'border-blue-400'
  },
  'asset-manager': {
    label: 'Asset Manager',
    icon: Package,
    color: 'bg-green-500',
    textColor: 'text-green-100',
    borderColor: 'border-green-400'
  },
  contributor: {
    label: 'Contributor',
    icon: Upload,
    color: 'bg-orange-500',
    textColor: 'text-orange-100',
    borderColor: 'border-orange-400'
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    color: 'bg-gray-500',
    textColor: 'text-gray-100',
    borderColor: 'border-gray-400'
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

