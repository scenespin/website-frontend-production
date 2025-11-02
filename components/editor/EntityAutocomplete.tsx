'use client';

import { useScreenplay } from '@/contexts/ScreenplayContext';
import type { Character, Location } from '@/types/screenplay';
import { User, MapPin, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface EntityAutocompleteProps {
    query: string; // Text after '@'
    position: { top: number; left: number };
    onSelect: (entityName: string, entityId: string, entityType: 'character' | 'location') => void;
    onClose: () => void;
}

type EntityItem = {
    id: string;
    name: string;
    type: 'character' | 'location';
    metadata?: string;
};

/**
 * EntityAutocomplete - @ mentions autocomplete for characters and locations
 * Theme-aware styling with DaisyUI classes
 */
export default function EntityAutocomplete({ query, position, onSelect, onClose }: EntityAutocompleteProps) {
    const screenplay = useScreenplay();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Combine characters and locations into a single searchable list
    const allEntities: EntityItem[] = [
        ...screenplay.characters.map(char => ({
            id: char.id,
            name: char.name,
            type: 'character' as const,
            metadata: char.type
        })),
        ...screenplay.locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            type: 'location' as const,
            metadata: loc.type
        }))
    ];

    // Filter entities based on query
    const filteredEntities = query.trim() === ''
        ? allEntities
        : allEntities.filter(entity =>
            entity.name.toLowerCase().includes(query.toLowerCase())
        );

    // Reset selected index when filtered list changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredEntities.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev < filteredEntities.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev > 0 ? prev - 1 : filteredEntities.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredEntities[selectedIndex]) {
                        const entity = filteredEntities[selectedIndex];
                        onSelect(entity.name, entity.id, entity.type);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredEntities, selectedIndex, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (filteredEntities.length === 0) {
        return (
            <div
                className="fixed z-[10000] bg-base-100 border border-base-300 rounded-lg shadow-2xl p-4 w-64"
                style={{ top: position.top + 20, left: position.left }}
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-base-content/60">No matches found</p>
                    <button
                        onClick={onClose}
                        className="text-base-content/60 hover:text-base-content transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-base-content/50">
                    Try searching for a different character or location
                </p>
            </div>
        );
    }

    return (
        <div
            ref={listRef}
            className="fixed z-[10000] bg-base-100 border border-base-300 rounded-lg shadow-2xl overflow-hidden w-72"
            style={{ top: position.top + 20, left: position.left }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-base-200 border-b border-base-300">
                <div className="text-xs font-semibold text-base-content/60">
                    Insert @ Mention
                </div>
                <button
                    onClick={onClose}
                    className="text-base-content/60 hover:text-base-content transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto">
                {filteredEntities.map((entity, index) => {
                    const isSelected = index === selectedIndex;
                    const isCharacter = entity.type === 'character';

                    return (
                        <button
                            key={entity.id}
                            onClick={() => onSelect(entity.name, entity.id, entity.type)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                isSelected
                                    ? 'bg-primary text-primary-content'
                                    : 'text-base-content/80 hover:bg-base-200'
                            }`}
                        >
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isSelected
                                    ? 'bg-primary-content/20'
                                    : isCharacter
                                        ? 'bg-warning/20'
                                        : 'bg-secondary/20'
                            }`}>
                                {isCharacter ? (
                                    <User className={`w-4 h-4 ${
                                        isSelected ? 'text-primary-content' : 'text-warning'
                                    }`} />
                                ) : (
                                    <MapPin className={`w-4 h-4 ${
                                        isSelected ? 'text-primary-content' : 'text-secondary'
                                    }`} />
                                )}
                            </div>

                            {/* Name & Metadata */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${
                                    isSelected ? 'text-primary-content' : 'text-base-content'
                                }`}>
                                    {entity.name}
                                </div>
                                {entity.metadata && (
                                    <div className={`text-xs capitalize truncate ${
                                        isSelected ? 'text-primary-content/70' : 'text-base-content/50'
                                    }`}>
                                        {entity.metadata}
                                    </div>
                                )}
                            </div>

                            {/* Type Badge */}
                            <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                                isSelected
                                    ? 'bg-primary-content/20 text-primary-content'
                                    : isCharacter
                                        ? 'bg-warning/20 text-warning'
                                        : 'bg-secondary/20 text-secondary'
                            }`}>
                                {isCharacter ? 'CHAR' : 'LOC'}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer with keyboard hints */}
            <div className="px-3 py-2 bg-base-200 border-t border-base-300 flex items-center justify-between text-xs text-base-content/60">
                <span>
                    <kbd className="kbd kbd-sm">↑↓</kbd> Navigate
                </span>
                <span>
                    <kbd className="kbd kbd-sm">Enter</kbd> Select
                </span>
                <span>
                    <kbd className="kbd kbd-sm">Esc</kbd> Close
                </span>
            </div>
        </div>
    );
}

