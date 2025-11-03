/**
 * Frontend Logger Type Definitions
 */

/**
 * Metadata that can be attached to log entries
 */
export interface LogMetadata {
    // Component identification
    component?: string;
    hook?: string;
    page?: string;
    
    // User context
    userId?: string;
    
    // Error context
    error?: string;
    errorCode?: string;
    stack?: string;
    
    // UI context
    action?: string;
    state?: any;
    
    // API context
    endpoint?: string;
    statusCode?: number;
    duration?: number;
    
    // Additional context
    [key: string]: any;
}

/**
 * Logger interface
 */
export interface Logger {
    debug(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, metadata?: LogMetadata): void;
    child(metadata: LogMetadata): Logger;
}

