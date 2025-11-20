'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Film, Check, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { listScreenplays } from '@/utils/screenplayStorage';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { cn } from '@/lib/utils';

export default function ScreenplaySwitcher() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const screenplay = useScreenplay();
  const [isOpen, setIsOpen] = useState(false);
  const [screenplays, setScreenplays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current screenplay ID from URL params (most reliable) or context
  const currentScreenplayId = searchParams?.get('project') || screenplay?.screenplayId;

  useEffect(() => {
    fetchScreenplays();
  }, []);

  // Refresh screenplays when dropdown opens to ensure we have latest data
  useEffect(() => {
    if (isOpen) {
      fetchScreenplays();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchScreenplays = async () => {
    try {
      setIsLoading(true);
      // Fetch all active screenplays (same as dashboard)
      const screenplaysList = await listScreenplays(getToken, 'active', 100);
      console.log('[ScreenplaySwitcher] Fetched screenplays:', screenplaysList?.length, screenplaysList);
      
      // Filter out any deleted screenplays just to be safe
      const activeScreenplays = (screenplaysList || []).filter(sp => 
        !sp.status || sp.status === 'active'
      );
      
      console.log('[ScreenplaySwitcher] Active screenplays after filtering:', activeScreenplays.length);
      setScreenplays(activeScreenplays);
    } catch (error) {
      console.error('[ScreenplaySwitcher] Failed to fetch screenplays:', error);
      setScreenplays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = (screenplayId: string) => {
    console.log('[ScreenplaySwitcher] Switching to screenplay:', screenplayId);
    setIsOpen(false);
    // Navigate to the screenplay editor - use window.location for full reload to ensure context updates
    window.location.href = `/write?project=${screenplayId}`;
  };

  const handleNewProject = () => {
    setIsOpen(false);
    router.push('/dashboard');
  };

  // Match by screenplay_id, with fallback to id
  // Use URL param as primary source of truth
  const urlProjectId = searchParams?.get('project');
  const currentScreenplay = screenplays.find(s => {
    const screenplayId = s.screenplay_id || (s as any).id;
    return screenplayId === urlProjectId || screenplayId === currentScreenplayId;
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-lg">
        <span className="loading loading-spinner loading-xs"></span>
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 bg-base-200 hover:bg-base-300 rounded-lg transition-colors",
          "text-sm font-medium min-w-[180px] justify-between"
        )}
        title="Switch screenplay"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Film className="w-4 h-4 flex-shrink-0 text-cinema-red" />
          <span className="truncate">
            {currentScreenplay?.title || 'Select Screenplay'}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-transform",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[280px] bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 max-h-[400px] overflow-y-auto">
          <div className="p-3 border-b border-base-300">
            <h3 className="font-semibold text-sm">Your Screenplays</h3>
            <p className="text-xs text-base-content/60 mt-1">
              {screenplays.length} {screenplays.length === 1 ? 'screenplay' : 'screenplays'}
            </p>
          </div>

          <div className="py-2">
            {screenplays.length === 0 ? (
              <div className="px-4 py-8 text-center text-base-content/60">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No screenplays yet</p>
                <p className="text-xs mt-1">Create your first screenplay</p>
              </div>
            ) : (
              screenplays.map((sp) => {
                const screenplayId = sp.screenplay_id || (sp as any).id;
                // Only mark as active if it matches the URL param (most reliable)
                const urlProjectId = searchParams?.get('project');
                const isActive = screenplayId === urlProjectId || 
                                 (urlProjectId === null && screenplayId === currentScreenplayId);
                
                return (
                  <button
                    key={screenplayId}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSwitch(screenplayId);
                    }}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 hover:bg-base-200 transition-colors text-left",
                      isActive && "bg-cinema-red/10"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isActive ? (
                        <Check className="w-4 h-4 text-cinema-red" />
                      ) : (
                        <Film className="w-4 h-4 text-base-content/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive && "text-cinema-red"
                      )}>
                        {sp.title || (sp as any).name || 'Untitled Screenplay'}
                      </p>
                      {sp.description && (
                        <p className="text-xs text-base-content/60 mt-1 truncate">
                          {sp.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-base-300">
            <button
              onClick={handleNewProject}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-200 transition-colors text-cinema-red"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Screenplay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

