/**
 * useWorkflows Hook
 * 
 * Dynamically fetches all 58 workflows from the backend API.
 * Provides category-based organization and filtering.
 * 
 * Backend Source: /api/workflows/list
 * Backend Registry: website-backend-api/src/config/workflows/
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  cost: { min: number; max: number; unit: string };
  time: { min: number; max: number; unit: string };
  quality: number;
  featured?: boolean;
  popularityScore?: number;
  bestFor: string[];
  examples: string[];
  tags?: string[];
  outputs?: string[];
  requiresVideoUpload?: boolean;
  videoUploadInstructions?: {
    title: string;
    subtitle: string;
  };
}

export interface UseWorkflowsResult {
  workflows: WorkflowDefinition[];
  workflowsByCategory: Record<string, WorkflowDefinition[]>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch all workflows from the backend
 */
export function useWorkflows(): UseWorkflowsResult {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.workflows.list();
      const workflowsData = response.data.workflows || [];

      setWorkflows(workflowsData);
      console.log(`[useWorkflows] ✅ Loaded ${workflowsData.length} workflows from backend`);
    } catch (err: any) {
      console.error('[useWorkflows] Failed to fetch workflows:', err);
      setError(err);
      toast.error('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Organize workflows by category
  const workflowsByCategory = workflows.reduce((acc, workflow) => {
    const category = workflow.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(workflow);
    return acc;
  }, {} as Record<string, WorkflowDefinition[]>);

  return {
    workflows,
    workflowsByCategory,
    isLoading,
    error,
    refetch: fetchWorkflows,
  };
}

/**
 * Get featured workflows
 */
export function getFeaturedWorkflows(workflows: WorkflowDefinition[]): WorkflowDefinition[] {
  return workflows
    .filter((w) => w.featured)
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
}

/**
 * Search workflows by query
 */
export function searchWorkflows(workflows: WorkflowDefinition[], query: string): WorkflowDefinition[] {
  const lowerQuery = query.toLowerCase();
  return workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(lowerQuery) ||
      w.description.toLowerCase().includes(lowerQuery) ||
      w.bestFor.some((b) => b.toLowerCase().includes(lowerQuery)) ||
      w.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

