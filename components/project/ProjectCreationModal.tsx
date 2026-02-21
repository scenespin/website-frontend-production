'use client';

import { useState } from 'react';
import { X, Film, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateScreenplayFlow, type CreatedProjectPayload } from '@/hooks/useCreateScreenplayFlow';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (_project: CreatedProjectPayload) => void | boolean | Promise<void | boolean>;
}

export function ProjectCreationModal({ isOpen, onClose, onSuccess }: ProjectCreationModalProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createProject } = useCreateScreenplayFlow();

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const createdProject = await createProject({
        projectName,
        description,
        genre,
      });

      toast.success(`Screenplay "${createdProject.title}" created!`);
      await onSuccess(createdProject);
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#3F3F46] bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1F1F1F] border border-[#3F3F46]">
              <Film className="w-6 h-6 text-[#DC143C]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#FFFFFF]">Create New Project</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors"
            disabled={isCreating}
          >
            <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
              Project Title <span className="text-[#DC143C]">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Amazing Project"
              className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={3}
              className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
              Genre (Optional)
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
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
        <div className="flex items-center justify-end gap-3 p-4 md:p-5 border-t border-[#3F3F46] bg-[#141414]">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-[#27272A] text-[#FFFFFF] border border-[#3F3F46] rounded-lg text-sm font-medium transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !projectName.trim()}
            className="px-4 py-2.5 bg-[#DC143C] hover:bg-[#B01030] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Create Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

