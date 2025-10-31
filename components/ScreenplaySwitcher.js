/**
 * ScreenplaySwitcher.js
 * 
 * Dropdown component for switching between screenplay projects
 * Shows current project and allows quick switching
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Film, Plus, Check, Folder } from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useRouter } from 'next/navigation';

export default function ScreenplaySwitcher() {
  const { currentProject, projects, switchProject, isLoading } = useScreenplay();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleProjectSwitch = async (projectId) => {
    setIsOpen(false);
    await switchProject(projectId);
    
    // Update URL if we're in the editor
    if (window.location.pathname.includes('/editor')) {
      router.push(`/editor?project=${projectId}`);
    }
  };

  const handleNewProject = () => {
    setIsOpen(false);
    router.push('/dashboard/new-project');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-lg">
        <span className="loading loading-spinner loading-sm"></span>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Project Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-base-200 hover:bg-base-300 rounded-lg transition-colors min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Film className="w-4 h-4 flex-shrink-0 text-cinema-blue" />
          <span className="text-sm font-medium truncate">
            {currentProject ? currentProject.project_name : 'Select Project'}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[300px] bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 max-h-[400px] overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-base-300">
            <h3 className="font-semibold text-sm">Your Screenplays</h3>
            <p className="text-xs text-base-content/60 mt-1">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>

          {/* Projects List */}
          <div className="py-2">
            {projects.length === 0 ? (
              <div className="px-4 py-8 text-center text-base-content/60">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No projects yet</p>
                <p className="text-xs mt-1">Create your first screenplay</p>
              </div>
            ) : (
              projects.map((project) => {
                const isActive = currentProject?.project_id === project.project_id;
                
                return (
                  <button
                    key={project.project_id}
                    onClick={() => handleProjectSwitch(project.project_id)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-base-200 transition-colors ${
                      isActive ? 'bg-cinema-blue/10' : ''
                    }`}
                  >
                    {/* Icon/Check */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isActive ? (
                        <Check className="w-4 h-4 text-cinema-blue" />
                      ) : (
                        <Folder className="w-4 h-4 text-base-content/60" />
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-cinema-blue' : ''
                        }`}>
                          {project.project_name}
                        </p>
                      </div>
                      
                      {/* Storage Provider Badge */}
                      {project.storage_provider && project.storage_provider !== 'local' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge badge-xs badge-outline">
                            {project.storage_provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}
                          </span>
                        </div>
                      )}
                      
                      {/* Description */}
                      {project.description && (
                        <p className="text-xs text-base-content/60 mt-1 truncate">
                          {project.description}
                        </p>
                      )}
                      
                      {/* Last Updated */}
                      {project.updated_at && (
                        <p className="text-xs text-base-content/50 mt-1">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* New Project Button */}
          <div className="p-2 border-t border-base-300">
            <button
              onClick={handleNewProject}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-200 transition-colors text-cinema-blue"
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

