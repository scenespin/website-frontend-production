'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, GitBranch, ExternalLink, RotateCcw, Loader2, HelpCircle, Save, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
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

interface GitHubRepoConfig {
    owner: string;
    repo: string;
}

export default function VersionHistoryModal({ isOpen, onClose }: VersionHistoryModalProps) {
    const { getToken } = useAuth();
    const { state, setContent } = useEditor();
    const { screenplayId, isOwner } = useScreenplay();
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [githubConfig, setGithubConfig] = useState<GitHubRepoConfig | null>(null);
    const [branch, setBranch] = useState<string>('main');
    const [showHelp, setShowHelp] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [contextLoading, setContextLoading] = useState(false);
    const [contextMessage, setContextMessage] = useState<string | null>(null);
    const [ownerGitHubConnected, setOwnerGitHubConnected] = useState(false);
    const [canManageGitHub, setCanManageGitHub] = useState(false);
    const [provisioning, setProvisioning] = useState(false);
    const autoProvisionAttemptedRef = useRef(false);
    
    // Restore confirmation modal state
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [commitToRestore, setCommitToRestore] = useState<Commit | null>(null);
    const [confirmText, setConfirmText] = useState('');
    // Reset one-time auto-provision attempt when modal/session target changes.
    useEffect(() => {
        autoProvisionAttemptedRef.current = false;
    }, [isOpen, screenplayId]);

    // Load canonical screenplay GitHub context from backend (source of truth).
    useEffect(() => {
        if (!isOpen || !screenplayId) return;
        if (!screenplayId.startsWith('screenplay_')) {
            setGithubConfig(null);
            setContextMessage('A valid screenplay is required to view version history.');
            return;
        }

        const loadGitHubContext = async () => {
            setContextLoading(true);
            try {
                const token = await getToken({ template: 'wryda-backend' });
                if (!token) {
                    throw new Error('Unable to authenticate with backend. Please sign in again.');
                }
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.wryda.ai';
                const response = await fetch(
                    `${backendUrl}/api/github/screenplay/context?screenplayId=${encodeURIComponent(screenplayId)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                const payload = await response.json().catch(() => null);
                if (!response.ok || !payload?.success) {
                    throw new Error(payload?.message || 'Failed to load GitHub context');
                }

                const hasCanonicalRepo = Boolean(payload?.canonicalConfigured && payload?.repoOwner && payload?.repoName);
                const ownerConnected = Boolean(payload?.ownerGitHubConnected);
                setOwnerGitHubConnected(ownerConnected);
                setCanManageGitHub(Boolean(payload?.canManageGitHub) && Boolean(isOwner));

                if (hasCanonicalRepo) {
                    setGithubConfig({
                        owner: String(payload.repoOwner),
                        repo: String(payload.repoName)
                    });
                    if (!ownerConnected) {
                        setContextMessage('Director GitHub connection is required to load version history.');
                    } else {
                        setContextMessage(null);
                    }
                } else {
                    setGithubConfig(null);
                    const isDirector = Boolean(payload?.canManageGitHub) && Boolean(isOwner);
                    if (isDirector && ownerConnected && !autoProvisionAttemptedRef.current) {
                        autoProvisionAttemptedRef.current = true;
                        setContextMessage('Configuring GitHub for this screenplay...');
                        await handleProvisionGitHub({
                            announceSuccess: false,
                            canManageOverride: isDirector,
                            ownerConnectedOverride: ownerConnected
                        });
                    } else {
                        setContextMessage(
                            isDirector
                                ? 'GitHub is not configured for this screenplay yet. It will be configured automatically on first backup/history use.'
                                : 'GitHub is not configured for this screenplay yet. Ask the director to configure it.'
                        );
                    }
                }
            } catch (err: any) {
                console.error('[VersionHistory] Failed to load screenplay GitHub context:', err);
                setGithubConfig(null);
                setContextMessage(err?.message || 'Failed to load GitHub context.');
            } finally {
                setContextLoading(false);
            }
        };

        void loadGitHubContext();
    }, [isOpen, screenplayId, getToken, isOwner]);
    
    // Fetch commits when modal opens
    useEffect(() => {
        if (isOpen && githubConfig && ownerGitHubConnected) {
            fetchCommits();
        }
    }, [isOpen, githubConfig, ownerGitHubConnected]);
    
    // State for showing expired token message
    const [tokenExpired, setTokenExpired] = useState(false);
    
    const handleReconnectGitHub = () => {
        if (!canManageGitHub) {
            toast.error('Only the director can manage GitHub connection for this screenplay.');
            return;
        }
        // Use full-page navigation so browser follows redirect chain to github.com.
        window.location.href = '/api/github/auth';
    };

    const handleProvisionGitHub = async (options?: {
        announceSuccess?: boolean;
        canManageOverride?: boolean;
        ownerConnectedOverride?: boolean;
    }): Promise<boolean> => {
        const announceSuccess = options?.announceSuccess !== false;
        const canManage = options?.canManageOverride ?? canManageGitHub;
        const ownerConnected = options?.ownerConnectedOverride ?? ownerGitHubConnected;
        if (!canManage) {
            toast.error('Only the director can configure GitHub for this screenplay.');
            return false;
        }
        if (!screenplayId || !screenplayId.startsWith('screenplay_')) {
            toast.error('A valid screenplay is required to configure GitHub.');
            return false;
        }
        if (!ownerConnected) {
            handleReconnectGitHub();
            return false;
        }

        setProvisioning(true);
        try {
            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
                throw new Error('Unable to authenticate with backend. Please sign in again.');
            }
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.wryda.ai';
            const response = await fetch(`${backendUrl}/api/github/screenplay/provision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ screenplayId })
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.success) {
                const backendError = new Error(payload?.message || 'Failed to configure GitHub repository');
                (backendError as Error & { errorCode?: string }).errorCode = payload?.errorCode;
                throw backendError;
            }

            setGithubConfig({
                owner: String(payload.repoOwner),
                repo: String(payload.repoName)
            });
            setOwnerGitHubConnected(Boolean(payload.ownerGitHubConnected));
            setContextMessage(null);
            if (announceSuccess) {
                toast.success(
                    payload.status === 'already_configured'
                        ? 'GitHub repository mapping is already configured for this screenplay.'
                        : 'GitHub repository configured for this screenplay.'
                );
            }
            return true;
        } catch (error: any) {
            const errorCode = error?.errorCode || '';
            if (errorCode === 'OWNER_GITHUB_NOT_CONNECTED') {
                toast.error('Director GitHub connection is required. Please reconnect GitHub first.');
                handleReconnectGitHub();
            } else {
                toast.error(`Failed to configure GitHub: ${error?.message || 'Unknown error'}`);
            }
            return false;
        } finally {
            setProvisioning(false);
        }
    };

    const handleDisconnectGitHub = async () => {
        if (!canManageGitHub) {
            toast.error('Only the director can manage GitHub connection for this screenplay.');
            return;
        }
        setDisconnecting(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.wryda.ai';
            let authHeader: string | undefined;
            const token = await getToken({ template: 'wryda-backend' });
            if (token) {
                authHeader = `Bearer ${token}`;
            }

            const response = await fetch(`${backendUrl}/api/github/disconnect`, {
                method: 'DELETE',
                headers: authHeader ? { Authorization: authHeader } : undefined,
            });

            // Even if backend disconnect fails, keep UI in a reconnectable state.
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                console.warn('[VersionHistory] Backend disconnect failed:', payload || response.status);
            }

            setGithubConfig(null);
            setCommits([]);
            setTokenExpired(false);
            setShowHelp(false);
            setOwnerGitHubConnected(false);
            setContextMessage('Director GitHub connection is required to load version history.');
            toast.success('GitHub disconnected. Reconnect to continue backups and version history.');
        } catch (error) {
            console.error('[VersionHistory] Disconnect failed:', error);
            setGithubConfig(null);
            setCommits([]);
            setTokenExpired(false);
            setShowHelp(false);
            setOwnerGitHubConnected(false);
            setContextMessage('Director GitHub connection is required to load version history.');
            toast.error('Failed to disconnect GitHub cleanly. Please retry.');
        } finally {
            setDisconnecting(false);
        }
    };
    
    const fetchCommits = async () => {
        if (!githubConfig) return;
        
        setLoading(true);
        setTokenExpired(false);
        try {
            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
                throw new Error('Unable to authenticate with backend. Please sign in again.');
            }

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.wryda.ai';
            const query = new URLSearchParams({
                screenplayId: screenplayId || '',
                owner: githubConfig.owner,
                repo: githubConfig.repo,
                limit: '10'
            });

            const response = await fetch(`${backendUrl}/api/github/screenplay/history?${query.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok || !payload?.success) {
                const backendError = new Error(payload?.message || 'Failed to load version history');
                (backendError as Error & { errorCode?: string }).errorCode = payload?.errorCode;
                throw backendError;
            } else {
                setBranch(payload.branch || 'main');
                setCommits(payload.commits || []);
            }
        } catch (error: any) {
            console.error('[VersionHistory] Failed to fetch commits:', error);
            
            // Check if this is an authentication error
            const errorMessage = error.message || '';
            const errorCode = error.errorCode || '';
            if (errorCode === 'OWNER_GITHUB_NOT_CONNECTED') {
                setTokenExpired(false);
                toast.error('Director GitHub connection is required to view version history.');
            } else if (
                errorCode === 'CANONICAL_GITHUB_CONFIG_MISSING' ||
                errorCode === 'CANONICAL_REPO_MISMATCH'
            ) {
                setTokenExpired(false);
                toast.error('GitHub repository is not configured for this screenplay yet. Ask the director to configure it.');
            } else if (
                errorMessage.includes('Bad credentials') ||
                errorMessage.includes('401') ||
                errorMessage.includes('Unauthorized') ||
                errorCode === 'GITHUB_TOKEN_EXPIRED' ||
                errorCode === 'GITHUB_NOT_CONNECTED'
            ) {
                setTokenExpired(true);
                toast.error('Your GitHub connection has expired. Please reconnect.');
            } else {
                toast.error(`Failed to load version history: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Show the restore confirmation modal
    const handleRestoreClick = (commit: Commit) => {
        setCommitToRestore(commit);
        setConfirmText('');
        // Defer opening by one frame to avoid click-through closing on the backdrop.
        requestAnimationFrame(() => {
            setShowRestoreConfirm(true);
        });
    };
    
    // Actually perform the restore after confirmation
    const handleConfirmedRestore = async () => {
        if (!githubConfig || !commitToRestore) return;
        
        setRestoring(commitToRestore.sha);
        setShowRestoreConfirm(false);
        
        try {
            let content: string;

            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
                throw new Error('Unable to authenticate with backend. Please sign in again.');
            }

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.wryda.ai';
            const query = new URLSearchParams({
                screenplayId: screenplayId || '',
                owner: githubConfig.owner,
                repo: githubConfig.repo,
                commitSha: commitToRestore.sha
            });

            const response = await fetch(`${backendUrl}/api/github/screenplay/content?${query.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok || !payload?.success) {
                const backendError = new Error(payload?.message || 'Failed to restore version from backend');
                (backendError as Error & { errorCode?: string }).errorCode = payload?.errorCode;
                throw backendError;
            } else {
                content = payload.content;
            }

            setContent(content, true);
            toast.success(
                `Restored! Your screenplay is now at: "${commitToRestore.message.split('\n')[0]}".`,
                { duration: 6000 }
            );
            setCommitToRestore(null);
            onClose();
        } catch (error: any) {
            console.error('[VersionHistory] Failed to restore:', error);
            const errorCode = error?.errorCode || '';
            if (errorCode === 'OWNER_GITHUB_NOT_CONNECTED') {
                toast.error('Director GitHub connection is required to restore versions.');
            } else if (
                errorCode === 'CANONICAL_GITHUB_CONFIG_MISSING' ||
                errorCode === 'CANONICAL_REPO_MISMATCH'
            ) {
                toast.error('GitHub repository is not configured for this screenplay yet.');
            } else {
                toast.error(`Failed to restore version: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setRestoring(null);
        }
    };
    
    // Cancel the restore
    const handleCancelRestore = () => {
        setShowRestoreConfirm(false);
        setCommitToRestore(null);
        setConfirmText('');
    };

    const handleDialogClose = () => {
        // While the restore confirm is open, ignore parent dialog close events.
        // The confirm overlay manages its own cancel/close behavior.
        if (showRestoreConfirm) {
            return;
        }
        onClose();
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
                                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[#3F3F46] shadow-xl transition-all">
                                    <div className="px-6 py-4 border-b border-[#3F3F46]">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                                                Version History
                                            </Dialog.Title>
                                            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-6 py-8 text-center space-y-4">
                                        <p className="text-gray-400">
                                            {contextLoading
                                                ? 'Loading GitHub version history context...'
                                                : (contextMessage || 'GitHub is not configured for this screenplay.')}
                                        </p>
                                        {!contextLoading && canManageGitHub && githubConfig && !ownerGitHubConnected && (
                                            <button
                                                onClick={handleReconnectGitHub}
                                                className="btn gap-2 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white border-none"
                                            >
                                                Reconnect GitHub
                                            </button>
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
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleDialogClose}>
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
                            <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[#3F3F46] shadow-xl transition-all max-h-[90vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[#3F3F46] px-6 py-4 bg-[#141414]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DC143C]">
                                            <GitBranch className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                                                Version History
                                            </Dialog.Title>
                                            <p className="text-xs text-gray-400">
                                                Backups for this screenplay • {commits.length} version{commits.length !== 1 ? 's' : ''} found
                                            </p>
                                            <p className="text-[11px] text-[#00D9FF] mt-1">
                                                Backend-token mode enabled
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canManageGitHub && (
                                            <button
                                                onClick={handleDisconnectGitHub}
                                                disabled={disconnecting}
                                                className="btn btn-ghost btn-sm text-xs text-gray-300 hover:text-white border border-[#3F3F46] hover:border-[#52525B]"
                                                title="Disconnect GitHub account"
                                            >
                                                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setShowHelp(!showHelp)} 
                                            className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
                                            title="How does this work?"
                                        >
                                            <HelpCircle className="h-5 w-5 text-[#DC143C]" />
                                        </button>
                                        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Help Section - Collapsible */}
                                {showHelp && (
                                    <div className="px-6 py-4 bg-[#141414] border-b border-[#3F3F46]">
                                        <div className="space-y-4">
                                            {/* What is this? */}
                                            <div>
                                                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                                    <Info className="h-4 w-4 text-[#DC143C]" />
                                                    What is this?
                                                </h4>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    Think of this as a <strong className="text-white">time machine for your screenplay</strong>. Every time you click 
                                                    the <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1F1F1F] border border-[#3F3F46] rounded text-xs font-medium text-white">
                                                    <Save className="h-3 w-3" /> GitHub</span> button in the toolbar, 
                                                    your script is saved as a "snapshot" that you can come back to anytime.
                                                </p>
                                            </div>
                                            
                                            {/* How to Back Up */}
                                            <div>
                                                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                                    <Save className="h-4 w-4 text-green-400" />
                                                    How to Save a Backup
                                                </h4>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    Click the <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1F1F1F] border border-[#3F3F46] rounded text-xs font-medium text-white">
                                                    <Save className="h-3 w-3" /> GitHub</span> button in your editor toolbar. 
                                                    Give your backup a short description (like "Finished Act 1" or "Before big changes") 
                                                    and click Save. <strong className="text-white">That's it!</strong> Your work is safely stored.
                                                </p>
                                            </div>
                                            
                                            {/* What Restore Does */}
                                            <div>
                                                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                                    <RotateCcw className="h-4 w-4 text-yellow-400" />
                                                    What Does "Restore" Do?
                                                </h4>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    Clicking <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#DC143C] text-white rounded text-xs font-medium">
                                                    <RotateCcw className="h-3 w-3" /> Restore</span> replaces your current 
                                                    screenplay with that older version. It's like going back in time to when you 
                                                    saved that backup. <strong className="text-white">Your current work will be replaced.</strong>
                                                </p>
                                            </div>
                                            
                                            {/* Restore note */}
                                            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                                                <h4 className="font-semibold text-green-400 flex items-center gap-2 mb-2">
                                                    <Info className="h-4 w-4" />
                                                    Important
                                                </h4>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    Restoring replaces the current screenplay content with the selected backup.
                                                </p>
                                            </div>
                                            
                                            {/* Tips */}
                                            <div className="text-xs text-gray-400 border-t border-[#3F3F46] pt-3">
                                                <strong className="text-white">Pro tip:</strong> Save a backup before making big changes, 
                                                so you can always come back if things don't work out!
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setShowHelp(false)}
                                            className="mt-4 text-xs text-[#DC143C] hover:text-[#DC143C]/80 hover:underline flex items-center gap-1"
                                        >
                                            <ChevronUp className="h-3 w-3" /> Hide help
                                        </button>
                                    </div>
                                )}
                                
                                {/* Quick Info Banner (always visible when help is hidden) */}
                                {!showHelp && commits.length > 0 && (
                                    <div className="px-6 py-2 bg-[#141414] border-b border-[#3F3F46]">
                                        <p className="text-xs text-gray-300 flex items-center gap-2">
                                            <Info className="h-3 w-3 text-[#DC143C]" />
                                            Click <strong className="text-white">Restore</strong> to go back to a saved version.
                                            <button 
                                                onClick={() => setShowHelp(true)} 
                                                className="text-[#DC143C] hover:text-[#DC143C]/80 hover:underline ml-auto flex items-center gap-1"
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
                                            <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
                                            <span className="ml-3 text-gray-300">Loading your saved versions...</span>
                                        </div>
                                    ) : tokenExpired ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-yellow-900/20 border border-yellow-700/50 rounded-full flex items-center justify-center">
                                                <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">GitHub Connection Expired</p>
                                                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                                    {canManageGitHub
                                                        ? 'Your connection to GitHub has expired. This happens sometimes for security reasons. Please reconnect to view your version history and save new backups.'
                                                        : 'The director GitHub connection has expired. Ask the director to reconnect to view version history and backups.'}
                                                </p>
                                            </div>
                                            {canManageGitHub && (
                                                <button
                                                    onClick={handleReconnectGitHub}
                                                    className="btn gap-2 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white border-none"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                    </svg>
                                                    Reconnect GitHub
                                                </button>
                                            )}
                                        </div>
                                    ) : !ownerGitHubConnected ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-yellow-900/20 border border-yellow-700/50 rounded-full flex items-center justify-center">
                                                <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Director GitHub Connection Required</p>
                                                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                                    {contextMessage || 'The director must reconnect GitHub to load version history.'}
                                                </p>
                                            </div>
                                            {canManageGitHub && (
                                                <button
                                                    onClick={handleReconnectGitHub}
                                                    className="btn gap-2 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white border-none"
                                                >
                                                    Reconnect GitHub
                                                </button>
                                            )}
                                        </div>
                                    ) : commits.length === 0 ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-[#1F1F1F] border border-[#3F3F46] rounded-full flex items-center justify-center">
                                                <Save className="h-8 w-8 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">No backups yet</p>
                                                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                                    Click the <strong className="text-white">BACKUP button</strong> in your toolbar to save your first backup. 
                                                    This history is scoped to the screenplay you currently have open.
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
                                                            ? 'border-green-700/50 bg-green-900/10' 
                                                            : 'border-[#3F3F46] hover:bg-[#1F1F1F] bg-[#0A0A0A]'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            {index === 0 && (
                                                                <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">
                                                                    Most Recent Backup
                                                                </span>
                                                            )}
                                                            <p className="font-medium text-white truncate">
                                                                {commit.message.split('\n')[0]}
                                                            </p>
                                                            <p className="text-sm text-gray-400 mt-1">
                                                                Saved by {commit.author.name} • {formatDate(commit.date)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                                                ID: {commit.sha.substring(0, 7)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0 items-center">
                                                            <div className="tooltip tooltip-left" data-tip="View this backup on GitHub">
                                                                <a
                                                                    href={getCommitUrl(commit.sha)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-ghost btn-sm text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
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
                                                                        className="btn btn-ghost btn-sm text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                                                                    >
                                                                        <GitBranch className="h-4 w-4" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                            <div
                                                                className="tooltip tooltip-left"
                                                                data-tip={
                                                                    canManageGitHub
                                                                        ? 'Replace your current screenplay with this version.'
                                                                        : 'Only the director can run backups and restores.'
                                                                }
                                                            >
                                                                <button
                                                                    onClick={() => canManageGitHub && handleRestoreClick(commit)}
                                                                    disabled={restoring === commit.sha || !canManageGitHub}
                                                                    className="btn btn-sm gap-1 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                                
                                {/* Footer */}
                                {commits.length > 0 && (
                                    <div className="px-6 py-3 border-t border-[#3F3F46] bg-[#141414]">
                                        <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                                            <Info className="h-3 w-3 text-[#DC143C]" />
                                            Restoring will replace your current screenplay with the selected backup.
                                        </p>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
                
                {/* Restore Confirmation Modal */}
                {showRestoreConfirm && commitToRestore && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60" onMouseDown={handleCancelRestore} />
                        <div
                            className="relative bg-[#0A0A0A] border border-[#3F3F46] rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Warning Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-yellow-900/20 border border-yellow-700/50 flex items-center justify-center">
                                    <RotateCcw className="h-8 w-8 text-yellow-400" />
                                </div>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-xl font-bold text-center mb-2 text-white">
                                Are you sure you want to restore?
                            </h3>
                            
                            {/* Explanation */}
                            <div className="space-y-3 text-sm text-gray-300 mb-4">
                                <p className="text-center">
                                    This will replace your <strong className="text-white">current screenplay</strong> with the backup:
                                </p>
                                
                                <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-3 text-center">
                                    <p className="font-semibold text-white">
                                        "{commitToRestore.message.split('\n')[0]}"
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Saved {formatDate(commitToRestore.date)}
                                    </p>
                                </div>
                                
                                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                                    <p className="flex items-start gap-2 text-sm">
                                        <Info className="h-4 w-4 mt-0.5 text-green-400 shrink-0" />
                                        <span>
                                            <strong className="text-white">Important:</strong> Restoring will replace your current screenplay with this saved backup.
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            {/* Type to Confirm */}
                            <div className="mb-4">
                                <label className="label">
                                    <span className="label-text font-medium text-white">
                                        Type <span className="font-mono bg-[#1F1F1F] border border-[#3F3F46] px-2 py-0.5 rounded text-yellow-400">RESTORE</span> to confirm:
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Type RESTORE here..."
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="input w-full font-mono bg-[#1F1F1F] border-[#3F3F46] text-white placeholder-gray-500 focus:border-[#DC143C]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && confirmText.toUpperCase() === 'RESTORE') {
                                            handleConfirmedRestore();
                                        }
                                    }}
                                />
                            </div>
                            
                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirmedRestore}
                                    disabled={confirmText.toUpperCase() !== 'RESTORE'}
                                    className="btn flex-1 gap-2 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Restore This Version
                                </button>
                                <button
                                    onClick={handleCancelRestore}
                                    className="btn btn-ghost text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </Transition>
    );
}

