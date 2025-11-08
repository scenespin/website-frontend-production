'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';

/**
 * Feature 0111: GitHub OAuth Callback Handler
 * Handles the OAuth callback when user connects GitHub (optional)
 * This replaces the removed GitHubRequiredGate's OAuth handling
 */
export default function GitHubOAuthHandler() {
    const searchParams = useSearchParams();
    const screenplay = useScreenplay();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const code = searchParams?.get('code');
            const state = searchParams?.get('state');
            
            // Only process if this is a GitHub OAuth callback
            if (!code || state !== 'github_oauth_wryda' || isProcessing) {
                return;
            }

            setIsProcessing(true);
            console.log('[GitHub OAuth] Processing callback...');

            try {
                const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.wryda.ai';

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
                const accessToken = data.access_token;
                
                // Get user info
                const userResponse = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                });
                
                if (!userResponse.ok) throw new Error('Failed to get user info');
                
                const userData = await userResponse.json();
                const username = userData.login;
                
                // Fetch user's repositories
                const reposResponse = await fetch(`${BACKEND_URL}/api/auth/github/repos`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json',
                    },
                });
                
                if (!reposResponse.ok) throw new Error('Failed to fetch repositories');
                
                const repos = await reposResponse.json();
                
                console.log('[GitHub OAuth] ✅ Connected as @' + username);
                console.log('[GitHub OAuth] Found ' + repos.length + ' repositories');
                
                // For now, auto-select the first repository or prompt user
                // TODO: Show repository selection modal if needed
                if (repos.length > 0) {
                    const repo = repos[0];
                    const [owner, repoName] = repo.full_name.split('/');
                    
                    // Connect to screenplay context
                    screenplay?.connect(accessToken, owner, repoName);
                    
                    alert(`✅ Connected to GitHub: ${repo.full_name}\n\nYou can now export your screenplay!`);
                } else {
                    alert('⚠️ No repositories found. Please create a repository on GitHub first.');
                }
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
            } catch (err) {
                console.error('[GitHub OAuth] Error:', err);
                alert('❌ GitHub connection failed: ' + (err.message || 'Unknown error'));
                
                // Clean up URL even on error
                window.history.replaceState({}, document.title, window.location.pathname);
            } finally {
                setIsProcessing(false);
            }
        };
        
        handleOAuthCallback();
    }, [searchParams, screenplay, isProcessing]);

    // This component renders nothing - it just handles the OAuth callback
    return null;
}

