'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
import type { CreatedProjectPayload } from '@/hooks/useCreateScreenplayFlow';

type OnProjectCreatedHandler = (
  _project: CreatedProjectPayload
) => void | boolean | Promise<void | boolean>;

interface OpenProjectCreationModalOptions {
  onSuccess?: OnProjectCreatedHandler;
}

interface ProjectCreationModalContextValue {
  openProjectCreationModal: (_options?: OpenProjectCreationModalOptions) => void;
  closeProjectCreationModal: () => void;
}

const ProjectCreationModalContext = createContext<ProjectCreationModalContextValue | null>(null);

export function ProjectCreationModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const successHandlerRef = useRef<OnProjectCreatedHandler | null>(null);

  const closeProjectCreationModal = useCallback(() => {
    setIsOpen(false);
    successHandlerRef.current = null;
  }, []);

  const openProjectCreationModal = useCallback((options?: OpenProjectCreationModalOptions) => {
    successHandlerRef.current = options?.onSuccess || null;
    setIsOpen(true);
  }, []);

  const handleSuccess = useCallback(
    async (project: CreatedProjectPayload) => {
      const externalHandler = successHandlerRef.current;

      if (externalHandler) {
        const result = await externalHandler(project);
        if (result === false) {
          return;
        }
        closeProjectCreationModal();
        return;
      }

      const screenplayId = project.screenplay_id || project.id;
      if (screenplayId && screenplayId.startsWith('screenplay_')) {
        closeProjectCreationModal();
        router.push(`/write?project=${screenplayId}`);
        return;
      }

      toast.error('Failed to open screenplay. Please try again.');
    },
    [closeProjectCreationModal, router]
  );

  return (
    <ProjectCreationModalContext.Provider
      value={{
        openProjectCreationModal,
        closeProjectCreationModal,
      }}
    >
      {children}
      <ProjectCreationModal
        isOpen={isOpen}
        onClose={closeProjectCreationModal}
        onSuccess={handleSuccess}
      />
    </ProjectCreationModalContext.Provider>
  );
}

export function useProjectCreationModal() {
  const context = useContext(ProjectCreationModalContext);
  if (!context) {
    throw new Error('useProjectCreationModal must be used within ProjectCreationModalProvider');
  }
  return context;
}
