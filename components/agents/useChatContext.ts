/**
 * Hook to access ChatContext
 * 
 * Must be used within a ChatProvider
 */

'use client';

import { useContext } from 'react';
import { ChatContext, type ChatContextValue } from './ChatContext';

/**
 * Access the ChatContext
 * @throws Error if used outside ChatProvider
 */
export function useChatContext(): ChatContextValue {
    const context = useContext(ChatContext);
    
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    
    return context;
}

