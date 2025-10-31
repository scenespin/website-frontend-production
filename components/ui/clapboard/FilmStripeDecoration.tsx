/**
 * Film Stripe Decoration Component
 * Reusable film strip decoration element
 */

import React from 'react';

interface FilmStripeDecorationProps {
  orientation?: 'horizontal' | 'vertical';
  stripeCount?: number;
  height?: string;
  width?: string;
  className?: string;
}

export function FilmStripeDecoration({
  orientation = 'horizontal',
  stripeCount = 8,
  height = 'h-10',
  width = 'w-full',
  className = ''
}: FilmStripeDecorationProps) {
  
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${isHorizontal ? height : width} shadow-inner ${className}`}>
      {[...Array(stripeCount)].map((_, i) => (
        <div 
          key={i}
          className={`flex-1 ${i % 2 === 0 ? 'bg-slate-900 dark:bg-white' : 'bg-white dark:bg-slate-900'}`}
        />
      ))}
    </div>
  );
}

export default FilmStripeDecoration;

