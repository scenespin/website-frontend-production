/**
 * ReferencePreview Component
 * 
 * Displays a visual preview of reference images that will be used for shot generation.
 * Shows small icons connected by arrows in a clean, compact layout.
 * 
 * EASY TO REMOVE: Simply delete this file and remove the import/usage in ShotConfigurationStep.tsx
 */

'use client';

import React from 'react';
import { User, MapPin, Package, Image as ImageIcon } from 'lucide-react';

interface ReferenceItem {
  type: 'character' | 'location' | 'prop' | 'asset' | 'other';
  imageUrl?: string;
  label: string;
  id: string;
}

interface ReferencePreviewProps {
  references: ReferenceItem[];
  className?: string;
}

export function ReferencePreview({ references, className = '' }: ReferencePreviewProps) {
  if (!references || references.length === 0) {
    return null;
  }

  const getIcon = (type: ReferenceItem['type']) => {
    switch (type) {
      case 'character':
        return <User className="w-3 h-3 text-blue-400" />;
      case 'location':
        return <MapPin className="w-3 h-3 text-green-400" />;
      case 'prop':
        return <Package className="w-3 h-3 text-orange-400" />;
      case 'asset':
        return <Package className="w-3 h-3 text-purple-400" />;
      default:
        return <ImageIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className={`flex items-center gap-1.5 py-2 px-3 bg-[#0A0A0A] rounded border border-[#3F3F46] ${className}`}>
      <span className="text-[10px] text-[#808080] mr-1">References:</span>
      <div className="flex items-center gap-1">
        {references.map((ref, index) => (
          <React.Fragment key={ref.id}>
            <div className="flex items-center gap-1 group relative">
              {ref.imageUrl ? (
                <img
                  src={ref.imageUrl}
                  alt={ref.label}
                  className="w-4 h-4 rounded object-cover border border-[#3F3F46] hover:border-[#DC143C] transition-colors"
                  title={ref.label}
                />
              ) : (
                <div className="w-4 h-4 rounded bg-[#1A1A1A] border border-[#3F3F46] flex items-center justify-center">
                  {getIcon(ref.type)}
                </div>
              )}
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#1A1A1A] text-[10px] text-[#FFFFFF] rounded border border-[#3F3F46] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                {ref.label}
              </div>
            </div>
            {/* Arrow connector (not shown after last item) */}
            {index < references.length - 1 && (
              <ArrowRight className="w-2.5 h-2.5 text-[#808080] mx-0.5" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Arrow icon component (simple SVG)
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 2L7 5L3 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

