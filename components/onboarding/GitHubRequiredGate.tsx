'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';

interface GitHubRequiredGateProps {
    children: React.ReactNode;
}

// Configuration
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * GitHubRequiredGate - Blocks access until GitHub is connected
 * Uses OAuth flow for secure, one-click GitHub authentication
 */
export default function GitHubRequiredGate({ children }: GitHubRequiredGateProps) {
    const screenplay = useScreenplay();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState<'connect' | 'select-repo'>('connect');
    
    // OAuth state
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    
    // Repository selection state
    const [repositories, setRepositories] = useState<any[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [newRepoName, setNewRepoName] = useState('');
    const [createNewRepo, setCreateNewRepo] = useState(false);
    
    const [error, setError] = useState('');

    // Handle OAuth callback
    useEffect(() => {
        const handleOAuthCallback = async () => {
            const code = searchParams?.get('code');
            const state = searchParams?.get('state');
            
            if (code && state === 'github_oauth_wryda') {
                setIsLoading(true);
                setShowModal(true);
                
                try {
                    // Exchange code for access token via backend
                    const response = await fetch(`${BACKEND_URL}/api/auth/github/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code }),
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to authenticate');
                    }
                    
                    const data = await response.json();
                    setAccessToken(data.access_token);
                    
                    // Get user info
                    const userResponse = await fetch('https://api.github.com/user', {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`,
                            'Accept': 'application/vnd.github.v3+json',
                        },
                    });
                    
                    if (!userResponse.ok) throw new Error('Failed to get user info');
                    
                    const userData = await userResponse.json();
                    setUsername(userData.login);
                    
                    // Fetch user's repositories
                    await fetchRepositories(data.access_token);
                    
                    // Move to repository selection
                    setStep('select-repo');
                    
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                } catch (err: any) {
                    console.error('[GitHub OAuth] Error:', err);
                    setError(err.message || 'Failed to authenticate with GitHub');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        handleOAuthCallback();
    }, [searchParams]);

    useEffect(() => {
        // Check if GitHub is connected
        if (!screenplay) return;
        
        if (!screenplay.isConnected) {
            setShowModal(true);
        }
        setIsLoading(false);
    }, [screenplay]);

    const fetchRepositories = async (token: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/github/repos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) throw new Error('Failed to fetch repositories');
            
            const repos = await response.json();
            setRepositories(repos);
        } catch (err: any) {
            console.error('[GitHub] Failed to fetch repos:', err);
            setError('Failed to load repositories');
        }
    };

    const handleOAuthConnect = () => {
        // Validate configuration
        if (!GITHUB_CLIENT_ID) {
            setError('GitHub OAuth is not configured. Please contact support.');
            console.error('[OAuth] Missing NEXT_PUBLIC_GITHUB_CLIENT_ID environment variable');
            return;
        }
        
        if (!BACKEND_URL) {
            setError('Backend URL is not configured. Please contact support.');
            console.error('[OAuth] Missing NEXT_PUBLIC_BACKEND_URL environment variable');
            return;
        }
        
        // Redirect to GitHub OAuth
        const scope = 'repo,user';
        const state = 'github_oauth_wryda';
        const redirectUri = `${FRONTEND_URL}/write`;
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
        
        console.log('[OAuth] Redirecting to GitHub authorization');
        window.location.href = authUrl;
    };

    const handleCreateRepo = async () => {
        if (!newRepoName || !accessToken) {
            setError('Repository name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/github/create-repo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newRepoName,
                    description: 'Wryda Screenplay Project',
                    private: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create repository');
            }

            const repoData = await response.json();
            
            // Connect to the new repository
            screenplay?.connect(accessToken, repoData.owner, repoData.name);
            setShowModal(false);
            
        } catch (err: any) {
            setError(err.message || 'Failed to create repository');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRepo = async () => {
        if (!selectedRepo || !accessToken) {
            setError('Please select a repository');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const [owner, repo] = selectedRepo.split('/');
            
            // Verify access to repository
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to access repository');
            }

            // Connect to GitHub
            screenplay?.connect(accessToken, owner, repo);
            console.log('[GitHubGate] ✅ Connected successfully');
            setShowModal(false);
            
        } catch (err: any) {
            setError(err.message || 'Failed to connect to repository');
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
                            <h2 className="text-3xl font-bold text-base-content mb-3">Connect Your GitHub Repository</h2>
                            <p className="text-base-content/80 text-base mb-4">
                                Wryda uses GitHub to save your screenplay with automatic version control and backup.
                            </p>
                            
                            {/* Privacy & Security Notice */}
                            <div className="bg-base-300/50 rounded-lg p-4 text-left border border-base-content/10">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-base-content/90">
                                        <p className="font-semibold mb-2">🔒 Your Privacy is Protected</p>
                                        <ul className="space-y-1 text-xs">
                                            <li>✓ We only access the repository you choose to connect</li>
                                            <li>✓ Your screenplay files stay in your GitHub account</li>
                                            <li>✓ You can disconnect or revoke access anytime</li>
                                            <li>✓ We never share your data with third parties</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Connect with OAuth */}
                        {step === 'connect' && (
                            <div className="space-y-6">
                                {/* OAuth Connect Button */}
                                <button
                                    onClick={handleOAuthConnect}
                                    disabled={isLoading}
                                    className="btn btn-primary btn-lg w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            Connect with GitHub
                                        </>
                                    )}
                                </button>

                                {/* Info Box */}
                                <div className="alert alert-info">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div className="text-sm">
                                        <p className="font-semibold mb-2">📝 What Happens Next?</p>
                                        <p>1. GitHub will ask for repository permissions</p>
                                        <p>2. You'll choose an existing repo or create a new one</p>
                                        <p>3. Your screenplay will auto-save with version history</p>
                                        <p className="mt-2 text-xs opacity-80">
                                            Note: GitHub shows standard permissions, but we only use the repository you select for your screenplay.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="alert alert-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Select Repository */}
                        {step === 'select-repo' && (
                            <div className="space-y-6">
                                {/* Welcome Message */}
                                <div className="alert alert-success">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Connected as <strong>@{username}</strong></span>
                                </div>

                                {/* Tab Toggle */}
                                <div className="tabs tabs-boxed">
                                    <a 
                                        className={`tab ${!createNewRepo ? 'tab-active' : ''}`}
                                        onClick={() => setCreateNewRepo(false)}
                                    >
                                        Select Existing
                                    </a>
                                    <a 
                                        className={`tab ${createNewRepo ? 'tab-active' : ''}`}
                                        onClick={() => setCreateNewRepo(true)}
                                    >
                                        Create New
                                    </a>
                                </div>

                                {/* Select Existing Repository */}
                                {!createNewRepo && (
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">Select Repository</span>
                                            </label>
                                            <select
                                                className="select select-bordered w-full"
                                                value={selectedRepo}
                                                onChange={(e) => setSelectedRepo(e.target.value)}
                                                disabled={isLoading}
                                            >
                                                <option value="">Choose a repository...</option>
                                                {repositories.map((repo) => (
                                                    <option key={repo.id} value={repo.full_name}>
                                                        {repo.full_name} {repo.private ? '🔒' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <label className="label">
                                                <span className="label-text-alt">
                                                    {repositories.length} repositories found
                                                </span>
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleSelectRepo}
                                            disabled={isLoading || !selectedRepo}
                                            className="btn btn-primary w-full"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="loading loading-spinner"></span>
                                                    Connecting...
                                                </>
                                            ) : (
                                                'Connect to Repository'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Create New Repository */}
                                {createNewRepo && (
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">Repository Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="my-screenplay"
                                                className="input input-bordered w-full"
                                                value={newRepoName}
                                                onChange={(e) => setNewRepoName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <label className="label">
                                                <span className="label-text-alt">
                                                    Will create a private repository
                                                </span>
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleCreateRepo}
                                            disabled={isLoading || !newRepoName}
                                            className="btn btn-primary w-full"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="loading loading-spinner"></span>
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create & Connect'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <div className="alert alert-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Connected - show children
    return <>{children}</>;
}


