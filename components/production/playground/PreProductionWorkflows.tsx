'use client';

/**
 * Pre-Production Workflows
 * 
 * Displays all 47 pre-production workflows in a grid.
 * Workflows are wrapped (users see quality tiers, not model names).
 */

import React, { useState } from 'react';
import { Workflow, Loader2, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, setAuthTokenGetter } from '@/lib/api';

interface PreProductionWorkflowsProps {
  className?: string;
  screenplayId?: string;
}

// Pre-production workflow categories
const PRE_PRODUCTION_CATEGORIES = [
  'character-generation',
  'location-generation',
  'asset-generation',
  'first-frame-generation',
  'character-enhancement',
  'location-enhancement',
  'asset-enhancement',
];

export function PreProductionWorkflows({ className = '', screenplayId }: PreProductionWorkflowsProps) {
  const { workflows, isLoading } = useWorkflows();
  const { getToken } = useAuth();
  const router = useRouter();
  const [executingWorkflowId, setExecutingWorkflowId] = useState<string | null>(null);

  // Filter pre-production workflows
  const preProductionWorkflows = React.useMemo(() => {
    return workflows.filter(w => 
      PRE_PRODUCTION_CATEGORIES.includes(w.category) ||
      w.category === 'pre-production' ||
      w.tags?.includes('pre-production')
    );
  }, [workflows]);

  const handleWorkflowClick = async (workflow: any) => {
    if (!screenplayId || screenplayId === 'default') {
      toast.error('Please select a screenplay first');
      return;
    }

    // Navigate to workflow selector with this workflow pre-selected
    router.push(`/production/${screenplayId}?tab=workflows&workflowId=${workflow.id}`);
  };

  if (isLoading) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cinema-red mx-auto mb-2" />
          <p className="text-[#808080] text-sm">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full overflow-y-auto p-4 md:p-6", className)}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Workflow className="w-6 h-6 text-cinema-red" />
          <h2 className="text-xl font-semibold text-white">Pre-Production Workflows</h2>
        </div>
        <p className="text-sm text-[#808080]">
          {preProductionWorkflows.length} workflows available for pre-production tasks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {preProductionWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => handleWorkflowClick(workflow)}
            className="p-4 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg hover:border-cinema-red transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white group-hover:text-cinema-red transition-colors">
                {workflow.name}
              </h3>
              <ExternalLink className="w-4 h-4 text-[#808080] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-[#808080] mb-3 line-clamp-2">{workflow.description}</p>
            <div className="flex items-center justify-between text-xs text-[#808080]">
              <span>{workflow.cost?.min || 0}-{workflow.cost?.max || 0} {workflow.cost?.unit || 'credits'}</span>
              <span>{workflow.time?.min || 0}-{workflow.time?.max || 0} {workflow.time?.unit || 'min'}</span>
            </div>
          </div>
        ))}
      </div>

      {preProductionWorkflows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#808080]">No pre-production workflows found</p>
        </div>
      )}
    </div>
  );
}


