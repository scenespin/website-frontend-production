/**
 * GitHub API Integration for Cloud Save
 * 
 * Provides functions to save and retrieve .fountain files via GitHub API
 * Files are stored in user's private repository
 */

interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
}

interface SaveFileOptions {
    path: string;
    content: string;
    message: string;
    branch?: string;
}

interface GetFileOptions {
    path: string;
    branch?: string;
}

/**
 * Initialize GitHub client with user token
 * Token should be stored securely in user's account
 */
export function initializeGitHub(token: string, owner: string, repo: string): GitHubConfig {
    return {
        token,
        owner,
        repo
    };
}

/**
 * Save a .fountain file to GitHub repository
 * 
 * @param config GitHub configuration
 * @param options File save options
 * @returns Commit SHA
 */
export async function saveToGitHub(
    config: GitHubConfig,
    options: SaveFileOptions
): Promise<string> {
    const { token, owner, repo } = config;
    const { path, content, message, branch = 'main' } = options;
    
    try {
        // First, try to get the existing file to get its SHA (required for updates)
        let sha: string | undefined;
        
        try {
            const getResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (getResponse.ok) {
                const data = await getResponse.json();
                sha = data.sha;
            }
        } catch (err) {
            // File doesn't exist yet, that's okay
            console.log('[GitHub] File does not exist, will create new file');
        }
        
        // Create or update the file
        const body: any = {
            message,
            content: btoa(content), // Base64 encode
            branch
        };
        
        if (sha) {
            body.sha = sha; // Include SHA for updates
        }
        
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[GitHub] File saved successfully:', data.commit.sha);
        
        return data.commit.sha;
        
    } catch (error) {
        console.error('[GitHub] Save failed:', error);
        throw error;
    }
}

/**
 * Retrieve a .fountain file from GitHub repository
 * 
 * @param config GitHub configuration
 * @param options File get options
 * @returns File content
 */
export async function getFromGitHub(
    config: GitHubConfig,
    options: GetFileOptions
): Promise<string> {
    const { token, owner, repo } = config;
    const { path, branch = 'main' } = options;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('File not found');
            }
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        // Decode base64 content
        const content = atob(data.content);
        
        console.log('[GitHub] File retrieved successfully');
        return content;
        
    } catch (error) {
        console.error('[GitHub] Retrieval failed:', error);
        throw error;
    }
}

/**
 * List all .fountain files in the repository
 * 
 * @param config GitHub configuration
 * @param directory Directory to list (default: root)
 * @returns Array of file paths
 */
export async function listFiles(
    config: GitHubConfig,
    directory = ''
): Promise<string[]> {
    const { token, owner, repo } = config;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${directory}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filter for .fountain files
        const fountainFiles = data
            .filter((item: any) => item.type === 'file' && item.name.endsWith('.fountain'))
            .map((item: any) => item.path);
        
        return fountainFiles;
        
    } catch (error) {
        console.error('[GitHub] List files failed:', error);
        throw error;
    }
}

/**
 * Delete a file from GitHub repository
 * 
 * @param config GitHub configuration
 * @param path File path
 * @param message Commit message
 * @returns boolean indicating success
 */
export async function deleteFromGitHub(
    config: GitHubConfig,
    path: string,
    message: string
): Promise<boolean> {
    const { token, owner, repo } = config;
    
    try {
        // Get file SHA (required for deletion)
        const getResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!getResponse.ok) {
            throw new Error('File not found');
        }
        
        const data = await getResponse.json();
        
        // Delete the file
        const deleteResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    sha: data.sha
                })
            }
        );
        
        if (!deleteResponse.ok) {
            const error = await deleteResponse.json();
            throw new Error(`GitHub API error: ${error.message || deleteResponse.statusText}`);
        }
        
        console.log('[GitHub] File deleted successfully');
        return true;
        
    } catch (error) {
        console.error('[GitHub] Delete failed:', error);
        throw error;
    }
}

