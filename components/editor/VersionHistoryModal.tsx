'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, GitBranch, ExternalLink, RotateCcw, Loader2, HelpCircle, Save, Undo2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { getFileCommits, getFileFromCommit, getDefaultBranch, type GitHubConfig } from '@/utils/github';
import { toast } from 'sonner';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Commit {
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    date: string;
}

export default function VersionHistoryModal({ isOpen, onClose }: VersionHistoryModalProps) {
    const { state, setContent } = useEditor();
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
    const [branch, setBranch] = useState<string>('main');
    const [showHelp, setShowHelp] = useState(false);
    
    // Load GitHub config on mount
    useEffect(() => {
        if (isOpen) {
            try {
                const configStr = localStorage.getItem('screenplay_github_config');
                if (configStr) {
                    const config = JSON.parse(configStr);
                    setGithubConfig({
                        token: config.accessToken || config.token,
                        owner: config.owner,
                        repo: config.repo
                    });
                }
            } catch (err) {
                console.error('[VersionHistory] Failed to load GitHub config:', err);
            }
        }
    }, [isOpen]);
    
    // Fetch commits when modal opens
    useEffect(() => {
        if (isOpen && githubConfig) {
            fetchCommits();
        }
    }, [isOpen, githubConfig]);
    
    const fetchCommits = async () => {
        if (!githubConfig) return;
        
        setLoading(true);
        try {
            // Get default branch
            const defaultBranch = await getDefaultBranch(githubConfig);
            setBranch(defaultBranch);
            
            // Fetch commits
            const fileCommits = await getFileCommits(githubConfig, 'screenplay.fountain', defaultBranch, 10);
            setCommits(fileCommits);
        } catch (error: any) {
            console.error('[VersionHistory] Failed to fetch commits:', error);
            toast.error(`Failed to load version history: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleRestore = async (commit: Commit) => {
        if (!githubConfig) return;
        
        // Check for unsaved changes
        if (state.isDirty) {
            const confirmed = confirm(
                `You have unsaved changes in your current screenplay.\n\n` +
                `Restoring this backup will replace your current work with the saved version "${commit.message.split('\n')[0]}".\n\n` +
                `Don't worry — you can press Ctrl+Z (or Cmd+Z on Mac) to undo the restore if you change your mind!\n\n` +
                `Continue with restore?`
            );
            if (!confirmed) return;
        }
        
        setRestoring(commit.sha);
        try {
            const content = await getFileFromCommit(githubConfig, 'screenplay.fountain', commit.sha);
            setContent(content, true);
            toast.success(
                `Restored! Your screenplay is now at: "${commit.message.split('\n')[0]}"\n\nPress Ctrl+Z to undo if needed.`,
                { duration: 6000 }
            );
            onClose();
        } catch (error: any) {
            console.error('[VersionHistory] Failed to restore:', error);
            toast.error(`Failed to restore version: ${error.message || 'Unknown error'}`);
        } finally {
            setRestoring(null);
        }
    };
    
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const getCommitUrl = (commitSha: string): string => {
        if (!githubConfig) return '#';
        return `https://github.com/${githubConfig.owner}/${githubConfig.repo}/commit/${commitSha}`;
    };
    
    const getCompareUrl = (commitSha: string): string => {
        if (!githubConfig || commits.length === 0) return '#';
        const latestSha = commits[0].sha;
        return `https://github.com/${githubConfig.owner}/${githubConfig.repo}/compare/${commitSha}...${latestSha}`;
    };
    
    if (!isOpen) return null;
    
    if (!githubConfig) {
        return (
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>
                    
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all">
                                    <div className="px-6 py-4 border-b border-base-300">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title as="h3" className="text-lg font-semibold">
                                                Version History
                                            </Dialog.Title>
                                            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-6 py-8 text-center">
                                        <p className="text-base-content/70">
                                            GitHub is not connected. Connect GitHub to view version history.
                                        </p>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        );
    }
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>
                
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all max-h-[90vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                            <GitBranch className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                                                Version History
                                            </Dialog.Title>
                                            <p className="text-xs text-base-content/60">
                                                Your saved backups • {commits.length} version{commits.length !== 1 ? 's' : ''} found
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setShowHelp(!showHelp)} 
                                            className="btn btn-ghost btn-sm btn-circle"
                                            title="How does this work?"
                                        >
                                            <HelpCircle className="h-5 w-5 text-primary" />
                                        </button>
                                        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Help Section - Collapsible */}
                                {showHelp && (
                                    <div className="px-6 py-4 bg-primary/5 border-b border-base-300">
                                        <div className="space-y-4">
                                            {/* What is this? */}
                                            <div>
                                                <h4 className="font-semibold text-base-content flex items-center gap-2 mb-2">
                                                    <Info className="h-4 w-4 text-primary" />
                                                    What is this?
                                                </h4>
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Think of this as a <strong>time machine for your screenplay</strong>. Every time you click 
                                                    the <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-base-300 rounded text-xs font-medium">
                                                    <Save className="h-3 w-3" /> GitHub</span> button in the toolbar, 
                                                    your script is saved as a "snapshot" that you can come back to anytime.
                                                </p>
                                            </div>
                                            
                                            {/* How to Back Up */}
                                            <div>
                                                <h4 className="font-semibold text-base-content flex items-center gap-2 mb-2">
                                                    <Save className="h-4 w-4 text-success" />
                                                    How to Save a Backup
                                                </h4>
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Click the <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-base-300 rounded text-xs font-medium">
                                                    <Save className="h-3 w-3" /> GitHub</span> button in your editor toolbar. 
                                                    Give your backup a short description (like "Finished Act 1" or "Before big changes") 
                                                    and click Save. <strong>That's it!</strong> Your work is safely stored.
                                                </p>
                                            </div>
                                            
                                            {/* What Restore Does */}
                                            <div>
                                                <h4 className="font-semibold text-base-content flex items-center gap-2 mb-2">
                                                    <RotateCcw className="h-4 w-4 text-warning" />
                                                    What Does "Restore" Do?
                                                </h4>
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Clicking <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-content rounded text-xs font-medium">
                                                    <RotateCcw className="h-3 w-3" /> Restore</span> replaces your current 
                                                    screenplay with that older version. It's like going back in time to when you 
                                                    saved that backup. <strong>Your current work will be replaced</strong>, but don't worry — you can undo it!
                                                </p>
                                            </div>
                                            
                                            {/* Undo Info - Important! */}
                                            <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                                                <h4 className="font-semibold text-success flex items-center gap-2 mb-2">
                                                    <Undo2 className="h-4 w-4" />
                                                    Changed Your Mind? Just Undo!
                                                </h4>
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    If you restore an old version and realize you want your newer work back, 
                                                    just press <kbd className="kbd kbd-sm">Ctrl+Z</kbd> (or <kbd className="kbd kbd-sm">Cmd+Z</kbd> on Mac) 
                                                    to undo the restore. <strong>This works as long as you haven't closed or refreshed the page.</strong>
                                                </p>
                                            </div>
                                            
                                            {/* Tips */}
                                            <div className="text-xs text-base-content/60 border-t border-base-300 pt-3">
                                                <strong>Pro tip:</strong> Save a backup before making big changes, 
                                                so you can always come back if things don't work out!
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setShowHelp(false)}
                                            className="mt-4 text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <ChevronUp className="h-3 w-3" /> Hide help
                                        </button>
                                    </div>
                                )}
                                
                                {/* Quick Info Banner (always visible when help is hidden) */}
                                {!showHelp && commits.length > 0 && (
                                    <div className="px-6 py-2 bg-base-200/50 border-b border-base-300">
                                        <p className="text-xs text-base-content/70 flex items-center gap-2">
                                            <Info className="h-3 w-3" />
                                            Click <strong>Restore</strong> to go back to a saved version. Don't worry — you can always undo with Ctrl+Z!
                                            <button 
                                                onClick={() => setShowHelp(true)} 
                                                className="text-primary hover:underline ml-auto flex items-center gap-1"
                                            >
                                                Learn more <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </p>
                                    </div>
                                )}
                                
                                {/* Content */}
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="ml-3 text-base-content/70">Loading your saved versions...</span>
                                        </div>
                                    ) : commits.length === 0 ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-base-200 rounded-full flex items-center justify-center">
                                                <Save className="h-8 w-8 text-base-content/40" />
                                            </div>
                                            <div>
                                                <p className="text-base-content font-medium">No backups yet</p>
                                                <p className="text-sm text-base-content/60 mt-1 max-w-sm mx-auto">
                                                    Click the <strong>GitHub button</strong> in your toolbar to save your first backup. 
                                                    It's like hitting "save" — but you can go back to any saved version later!
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {commits.map((commit, index) => (
                                                <div
                                                    key={commit.sha}
                                                    className={`border rounded-lg p-4 transition-colors ${
                                                        index === 0 
                                                            ? 'border-success/50 bg-success/5' 
                                                            : 'border-base-300 hover:bg-base-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            {index === 0 && (
                                                                <span className="text-[10px] font-semibold text-success uppercase tracking-wide">
                                                                    Most Recent Backup
                                                                </span>
                                                            )}
                                                            <p className="font-medium text-base-content truncate">
                                                                {commit.message.split('\n')[0]}
                                                            </p>
                                                            <p className="text-sm text-base-content/60 mt-1">
                                                                Saved by {commit.author.name} • {formatDate(commit.date)}
                                                            </p>
                                                            <p className="text-xs text-base-content/40 mt-1 font-mono">
                                                                ID: {commit.sha.substring(0, 7)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0 items-center">
                                                            <div className="tooltip tooltip-left" data-tip="View this backup on GitHub">
                                                                <a
                                                                    href={getCommitUrl(commit.sha)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-ghost btn-sm"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                            {index > 0 && (
                                                                <div className="tooltip tooltip-left" data-tip="Compare changes between versions">
                                                                    <a
                                                                        href={getCompareUrl(commit.sha)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="btn btn-ghost btn-sm"
                                                                    >
                                                                        <GitBranch className="h-4 w-4" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                            <div className="tooltip tooltip-left" data-tip="Replace your current screenplay with this version (you can undo with Ctrl+Z)">
                                                                <button
                                                                    onClick={() => handleRestore(commit)}
                                                                    disabled={restoring === commit.sha}
                                                                    className="btn btn-primary btn-sm gap-1"
                                                                >
                                                                    {restoring === commit.sha ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <RotateCcw className="h-4 w-4" />
                                                                            <span className="hidden sm:inline">Restore</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Footer with undo reminder */}
                                {commits.length > 0 && (
                                    <div className="px-6 py-3 border-t border-base-300 bg-base-200/30">
                                        <p className="text-xs text-base-content/60 flex items-center justify-center gap-2">
                                            <Undo2 className="h-3 w-3" />
                                            Remember: You can always undo a restore with <kbd className="kbd kbd-xs">Ctrl+Z</kbd> (or <kbd className="kbd kbd-xs">Cmd+Z</kbd>)
                                        </p>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

