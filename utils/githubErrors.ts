/**
 * GitHub Error Handling Utilities
 * 
 * Provides user-friendly error messages and retry logic for GitHub API operations
 */

export class GitHubError extends Error {
    code: string;
    statusCode?: number;
    retryable: boolean;
    userMessage: string;

    constructor(
        message: string,
        code: string,
        statusCode?: number,
        retryable: boolean = false
    ) {
        super(message);
        this.name = 'GitHubError';
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.userMessage = this.getUserFriendlyMessage();
    }

    private getUserFriendlyMessage(): string {
        switch (this.code) {
            case 'AUTH_FAILED':
                return 'GitHub authentication failed. Please check your Personal Access Token and try reconnecting.';
            
            case 'REPO_NOT_FOUND':
                return 'Repository not found. Please check the repository name and ensure you have access to it.';
            
            case 'RATE_LIMIT':
                return 'GitHub API rate limit exceeded. Please wait a few minutes and try again.';
            
            case 'NETWORK_ERROR':
                return 'Network connection failed. Please check your internet connection and try again.';
            
            case 'PERMISSION_DENIED':
                return 'Permission denied. Your Personal Access Token needs the "repo" scope to make changes.';
            
            case 'FILE_TOO_LARGE':
                return 'File is too large for GitHub API. Consider splitting your screenplay into multiple files.';
            
            case 'MERGE_CONFLICT':
                return 'Someone else has made changes to this file. Please refresh and try again.';
            
            case 'BRANCH_NOT_FOUND':
                return 'Branch not found. The branch may have been deleted.';
            
            case 'COMMIT_FAILED':
                return 'Failed to save changes to GitHub. Please try again.';
            
            default:
                return `GitHub error: ${this.message}`;
        }
    }
}

/**
 * Parse GitHub API error response
 */
export function parseGitHubError(error: any): GitHubError {
    // Network errors
    if (error instanceof TypeError || error.message === 'Failed to fetch') {
        return new GitHubError(
            'Network connection failed',
            'NETWORK_ERROR',
            undefined,
            true // retryable
        );
    }

    // GitHub API errors
    if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        switch (status) {
            case 401:
            case 403:
                if (message.toLowerCase().includes('rate limit')) {
                    return new GitHubError(
                        'Rate limit exceeded',
                        'RATE_LIMIT',
                        status,
                        true
                    );
                }
                return new GitHubError(
                    'Authentication failed',
                    'AUTH_FAILED',
                    status,
                    false
                );

            case 404:
                if (message.toLowerCase().includes('branch')) {
                    return new GitHubError(
                        'Branch not found',
                        'BRANCH_NOT_FOUND',
                        status,
                        false
                    );
                }
                return new GitHubError(
                    'Repository not found',
                    'REPO_NOT_FOUND',
                    status,
                    false
                );

            case 409:
                return new GitHubError(
                    'Merge conflict detected',
                    'MERGE_CONFLICT',
                    status,
                    true
                );

            case 422:
                if (message.toLowerCase().includes('too large')) {
                    return new GitHubError(
                        'File too large',
                        'FILE_TOO_LARGE',
                        status,
                        false
                    );
                }
                return new GitHubError(
                    'Invalid request',
                    'INVALID_REQUEST',
                    status,
                    false
                );

            case 500:
            case 502:
            case 503:
            case 504:
                return new GitHubError(
                    'GitHub server error',
                    'SERVER_ERROR',
                    status,
                    true
                );

            default:
                return new GitHubError(
                    message,
                    'UNKNOWN_ERROR',
                    status,
                    false
                );
        }
    }

    // Unknown errors
    return new GitHubError(
        error.message || 'Unknown error occurred',
        'UNKNOWN_ERROR',
        undefined,
        false
    );
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            const githubError = parseGitHubError(error);
            
            // Don't retry if error is not retryable
            if (!githubError.retryable) {
                throw githubError;
            }

            // Don't retry on last attempt
            if (attempt === maxRetries - 1) {
                throw githubError;
            }

            // Wait with exponential backoff
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`[GitHub] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw parseGitHubError(lastError!);
}

/**
 * Offline queue for failed operations
 */
interface QueuedOperation {
    id: string;
    type: 'save' | 'commit' | 'update';
    data: any;
    timestamp: number;
    attempts: number;
}

class OfflineQueue {
    private static STORAGE_KEY = 'github_offline_queue';
    private static MAX_ATTEMPTS = 5;

    static add(type: QueuedOperation['type'], data: any): string {
        const queue = this.getQueue();
        const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        queue.push({
            id,
            type,
            data,
            timestamp: Date.now(),
            attempts: 0
        });

        this.saveQueue(queue);
        return id;
    }

    static async processQueue(
        handler: (op: QueuedOperation) => Promise<void>
    ): Promise<{ success: number; failed: number }> {
        const queue = this.getQueue();
        let success = 0;
        let failed = 0;

        for (const operation of queue) {
            try {
                await handler(operation);
                this.remove(operation.id);
                success++;
            } catch (error) {
                operation.attempts++;
                
                if (operation.attempts >= this.MAX_ATTEMPTS) {
                    console.error(`[OfflineQueue] Max attempts reached for ${operation.id}`, error);
                    this.remove(operation.id);
                    failed++;
                } else {
                    console.warn(`[OfflineQueue] Retry ${operation.attempts}/${this.MAX_ATTEMPTS} for ${operation.id}`);
                }
            }
        }

        this.saveQueue(queue);
        return { success, failed };
    }

    static getQueue(): QueuedOperation[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    static remove(id: string): void {
        const queue = this.getQueue().filter(op => op.id !== id);
        this.saveQueue(queue);
    }

    static clear(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    private static saveQueue(queue: QueuedOperation[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('[OfflineQueue] Failed to save queue', error);
        }
    }
}

export { OfflineQueue };

/**
 * Validate GitHub configuration
 */
export function validateGitHubConfig(config: {
    token?: string;
    owner?: string;
    repo?: string;
    branch?: string;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.token || config.token.trim().length === 0) {
        errors.push('Personal Access Token is required');
    } else if (!config.token.startsWith('ghp_') && !config.token.startsWith('github_pat_')) {
        errors.push('Invalid Personal Access Token format');
    }

    if (!config.owner || config.owner.trim().length === 0) {
        errors.push('Repository owner is required');
    }

    if (!config.repo || config.repo.trim().length === 0) {
        errors.push('Repository name is required');
    }

    if (!config.branch || config.branch.trim().length === 0) {
        errors.push('Branch name is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Wait for online status
 */
export function waitForOnline(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
        if (navigator.onLine) {
            resolve(true);
            return;
        }

        const timer = setTimeout(() => {
            window.removeEventListener('online', onlineHandler);
            resolve(false);
        }, timeout);

        const onlineHandler = () => {
            clearTimeout(timer);
            window.removeEventListener('online', onlineHandler);
            resolve(true);
        };

        window.addEventListener('online', onlineHandler);
    });
}

