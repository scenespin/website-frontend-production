/**
 * useDirectorMode Hook
 * 
 * Manages state and logic for Director Mode - expansive scene generation.
 * Director mode generates full scenes (5-15+ lines) vs Chat mode's short snippets.
 */

'use client';

import { useState, useCallback } from 'react';
import { useChatContext } from '@/components/agents/context/useChatContext';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDirectorModeReturn {
    // State
    lastGeneratedScene: string | null;
    
    // Actions
    setLastGeneratedScene: (scene: string | null) => void;
    
    // Helpers
    isScreenplayContent: (content: string) => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDirectorMode(): UseDirectorModeReturn {
    const chatContext = useChatContext();
    const state = chatContext.state;
    
    // Track last generated scene for "Insert" button
    const [lastGeneratedScene, setLastGeneratedScene] = useState<string | null>(null);
    
    // ============================================================================
    // CONTENT DETECTION
    // ============================================================================
    
    /**
     * Helper function to detect if content is screenplay text (not discussion/advice)
     * Director mode almost always produces screenplay, but this provides safety
     */
    const isScreenplayContent = useCallback((content: string): boolean => {
        // Trim for accurate detection
        const trimmed = content.trim();
        
        // Empty or very short responses are probably not useful
        if (trimmed.length < 20) {
            return false;
        }
        
        // Check for CLEAR non-screenplay indicators (advice, discussion, questions)
        
        // 1. Questions (asking user for input)
        const hasQuestions = /\?/g.test(trimmed) && (trimmed.match(/\?/g) || []).length >= 2;
        const startsWithQuestion = /^(How|What|Where|When|Why|Should|Would|Could|Can|Do you|Are you|Is this)/i.test(trimmed);
        
        // 2. Advice/instruction language
        const hasAdviceLanguage = /\b(you should|you could|you might|try to|consider|think about|let me know|if you want|would you like|feel free|here to help|happy to help)\b/i.test(trimmed);
        
        // 3. Lists (numbered or bulleted)
        const hasNumberedList = /^\d+\./m.test(trimmed);
        const hasBulletPoints = /^[-•*]\s/m.test(trimmed);
        
        // 4. Explanation/meta-commentary starters
        const hasExplanationIntro = /^(To |Here's |This |If you|Sure,|Okay,|Alright,|Let me|I can|I'll|I've|I think|I would)/i.test(trimmed);
        
        // 5. Meta-commentary about writing/story
        const hasMetaCommentary = /\b(this could|this would|this might|the scene could|the character should|you can have|to make this|to add|for this scene)\b/i.test(trimmed);
        
        // If ANY of these are true, it's NOT screenplay
        if (hasQuestions || startsWithQuestion || hasAdviceLanguage || hasNumberedList || hasBulletPoints || hasExplanationIntro || hasMetaCommentary) {
            return false;
        }
        
        // Everything else is screenplay! 
        // (Descriptive prose, action lines, dialogue, scene descriptions, etc.)
        return true;
    }, []);
    
    // ============================================================================
    // RETURN
    // ============================================================================
    
    return {
        // State
        lastGeneratedScene,
        
        // Actions
        setLastGeneratedScene,
        
        // Helpers
        isScreenplayContent
    };
}

