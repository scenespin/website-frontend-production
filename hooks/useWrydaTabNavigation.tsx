'use client';

import React, { useCallback, useState, useRef, KeyboardEvent, RefObject } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import {
    detectElementType,
    getNextElementType,
    FountainElementType
} from '@/utils/fountain';
import {
    detectSceneHeadingField,
    getNextSceneHeadingField,
    parseSceneHeading,
    TIME_OF_DAY_OPTIONS,
    SceneHeadingField
} from '@/utils/sceneHeadingParser';
import SmartTypeDropdown from '@/components/editor/SmartTypeDropdown';

interface SmartTypeState {
    show: boolean;
    items: Array<{ id: string; label: string; type: 'location' | 'time' }>;
    position: { top: number; left: number };
    field: 'location' | 'time';
    query: string;
}

interface UseWrydaTabNavigationReturn {
    handleTab: (e: KeyboardEvent<HTMLTextAreaElement>) => boolean; // Returns true if handled
    smartTypeDropdown: React.ReactNode | null;
}

/**
 * Wryda Tab Navigation Hook
 * 
 * Implements Final Draft-style Tab key navigation:
 * - Scene headings: Navigate between Type → Location → Time fields
 * - SmartType integration: Show location/time suggestions
 * - Element transitions: Navigate between screenplay elements
 * 
 * Feature flag: NEXT_PUBLIC_WRYDA_TAB (default: false)
 */
