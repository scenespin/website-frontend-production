/**
 * Action Button Component
 * Hollywood-inspired CTA button with film slate aesthetics
 */

import React from 'react';
import { LucideIcon, Film } from 'lucide-react';

interface ActionButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  href?: string;
  showFilmIcon?: boolean;
}

export function ActionButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  href,
  showFilmIcon = false
}: ActionButtonProps) {
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 shadow-lg hover:shadow-xl hover:scale-105',
    secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-base-content border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg',
    ghost: 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-base-content border-2 border-white/30 hover:border-white/50'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  const DisplayIcon = Icon || (showFilmIcon ? Film : null);
  
  const content = (
    <>
      {DisplayIcon && <DisplayIcon className={size === 'sm' ? 'w-4 h-4' : size === 'xl' ? 'w-7 h-7' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />}
      <span>{children}</span>
    </>
  );
  
  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {content}
    </button>
  );
}

export default ActionButton;

