'use client';

/**
 * Examples Section Component
 * 
 * Displays example prompts/images that users can click to load into the form
 */

import React from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Example {
  id: string;
  prompt: string;
  model?: string;
  aspectRatio?: string;
  imageUrl?: string;
  description?: string;
}

interface ExamplesSectionProps {
  type: 'image' | 'video';
  onSelectExample: (example: Example) => void;
  className?: string;
}

// Example prompts for image generation
const IMAGE_EXAMPLES: Example[] = [
  {
    id: '1',
    prompt: 'A cinematic shot of a futuristic cityscape at sunset, neon lights reflecting on wet streets, cyberpunk aesthetic, dramatic lighting, 4K quality',
    description: 'Futuristic cityscape',
    aspectRatio: '16:9'
  },
  {
    id: '2',
    prompt: 'A close-up portrait of a mysterious character in a vintage detective film noir style, dramatic shadows, black and white with selective color, moody atmosphere',
    description: 'Film noir portrait',
    aspectRatio: '1:1'
  },
  {
    id: '3',
    prompt: 'A serene mountain landscape at dawn, misty valleys, golden hour lighting, cinematic wide shot, nature photography style',
    description: 'Mountain landscape',
    aspectRatio: '16:9'
  },
  {
    id: '4',
    prompt: 'A detailed character design of a steampunk inventor with brass goggles, Victorian-era clothing, intricate mechanical details, studio lighting',
    description: 'Steampunk character',
    aspectRatio: '1:1'
  },
  {
    id: '5',
    prompt: 'An interior scene of a cozy coffee shop, warm lighting, people working on laptops, bokeh background, lifestyle photography',
    description: 'Coffee shop interior',
    aspectRatio: '4:3'
  },
  {
    id: '6',
    prompt: 'A dramatic action scene of a hero standing on a rooftop overlooking a city, dynamic pose, cinematic composition, epic lighting',
    description: 'Action hero scene',
    aspectRatio: '16:9'
  }
];

// Example prompts for video generation
const VIDEO_EXAMPLES: Example[] = [
  {
    id: '1',
    prompt: 'A slow dolly forward through a mysterious forest, fog rolling between trees, cinematic camera movement, dramatic lighting',
    description: 'Forest dolly shot',
    aspectRatio: '16:9'
  },
  {
    id: '2',
    prompt: 'A character walking through a futuristic city, camera tracking alongside, neon signs blurring in background, cyberpunk aesthetic',
    description: 'City tracking shot',
    aspectRatio: '16:9'
  },
  {
    id: '3',
    prompt: 'A serene landscape time-lapse, clouds moving across mountains, golden hour transition, cinematic wide shot',
    description: 'Landscape time-lapse',
    aspectRatio: '16:9'
  }
];

export function ExamplesSection({ type, onSelectExample, className = '' }: ExamplesSectionProps) {
  const examples = type === 'image' ? IMAGE_EXAMPLES : VIDEO_EXAMPLES;

  return (
    <div className={cn("border-b border-white/10 bg-[#141414] p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-cinema-red" />
        <h3 className="text-sm font-medium text-white">Examples</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {examples.map((example) => (
          <button
            key={example.id}
            onClick={() => onSelectExample(example)}
            className={cn(
              "text-left p-3 rounded-lg border border-white/10 bg-[#1F1F1F]",
              "hover:border-cinema-red/50 hover:bg-[#2A2A2A] transition-colors",
              "group"
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-cinema-red/60 group-hover:text-cinema-red flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {example.description && (
                  <p className="text-xs font-medium text-white mb-1 truncate">
                    {example.description}
                  </p>
                )}
                <p className="text-xs text-[#808080] line-clamp-2 group-hover:text-[#A0A0A0]">
                  {example.prompt}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

