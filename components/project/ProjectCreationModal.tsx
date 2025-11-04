'use client';

import { useState } from 'react';
import { X, Film, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName.trim(),
          description: description.trim() || undefined,
          genre: genre || undefined,
          storage_provider: 'local', // Default to local storage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();
      
      toast.success(`Project "${projectName}" created!`);
      onSuccess(data.project);
      handleClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
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
            <h2 className="text-2xl font-bold text-white">Create New Project</h2>
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
              Project Name <span className="text-[#DC143C]">*</span>
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
                Create Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

