'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, GitBranch, ExternalLink, RotateCcw, Loader2 } from 'lucide-react';
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
                'You have unsaved changes. Restoring this version will overwrite them. Continue?'
            );
            if (!confirmed) return;
        }
        
        setRestoring(commit.sha);
        try {
            const content = await getFileFromCommit(githubConfig, 'screenplay.fountain', commit.sha);
            setContent(content, true);
            toast.success(`Version restored from: ${commit.message.split('\n')[0]}`);
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
                                                {commits.length} commit{commits.length !== 1 ? 's' : ''} found
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : commits.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-base-content/70">No commits found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {commits.map((commit, index) => (
                                                <div
                                                    key={commit.sha}
                                                    className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-base-content truncate">
                                                                {commit.message.split('\n')[0]}
                                                            </p>
                                                            <p className="text-sm text-base-content/60 mt-1">
                                                                {commit.author.name} • {formatDate(commit.date)}
                                                            </p>
                                                            <p className="text-xs text-base-content/40 mt-1 font-mono">
                                                                {commit.sha.substring(0, 7)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <a
                                                                href={getCommitUrl(commit.sha)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-ghost btn-sm"
                                                                title="View on GitHub"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                            {index > 0 && (
                                                                <a
                                                                    href={getCompareUrl(commit.sha)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-ghost btn-sm"
                                                                    title="Compare with current"
                                                                >
                                                                    <GitBranch className="h-4 w-4" />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleRestore(commit)}
                                                                disabled={restoring === commit.sha}
                                                                className="btn btn-primary btn-sm"
                                                                title="Restore this version"
                                                            >
                                                                {restoring === commit.sha ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RotateCcw className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