export function useWrydaTabNavigation(
    textareaRef: RefObject<HTMLTextAreaElement>
): UseWrydaTabNavigationReturn {
    const { state, setContent, setCursorPosition } = useEditor();
    const screenplay = useScreenplay();
    
    const [smartType, setSmartType] = useState<SmartTypeState | null>(null);
    const smartTypeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Get cursor position in textarea
     */
    const getCursorPosition = useCallback((): number => {
        return textareaRef.current?.selectionStart || 0;
    }, [textareaRef]);

    /**
     * Get current line text and cursor position within line
     */
    const getCurrentLineInfo = useCallback(() => {
        if (!textareaRef.current) return null;
        
        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1] || '';
        const cursorInLine = currentLineText.length;
        
        return {
            currentLineText,
            cursorInLine,
            lineIndex: lines.length - 1,
            cursorPos
        };
    }, [textareaRef, state.content]);

    /**
     * Get dropdown position near cursor
     */
    const getDropdownPosition = useCallback((): { top: number; left: number } => {
        if (!textareaRef.current) return { top: 0, left: 0 };
        
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        
        // Create a temporary range to measure cursor position
        const range = document.createRange();
        const textNode = textarea.firstChild || textarea;
        
        // Approximate position (textarea doesn't support getBoundingClientRect for text positions easily)
        // Use textarea's position + estimate based on line height
        const textareaRect = textarea.getBoundingClientRect();
        const lines = state.content.substring(0, cursorPos).split('\n');
        const lineNumber = lines.length - 1;
        const lineHeight = 24; // Approximate line height
        const charWidth = 8; // Approximate character width
        
        return {
            top: textareaRect.top + (lineNumber * lineHeight) + lineHeight + 5,
            left: textareaRect.left + (lines[lines.length - 1].length * charWidth) + 10
        };
    }, [textareaRef, state.content]);

    /**
     * Show SmartType dropdown for locations
     */
    const showLocationSmartType = useCallback((query: string = '') => {
        const locations = screenplay.locations.map(loc => ({
            id: loc.id,
            label: loc.name,
            type: 'location' as const
        }));
        
        setSmartType({
            show: true,
            items: locations,
            position: getDropdownPosition(),
            field: 'location',
            query
        });
    }, [screenplay.locations, getDropdownPosition]);

    /**
     * Show SmartType dropdown for times
     */
    const showTimeSmartType = useCallback((query: string = '') => {
        const times = TIME_OF_DAY_OPTIONS.map(time => ({
            id: time,
            label: time,
            type: 'time' as const
        }));
        
        setSmartType({
            show: true,
            items: times,
            position: getDropdownPosition(),
            field: 'time',
            query
        });
    }, [getDropdownPosition]);

    /**
     * Close SmartType dropdown
     */
    const closeSmartType = useCallback(() => {
        setSmartType(null);
        if (smartTypeTimeoutRef.current) {
            clearTimeout(smartTypeTimeoutRef.current);
            smartTypeTimeoutRef.current = null;
        }
    }, []);

    /**
     * Handle SmartType selection
     */
    const handleSmartTypeSelect = useCallback((item: { id: string; label: string; type: 'location' | 'time' }) => {
        if (!textareaRef.current || !smartType) return;
        
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1] || '';
        
        if (smartType.field === 'location') {
            // Insert location into scene heading
            const fieldInfo = detectSceneHeadingField(currentLineText, cursorPos);
            const parts = parseSceneHeading(currentLineText);
            
            // Build new scene heading with location inserted
            let newLine = parts.type;
            if (parts.type && !parts.type.endsWith('.')) {
                newLine += '.';
            }
            newLine += ' ' + item.label;
            
            // Add time if it exists
            if (parts.time) {
                newLine += ' - ' + parts.time;
            } else {
                // Add dash and move to time field
                newLine += ' - ';
            }
            
            const newTextBefore = lines.slice(0, -1).concat(newLine).join('\n');
            const newContent = newTextBefore + textAfterCursor;
            setContent(newContent);
            
            // Move cursor to after location (or to time field if dash was added)
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = newTextBefore.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            // If we added the dash, show time SmartType
            if (!parts.time) {
                setTimeout(() => showTimeSmartType(), 100);
            } else {
                closeSmartType();
            }
        } else if (smartType.field === 'time') {
            // Insert time into scene heading
            const fieldInfo = detectSceneHeadingField(currentLineText, cursorPos);
            const parts = parseSceneHeading(currentLineText);
            
            // Build new scene heading with time inserted
            let newLine = parts.type;
            if (parts.type && !parts.type.endsWith('.')) {
                newLine += '.';
            }
            if (parts.location) {
                newLine += ' ' + parts.location;
            }
            newLine += ' - ' + item.label;
            
            const newTextBefore = lines.slice(0, -1).concat(newLine).join('\n');
            const newContent = newTextBefore + textAfterCursor;
            setContent(newContent);
            
            // Move cursor to end of line
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = newTextBefore.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            closeSmartType();
        }
    }, [textareaRef, state.content, smartType, setContent, setCursorPosition, showTimeSmartType, closeSmartType]);

    /**
     * Handle Tab key in scene heading
     */
    const handleSceneHeadingTab = useCallback((
        e: KeyboardEvent<HTMLTextAreaElement>,
        currentLineText: string,
        cursorPos: number
    ): boolean => {
        e.preventDefault();
        
        if (!textareaRef.current) return false;
        
        const fieldInfo = detectSceneHeadingField(currentLineText, cursorPos);
        const parts = fieldInfo.parts;
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        const lines = textBeforeCursor.split('\n');
        
        // Handle type field
        if (fieldInfo.field === 'type') {
            // Complete type if partial (e.g., "INT" -> "INT.")
            let newType = parts.type.toUpperCase();
            if (!newType.endsWith('.')) {
                newType += '.';
            }
            
            // Build new line with completed type
            let newLine = newType;
            if (parts.location) {
                newLine += ' ' + parts.location;
            }
            if (parts.time) {
                newLine += ' - ' + parts.time;
            }
            
            const newTextBefore = lines.slice(0, -1).concat(newLine).join('\n');
            const newContent = newTextBefore + textAfterCursor;
            setContent(newContent);
            
            // Move cursor to location field (after type + space)
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = newTextBefore.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            // Show location SmartType
            setTimeout(() => showLocationSmartType(), 100);
            return true;
        }
        
        // Handle location field
        if (fieldInfo.field === 'location') {
            const locationText = parts.location.trim();
            
            if (locationText) {
                // Location exists, move to time field
                let newType = parts.type;
                if (!newType.endsWith('.')) {
                    newType += '.';
                }
                let newLine = newType + ' ' + locationText;
                
                // Add dash if time doesn't exist
                if (!parts.time) {
                    newLine += ' - ';
                } else {
                    newLine += ' - ' + parts.time;
                }
                
                const newTextBefore = lines.slice(0, -1).concat(newLine).join('\n');
                const newContent = newTextBefore + textAfterCursor;
                setContent(newContent);
                
                // Move cursor to time field (after " - ")
                setTimeout(() => {
                    if (textareaRef.current) {
                        const newPos = newTextBefore.length;
                        textareaRef.current.selectionStart = newPos;
                        textareaRef.current.selectionEnd = newPos;
                        setCursorPosition(newPos);
                    }
                }, 0);
                
                // Show time SmartType
                setTimeout(() => showTimeSmartType(), 100);
            } else {
                // No location yet, show location SmartType
                showLocationSmartType();
            }
            return true;
        }
        
        // Handle time field
        if (fieldInfo.field === 'time') {
            // Show time SmartType
            showTimeSmartType(parts.time);
            return true;
        }
        
        return false;
    }, [textareaRef, state.content, setContent, setCursorPosition, showLocationSmartType, showTimeSmartType]);

    /**
     * Handle Tab key for element transitions
     */
    const handleElementTransition = useCallback((
        e: KeyboardEvent<HTMLTextAreaElement>,
        currentLineText: string,
        elementType: FountainElementType
    ): boolean => {
        e.preventDefault();
        
        const nextType = getNextElementType(elementType);
        const cursorPos = getCursorPosition();
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        const lines = textBeforeCursor.split('\n');
        
        // For dialogue -> character transition, look ahead for next character
        if (elementType === 'dialogue') {
            // Check if there's another character in the scene
            const remainingText = textAfterCursor;
            const remainingLines = remainingText.split('\n');
            
            // Look for next character name (all caps, short line)
            for (let i = 0; i < Math.min(remainingLines.length, 5); i++) {
                const line = remainingLines[i].trim();
                if (line && /^[A-Z\s'0-9#]+$/.test(line) && line.length < 40 && line.length > 1) {
                    // Found next character, move cursor there
                    const linesBefore = textBeforeCursor.split('\n');
                    const targetLineIndex = linesBefore.length + i;
                    const targetPos = state.content.split('\n').slice(0, targetLineIndex).join('\n').length + 1;
                    
                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.selectionStart = targetPos;
                            textareaRef.current.selectionEnd = targetPos;
                            setCursorPosition(targetPos);
                        }
                    }, 0);
                    return true;
                }
            }
        }
        
        // Default: move to next line with appropriate element type
        const newContent = textBeforeCursor + '\n' + textAfterCursor;
        setContent(newContent);
        
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = cursorPos + 1;
                textareaRef.current.selectionStart = newPos;
                textareaRef.current.selectionEnd = newPos;
                setCursorPosition(newPos);
            }
        }, 0);
        
        return true;
    }, [state.content, getCursorPosition, setContent, setCursorPosition]);

    /**
     * Check if a line looks like it could be a scene heading (even if incomplete)
     */
    const looksLikeSceneHeading = useCallback((line: string): boolean => {
        const trimmed = line.trim().toUpperCase();
        // Check if it starts with scene heading prefixes (even without period)
        return /^(INT|EXT|EST|I\/E|INT\/EXT)/.test(trimmed) && trimmed.length <= 20;
    }, []);

    /**
     * Main Tab handler
     */
    const handleTab = useCallback((e: KeyboardEvent<HTMLTextAreaElement>): boolean => {
        console.log('[WrydaTab] handleTab called');
        if (!textareaRef.current) {
            console.log('[WrydaTab] No textarea ref');
            return false;
        }
        
        const lineInfo = getCurrentLineInfo();
        if (!lineInfo) {
            console.log('[WrydaTab] No line info');
            return false;
        }
        
        const elementType = detectElementType(lineInfo.currentLineText);
        console.log('[WrydaTab] Element type detected:', elementType, 'Line:', lineInfo.currentLineText);
        
        // Special case: If line looks like a scene heading but wasn't detected as one,
        // treat it as a scene heading (handles partial inputs like "INT" without period)
        if (elementType !== 'scene_heading' && looksLikeSceneHeading(lineInfo.currentLineText)) {
            console.log('[WrydaTab] Line looks like scene heading, treating as scene heading');
            return handleSceneHeadingTab(e, lineInfo.currentLineText, lineInfo.cursorPos);
        }
        
        // Handle scene heading navigation
        if (elementType === 'scene_heading') {
            console.log('[WrydaTab] Handling scene heading tab');
            return handleSceneHeadingTab(e, lineInfo.currentLineText, lineInfo.cursorPos);
        }
        
        // Handle element transitions
        if (elementType === 'dialogue' || elementType === 'character' || elementType === 'action') {
            console.log('[WrydaTab] Handling element transition:', elementType);
            return handleElementTransition(e, lineInfo.currentLineText, elementType);
        }
        
        console.log('[WrydaTab] No handler for element type:', elementType);
        return false;
    }, [getCurrentLineInfo, handleSceneHeadingTab, handleElementTransition, looksLikeSceneHeading]);

    // Render SmartType dropdown
    const smartTypeDropdown = smartType ? (
        <SmartTypeDropdown
            items={smartType.items}
            position={smartType.position}
            query={smartType.query}
            onSelect={handleSmartTypeSelect}
            onClose={closeSmartType}
        />
    ) : null;

    return {
        handleTab,
        smartTypeDropdown
    };
}

