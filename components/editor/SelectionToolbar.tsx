'use client';

import React, { useState } from 'react';
import { useEditorAgent } from '@/hooks/useAgentCall';

interface SelectionToolbarProps {
  selectedText: string;
  position: { top: number; left: number };
  onReplace: (newText: string) => void;
  onClose: () => void;
}

/**
 * SelectionToolbar - Quick AI rewrite actions for selected text
 * Theme-aware styling with DaisyUI classes
 */
export default function SelectionToolbar({
  selectedText,
  position,
  onReplace,
  onClose
}: SelectionToolbarProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const { rewrite, isLoading, error } = useEditorAgent();

  const handleQuickRewrite = async (instruction: string) => {
    setIsRewriting(true);
    try {
      const result = await rewrite(
        selectedText,
        instruction,
        'gemini-2.0-flash-thinking-exp'
      );
      
      if (result?.rewrittenText) {
        onReplace(result.rewrittenText);
        onClose();
      }
    } catch (err) {
      console.error('Rewrite failed:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCustomRewrite = async () => {
    if (!customPrompt.trim()) return;
    
    setIsRewriting(true);
    try {
      const result = await rewrite(
        selectedText,
        customPrompt,
        'gemini-2.0-flash-thinking-exp'
      );
      
      if (result?.rewrittenText) {
        onReplace(result.rewrittenText);
        setCustomPrompt('');
        setShowPromptInput(false);
        onClose();
      }
    } catch (err) {
      console.error('Rewrite failed:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div
      className="fixed bg-base-100 rounded-lg shadow-2xl border border-primary/20 z-[10000] min-w-[280px] max-w-[320px] overflow-hidden"
      style={{
        top: position.top < 250 
          ? `${position.top + 20}px`  // If too close to top, show below selection
          : `${position.top}px`,
        left: `${Math.min(position.left, window.innerWidth - 340)}px`, // Keep within viewport
        transform: position.top < 250
          ? 'translateY(0)'  // Below selection
          : 'translateY(-100%) translateY(-8px)'  // Above selection
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-focus px-3 py-2 flex items-center justify-between">
        <span className="text-primary-content text-xs font-medium">✨ AI Rewrite</span>
        <button
          onClick={onClose}
          className="text-primary-content hover:text-primary-content/70 text-lg leading-none"
          disabled={isRewriting}
        >
          ×
        </button>
      </div>

      {/* Quick Actions */}
      {!showPromptInput && (
        <div className="p-2 space-y-1">
          <button
            onClick={() => handleQuickRewrite('Make this more concise')}
            disabled={isLoading || isRewriting}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✂️ Make Concise
          </button>
          <button
            onClick={() => handleQuickRewrite('Expand this with more detail')}
            disabled={isLoading || isRewriting}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📝 Expand Detail
          </button>
          <button
            onClick={() => handleQuickRewrite('Make this more dramatic and intense')}
            disabled={isLoading || isRewriting}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎭 More Dramatic
          </button>
          <button
            onClick={() => handleQuickRewrite('Improve the dialogue to sound more natural')}
            disabled={isLoading || isRewriting}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💬 Polish Dialogue
          </button>
          <button
            onClick={() => handleQuickRewrite('Fix any grammar or formatting issues')}
            disabled={isLoading || isRewriting}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Fix Grammar
          </button>
          
          <div className="border-t border-base-300 my-2"></div>
          
          <button
            onClick={() => setShowPromptInput(true)}
            disabled={isLoading || isRewriting}
            className="w-full text-left px-3 py-2 text-sm rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✏️ Custom Instruction...
          </button>
        </div>
      )}

      {/* Custom Prompt Input */}
      {showPromptInput && (
        <div className="p-3 space-y-2">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your rewrite instruction..."
            className="textarea textarea-bordered w-full text-sm resize-none bg-base-200 text-base-content"
            rows={3}
            autoFocus
            disabled={isRewriting}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCustomRewrite}
              disabled={isLoading || isRewriting || !customPrompt.trim()}
              className="btn btn-primary btn-sm flex-1"
            >
              {isRewriting ? 'Rewriting...' : 'Apply'}
            </button>
            <button
              onClick={() => {
                setShowPromptInput(false);
                setCustomPrompt('');
              }}
              disabled={isRewriting}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isRewriting && (
        <div className="absolute inset-0 bg-base-100/90 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-xs text-base-content/60 mt-2">Rewriting...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isRewriting && (
        <div className="px-3 py-2 bg-error/10 border-t border-error/20">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}
    </div>
  );
}

