'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface GitHubRepository {
    name?: string;
    owner?: string;
}

interface StoredGitHubConfig {
    owner: string;
    repo: string;
    branch: string;
}

/**
 * Feature 0111: GitHub OAuth Callback Handler
 * Handles backend OAuth callback completion and stores repo metadata only.
 */
export default function GitHubOAuthHandler() {
    const searchParams = useSearchParams();
    const hasProcessedRef = useRef(false);

    useEffect(() => {
        const githubStatus = searchParams?.get('github');
        if (!githubStatus || hasProcessedRef.current) {
            return;
        }
        hasProcessedRef.current = true;

        const cleanupQueryParams = () => {
            window.history.replaceState({}, document.title, window.location.pathname);
        };

        const handleConnected = async () => {
            try {
                const response = await fetch('/api/github/repositories?type=owner&per_page=50&page=1', {
                    method: 'GET',
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => null);

                if (!response.ok || !Array.isArray(payload?.repositories)) {
                    throw new Error(payload?.message || payload?.error || 'Failed to load repositories');
                }

                const repositories: GitHubRepository[] = payload.repositories;
                if (repositories.length === 0) {
                    toast.warning('GitHub connected, but no repositories were found yet.');
                    return;
                }

                let selected = repositories[0];
                try {
                    const existingRaw = localStorage.getItem('screenplay_github_config');
                    if (existingRaw) {
                        const existingConfig = JSON.parse(existingRaw) as Partial<StoredGitHubConfig>;
                        const existingMatch = repositories.find((repo) =>
                            repo.owner === existingConfig.owner && repo.name === existingConfig.repo
                        );
                        if (existingMatch) {
                            selected = existingMatch;
                        }
                    }
                } catch (readError) {
                    console.warn('[GitHub OAuth] Unable to reuse existing repository selection:', readError);
                }

                if (!selected.owner || !selected.name) {
                    throw new Error('Repository payload is missing owner/name');
                }

                const githubConfig: StoredGitHubConfig = {
                    owner: selected.owner,
                    repo: selected.name,
                    branch: 'main'
                };
                localStorage.setItem('screenplay_github_config', JSON.stringify(githubConfig));

                toast.success(`GitHub connected: ${selected.owner}/${selected.name}`);
            } catch (error: any) {
                console.error('[GitHub OAuth] Failed to finalize backend OAuth connect:', error);
                toast.error(`GitHub connected, but repository setup failed: ${error?.message || 'Unknown error'}`);
            } finally {
                cleanupQueryParams();
            }
        };

        if (githubStatus === 'connected') {
            void handleConnected();
            return;
        }

        if (githubStatus === 'denied') {
            toast.error('GitHub authorization was denied.');
            cleanupQueryParams();
            return;
        }

        if (githubStatus === 'error') {
            const message = searchParams?.get('message');
            toast.error(`GitHub connection failed: ${message || 'Unknown error'}`);
            cleanupQueryParams();
            return;
        }

        cleanupQueryParams();
    }, [searchParams]);

    // This component renders nothing - it just handles OAuth callback completion.
    return null;
}

