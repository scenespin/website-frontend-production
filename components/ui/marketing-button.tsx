// Digital Film Strip Button Component
// For marketing pages with cinema aesthetic

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function MarketingButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-semibold rounded-lg transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]
    disabled:opacity-50 disabled:cursor-not-allowed
    overflow-hidden group
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-br from-[#DC143C] to-[#8B0000]
      text-white shadow-lg shadow-[#DC143C]/40
      hover:shadow-xl hover:shadow-[#DC143C]/60
      hover:-translate-y-0.5
      focus:ring-[#DC143C]
    `,
    secondary: `
      bg-gradient-to-br from-[#00D9FF] to-[#0099CC]
      text-white shadow-lg shadow-[#00D9FF]/40
      hover:shadow-xl hover:shadow-[#00D9FF]/60
      hover:-translate-y-0.5
      focus:ring-[#00D9FF]
    `,
    outline: `
      border-2 border-white/20 bg-transparent
      text-white hover:bg-white/5
      hover:border-white/40
      focus:ring-white/20
    `,
    ghost: `
      bg-transparent text-white
      hover:bg-white/5
      focus:ring-white/20
    `,
    gold: `
      bg-gradient-to-br from-[#FFD700] to-[#FFA500]
      text-black shadow-lg shadow-[#FFD700]/40
      hover:shadow-xl hover:shadow-[#FFD700]/60
      hover:-translate-y-0.5
      focus:ring-[#FFD700]
      font-bold
    `,
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
    xl: 'px-8 py-4 text-xl gap-3',
  };
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer effect on hover */}
      <span className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </span>
      
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!isLoading && icon && iconPosition === 'left' && icon}
      {children}
      {!isLoading && icon && iconPosition === 'right' && icon}
    </button>
  );
}

