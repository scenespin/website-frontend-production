// Digital Film Strip Card Component
// For marketing pages with cinema aesthetic

import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  hover?: boolean;
  filmStrip?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MarketingCard({
  children,
  variant = 'default',
  hover = false,
  filmStrip = false,
  className,
  onClick,
}: CardProps) {
  const baseStyles = `
    relative rounded-2xl p-6 transition-all duration-300
    overflow-hidden
  `;
  
  const variants = {
    default: `
      bg-gradient-to-br from-[#1F1F1F] to-[#141414]
      border border-white/10
    `,
    elevated: `
      bg-gradient-to-br from-[#1F1F1F] to-[#141414]
      border border-white/10
      shadow-xl shadow-black/50
    `,
    bordered: `
      bg-[#141414] border-2 border-white/20
    `,
    gradient: `
      bg-gradient-to-br from-[#DC143C]/10 via-[#1F1F1F] to-[#00D9FF]/10
      border border-white/10
    `,
  };
  
  const hoverStyles = hover
    ? 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#DC143C]/20 cursor-pointer'
    : '';
  
  return (
    <div
      className={cn(baseStyles, variants[variant], hoverStyles, className)}
      onClick={onClick}
    >
      {/* Film strip border */}
      {filmStrip && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DC143C] to-transparent opacity-50" />
      )}
      
      {/* Shimmer effect on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 -translate-x-full hover:translate-x-full pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

