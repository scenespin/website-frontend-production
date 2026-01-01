'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Search, ArrowUp, ArrowDown, Replace } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { stripTagsForDisplay, mapDisplayPositionToFullContent } from '@/utils/fountain';

interface FindReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FindReplaceModal({ isOpen, onClose }: FindReplaceModalProps) {
    const { state, setContent, setCursorPosition, replaceSelection } = useEditor();
    const [searchText, setSearchText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [matches, setMatches] = useState<Array<{ start: number; end: number }>>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const displayContent = stripTagsForDisplay(state.content);
    
    // Find all matches when search text changes
    useEffect(() => {
        if (!searchText) {
            setMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }
        
        const foundMatches: Array<{ start: number; end: number }> = [];
        const searchRegex = new RegExp(
            wholeWord ? `\\b${escapeRegex(searchText)}\\b` : escapeRegex(searchText),
            caseSensitive ? 'g' : 'gi'
        );
        
        let match;
        while ((match = searchRegex.exec(displayContent)) !== null) {
            foundMatches.push({
                start: match.index,
                end: match.index + match[0].length
            });
        }
        
        setMatches(foundMatches);
        if (foundMatches.length > 0) {
            setCurrentMatchIndex(0);
            // Scroll to first match
            scrollToMatch(foundMatches[0]);
        } else {
            setCurrentMatchIndex(-1);
        }
    }, [searchText, caseSensitive, wholeWord, displayContent]);
    
    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }, 100);
        }
    }, [isOpen]);
    
    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchText('');
            setReplaceText('');
            setMatches([]);
            setCurrentMatchIndex(-1);
        }
    }, [isOpen]);
    
    const escapeRegex = (text: string): string => {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    const scrollToMatch = (match: { start: number; end: number }) => {
        // Map display position to full content position
        const fullStart = mapDisplayPositionToFullContent(displayContent, state.content, match.start);
        const fullEnd = mapDisplayPositionToFullContent(displayContent, state.content, match.end);
        
        // Set cursor position to match and select it
        setCursorPosition(fullStart);
        
        // Note: The textarea selection will be handled by EditorContext's setCursorPosition
        // We just need to ensure the editor is focused
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
            textarea.focus();
            // The actual selection will be set by the editor's cursor position update
        }
    };
    
    const handleFindNext = () => {
        if (matches.length === 0) return;
        const nextIndex = (currentMatchIndex + 1) % matches.length;
        setCurrentMatchIndex(nextIndex);
        scrollToMatch(matches[nextIndex]);
    };
    
    const handleFindPrevious = () => {
        if (matches.length === 0) return;
        const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
        setCurrentMatchIndex(prevIndex);
        scrollToMatch(matches[prevIndex]);
    };
    
    const handleReplace = () => {
        if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
        
        const match = matches[currentMatchIndex];
        const fullStart = mapDisplayPositionToFullContent(displayContent, state.content, match.start);
        const fullEnd = mapDisplayPositionToFullContent(displayContent, state.content, match.end);
        
        replaceSelection(replaceText, fullStart, fullEnd);
        
        // Remove this match from matches array and adjust index
        const newMatches = matches.filter((_, i) => i !== currentMatchIndex);
        setMatches(newMatches);
        
        if (newMatches.length > 0) {
            const nextIndex = currentMatchIndex < newMatches.length ? currentMatchIndex : 0;
            setCurrentMatchIndex(nextIndex);
            if (newMatches[nextIndex]) {
                scrollToMatch(newMatches[nextIndex]);
            }
        } else {
            setCurrentMatchIndex(-1);
        }
    };
    
    const handleReplaceAll = () => {
        if (matches.length === 0) return;
        
        // Replace all matches (in reverse order to maintain positions)
        const sortedMatches = [...matches].sort((a, b) => b.start - a.start);
        
        sortedMatches.forEach(match => {
            const fullStart = mapDisplayPositionToFullContent(displayContent, state.content, match.start);
            const fullEnd = mapDisplayPositionToFullContent(displayContent, state.content, match.end);
            replaceSelection(replaceText, fullStart, fullEnd);
        });
        
        setMatches([]);
        setCurrentMatchIndex(-1);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            handleFindPrevious();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleFindNext();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>
                
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-base-100 shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                            <Search className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                                                Find & Replace
                                            </Dialog.Title>
                                            <p className="text-xs text-base-content/60">
                                                {matches.length > 0 ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} found` : 'No matches'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="btn btn-ghost btn-sm btn-circle"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                {/* Content */}
                                <div className="px-6 py-4 space-y-4">
                                    {/* Find */}
                                    <div>
                                        <label className="label">
                                            <span className="label-text">Find</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Search..."
                                                className="input input-bordered flex-1"
                                                autoFocus
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={handleFindPrevious}
                                                    disabled={matches.length === 0}
                                                    className="btn btn-ghost btn-sm"
                                                    title="Previous (Shift+Enter)"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={handleFindNext}
                                                    disabled={matches.length === 0}
                                                    className="btn btn-ghost btn-sm"
                                                    title="Next (Enter)"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Replace */}
                                    <div>
                                        <label className="label">
                                            <span className="label-text">Replace</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={replaceText}
                                            onChange={(e) => setReplaceText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Replace with..."
                                            className="input input-bordered w-full"
                                        />
                                    </div>
                                    
                                    {/* Options */}
                                    <div className="flex gap-4">
                                        <label className="label cursor-pointer gap-2">
                                            <input
                                                type="checkbox"
                                                checked={caseSensitive}
                                                onChange={(e) => setCaseSensitive(e.target.checked)}
                                                className="checkbox checkbox-sm"
                                            />
                                            <span className="label-text text-xs">Case sensitive</span>
                                        </label>
                                        <label className="label cursor-pointer gap-2">
                                            <input
                                                type="checkbox"
                                                checked={wholeWord}
                                                onChange={(e) => setWholeWord(e.target.checked)}
                                                className="checkbox checkbox-sm"
                                            />
                                            <span className="label-text text-xs">Whole word</span>
                                        </label>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleReplace}
                                            disabled={currentMatchIndex < 0}
                                            className="btn btn-primary btn-sm flex-1"
                                        >
                                            <Replace className="h-4 w-4 mr-1" />
                                            Replace
                                        </button>
                                        <button
                                            onClick={handleReplaceAll}
                                            disabled={matches.length === 0}
                                            className="btn btn-secondary btn-sm flex-1"
                                        >
                                            <Replace className="h-4 w-4 mr-1" />
                                            Replace All
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

