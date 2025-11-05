'use client';

/**
 * /editor Page
 * Opens directly to editor with project creation modal if no project selected
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues
const EditorComponent = dynamic(() => import('@/components/EditorComponent'), { ssr: false });

export default function EditorPage() {
  const { user, isLoaded } = useUser();
  const { currentProject, switchProject } = useScreenplay();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        // Not logged in - redirect to sign in
        router.replace('/sign-in?redirect_url=/editor');
      } else if (projectId) {
        // Has project ID in URL - switch to that project
        switchProject(projectId).then(() => setIsReady(true));
      } else if (!currentProject) {
        // No project selected - show creation modal
        setShowCreateModal(true);
        setIsReady(true);
      } else {
        // Has current project - ready to edit
        setIsReady(true);
      }
    }
  }, [isLoaded, user, projectId, currentProject, router, switchProject]);

  const handleProjectCreated = (project) => {
    setShowCreateModal(false);
    // Switch to the new project and update URL
    switchProject(project.project_id);
    router.push(`/editor?project=${project.project_id}`);
  };

  if (!isLoaded || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A]">
        {currentProject ? (
          <EditorComponent projectId={currentProject.project_id} />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400">Select or create a project to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // If they close without creating, go to dashboard
          if (!currentProject) {
            router.push('/dashboard');
          }
        }}
        onSuccess={handleProjectCreated}
      />
    </>
  );
}
