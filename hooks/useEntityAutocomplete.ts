'use client';

import { useState, useCallback, RefObject } from 'react';
import { useEditor } from '@/contexts/EditorContext';

interface AutocompleteState {
    show: boolean;
    query: string;
    position: { top: number; left: number };
    onSelect: (entityName: string, entityId: string, entityType: 'character' | 'location') => void;
    onClose: () => void;
}

interface UseEntityAutocompleteReturn {
    autocomplete: AutocompleteState;
    checkForMention: (content: string, cursorPos: number, textarea: HTMLTextAreaElement) => void;
}

/**
 * Custom hook to handle @ mention autocomplete functionality
 * Extracts entity autocomplete logic from FountainEditor
 * 
 * @param textareaRef - Reference to the textarea element
 */
export function useEntityAutocomplete(
    textareaRef: RefObject<HTMLTextAreaElement>
): UseEntityAutocompleteReturn {
    const { setContent, setCursorPosition } = useEditor();
    
    // Autocomplete state
    const [showEntityAutocomplete, setShowEntityAutocomplete] = useState(false);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');
    const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
    const [atSymbolPosition, setAtSymbolPosition] = useState<number | null>(null);
    
    /**
     * Check for @ mention trigger
     * Looks backwards from cursor to find '@' symbol
     */
    const checkForMention = useCallback((content: string, cursorPos: number, textarea: HTMLTextAreaElement) => {
        // Look backwards from cursor to find '@'
        let atPos = cursorPos - 1;
        let query = '';
        
        // Search backwards for '@' or whitespace/newline
        while (atPos >= 0) {
            const char = content[atPos];
            
            if (char === '@') {
                // Found '@' symbol
                query = content.substring(atPos + 1, cursorPos);
                
                // Calculate position for autocomplete dropdown
                const lines = content.substring(0, cursorPos).split('\n');
                const currentLineNum = lines.length - 1;
                const currentLineText = lines[currentLineNum];
                const charOffset = currentLineText.length;
                
                // Approximate position (will be refined with actual measurements)
                const lineHeight = 24;
                const charWidth = 8.4;
                const top = (currentLineNum * lineHeight) + 30;
                const left = (charOffset * charWidth) + 20;
                
                setAtSymbolPosition(atPos);
                setAutocompleteQuery(query);
                setAutocompletePosition({ top, left });
                setShowEntityAutocomplete(true);
                return;
            }
            
            if (char === ' ' || char === '\n' || char === '\t') {
                // Hit whitespace before finding '@'
                break;
            }
            
            atPos--;
        }
        
        // No '@' found or cursor moved away
        setShowEntityAutocomplete(false);
    }, []);
    
    /**
     * Handle entity selection from autocomplete
     */
    const handleEntitySelect = useCallback((entityName: string, entityId: string, entityType: 'character' | 'location') => {
        if (atSymbolPosition === null || !textareaRef.current) {
            setShowEntityAutocomplete(false);
            return;
        }
        
        // Get current content
        const currentContent = textareaRef.current.value;
        const cursorPos = textareaRef.current.selectionStart;
        
        // Replace from '@' to cursor with entity name
        const before = currentContent.substring(0, atSymbolPosition);
        const after = currentContent.substring(cursorPos);
        const newContent = before + entityName.toUpperCase() + after;
        
        // Update content
        setContent(newContent);
        
        // Set cursor after inserted name
        const newCursorPos = atSymbolPosition + entityName.length;
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                setCursorPosition(newCursorPos);
            }
        }, 0);
        
        // Close autocomplete
        setShowEntityAutocomplete(false);
        setAtSymbolPosition(null);
        
        // TODO: Update relationships.json when we know which scene this is
        console.log(`[useEntityAutocomplete] Inserted ${entityType}: ${entityName} (${entityId})`);
    }, [atSymbolPosition, textareaRef, setContent, setCursorPosition]);
    
    /**
     * Close autocomplete
     */
    const handleClose = useCallback(() => {
        setShowEntityAutocomplete(false);
        setAtSymbolPosition(null);
    }, []);
    
    return {
        autocomplete: {
            show: showEntityAutocomplete,
            query: autocompleteQuery,
            position: autocompletePosition,
            onSelect: handleEntitySelect,
            onClose: handleClose
        },
        checkForMention
    };
}

