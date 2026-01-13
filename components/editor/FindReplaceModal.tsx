'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Search, ArrowUp, ArrowDown, Replace, FileText } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { stripTagsForDisplay, mapDisplayPositionToFullContent, getVisibleLineNumber } from '@/utils/fountain';

interface FindReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MatchWithLine {
    start: number;
    end: number;
    lineNumber: number;
    preview: { before: string; match: string; after: string };
}

export default function FindReplaceModal({ isOpen, onClose }: FindReplaceModalProps) {
    const { state, setContent, setCursorPosition, replaceSelection, setHighlightRange, clearHighlight } = useEditor();
    const [searchText, setSearchText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [matches, setMatches] = useState<MatchWithLine[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const matchesListRef = useRef<HTMLDivElement>(null);
    
    const displayContent = stripTagsForDisplay(state.content);
    
    // Helper function to get line number from position
    const getLineNumberFromPosition = (position: number): number => {
        const textBefore = displayContent.substring(0, position);
        return textBefore.split('\n').length;
    };
    
    // Helper function to get preview text around match
    const getPreviewText = (start: number, end: number, maxLength: number = 60): { before: string; match: string; after: string } => {
        const beforeStart = Math.max(0, start - maxLength / 2);
        const afterEnd = Math.min(displayContent.length, end + maxLength / 2);
        
        const before = beforeStart > 0 ? '...' + displayContent.substring(beforeStart, start) : displayContent.substring(beforeStart, start);
        const match = displayContent.substring(start, end);
        const after = afterEnd < displayContent.length ? displayContent.substring(end, afterEnd) + '...' : displayContent.substring(end, afterEnd);
        
        return { before, match, after };
    };
    
    // Find all matches when search text changes
    useEffect(() => {
        if (!searchText) {
            setMatches([]);
            setCurrentMatchIndex(-1);
            clearHighlight();
            return;
        }
        
        const foundMatches: MatchWithLine[] = [];
        const searchRegex = new RegExp(
            wholeWord ? `\\b${escapeRegex(searchText)}\\b` : escapeRegex(searchText),
            caseSensitive ? 'g' : 'gi'
        );
        
        let match;
        while ((match = searchRegex.exec(displayContent)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;
            const lineNumber = getLineNumberFromPosition(start);
            const preview = getPreviewText(start, end);
            
            foundMatches.push({
                start,
                end,
                lineNumber,
                preview
            });
        }
        
        setMatches(foundMatches);
        if (foundMatches.length > 0) {
            setCurrentMatchIndex(0);
            // Don't auto-scroll while typing - only scroll on explicit navigation
            // scrollToMatch(foundMatches[0]);
        } else {
            setCurrentMatchIndex(-1);
        }
    }, [searchText, caseSensitive, wholeWord, displayContent, clearHighlight]);
    
    // Scroll to current match in list when it changes
    useEffect(() => {
        if (matchesListRef.current && currentMatchIndex >= 0) {
            const matchElement = matchesListRef.current.querySelector(`[data-match-index="${currentMatchIndex}"]`);
            if (matchElement) {
                matchElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentMatchIndex]);
    
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
            clearHighlight();
        }
    }, [isOpen, clearHighlight]);
    
    const escapeRegex = (text: string): string => {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    const scrollToMatch = (match: MatchWithLine) => {
        // Map display position to full content position
        const fullStart = mapDisplayPositionToFullContent(displayContent, state.content, match.start);
        const fullEnd = mapDisplayPositionToFullContent(displayContent, state.content, match.end);
        
        // Set cursor position to match and select it
        setCursorPosition(fullStart);
        
        // Highlight the match so user can see what will be replaced
        setHighlightRange({ start: fullStart, end: fullEnd });
        
        // Focus the textarea
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
            textarea.focus();
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
    
    const handleMatchClick = (index: number) => {
        setCurrentMatchIndex(index);
        scrollToMatch(matches[index]);
    };
    
    const handleReplace = () => {
        if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
        
        const match = matches[currentMatchIndex];
        const fullStart = mapDisplayPositionToFullContent(displayContent, state.content, match.start);
        const fullEnd = mapDisplayPositionToFullContent(displayContent, state.content, match.end);
        
        clearHighlight();
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
            clearHighlight();
        }
    };
    
    const handleReplaceAll = () => {
        if (matches.length === 0) return;
        
        clearHighlight();
        
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
                            <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[#3F3F46] shadow-xl transition-all max-h-[90vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[#3F3F46] px-6 py-4 bg-[#141414]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DC143C]">
                                            <Search className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                                                Find & Replace
                                            </Dialog.Title>
                                            <p className="text-xs text-gray-400">
                                                {matches.length > 0 
                                                    ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} found${currentMatchIndex >= 0 ? ` • ${currentMatchIndex + 1} of ${matches.length}` : ''}`
                                                    : searchText ? 'No matches found' : 'Enter search term'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    <div className="px-6 py-4 space-y-4 border-b border-[#3F3F46]">
                                        {/* Find */}
                                        <div>
                                            <label className="label pb-2">
                                                <span className="label-text text-white font-medium">Find</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={searchText}
                                                    onChange={(e) => setSearchText(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder="Search..."
                                                    className="input flex-1 bg-[#1F1F1F] border-[#3F3F46] text-white placeholder-gray-500 focus:border-[#DC143C] focus:outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={handleFindPrevious}
                                                        disabled={matches.length === 0}
                                                        className="btn btn-sm text-gray-400 hover:text-white hover:bg-[#1F1F1F] border-[#3F3F46] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Previous (Shift+Enter)"
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleFindNext}
                                                        disabled={matches.length === 0}
                                                        className="btn btn-sm text-gray-400 hover:text-white hover:bg-[#1F1F1F] border-[#3F3F46] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Next (Enter)"
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Replace */}
                                        <div>
                                            <label className="label pb-2">
                                                <span className="label-text text-white font-medium">Replace</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={replaceText}
                                                onChange={(e) => setReplaceText(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Replace with..."
                                                className="input w-full bg-[#1F1F1F] border-[#3F3F46] text-white placeholder-gray-500 focus:border-[#DC143C] focus:outline-none"
                                            />
                                        </div>
                                        
                                        {/* Options */}
                                        <div className="flex gap-4">
                                            <label className="label cursor-pointer gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={caseSensitive}
                                                    onChange={(e) => setCaseSensitive(e.target.checked)}
                                                    className="checkbox checkbox-sm bg-[#1F1F1F] border-[#3F3F46] checked:bg-[#DC143C] checked:border-[#DC143C]"
                                                />
                                                <span className="label-text text-xs text-gray-300">Case sensitive</span>
                                            </label>
                                            <label className="label cursor-pointer gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={wholeWord}
                                                    onChange={(e) => setWholeWord(e.target.checked)}
                                                    className="checkbox checkbox-sm bg-[#1F1F1F] border-[#3F3F46] checked:bg-[#DC143C] checked:border-[#DC143C]"
                                                />
                                                <span className="label-text text-xs text-gray-300">Whole word</span>
                                            </label>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={handleReplace}
                                                disabled={currentMatchIndex < 0}
                                                className="btn btn-sm flex-1 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Replace className="h-4 w-4 mr-1" />
                                                Replace
                                            </button>
                                            <button
                                                onClick={handleReplaceAll}
                                                disabled={matches.length === 0}
                                                className="btn btn-sm flex-1 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#3F3F46] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Replace className="h-4 w-4 mr-1" />
                                                Replace All
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Matches List */}
                                    {matches.length > 0 && (
                                        <div className="flex-1 overflow-y-auto px-6 py-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="h-4 w-4 text-[#DC143C]" />
                                                <h4 className="text-sm font-semibold text-white">All Matches</h4>
                                                <span className="text-xs text-gray-400">({matches.length} found)</span>
                                            </div>
                                            <div 
                                                ref={matchesListRef}
                                                className="space-y-1 max-h-[300px] overflow-y-auto"
                                            >
                                                {matches.map((match, index) => (
                                                    <button
                                                        key={index}
                                                        data-match-index={index}
                                                        onClick={() => handleMatchClick(index)}
                                                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                            index === currentMatchIndex
                                                                ? 'bg-[#DC143C]/20 border-[#DC143C] text-white'
                                                                : 'bg-[#1F1F1F] border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#3F3F46]'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-mono text-[#DC143C] font-semibold">
                                                                        Line {match.lineNumber}
                                                                    </span>
                                                                    {index === currentMatchIndex && (
                                                                        <span className="text-xs px-2 py-0.5 bg-[#DC143C] text-white rounded">
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-300 break-words">
                                                                    <span>{match.preview.before}</span>
                                                                    <mark className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
                                                                        {match.preview.match}
                                                                    </mark>
                                                                    <span>{match.preview.after}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {searchText && matches.length === 0 && (
                                        <div className="px-6 py-8 text-center">
                                            <p className="text-gray-400">No matches found for "{searchText}"</p>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
