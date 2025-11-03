/**
 * Composition Preview - Visual representation of selected composition
 * Shows how the final video will look before rendering
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface CompositionPreviewProps {
  layout: string | null;
  animation: string | null;
  pacing: string | null;
  type: 'static' | 'animated' | 'paced' | 'music-video' | 'podcast' | 'social-media';
}

export function CompositionPreview({ layout, animation, pacing, type }: CompositionPreviewProps) {
  
  const renderLayoutPreview = () => {
    if (!layout && !animation && !pacing) {
      return (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
          <div className="text-center space-y-2">
            <Eye className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm">Select options to preview</p>
          </div>
        </div>
      );
    }

    // Simplified preview representation
    if (type === 'static' && layout) {
      if (layout.includes('phone-call-3way')) {
        return (
          <svg viewBox="0 0 1920 1080" className="w-full h-full">
            <rect x="0" y="0" width="1920" height="1080" fill="#f1f5f9" className="dark:fill-slate-900" />
            <rect x="50" y="50" width="580" height="980" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="670" y="50" width="580" height="980" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="1290" y="50" width="580" height="980" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
          </svg>
        );
      } else if (layout.includes('split')) {
        return (
          <svg viewBox="0 0 1920 1080" className="w-full h-full">
            <rect x="0" y="0" width="1920" height="1080" fill="#f1f5f9" className="dark:fill-slate-900" />
            <rect x="50" y="50" width="910" height="980" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="960" y="50" width="910" height="980" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
          </svg>
        );
      } else if (layout.includes('pip')) {
        return (
          <svg viewBox="0 0 1920 1080" className="w-full h-full">
            <rect x="0" y="0" width="1920" height="1080" fill="#f1f5f9" className="dark:fill-slate-900" />
            <rect x="50" y="50" width="1820" height="980" fill="#fbbf24" opacity="0.3" stroke="#f59e0b" strokeWidth="4" />
            <rect x="1300" y="700" width="570" height="330" fill="#fbbf24" opacity="0.6" stroke="#f59e0b" strokeWidth="6" />
          </svg>
        );
      } else if (layout.includes('grid')) {
        return (
          <svg viewBox="0 0 1920 1080" className="w-full h-full">
            <rect x="0" y="0" width="1920" height="1080" fill="#f1f5f9" className="dark:fill-slate-900" />
            <rect x="50" y="50" width="910" height="480" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="960" y="50" width="910" height="480" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="50" y="550" width="910" height="480" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="960" y="550" width="910" height="480" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
          </svg>
        );
      }
    }

    // Default preview
    return (
      <svg viewBox="0 0 1920 1080" className="w-full h-full">
        <rect x="0" y="0" width="1920" height="1080" fill="#f1f5f9" className="dark:fill-slate-900" />
        <rect x="50" y="50" width="1820" height="980" fill="#fbbf24" opacity="0.4" stroke="#f59e0b" strokeWidth="4" />
        <text x="960" y="540" textAnchor="middle" fill="#64748b" className="dark:fill-slate-400" fontSize="48" fontFamily="system-ui">
          {type === 'animated' ? '⚡ Animated' : 
           type === 'paced' ? '⏱ Paced' : 
           type === 'music-video' ? '🎵 Beat-Synced' :
           type === 'podcast' ? '🎙️ Interview' :
           type === 'social-media' ? '📱 Vertical' : 
           'Preview'}
        </text>
      </svg>
    );
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 bg-yellow-400 rounded">
            <Eye className="w-4 h-4 text-black" />
          </div>
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 aspect-video">
          {renderLayoutPreview()}
        </div>
        {(layout || animation || pacing) && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {type === 'static' && layout && '16:9 Cinematic Layout'}
              {type === 'animated' && animation && 'Animated Composition'}
              {type === 'paced' && pacing && 'Emotional Pacing Applied'}
              {type === 'music-video' && 'Beat-Synced Music Video'}
              {type === 'podcast' && 'Side-by-Side Interview Layout'}
              {type === 'social-media' && 'Vertical Format for Social'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

