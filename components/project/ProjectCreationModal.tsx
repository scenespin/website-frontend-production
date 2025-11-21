'use client';

import { useState } from 'react';
import { X, Film, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { createScreenplay, updateScreenplay } from '@/utils/screenplayStorage';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: any) => void;
}

export function ProjectCreationModal({ isOpen, onClose, onSuccess }: ProjectCreationModalProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { getToken } = useAuth();

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsCreating(true);

    try {
      // Feature 0130 Phase 0: Create screenplay instead of project
      // This ensures new "projects" get screenplay_ IDs from the start
      console.log('[ProjectCreationModal] Creating screenplay via /api/screenplays...');
      
      // Feature 0130 Phase 0: Create screenplay instead of project
      // This ensures new "projects" get screenplay_ IDs from the start
      console.log('[ProjectCreationModal] Creating screenplay via /api/screenplays...');
      
      const screenplay = await createScreenplay({
        title: projectName.trim(),
        author: 'Anonymous', // Default author (user can change later)
        content: '', // Start with empty content
      }, getToken);
      
      console.log('[ProjectCreationModal] Screenplay created:', screenplay);
      
      // If description or genre were provided, update the screenplay with metadata
      if (description.trim() || genre) {
        try {
          await updateScreenplay({
            screenplay_id: screenplay.screenplay_id,
            description: description.trim() || undefined,
            metadata: genre ? { genre } : undefined,
          }, getToken);
          console.log('[ProjectCreationModal] Updated screenplay with description/genre');
        } catch (updateError) {
          console.warn('[ProjectCreationModal] Failed to update description/genre (non-critical):', updateError);
          // Don't fail the whole flow - screenplay was created successfully
        }
      }
      
      // Transform screenplay response to match expected project format for onSuccess callback
      // This maintains compatibility with dashboard's handleProjectCreated function
      const transformedProject = {
        id: screenplay.screenplay_id,
        screenplay_id: screenplay.screenplay_id,
        project_id: screenplay.screenplay_id, // For backward compatibility during transition
        project_name: screenplay.title,
        name: screenplay.title,
        title: screenplay.title,
        description: description.trim() || undefined,
        metadata: genre ? { genre } : undefined,
        created_at: screenplay.created_at,
        updated_at: screenplay.updated_at,
        status: screenplay.status || 'active'
      };
      
      toast.success(`Screenplay "${projectName}" created!`);
      onSuccess(transformedProject);
      handleClose();
    } catch (error: any) {
      console.error('[ProjectCreationModal] Failed to create screenplay:', error);
      toast.error(error.message || 'Failed to create screenplay. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setDescription('');
    setGenre('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DC143C]/10 rounded-lg">
              <Film className="w-6 h-6 text-[#DC143C]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create New Screenplay</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Screenplay Title <span className="text-[#DC143C]">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Amazing Screenplay"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your screenplay..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Genre (Optional)
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              disabled={isCreating}
            >
              <option value="">Select a genre...</option>
              <option value="action">Action</option>
              <option value="comedy">Comedy</option>
              <option value="drama">Drama</option>
              <option value="horror">Horror</option>
              <option value="sci-fi">Sci-Fi</option>
              <option value="thriller">Thriller</option>
              <option value="romance">Romance</option>
              <option value="fantasy">Fantasy</option>
              <option value="mystery">Mystery</option>
              <option value="documentary">Documentary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !projectName.trim()}
            className="px-5 py-2.5 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Create Screenplay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

