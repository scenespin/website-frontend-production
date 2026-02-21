'use client';

import { useAuth } from '@clerk/nextjs';
import { createScreenplay, updateScreenplay } from '@/utils/screenplayStorage';

interface CreateScreenplayInput {
  projectName: string;
  description: string;
  genre: string;
}

export interface CreatedProjectPayload {
  id: string;
  screenplay_id: string;
  project_id: string;
  project_name: string;
  name: string;
  title: string;
  description?: string;
  metadata?: { genre: string };
  created_at: string;
  updated_at: string;
  status: string;
}

export function useCreateScreenplayFlow() {
  const { getToken } = useAuth();

  const createProject = async (input: CreateScreenplayInput): Promise<CreatedProjectPayload> => {
    const trimmedTitle = input.projectName.trim();
    if (!trimmedTitle) {
      throw new Error('Please enter a project name');
    }

    const screenplay = await createScreenplay(
      {
        title: trimmedTitle,
        author: 'Anonymous',
        content: '',
      },
      getToken
    );

    if (!screenplay?.screenplay_id) {
      throw new Error('Failed to create screenplay - missing screenplay ID in response');
    }

    const trimmedDescription = input.description.trim();
    const trimmedGenre = input.genre.trim();

    if (trimmedDescription || trimmedGenre) {
      try {
        await updateScreenplay(
          {
            screenplay_id: screenplay.screenplay_id,
            description: trimmedDescription || undefined,
            metadata: trimmedGenre ? { genre: trimmedGenre } : undefined,
          },
          getToken
        );
      } catch (updateError) {
        console.warn(
          '[useCreateScreenplayFlow] Metadata update failed (non-critical):',
          updateError
        );
      }
    }

    return {
      id: screenplay.screenplay_id,
      screenplay_id: screenplay.screenplay_id,
      project_id: screenplay.screenplay_id,
      project_name: screenplay.title,
      name: screenplay.title,
      title: screenplay.title,
      description: trimmedDescription || undefined,
      metadata: trimmedGenre ? { genre: trimmedGenre } : undefined,
      created_at: screenplay.created_at,
      updated_at: screenplay.updated_at,
      status: screenplay.status || 'active',
    };
  };

  return { createProject };
}
