'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';

interface SmartTypeItem {
    id: string;
    label: string;
    type: 'location' | 'time';
}

interface SmartTypeDropdownProps {
    items: SmartTypeItem[];
    position: { top: number; left: number; above?: boolean };
    onSelect: (item: SmartTypeItem) => void;
    onClose: () => void;
    query?: string; // Current text being typed (for filtering)
}

/**
 * SmartTypeDropdown - Dropdown for location and time suggestions
 * Similar to EntityAutocomplete but specifically for Tab navigation
 */
export default function SmartTypeDropdown({
    items,
    position,
    onSelect,
    onClose,
    query = ''
}: SmartTypeDropdownProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter items based on query
    const filteredItems = query.trim() === ''
        ? items
        : items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
        );

    // Reset selected index when filtered list changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, items.length]);

    // Keyboard navigation - only when dropdown is visible
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredItems.length === 0) return;
            
            // Only handle keys if dropdown is actually visible
            // Check if the dropdown element exists in the DOM
            if (!listRef.current) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation(); // Prevent bubbling to textarea
                    setSelectedIndex(prev =>
                        prev < filteredItems.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation(); // Prevent bubbling to textarea
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredItems.length - 1
                    );
                    break;
                case 'Enter':
                case 'Tab':
                    // Tab and Enter both accept selection (like Final Draft)
                    e.preventDefault();
                    e.stopPropagation(); // Prevent bubbling to textarea
                    if (filteredItems[selectedIndex]) {
                        onSelect(filteredItems[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation(); // Prevent bubbling to textarea
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [filteredItems, selectedIndex, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (filteredItems.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg w-72 max-h-64 overflow-y-auto"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                // Ensure dropdown stays within viewport
                maxWidth: `calc(100vw - ${position.left}px - 20px)`
            }}
        >
            <div ref={listRef} className="py-1">
                {filteredItems.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-base-200 transition-colors ${
                                isSelected ? 'bg-primary text-primary-content' : ''
                            }`}
                            onClick={() => onSelect(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {item.type === 'location' ? (
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                            ) : (
                                <Clock className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{item.label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="px-3 py-2 text-xs text-base-content/60 border-t border-base-300">
                <kbd className="kbd kbd-sm">↑↓</kbd> Navigate • <kbd className="kbd kbd-sm">Tab</kbd> or <kbd className="kbd kbd-sm">Enter</kbd> Select • <kbd className="kbd kbd-sm">Esc</kbd> Close
            </div>
        </div>
    );
}

