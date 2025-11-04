"use client"

/**
 * Mobile-Optimized Slider
 * 
 * Larger touch targets, better feedback, haptic support
 */

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const MobileSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    onValueChange?: (value: number[]) => void;
    enableHaptic?: boolean;
  }
>(({ className, onValueChange, enableHaptic = true, ...props }, ref) => {
  const handleValueChange = (value: number[]) => {
    // Haptic feedback on mobile (if supported)
    if (enableHaptic && typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(1); // Ultra-short vibration (1ms)
    }
    
    onValueChange?.(value);
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "py-4", // Extra padding for easier thumb grabbing
        className
      )}
      onValueChange={handleValueChange}
      {...props}
    >
      {/* Track - Taller for easier touch */}
      <SliderPrimitive.Track className="relative h-3 md:h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      
      {/* Thumb - Much larger for mobile */}
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-8 w-8 md:h-5 md:w-5", // Larger on mobile
          "rounded-full border-3 md:border-2 border-primary bg-background",
          "shadow-lg", // More visible
          "ring-offset-background transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2",
          "active:scale-110", // Feedback on press
          "disabled:pointer-events-none disabled:opacity-50",
          "touch-manipulation" // Optimize for touch
        )} 
      />
    </SliderPrimitive.Root>
  );
});

MobileSlider.displayName = "MobileSlider"

export { MobileSlider }

