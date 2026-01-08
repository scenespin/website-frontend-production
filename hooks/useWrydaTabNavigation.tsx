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
    formatSceneHeadingType,
    buildSceneHeading,
    updateSceneHeadingParts,
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
    isSmartTypeOpen: boolean; // Expose whether dropdown is open
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
     * Shows above cursor if near bottom of screen, otherwise below
     * Accounts for mobile keyboard using visualViewport
     */
    const getDropdownPosition = useCallback((): { top: number; left: number; above?: boolean } => {
        if (!textareaRef.current) return { top: 0, left: 0 };
        
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        
        // Get textarea position
        const textareaRect = textarea.getBoundingClientRect();
        const lines = state.content.substring(0, cursorPos).split('\n');
        const lineNumber = lines.length - 1;
        const currentLineText = lines[lines.length - 1] || '';
        const cursorInLine = currentLineText.length;
        
        // Get actual line height from computed style
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
        const fontSize = parseFloat(computedStyle.fontSize) || 16;
        const charWidth = fontSize * 0.6; // More accurate character width estimate (monospace)
        
        // Account for padding
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        
        // Calculate cursor position
        const lineTop = textareaRect.top + paddingTop + (lineNumber * lineHeight);
        const cursorLeft = textareaRect.left + paddingLeft + (cursorInLine * charWidth);
        
        // Use visualViewport on mobile to account for keyboard
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const viewportTop = window.visualViewport?.offsetTop || 0;
        
        const dropdownHeight = 256; // max-h-64 = 256px
        const spaceBelow = viewportHeight - (lineTop - viewportTop) - lineHeight;
        const spaceAbove = lineTop - viewportTop;
        
        // On mobile, prefer showing above to avoid keyboard
        const isMobile = window.innerWidth < 768;
        const showAbove = isMobile 
            ? (spaceBelow < dropdownHeight + 50 || spaceAbove > spaceBelow) // Prefer above on mobile
            : (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight);
        
        const baseTop = lineTop + lineHeight;
        
        // Calculate position
        let top = showAbove 
            ? baseTop - dropdownHeight - 5  // Show above with 5px gap
            : baseTop + 5;                    // Show below with 5px gap
        let left = cursorLeft + 10; // Position at cursor + small offset
        
        // Ensure dropdown stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dropdownWidth = 288; // w-72 = 288px
        
        // Clamp left position to viewport
        if (left + dropdownWidth > viewportWidth - 20) {
            left = viewportWidth - dropdownWidth - 20;
        }
        if (left < 10) {
            left = 10;
        }
        
        // Clamp top position to viewport
        if (top < 10) {
            top = 10;
        }
        if (top + dropdownHeight > viewportHeight - 10) {
            top = viewportHeight - dropdownHeight - 10;
        }
        
        return {
            top,
            left,
            above: showAbove
        };
    }, [textareaRef, state.content]);

    /**
     * Show SmartType dropdown for locations
     * Sorts locations by INT/EXT type matching current scene heading
     */
    const showLocationSmartType = useCallback((query: string = '') => {
        if (!textareaRef.current) return;
        
        // Get current scene heading type to match locations
        const lineInfo = getCurrentLineInfo();
        let currentSceneType: 'INT' | 'EXT' | 'INT/EXT' | null = null;
        
        if (lineInfo) {
            const parts = parseSceneHeading(lineInfo.currentLineText);
            const typeUpper = parts.type.toUpperCase();
            if (typeUpper.includes('INT/EXT') || typeUpper.includes('I/E')) {
                currentSceneType = 'INT/EXT';
            } else if (typeUpper.startsWith('EXT')) {
                currentSceneType = 'EXT';
            } else if (typeUpper.startsWith('INT')) {
                currentSceneType = 'INT';
            }
        }
        
        // Map and sort locations: matching type first, then others
        const locations = screenplay.locations
            .map(loc => ({
                id: loc.id,
                label: loc.name,
                type: 'location' as const,
                locationType: loc.type || null as 'INT' | 'EXT' | 'INT/EXT' | null
            }))
            .sort((a, b) => {
                // If we have a current scene type, prioritize matching locations
                if (currentSceneType) {
                    const aMatches = a.locationType === currentSceneType;
                    const bMatches = b.locationType === currentSceneType;
                    if (aMatches && !bMatches) return -1;
                    if (!aMatches && bMatches) return 1;
                }
                // Then sort by INT, EXT, INT/EXT, then null
                const typeOrder = { 'INT': 0, 'EXT': 1, 'INT/EXT': 2, null: 3 };
                const aOrder = typeOrder[a.locationType || null];
                const bOrder = typeOrder[b.locationType || null];
                if (aOrder !== bOrder) return aOrder - bOrder;
                // Finally alphabetically
                return a.label.localeCompare(b.label);
            })
            .map(loc => ({
                id: loc.id,
                label: loc.label,
                type: 'location' as const
            }));
        
        const position = getDropdownPosition();
        console.log('[WrydaTab] showLocationSmartType:', {
            locationsCount: locations.length,
            position,
            query
        });
        
        setSmartType({
            show: true,
            items: locations,
            position,
            field: 'location',
            query
        });
    }, [screenplay.locations, getDropdownPosition, getCurrentLineInfo]);

    /**
     * Show SmartType dropdown for times
     */
    const showTimeSmartType = useCallback((query: string = '') => {
        const times = TIME_OF_DAY_OPTIONS.map(time => ({
            id: time,
            label: time,
            type: 'time' as const
        }));
        
        const position = getDropdownPosition();
        console.log('[WrydaTab] showTimeSmartType:', {
            timesCount: times.length,
            position,
            query
        });
        
        setSmartType({
            show: true,
            items: times,
            position,
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
            // Insert location into scene heading - rebuild from scratch to avoid formatting issues
            const parts = parseSceneHeading(currentLineText);
            
            // Clean location - remove any trailing dashes or spaces that might cause double dashes
            const cleanLocation = item.label.trim().replace(/[\s-]+$/, '');
            
            // Update parts with new location and formatted type
            const updatedParts = updateSceneHeadingParts(parts, {
                location: cleanLocation,
                type: formatSceneHeadingType(parts.type) // Ensure type is formatted
            });
            
            // Build scene heading - add time if it exists, otherwise add dash for time field
            let newLine = buildSceneHeading(updatedParts);
            if (!parts.time || !parts.time.trim() || parts.time.trim().endsWith('-')) {
                // No time yet, add dash for time field
                newLine += ' - ';
            }
            
            const newTextBefore = lines.slice(0, -1).concat(newLine).join('\n');
            const newContent = newTextBefore + textAfterCursor;
            setContent(newContent);
            
            // Move cursor to time field (after " - ") if we added the dash
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = newTextBefore.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            // Always show time SmartType after selecting location (unless time already exists)
            if (!parts.time || !parts.time.trim() || parts.time.trim().endsWith('-')) {
                setTimeout(() => showTimeSmartType(), 100);
            } else {
                closeSmartType();
            }
        } else if (smartType.field === 'time') {
            // Insert time into scene heading - rebuild from scratch to avoid double dashes
            const parts = parseSceneHeading(currentLineText);
            
            // Update parts with new time and formatted type
            const updatedParts = updateSceneHeadingParts(parts, {
                time: item.label,
                type: formatSceneHeadingType(parts.type), // Ensure type is formatted
                location: parts.location?.trim().replace(/[\s-]+$/, '') || '' // Clean location
            });
            
            // Build complete scene heading
            const newLine = buildSceneHeading(updatedParts);
            
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
            // Complete type according to industry standards
            // INT → INT., INT/EXT → INT./EXT., I/E → I./E.
            const updatedParts = updateSceneHeadingParts(parts, {
                type: formatSceneHeadingType(parts.type)
            });
            
            // Build complete scene heading
            const newLine = buildSceneHeading(updatedParts);
            
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
            
            // Show location SmartType (just show dropdown, don't auto-select)
            setTimeout(() => showLocationSmartType(), 100);
            return true;
        }
        
        // Handle location field
        if (fieldInfo.field === 'location') {
            const locationText = parts.location.trim();
            
            // Format type according to industry standards (handles lowercase "int/ext" → "INT./EXT.")
            const formattedType = formatSceneHeadingType(parts.type);
            
            if (locationText) {
                // Location exists, move to time field
                // Clean location and build scene heading
                const cleanLocation = locationText.trim().replace(/[\s-]+$/, '');
                const updatedParts = updateSceneHeadingParts(parts, {
                    type: formattedType,
                    location: cleanLocation
                });
                
                // Build scene heading - add dash if time doesn't exist
                let newLine = buildSceneHeading(updatedParts);
                if (!parts.time || !parts.time.trim()) {
                    newLine += ' - ';
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
                // No location yet, show location SmartType dropdown (user can select)
                // Don't auto-select - let user choose
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
     * Main Tab handler
     * Always prevents default to keep focus in editor
     * On mobile: Only handles scene headings, skips element transitions and new line creation
     */
    const handleTab = useCallback((e: KeyboardEvent<HTMLTextAreaElement>): boolean => {
        console.log('[WrydaTab] handleTab called');
        e.preventDefault(); // Always prevent default to avoid focus navigation
        
        // Detect mobile (screen width < 768px)
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        
        if (!textareaRef.current) {
            console.log('[WrydaTab] No textarea ref');
            return true; // Still handled (prevented default)
        }
        
        const lineInfo = getCurrentLineInfo();
        if (!lineInfo) {
            console.log('[WrydaTab] No line info');
            // On mobile, don't create new lines - just prevent default
            if (isMobile) {
                console.log('[WrydaTab] Mobile: Skipping new line creation for empty line');
                return true; // Handled (prevented default), but do nothing
            }
            // Desktop: create new line
            const cursorPos = getCursorPosition();
            const textBeforeCursor = state.content.substring(0, cursorPos);
            const textAfterCursor = state.content.substring(cursorPos);
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
        }
        
        const elementType = detectElementType(lineInfo.currentLineText);
        console.log('[WrydaTab] Element type detected:', elementType, 'Line:', lineInfo.currentLineText, 'Mobile:', isMobile);
        
        // Handle scene heading navigation (works on both mobile and desktop)
        // detectElementType now handles partial inputs like "INT" without period, "int/ext", "i/e"
        if (elementType === 'scene_heading') {
            console.log('[WrydaTab] Handling scene heading tab');
            return handleSceneHeadingTab(e, lineInfo.currentLineText, lineInfo.cursorPos);
        }
        
        // On mobile, only handle scene headings - skip everything else
        if (isMobile) {
            console.log('[WrydaTab] Mobile: Not a scene heading, skipping Tab handling');
            return true; // Handled (prevented default), but do nothing
        }
        
        // Desktop: Handle element transitions
        if (elementType === 'dialogue' || elementType === 'character' || elementType === 'action' || elementType === 'parenthetical' || elementType === 'empty') {
            console.log('[WrydaTab] Handling element transition:', elementType);
            return handleElementTransition(e, lineInfo.currentLineText, elementType);
        }
        
        // Desktop: Default: create new line for any other element type
        console.log('[WrydaTab] Default: creating new line for element type:', elementType);
        const cursorPos = getCursorPosition();
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
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
        return true; // Always handled (prevented default)
    }, [getCurrentLineInfo, handleSceneHeadingTab, handleElementTransition, getCursorPosition, state.content, setContent, setCursorPosition]);

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
        smartTypeDropdown,
        isSmartTypeOpen: smartType !== null
    };
}

