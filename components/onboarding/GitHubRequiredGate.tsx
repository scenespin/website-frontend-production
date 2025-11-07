'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';

interface GitHubRequiredGateProps {
    children: React.ReactNode;
}

/**
 * GitHubRequiredGate - Blocks access until GitHub is connected
 * Shows onboarding modal for GitHub connection
 */
export default function GitHubRequiredGate({ children }: GitHubRequiredGateProps) {
    const screenplay = useScreenplay();
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form state
    const [token, setToken] = useState('');
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if GitHub is connected
        if (!screenplay) return;
        
        if (!screenplay.isConnected) {
            setShowModal(true);
        }
        setIsLoading(false);
    }, [screenplay]);

    const handleConnect = async () => {
        if (!token || !owner || !repo) {
            setError('All fields are required');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // Connect to GitHub
            screenplay?.connect(token, owner, repo);
            
            // Verify connection by trying to access repo
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to connect to repository. Check your credentials.');
            }

            console.log('[GitHubGate] ✅ Connected successfully');
            setShowModal(false);
        } catch (err: any) {
            setError(err.message || 'Failed to connect to GitHub');
            // Disconnect on failure
            screenplay?.disconnect();
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking connection
    if (isLoading && !showModal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4 text-base-content/60">Checking GitHub connection...</p>
                </div>
            </div>
        );
    }

    // Show onboarding modal if not connected
    if (showModal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
                <div className="card w-full max-w-2xl bg-base-200 shadow-xl">
                    <div className="card-body">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="flex justify-center mb-4">
                                <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-base-content">Connect Your GitHub Repository</h2>
                            <p className="text-base-content/60 mt-2">
                                Wryda uses GitHub to store your screenplay, characters, and locations. This enables version control, backup, and collaboration.
                            </p>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            {/* GitHub Token */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">GitHub Personal Access Token</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    className="input input-bordered w-full"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                />
                                <label className="label">
                                    <span className="label-text-alt">
                                        <a 
                                            href="https://github.com/settings/tokens/new?scopes=repo&description=Wryda%20Screenplay%20Editor"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link link-primary"
                                        >
                                            Create a token here
                                        </a>
                                        {' '}(requires "repo" scope)
                                    </span>
                                </label>
                            </div>

                            {/* Repository Owner */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Repository Owner (Username)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="your-username"
                                    className="input input-bordered w-full"
                                    value={owner}
                                    onChange={(e) => setOwner(e.target.value)}
                                />
                            </div>

                            {/* Repository Name */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Repository Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="my-screenplay"
                                    className="input input-bordered w-full"
                                    value={repo}
                                    onChange={(e) => setRepo(e.target.value)}
                                />
                                <label className="label">
                                    <span className="label-text-alt">
                                        Create a new private repository on GitHub first
                                    </span>
                                </label>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="alert alert-error">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Connect Button */}
                            <button
                                onClick={handleConnect}
                                disabled={isLoading || !token || !owner || !repo}
                                className="btn btn-primary btn-lg w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        Connect to GitHub
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="alert alert-info mt-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div className="text-sm">
                                <p className="font-semibold">Why GitHub?</p>
                                <p>• Version control for your screenplay</p>
                                <p>• Automatic backup and sync</p>
                                <p>• Collaboration with your team</p>
                                <p>• All your data stored securely in your own repository</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Connected - show children
    return <>{children}</>;
}

