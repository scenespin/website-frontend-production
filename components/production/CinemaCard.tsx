'use client';

/**
 * CinemaCard - Reusable video game-style card component
 * 
 * Used for Character, Location, and Asset cards in Production Hub
 * Features:
 * - Main image hero (aspect-video)
 * - Reference images sidebar
 * - Cinema theme styling
 * - Hover effects (scale, glow, border)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { User, MapPin, Box, Image as ImageIcon } from 'lucide-react';

export interface CinemaCardImage {
  id: string;
  imageUrl: string;
  label?: string;
}

export interface CinemaCardProps {
  // Core data
  id: string;
  name: string;
  type: string; // 'lead' | 'supporting' | 'minor' | 'interior' | 'exterior' | 'prop' | etc.
  typeLabel?: string; // Display label for type
  
  // Images
  mainImage?: CinemaCardImage | null;
  referenceImages?: CinemaCardImage[];
  referenceCount?: number;
  
  // Metadata
  metadata?: string | React.ReactNode; // e.g., "5 refs", scene count, etc.
  description?: string;
  
  // Visual customization
  cardType?: 'character' | 'location' | 'asset';
  icon?: React.ReactNode; // Custom icon if no main image
  
  // Interaction
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  
  // Badge customization
  typeBadgeColor?: 'red' | 'blue' | 'gold' | 'gray';
}

export function CinemaCard({
  id,
  name,
  type,
  typeLabel,
  mainImage,
  referenceImages = [],
  referenceCount = 0,
  metadata,
  description,
  cardType = 'character',
  icon,
  onClick,
  isSelected = false,
  className,
  typeBadgeColor
}: CinemaCardProps) {
  
  // Determine badge color based on type or prop
  const getBadgeColor = () => {
    if (typeBadgeColor) {
      const colors = {
        red: 'bg-[#DC143C]/20 text-[#DC143C]',
        blue: 'bg-[#1F1F1F] text-[#808080] border border-[#3F3F46]',
        gold: 'bg-[#FFD700]/20 text-[#FFD700]',
        gray: 'bg-[#808080]/20 text-[#808080]'
      };
      return colors[typeBadgeColor];
    }
    
    // Auto-detect based on type
    if (cardType === 'character') {
      if (type === 'lead') return 'bg-[#DC143C]/20 text-[#DC143C]';
      if (type === 'supporting') return 'bg-[#1F1F1F] text-[#808080] border border-[#3F3F46]';
      return 'bg-[#808080]/20 text-[#808080]';
    }
    
    if (cardType === 'location') {
      if (type === 'interior') return 'bg-[#DC143C]/20 text-[#DC143C]';
      if (type === 'exterior') return 'bg-[#1F1F1F] text-[#808080] border border-[#3F3F46]';
      return 'bg-[#808080]/20 text-[#808080]';
    }
    
    // Asset default
    return 'bg-[#808080]/20 text-[#808080]';
  };
  
  // Get default icon based on card type
  const getDefaultIcon = () => {
    if (icon) return icon;
    
    switch (cardType) {
      case 'character':
        return <User className="w-16 h-16 text-[#808080]" />;
      case 'location':
        return <MapPin className="w-16 h-16 text-[#808080]" />;
      case 'asset':
        return <Box className="w-16 h-16 text-[#808080]" />;
      default:
        return <ImageIcon className="w-16 h-16 text-[#808080]" />;
    }
  };
  
  // Display reference count or custom metadata
  const displayMetadata = metadata || (referenceCount > 0 ? `${referenceCount} ${referenceCount === 1 ? 'ref' : 'refs'}` : null);
  
  // Show up to 3 reference images in sidebar
  const visibleReferences = referenceImages.slice(0, 3);
  const remainingCount = referenceImages.length > 3 ? referenceImages.length - 3 : 0;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#141414] border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer group',
        isSelected
          ? 'border-[#DC143C] bg-[#DC143C]/10 shadow-lg shadow-[#DC143C]/20'
          : 'border-[#3F3F46] hover:border-[#DC143C]/50 hover:shadow-lg hover:shadow-[#DC143C]/20 hover:scale-[1.02]',
        className
      )}
    >
      {/* Main Image Hero - Smaller aspect ratio */}
      <div className="relative aspect-[4/3] bg-[#1F1F1F] overflow-hidden">
        {mainImage?.imageUrl ? (
          <img
            src={mainImage.imageUrl}
            alt={mainImage.label || name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="scale-75">
              {getDefaultIcon()}
            </div>
          </div>
        )}
        
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Card Content - More compact */}
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Name and Type */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs text-[#FFFFFF] truncate mb-1">
              {name}
            </h3>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full inline-block',
              getBadgeColor()
            )}>
              {typeLabel || type}
            </span>
          </div>
          
          {/* Reference Images Sidebar - Smaller */}
          {visibleReferences.length > 0 && (
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              {visibleReferences.map(ref => (
                <img
                  key={ref.id}
                  src={ref.imageUrl}
                  alt={ref.label || 'Reference'}
                  className="w-6 h-6 rounded object-cover border border-[#3F3F46] group-hover:border-[#DC143C]/50 transition-colors"
                />
              ))}
              {remainingCount > 0 && (
                <div className="w-6 h-6 rounded bg-[#1F1F1F] border border-[#3F3F46] flex items-center justify-center text-[10px] text-[#808080] group-hover:border-[#DC143C]/50 transition-colors">
                  +{remainingCount}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Description (if provided) */}
        {description && (
          <p className="text-xs text-[#808080] line-clamp-1 mb-2">
            {description}
          </p>
        )}
        
        {/* Metadata */}
        {displayMetadata && (
          <div className="text-xs text-[#808080]">
            {displayMetadata}
          </div>
        )}
      </div>
    </div>
  );
}

