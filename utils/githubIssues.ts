/**
 * GitHub Issues API Integration
 * 
 * Manages character and location entities as GitHub Issues
 * with custom fields for tracking
 */

import type { CharacterIssueFields, LocationIssueFields } from '@/types/screenplay';

interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
}

interface Issue {
    number: number;
    title: string;
    body: string;
    labels: string[];
    state: 'open' | 'closed';
    html_url: string;
}

/**
 * Create a GitHub Issue for a character
 * 
 * @param config GitHub configuration
 * @param character Character data
 * @returns Issue number
 */
export async function createCharacterIssue(
    config: GitHubConfig,
    character: {
        name: string;
        type: 'lead' | 'supporting' | 'minor';
        description?: string;
        firstAppearance?: string;
        arcStatus: 'introduced' | 'developing' | 'resolved';
    }
): Promise<number> {
    const { token, owner, repo } = config;
    
    // Build issue body with custom fields
    const customFields: CharacterIssueFields = {
        entity_type: 'character',
        protagonist_level: character.type,
        first_appearance: character.firstAppearance,
        arc_status: character.arcStatus
    };
    
    const body = `${character.description || 'No description provided'}

---
**Custom Fields:**
\`\`\`json
${JSON.stringify(customFields, null, 2)}
\`\`\`
`;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: `Character: ${character.name}`,
                    body,
                    labels: ['character', `type:${character.type}`, `arc:${character.arcStatus}`]
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create issue: ${error.message || response.statusText}`);
        }
        
        const data: Issue = await response.json();
        console.log(`[GitHub Issues] Created character issue #${data.number} for ${character.name}`);
        
        return data.number;
        
    } catch (error) {
        console.error('[GitHub Issues] Character issue creation failed:', error);
        throw error;
    }
}

/**
 * Create a GitHub Issue for a location
 * 
 * @param config GitHub configuration
 * @param location Location data
 * @returns Issue number
 */
export async function createLocationIssue(
    config: GitHubConfig,
    location: {
        name: string;
        type: 'INT' | 'EXT' | 'INT/EXT';
        description?: string;
        productionNotes?: string;
        sceneCount: number;
    }
): Promise<number> {
    const { token, owner, repo } = config;
    
    // Build issue body with custom fields
    const customFields: LocationIssueFields = {
        entity_type: 'location',
        location_type: location.type,
        scene_count: location.sceneCount,
        production_notes: location.productionNotes
    };
    
    const body = `${location.description || 'No description provided'}

---
**Custom Fields:**
\`\`\`json
${JSON.stringify(customFields, null, 2)}
\`\`\`
`;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: `Location: ${location.name}`,
                    body,
                    labels: ['location', `type:${location.type}`]
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create issue: ${error.message || response.statusText}`);
        }
        
        const data: Issue = await response.json();
        console.log(`[GitHub Issues] Created location issue #${data.number} for ${location.name}`);
        
        return data.number;
        
    } catch (error) {
        console.error('[GitHub Issues] Location issue creation failed:', error);
        throw error;
    }
}

/**
 * Update a GitHub Issue
 * 
 * @param config GitHub configuration
 * @param issueNumber Issue number
 * @param updates Update data
 */
export async function updateIssue(
    config: GitHubConfig,
    issueNumber: number,
    updates: {
        title?: string;
        body?: string;
        labels?: string[];
        state?: 'open' | 'closed';
    }
): Promise<void> {
    const { token, owner, repo } = config;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to update issue: ${error.message || response.statusText}`);
        }
        
        console.log(`[GitHub Issues] Updated issue #${issueNumber}`);
        
    } catch (error) {
        console.error('[GitHub Issues] Issue update failed:', error);
        throw error;
    }
}

/**
 * Close a GitHub Issue with a reason
 * 
 * @param config GitHub configuration
 * @param issueNumber Issue number
 * @param reason Reason for closing
 */
export async function closeIssue(
    config: GitHubConfig,
    issueNumber: number,
    reason: 'removed' | 'consolidated',
    comment?: string
): Promise<void> {
    const { token, owner, repo } = config;
    
    try {
        // Add comment if provided
        if (comment) {
            await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        body: `**${reason === 'removed' ? 'Removed' : 'Consolidated'}**: ${comment}`
                    })
                }
            );
        }
        
        // Close the issue
        await updateIssue(config, issueNumber, {
            state: 'closed',
            labels: [reason]
        });
        
        console.log(`[GitHub Issues] Closed issue #${issueNumber} (${reason})`);
        
    } catch (error) {
        console.error('[GitHub Issues] Issue close failed:', error);
        throw error;
    }
}

/**
 * Get a GitHub Issue by number
 * 
 * @param config GitHub configuration
 * @param issueNumber Issue number
 * @returns Issue data
 */
export async function getIssue(
    config: GitHubConfig,
    issueNumber: number
): Promise<Issue> {
    const { token, owner, repo } = config;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get issue: ${error.message || response.statusText}`);
        }
        
        const data: Issue = await response.json();
        return data;
        
    } catch (error) {
        console.error('[GitHub Issues] Get issue failed:', error);
        throw error;
    }
}

/**
 * Get all issues with a specific label
 * 
 * @param config GitHub configuration
 * @param label Label to filter by
 * @returns Array of issues
 */
export async function getIssuesByLabel(
    config: GitHubConfig,
    label: string
): Promise<Issue[]> {
    const { token, owner, repo } = config;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues?labels=${label}&state=all`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get issues: ${error.message || response.statusText}`);
        }
        
        const data: Issue[] = await response.json();
        return data;
        
    } catch (error) {
        console.error('[GitHub Issues] Get issues by label failed:', error);
        throw error;
    }
}

/**
 * Extract custom fields from issue body
 * 
 * @param issueBody Issue body text
 * @returns Parsed custom fields or null
 */
export function extractCustomFields<T>(issueBody: string): T | null {
    try {
        // Find JSON block in markdown code fence
        const jsonMatch = issueBody.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) return null;
        
        return JSON.parse(jsonMatch[1]) as T;
    } catch (error) {
        console.error('[GitHub Issues] Failed to extract custom fields:', error);
        return null;
    }
}

