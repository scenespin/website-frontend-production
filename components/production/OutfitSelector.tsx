'use client';

import React, { useState, useEffect } from 'react';

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
  { value: 'formal-evening', label: 'Formal Evening' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'custom', label: 'Custom...' }
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
  const [customOutfit, setCustomOutfit] = useState<string>('');

  // Initialize with value or default
  useEffect(() => {
    if (value !== undefined) {
      // If value is provided and matches a preset, use it
      // Otherwise, it's a custom outfit
      const isPreset = OUTFIT_OPTIONS.some(opt => opt.value === value);
      if (isPreset) {
        setSelectedOutfit(value);
        setCustomOutfit('');
      } else if (value && value !== 'default') {
        setSelectedOutfit('custom');
        setCustomOutfit(value);
      } else {
        setSelectedOutfit('default');
        setCustomOutfit('');
      }
    } else if (defaultValue) {
      // Use character's default outfit
      const isPreset = OUTFIT_OPTIONS.some(opt => opt.value === defaultValue);
      if (isPreset) {
        setSelectedOutfit(defaultValue);
        setCustomOutfit('');
      } else {
        setSelectedOutfit('custom');
        setCustomOutfit(defaultValue);
      }
    }
  }, [value, defaultValue]);

  // Build options array (include default option if showDefaultOption is true)
  const options = showDefaultOption
    ? [{ value: 'default', label: defaultValue ? `Use Character Default (${defaultValue})` : 'Use Character Default' }, ...OUTFIT_OPTIONS]
    : OUTFIT_OPTIONS;

  const handleOutfitChange = (newValue: string) => {
    setSelectedOutfit(newValue);
    
    if (newValue === 'default') {
      // Use character's default outfit (undefined means use default)
      onChange(undefined);
    } else if (newValue === 'custom') {
      // Keep current custom value if it exists, otherwise empty
      onChange(customOutfit || '');
    } else {
      // Use preset outfit
      onChange(newValue);
    }
  };

  const handleCustomChange = (newValue: string) => {
    setCustomOutfit(newValue);
    onChange(newValue);
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

      {selectedOutfit === 'custom' && (
        <input
          type="text"
          placeholder="Describe the outfit (e.g., 'red evening gown', 'military uniform', 'casual jeans and t-shirt')"
          value={customOutfit}
          onChange={(e) => handleCustomChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm border transition-colors"
          style={{
            backgroundColor: '#1C1C1E',
            borderColor: '#3F3F46',
            color: '#E5E7EB'
          }}
        />
      )}

      {selectedOutfit !== 'default' && selectedOutfit !== 'custom' && (
        <p className="text-xs" style={{ color: '#6B7280' }}>
          All poses will be generated wearing: <span className="font-medium" style={{ color: '#9CA3AF' }}>{OUTFIT_OPTIONS.find(opt => opt.value === selectedOutfit)?.label}</span>
        </p>
      )}
    </div>
  );
}

