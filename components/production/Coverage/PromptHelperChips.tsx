'use client';

import React, { useMemo } from 'react';
import {
  getPromptHelperBaseline,
  getPromptHelperChips,
  appendPromptHelperText,
  type PromptHelperContext,
} from '../utils/promptHelperChips';

type EntityType = 'character' | 'location' | 'asset';

interface PromptHelperChipsProps {
  entity: EntityType;
  context?: PromptHelperContext;
  promptValue: string;
  onPromptChange: (next: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function PromptHelperChips({
  entity,
  context = 'all',
  promptValue,
  onPromptChange,
  textareaRef,
}: PromptHelperChipsProps) {
  const chips = useMemo(
    () => getPromptHelperChips({ entity, context, includeShared: true }),
    [entity, context]
  );

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef?.current;
    if (textarea && typeof textarea.selectionStart === 'number' && typeof textarea.selectionEnd === 'number') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = promptValue.slice(0, start);
      const after = promptValue.slice(end);
      const insertion = before.length > 0 && !/[.!?\s]$/.test(before) ? `. ${text}` : `${text}`;
      const next = `${before}${insertion}${after ? ` ${after.trimStart()}` : ''}`.trim();
      onPromptChange(next);

      // Restore caret after state update.
      requestAnimationFrame(() => {
        const el = textareaRef?.current;
        if (!el) return;
        const caret = Math.min(next.length, start + insertion.length);
        el.focus();
        el.setSelectionRange(caret, caret);
      });
      return;
    }

    onPromptChange(appendPromptHelperText(promptValue, text));
  };

  const insertBaseline = () => {
    insertAtCursor(getPromptHelperBaseline(entity));
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#808080]">Prompt Helpers</span>
        <button
          type="button"
          onClick={insertBaseline}
          className="text-xs px-2 py-1 rounded border border-[#3F3F46] text-[#E4E4E7] hover:bg-[#2A2A2A] transition-colors"
        >
          Insert Continuity Baseline
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => insertAtCursor(chip.insertText)}
            className="text-xs px-2 py-1 rounded-full border border-[#3F3F46] text-[#D4D4D8] hover:border-[#DC143C]/60 hover:text-white hover:bg-[#1F1F1F] transition-colors"
            title={chip.insertText}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

