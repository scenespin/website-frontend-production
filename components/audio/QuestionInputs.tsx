'use client';

/**
 * Question Input Components
 * 
 * Feature 0074: Input components for different question types in audio wizard
 * - Single Select (radio/buttons)
 * - Multi Select (checkboxes)
 * - Text Input
 * - Textarea
 * - Slider
 * - Tags Input
 */

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// SINGLE SELECT
// ============================================================================

export function SingleSelectInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(option => (
        <Button
          key={option}
          variant={value === option ? 'default' : 'outline'}
          className={`justify-start h-auto py-4 text-left ${
            value === option
              ? 'bg-violet-600 hover:bg-violet-700 border-violet-500'
              : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
          }`}
          onClick={() => onChange(option)}
        >
          <div className="flex items-center justify-between w-full">
            <span>{option}</span>
            {value === option && <Check className="w-5 h-5 flex-shrink-0 ml-2" />}
          </div>
        </Button>
      ))}
    </div>
  );
}

// ============================================================================
// MULTI SELECT
// ============================================================================

export function MultiSelectInput({
  options,
  value = [],
  onChange,
  maxSelections,
}: {
  options: string[];
  value?: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
}) {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        // Replace last selection
        onChange([...value.slice(0, maxSelections - 1), option]);
      } else {
        onChange([...value, option]);
      }
    }
  };

  return (
    <div className="space-y-4">
      {maxSelections && (
        <div className="text-sm text-gray-400">
          Select up to {maxSelections} options ({value.length}/{maxSelections} selected)
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(option => {
          const isSelected = value.includes(option);
          const isDisabled = !isSelected && maxSelections ? value.length >= maxSelections : false;
          
          return (
            <Button
              key={option}
              variant={isSelected ? 'default' : 'outline'}
              className={`justify-start h-auto py-3 text-left ${
                isSelected
                  ? 'bg-violet-600 hover:bg-violet-700 border-violet-500'
                  : isDisabled
                  ? 'bg-gray-800/50 border-gray-700/50 opacity-50 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
              }`}
              onClick={() => !isDisabled && toggleOption(option)}
              disabled={isDisabled}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm">{option}</span>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TEXT INPUT
// ============================================================================

export function TextInputComponent({
  value = '',
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-lg py-6"
    />
  );
}

// ============================================================================
// TEXTAREA INPUT
// ============================================================================

export function TextareaInput({
  value = '',
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={6}
      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-lg resize-none"
    />
  );
}

// ============================================================================
// SLIDER INPUT
// ============================================================================

export function SliderInput({
  value = 50,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
}: {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="space-y-6">
      {/* Value display */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-white mb-2">
            {value}
            {unit && <span className="text-3xl text-gray-400 ml-2">{unit}</span>}
          </div>
          <div className="text-sm text-gray-400">
            Range: {min} - {max}
          </div>
        </div>
      </div>

      {/* Slider */}
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      {/* Quick select buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Min', value: min },
          { label: '⅓', value: Math.round(min + (max - min) / 3) },
          { label: '⅔', value: Math.round(min + (2 * (max - min)) / 3) },
          { label: 'Max', value: max },
        ].map(({ label, value: quickValue }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            onClick={() => onChange(quickValue)}
            className={`${
              value === quickValue
                ? 'bg-violet-600 border-violet-500'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TAGS INPUT
// ============================================================================

export function TagsInput({
  value = [],
  onChange,
  placeholder,
}: {
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type and press Enter or comma to add'}
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-lg py-6"
        />
        {inputValue.trim() && (
          <Button
            size="sm"
            onClick={addTag}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700"
          >
            Add
          </Button>
        )}
      </div>

      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-violet-600/20 text-violet-300 border border-violet-500/30 px-3 py-1.5 text-sm"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Press Enter or comma to add tags. Backspace to remove last tag.
      </div>
    </div>
  );
}

