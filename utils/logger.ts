/**
 * Frontend Logging Utility
 * 
 * Lightweight logging wrapper that respects environment settings.
 * 
 * Features:
 * - Environment-based logging (verbose in dev, minimal in prod)
 * - No performance overhead in production
 * - Optional error reporting integration (Sentry)
 * - Consistent API with backend logger
 */

interface LogMetadata {
    component?: string;
    hook?: string;
    page?: string;
    userId?: string;
    error?: string;
    [key: string]: any;
}

class Logger {
    private isDevelopment: boolean;
    private logLevel: string;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || (this.isDevelopment ? 'debug' : 'error');
    }

    /**
     * Check if a log level should be output
     */
    private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel as keyof typeof levels] || levels.info;
        const messageLevel = levels[level];

        return messageLevel >= currentLevel;
    }

    /**
     * Format log message with metadata
     */
    private formatMessage(message: string, metadata?: LogMetadata): string {
        if (!metadata || Object.keys(metadata).length === 0) {
            return message;
        }

        const metaStr = Object.entries(metadata)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(' ');

        return `${message} | ${metaStr}`;
    }

    /**
     * Sanitize sensitive data from logs
     */
    private sanitize(metadata?: LogMetadata): LogMetadata | undefined {
        if (!metadata) return metadata;

        const sanitized = { ...metadata };
        const sensitiveFields = ['password', 'token', 'apiKey', 'authorization'];

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    /**
     * Debug level - verbose information for development only
     * Completely disabled in production
     */
    debug(message: string, metadata?: LogMetadata): void {
        if (!this.shouldLog('debug')) return;

        if (this.isDevelopment) {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] ${this.formatMessage(message, this.sanitize(metadata))}`);
        }
    }

    /**
     * Info level - general application flow
     * Disabled in production
     */
    info(message: string, metadata?: LogMetadata): void {
        if (!this.shouldLog('info')) return;

        if (this.isDevelopment) {
            // eslint-disable-next-line no-console
            console.info(`[INFO] ${this.formatMessage(message, this.sanitize(metadata))}`);
        }
    }

    /**
     * Warn level - potentially harmful situations
     * Visible in production
     */
    warn(message: string, metadata?: LogMetadata): void {
        if (!this.shouldLog('warn')) return;

        // eslint-disable-next-line no-console
        console.warn(`[WARN] ${this.formatMessage(message, this.sanitize(metadata))}`);
    }

    /**
     * Error level - error events
     * Always visible, even in production
     * 
     * In production, these should also go to error tracking service (Sentry)
     */
    error(message: string, metadata?: LogMetadata): void {
        if (!this.shouldLog('error')) return;

        const sanitizedMetadata = this.sanitize(metadata);
        
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${this.formatMessage(message, sanitizedMetadata)}`, sanitizedMetadata);

        // TODO: Send to error tracking service in production
        // if (typeof window !== 'undefined' && window.Sentry && !this.isDevelopment) {
        //     window.Sentry.captureException(new Error(message), {
        //         extra: sanitizedMetadata
        //     });
        // }
    }

    /**
     * Create a child logger with persistent metadata
     * Useful for component-level logging
     */
    child(persistentMetadata: LogMetadata): Logger {
        const childLogger = new Logger();
        const originalMethods = {
            debug: childLogger.debug.bind(childLogger),
            info: childLogger.info.bind(childLogger),
            warn: childLogger.warn.bind(childLogger),
            error: childLogger.error.bind(childLogger)
        };

        // Merge persistent metadata with each call
        childLogger.debug = (message: string, metadata?: LogMetadata) =>
            originalMethods.debug(message, { ...persistentMetadata, ...metadata });
        childLogger.info = (message: string, metadata?: LogMetadata) =>
            originalMethods.info(message, { ...persistentMetadata, ...metadata });
        childLogger.warn = (message: string, metadata?: LogMetadata) =>
            originalMethods.warn(message, { ...persistentMetadata, ...metadata });
        childLogger.error = (message: string, metadata?: LogMetadata) =>
            originalMethods.error(message, { ...persistentMetadata, ...metadata });

        return childLogger;
    }
}

// Export singleton instance
const logger = new Logger();
export default logger;

// Also export class for testing
export { Logger };

// Export type for TypeScript users
export type { LogMetadata };