/**
 * Create a new GitHub repository for screenplay storage
 * 
 * @param token GitHub personal access token
 * @param repoName Repository name
 * @returns Repository data
 */
export async function createScreenplayRepo(
    token: string,
    repoName: string = 'screenplays'
): Promise<{ owner: string; repo: string }> {
    try {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                description: 'Screenplays created with SceneSpin',
                private: true,
                auto_init: true
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            owner: data.owner.login,
            repo: data.name
        };
        
    } catch (error) {
        console.error('[GitHub] Repository creation failed:', error);
        throw error;
    }
}

/**
 * Get the default branch name for a repository
 * 
 * @param config GitHub configuration
 * @returns Default branch name (usually 'main' or 'master')
 */
export async function getDefaultBranch(config: GitHubConfig): Promise<string> {
    const { token, owner, repo } = config;
    
    try {
        console.log(`[GitHub] Getting default branch for ${owner}/${repo}`);
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        console.log(`[GitHub] API response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[GitHub] Repository API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(`Failed to get repository info: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const branch = data.default_branch || 'main';
        console.log(`[GitHub] Default branch detected: ${branch}`);
        return branch;
    } catch (error: any) {
        console.error('[GitHub] Failed to get default branch:', error.message);
        console.log('[GitHub] Falling back to "main"');
        return 'main';
    }
}

/**
 * Get a structure JSON file from /structure/ folder
 * 
 * @param config GitHub configuration
 * @param filename Structure file type
 * @returns Parsed JSON data
 */
export async function getStructureFile<T>(
    config: GitHubConfig,
    filename: 'beats' | 'characters' | 'locations' | 'relationships',
    branch?: string
): Promise<T | null> {
    try {
        // Get default branch if not specified
        const targetBranch = branch || await getDefaultBranch(config);
        const path = `structure/${filename}.json`;
        const content = await getFromGitHub(config, { path, branch: targetBranch });
        return JSON.parse(content) as T;
    } catch (error: any) {
        if (error.message === 'File not found') {
            console.log(`[GitHub] ${filename}.json not found, returning null`);
            return null;
        }
        throw error;
    }
}

/**
 * Save a structure JSON file to /structure/ folder
 * 
 * @param config GitHub configuration
 * @param filename Structure file type
 * @param data Data to save
 * @param message Commit message
 * @returns Commit SHA
 */
export async function saveStructureFile<T>(
    config: GitHubConfig,
    filename: 'beats' | 'characters' | 'locations' | 'relationships',
    data: T,
    message: string,
    branch?: string
): Promise<string> {
    // Get default branch if not specified
    const targetBranch = branch || await getDefaultBranch(config);
    const path = `structure/${filename}.json`;
    const content = JSON.stringify(data, null, 2);
    
    return saveToGitHub(config, {
        path,
        content,
        message,
        branch: targetBranch
    });
}

/**
 * Create a new branch from a base branch
 * 
 * @param config GitHub configuration
 * @param newBranch New branch name
 * @param baseBranch Base branch to branch from
 */
export async function createBranch(
    config: GitHubConfig,
    newBranch: string,
    baseBranch: string = 'main'
): Promise<void> {
    const { token, owner, repo } = config;
    
    try {
        // Get the SHA of the base branch
        const refResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!refResponse.ok) {
            throw new Error(`Failed to get base branch: ${refResponse.statusText}`);
        }
        
        const refData = await refResponse.json();
        const sha = refData.object.sha;
        
        // Create new branch
        const createResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: `refs/heads/${newBranch}`,
                    sha
                })
            }
        );
        
        if (!createResponse.ok) {
            const error = await createResponse.json();
            // Branch might already exist, that's okay
            if (error.message && error.message.includes('already exists')) {
                console.log(`[GitHub] Branch ${newBranch} already exists`);
                return;
            }
            throw new Error(`Failed to create branch: ${error.message || createResponse.statusText}`);
        }
        
        console.log(`[GitHub] Branch ${newBranch} created successfully`);
        
    } catch (error) {
        console.error('[GitHub] Branch creation failed:', error);
        throw error;
    }
}

