'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface OutfitSelectorProps {
  value?: string;
  defaultValue?: string; // Character's default outfit from database
  onChange: (outfit: string | undefined) => void;
  className?: string;
  label?: string;
  showDefaultOption?: boolean;
}

const OUTFIT_OPTIONS = [
  { value: 'business-casual', label: 'Business Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'athletic', label: 'Athletic/Sportswear' },
  { value: 'formal-evening', label: 'Formal Evening' }
];

export function OutfitSelector({
  value,
  defaultValue,
  onChange,
  className = '',
  label = 'Outfit',
  showDefaultOption = true
}: OutfitSelectorProps) {
  const [selectedOutfit, setSelectedOutfit] = useState<string>(value || 'default');
  const isManualChangeRef = useRef(false);

  // Initialize with value or default
  useEffect(() => {
    // Skip if user just manually changed the selection
    if (isManualChangeRef.current) {
      isManualChangeRef.current = false;
      return;
    }
    
    if (value !== undefined) {
      // If value is provided and matches a preset, use it
      const isPreset = OUTFIT_OPTIONS.some(opt => opt.value === value);
      if (isPreset) {
        setSelectedOutfit(value);
      } else {
        setSelectedOutfit('default');
      }
    } else if (defaultValue) {
      // Use character's default outfit
      const isPreset = OUTFIT_OPTIONS.some(opt => opt.value === defaultValue);
      if (isPreset) {
        setSelectedOutfit(defaultValue);
      } else {
        setSelectedOutfit('default');
      }
    }
  }, [value, defaultValue]);

  // Build options array (include default option if showDefaultOption is true)
  const options = showDefaultOption
    ? [{ value: 'default', label: defaultValue ? `Use Character Default (${defaultValue})` : 'Use Character Default' }, ...OUTFIT_OPTIONS]
    : OUTFIT_OPTIONS;

  const handleOutfitChange = (newValue: string) => {
    isManualChangeRef.current = true; // Mark as manual change to prevent useEffect reset
    setSelectedOutfit(newValue);
    
    if (newValue === 'default') {
      // Use character's default outfit (undefined means use default)
      onChange(undefined);
    } else {
      // Use preset outfit
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
        {label}
      </label>
      
      <select
        value={selectedOutfit}
        onChange={(e) => handleOutfitChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm border transition-colors"
        style={{
          backgroundColor: '#1C1C1E',
          borderColor: '#3F3F46',
          color: '#E5E7EB'
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {selectedOutfit !== 'default' && (
        <p className="text-xs" style={{ color: '#6B7280' }}>
          All poses will be generated wearing: <span className="font-medium" style={{ color: '#9CA3AF' }}>{OUTFIT_OPTIONS.find(opt => opt.value === selectedOutfit)?.label}</span>
        </p>
      )}
    </div>
  );
}