/**
 * Merge one branch into another
 * 
 * @param config GitHub configuration
 * @param sourceBranch Branch to merge from
 * @param targetBranch Branch to merge into
 * @returns Merge commit SHA
 */
export async function mergeBranch(
    config: GitHubConfig,
    sourceBranch: string,
    targetBranch: string
): Promise<string> {
    const { token, owner, repo } = config;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/merges`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    base: targetBranch,
                    head: sourceBranch,
                    commit_message: `Merge ${sourceBranch} into ${targetBranch}`
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Merge failed: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[GitHub] Merged ${sourceBranch} into ${targetBranch}`);
        
        return data.sha;
        
    } catch (error) {
        console.error('[GitHub] Merge failed:', error);
        throw error;
    }
}

/**
 * Delete a branch
 * 
 * @param config GitHub configuration
 * @param branch Branch name to delete
 */
export async function deleteBranch(
    config: GitHubConfig,
    branch: string
): Promise<void> {
    const { token, owner, repo } = config;
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete branch: ${response.statusText}`);
        }
        
        console.log(`[GitHub] Branch ${branch} deleted`);
        
    } catch (error) {
        console.error('[GitHub] Branch deletion failed:', error);
        throw error;
    }
}

/**
 * Create multiple file changes in a single commit
 * Useful for atomic updates across structure files
 * 
 * @param config GitHub configuration
 * @param files Array of file changes
 * @param message Commit message
 * @param branch Branch to commit to
 * @returns Commit SHA
 */
export async function createMultiFileCommit(
    config: GitHubConfig,
    files: Array<{ path: string; content: string }>,
    message: string,
    branch?: string
): Promise<string> {
    const { token, owner, repo } = config;
    
    try {
        // Get default branch if not specified
        const targetBranch = branch || await getDefaultBranch(config);
        
        // Get the latest commit SHA for the branch
        const refResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${targetBranch}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!refResponse.ok) {
            throw new Error(`Failed to get branch ref: ${refResponse.statusText}`);
        }
        
        const refData = await refResponse.json();
        const latestCommitSha = refData.object.sha;
        
        // Get the tree SHA from the latest commit
        const commitResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!commitResponse.ok) {
            throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
        }
        
        const commitData = await commitResponse.json();
        const baseTreeSha = commitData.tree.sha;
        
        // Create blobs for each file
        const tree = await Promise.all(
            files.map(async (file) => {
                const blobResponse = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            content: file.content,
                            encoding: 'utf-8'
                        })
                    }
                );
                
                if (!blobResponse.ok) {
                    throw new Error(`Failed to create blob for ${file.path}`);
                }
                
                const blobData = await blobResponse.json();
                
                return {
                    path: file.path,
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                };
            })
        );
        
        // Create new tree
        const treeResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    base_tree: baseTreeSha,
                    tree
                })
            }
        );
        
        if (!treeResponse.ok) {
            throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
        }
        
        const treeData = await treeResponse.json();
        
        // Create commit
        const newCommitResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/commits`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    tree: treeData.sha,
                    parents: [latestCommitSha]
                })
            }
        );
        
        if (!newCommitResponse.ok) {
            throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`);
        }
        
        const newCommitData = await newCommitResponse.json();
        
        // Update branch reference
        const updateRefResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sha: newCommitData.sha
                })
            }
        );
        
        if (!updateRefResponse.ok) {
            throw new Error(`Failed to update ref: ${updateRefResponse.statusText}`);
        }
        
        console.log(`[GitHub] Multi-file commit created: ${newCommitData.sha}`);
        return newCommitData.sha;
        
    } catch (error) {
        console.error('[GitHub] Multi-file commit failed:', error);
        throw error;
    }
}

