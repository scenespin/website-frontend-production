'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Loader2, Sparkles, Zap, Minus, Plus, MessageSquare, Edit3 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { api } from '@/lib/api';
import { detectCurrentScene, extractSelectionContext } from '@/utils/sceneDetection';
import { buildRewritePrompt } from '@/utils/promptBuilders';
import { formatFountainSpacing } from '@/utils/fountainSpacing';
import { buildCharacterSummaries } from '@/utils/characterContextBuilder';
import { getModelTiming, getTimingMessage } from '@/utils/modelTiming';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

// LLM Models - Same order and list as UnifiedChatPanel for consistency
// Curated list: 8 models across 3 providers (latest flagship + fast option + premium option per provider)
// Order: Anthropic (Claude) → OpenAI (GPT) → Google (Gemini)
const LLM_MODELS = [
  // Claude (Anthropic) - Best for Creative Writing
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: '⭐ Best for creative writing & screenplays', recommended: true },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic', description: 'Most powerful - Enhanced coding & reasoning' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast & economical' },
  // GPT (OpenAI) - Good for Creative Writing
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Latest - Excellent for creative writing' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Balanced - Good for dialogue & scenes' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', description: 'Reasoning model - Best for analysis' },
  // Gemini (Google) - Good for Complex Narratives
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Latest - Most intelligent, advanced reasoning' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient' },
];

// Helper to clean AI output: strip markdown and remove writing notes
// Same function as ChatModePanel for consistency
function cleanFountainOutput(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove markdown formatting
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\b\*([^*\n]+)\*\b/g, '$1')
    .replace(/\b_([^_\n]+)_\b/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '');
  
  // Remove common AI response patterns that aren't screenplay content
  const unwantedPatterns = [
    /^(Here's|Here is|I'll|I will|Let me|This version|Here's the|This is|Here are|Here is the|I've|I have|Perfect|Great|Excellent|Good|Nice|Sure|Okay|OK)[\s:]*/i,
    /Great (emotional|physical|character|story|writing|detail|note|suggestion|idea).*$/i,
    /(SCREENWRITING\s+)?NOTE:.*$/is,
    /^#?\s*REVISION\s*$/im,
    /^#?\s*REVISED\s+SCENE\s*$/im,
    /ALTERNATIVE OPTIONS?:.*$/is,
    /Option \d+[:\-].*$/im,
    /Which direction.*$/is,
    /This version:.*$/is,
    /What comes next\?.*$/is,
    /What feeling.*$/is,
    /Would you like.*$/is,
    /Here are (some|a few) (suggestions|options|ideas|ways|things).*$/is,
    /---\s*\n\s*\*\*WRITING NOTE\*\*.*$/is,
    /---\s*\n\s*WRITING NOTE.*$/is,
    /\*\*WRITING NOTE\*\*.*$/is,
    /WRITING NOTE.*$/is,
    /---\s*\n\s*\*\*NOTE\*\*.*$/is,
    /---\s*\n\s*NOTE.*$/is,
    /\*\*NOTE\*\*.*$/is,
    /^---\s*$/m,
    /This (version|Sarah|character|scene|moment).*$/is,
    /Works perfectly.*$/is,
    /What happens next\?.*$/is,
    /For (your|this) scene.*$/is,
    /Recommendation:.*$/is,
    /Current line:.*$/is,
    /Enhanced options?:.*$/is
  ];
  
  for (const pattern of unwantedPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      cleaned = cleaned.substring(0, match.index).trim();
      break;
    }
  }
  
  // Remove lines that are clearly explanations
  const lines = cleaned.split('\n');
  const screenplayLines = [];
  let foundFirstScreenplayContent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!foundFirstScreenplayContent && !line) continue;
    
    if (/^NOTE:/i.test(line)) {
      break;
    }
    
    const isLikelyDialogue = line.length < 50 && (
      /^[A-Z][A-Z\s]+$/.test(lines[i-1]?.trim() || '') ||
      /^\(/.test(line) ||
      /[!?.]$/.test(line)
    );
    
    if (!isLikelyDialogue && /^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure)/i.test(line) &&
        !/^(INT\.|EXT\.|I\/E\.)/i.test(line) &&
        !/^[A-Z][A-Z\s]+$/.test(line) &&
        line.length > 15) {
      break;
    }
    
    // Skip scene headings (rewrite should not include scene headings)
    if (/^(INT\.|EXT\.|I\/E\.)/i.test(line)) {
      continue;
    }
    
    // Skip markdown headers
    if (/^#+\s+(REVISED|REVISION)/i.test(line)) {
      continue;
    }
    
    if (/^[A-Z][A-Z\s#0-9']+$/.test(line) && line.length > 2) {
      foundFirstScreenplayContent = true;
    }
    
    if (foundFirstScreenplayContent || line.length > 0) {
      screenplayLines.push(lines[i]);
    }
  }
  
  cleaned = screenplayLines.join('\n');
  
  // 🔥 DEBUG: Log after line processing to catch sentence splitting
  if (cleaned.includes('p. ') || cleaned.includes('p.\n') || cleaned.match(/^[a-z]\.\s/)) {
    console.warn('[RewriteModal] ⚠️ POTENTIAL SENTENCE SPLITTING DETECTED:', cleaned);
  }
  
  // Whitespace normalization
  // 1. Trim trailing whitespace from each line (but preserve newlines between lines)
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // 2. Normalize multiple consecutive newlines to single newline (but preserve structure)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines (for scene breaks if needed)
  
  // 3. 🔥 FIX: Only trim leading whitespace, preserve trailing newline if present
  // This is critical for rewrite agent to maintain spacing after rewritten text
  // BUT: Don't add newlines here - let the calling code handle it to prevent duplicates
  cleaned = cleaned.trimStart(); // Only trim leading whitespace
  // Note: We preserve trailing newlines but don't add them here
  // The calling code will add exactly one newline if needed
  
  // 🔥 FIX: Repair broken sentences that got split incorrectly
  // Pattern: single lowercase letter followed by period at start of line (like "p. A bead")
  // This usually means a sentence was split incorrectly
  cleaned = cleaned.replace(/\n([a-z])\.\s+/g, ' $1. '); // Fix "p. A bead" -> "p. A bead" (on same line)
  cleaned = cleaned.replace(/\n([a-z])\.\n/g, ' $1. '); // Fix "p.\nA bead" -> "p. A bead"
  
  // Fix missing words at start of lines (like " the newsroom" should be "Through the newsroom")
  // This is harder to fix automatically, but we can at least log it
  if (cleaned.match(/^\s+[a-z]/m)) {
    console.warn('[RewriteModal] ⚠️ Potential missing word at line start detected');
  }
  
  return cleaned;
}

// Quick action buttons configuration
const QUICK_ACTIONS = [
  {
    id: 'dramatic',
    label: 'Make more dramatic',
    prompt: 'make this more dramatic',
    icon: Zap,
    color: 'btn-error'
  },
  {
    id: 'concise',
    label: 'Make more concise',
    prompt: 'make this more concise',
    icon: Minus,
    color: 'btn-primary'
  },
  {
    id: 'physical',
    label: 'Add physical detail',
    prompt: 'add more physical detail',
    icon: Plus,
    color: 'btn-secondary'
  },
  {
    id: 'dialogue',
    label: 'Improve dialogue',
    prompt: 'improve the dialogue',
    icon: MessageSquare,
    color: 'btn-accent'
  }
];

export default function RewriteModal({
  isOpen,
  onClose,
  selectedText,
  selectionRange,
  editorContent,
  onReplace
}) {
  const { state: chatState } = useChatContext();
  const { characters } = useScreenplay();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null); // 'building' | 'generating' | null
  const [abortController, setAbortController] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    // Get from localStorage or default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rewrite-selected-model');
      if (saved) return saved;
    }
    return chatState.selectedModel || 'claude-sonnet-4-5-20250929';
  });

  // 🔥 CRITICAL FIX: Memoize filtered model arrays to prevent Radix UI Select from seeing new arrays on every render
  // This prevents infinite re-render loops when the modal opens
  const anthropicModels = useMemo(() => LLM_MODELS.filter(m => m.provider === 'Anthropic'), []);
  const openAIModels = useMemo(() => LLM_MODELS.filter(m => m.provider === 'OpenAI'), []);
  const googleModels = useMemo(() => LLM_MODELS.filter(m => m.provider === 'Google'), []);

  // 🔥 CRITICAL FIX: Memoize onValueChange callback to prevent Radix UI Select from seeing new function on every render
  const handleModelChange = useCallback((value) => {
    setSelectedModel(value);
  }, []);

  // 🔥 CRITICAL FIX: Memoize SelectContent children to prevent Radix UI from seeing new React elements on every render
  const selectContentChildren = useMemo(() => (
    <>
      <SelectGroup>
        <SelectLabel>Anthropic (Claude)</SelectLabel>
        {anthropicModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name} {model.recommended ? '⭐' : ''}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>OpenAI (GPT)</SelectLabel>
        {openAIModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Google (Gemini)</SelectLabel>
        {googleModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectGroup>
    </>
  ), [anthropicModels, openAIModels, googleModels]);
  
  // Save model selection to localStorage
  useEffect(() => {
    if (selectedModel && typeof window !== 'undefined') {
      localStorage.setItem('rewrite-selected-model', selectedModel);
    }
  }, [selectedModel]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCustomPrompt('');
      setShowCustomInput(false);
      setIsLoading(false);
      setLoadingStage(null);
      // Cancel any ongoing request
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
    }
  }, [isOpen, abortController]);
  
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);
  
  const handleRewrite = async (prompt) => {
    // 🔥 CRITICAL: Only allow rewrite if text is actually selected (not just cursor position)
    if (!selectedText || !selectionRange || !editorContent) {
      toast.error('Please select text to rewrite');
      return;
    }
    
    // Check if selection has actual content (not just whitespace)
    const trimmedText = selectedText.trim();
    if (!trimmedText || trimmedText.length === 0) {
      toast.error('Please select text to rewrite');
      return;
    }
    
    // Check if selection range has meaningful length (not just cursor position)
    if (selectionRange.start === selectionRange.end) {
      toast.error('Please select text to rewrite');
      return;
    }
    
    setIsLoading(true);
    setLoadingStage('building');
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    const isCancelledRef = { current: false };
    
    // Set up abort handler
    controller.signal.addEventListener('abort', () => {
      isCancelledRef.current = true;
    });
    
    // Track when building stage started for minimum duration
    const buildingStartTime = Date.now();
    const MIN_BUILDING_DURATION = 2000; // 2 seconds minimum for visual balance
    
    try {
      // Detect scene context
      const sceneContext = detectCurrentScene(editorContent, selectionRange.start);
      
      // Enhanced context: Dynamic surrounding text (2x selection length, min 200, max 2000 chars)
      const selectionLength = selectedText.length;
      const dynamicContextLength = Math.max(200, Math.min(2000, selectionLength * 2));
      
      const beforeStart = Math.max(0, selectionRange.start - dynamicContextLength);
      const afterEnd = Math.min(editorContent.length, selectionRange.end + dynamicContextLength);
      const textBefore = editorContent.substring(beforeStart, selectionRange.start).trim();
      const textAfter = editorContent.substring(selectionRange.end, afterEnd).trim();
      
      // Get full current scene for broader context
      const fullCurrentScene = sceneContext?.content || '';
      
      // Get character summaries if characters appear in selection
      let characterSummaries = '';
      if (sceneContext && sceneContext.characters && sceneContext.characters.length > 0) {
        // Check if any character names appear in selected text
        const selectedTextUpper = selectedText.toUpperCase();
        const charactersInSelection = (characters || []).filter(char => 
          char.name && selectedTextUpper.includes(char.name.toUpperCase())
        );
        if (charactersInSelection.length > 0) {
          characterSummaries = buildCharacterSummaries(charactersInSelection, sceneContext);
        }
      }
      
      // Build rewrite prompt with enhanced context
      const surroundingText = {
        before: textBefore,
        after: textAfter
      };
      
      // 🔥 PHASE 4: Use JSON format for rewrite (structured output)
      const useJSONFormat = true;
      const builtPrompt = buildRewritePrompt(
        prompt, 
        selectedText, 
        sceneContext, 
        surroundingText, 
        fullCurrentScene,
        characterSummaries,
        useJSONFormat
      );
      
      // System prompt for rewrite
      const systemPrompt = useJSONFormat
        ? "You are a professional screenwriting assistant. The user has selected text and wants to rewrite it. You MUST respond with valid JSON only. No explanations, no markdown, just JSON with the rewritten text."
        : "You are a professional screenwriting assistant. The user has selected text and wants to rewrite it. Provide only the rewritten text in Fountain format.";
      
      // Build structured output format if model supports it and using JSON format
      let responseFormat = undefined;
      if (useJSONFormat) {
        const { getRewriteSchema } = await import('../../utils/jsonSchemas');
        const { supportsStructuredOutputs } = await import('../../utils/jsonValidator');
        
        if (supportsStructuredOutputs(selectedModel)) {
          responseFormat = {
            type: "json_schema",
            json_schema: {
              schema: getRewriteSchema(),
              strict: true
            }
          };
        }
      }

      // Ensure minimum duration for building stage (for visual balance)
      const buildingElapsed = Date.now() - buildingStartTime;
      const remainingTime = Math.max(0, MIN_BUILDING_DURATION - buildingElapsed);
      
      if (remainingTime > 0) {
        // Wait for remaining time before transitioning
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Check if cancelled during wait
      if (controller.signal.aborted) {
        setIsLoading(false);
        setLoadingStage(null);
        setAbortController(null);
        return;
      }
      
      // Move to generating stage
      setLoadingStage('generating');
      
      // Call API
      let accumulatedText = '';
      
      await api.chat.generateStream(
        {
          userPrompt: builtPrompt,
          systemPrompt: systemPrompt,
          desiredModelId: selectedModel,
          conversationHistory: [], // Empty for rewrite (standalone)
          sceneContext: sceneContext ? {
            heading: sceneContext.heading,
            act: sceneContext.act,
            characters: sceneContext.characters,
            pageNumber: sceneContext.pageNumber
          } : null,
          responseFormat: responseFormat // Structured output format (if supported and using JSON)
        },
        // onChunk
        (chunk) => {
          // Ignore chunks if cancelled
          if (controller.signal.aborted || isCancelledRef.current) return;
          accumulatedText += chunk;
        },
        // onComplete
        async (fullContent) => {
          // CRITICAL: Check if cancelled FIRST - even if API completed, don't process if user cancelled
          if (controller.signal.aborted || isCancelledRef.current) {
            setIsLoading(false);
            setLoadingStage(null);
            setAbortController(null);
            toast('Rewrite cancelled - you will only be charged for tokens already processed');
            return;
          }
          
          // 🔥 DEBUG: Log raw AI response to diagnose sentence splitting issues
          console.log('[RewriteModal] 📝 RAW AI RESPONSE (first 500 chars):', fullContent.substring(0, 500));
          console.log('[RewriteModal] 📝 RAW AI RESPONSE (last 200 chars):', fullContent.substring(Math.max(0, fullContent.length - 200)));
          console.log('[RewriteModal] 📝 RAW AI RESPONSE length:', fullContent.length);
          console.log('[RewriteModal] 📝 RAW AI RESPONSE (full):', JSON.stringify(fullContent));
          
          // 🔥 PHASE 4: Validate JSON for rewrite requests
          if (useJSONFormat) {
            const { validateRewriteContent } = await import('@/utils/jsonValidator');
            const validation = validateRewriteContent(fullContent);
            
            if (validation.valid) {
              console.log('[RewriteModal] ✅ JSON validation passed');
              // Use the validated rewritten text
              let cleaned = validation.rewrittenText;
              
              console.log('[RewriteModal] 📝 After JSON validation - cleaned length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
              
              if (!cleaned || cleaned.trim().length === 0) {
                toast.error('No valid content returned from rewrite');
                setIsLoading(false);
                return;
              }
              
              // Apply Fountain spacing formatting
              // Split into lines, apply spacing logic, then rejoin
              const lines = cleaned.split('\n').filter(l => l.trim() || l === '');
              cleaned = formatFountainSpacing(lines.filter(l => l.trim()));
              
              console.log('[RewriteModal] 📝 After Fountain spacing formatting - cleaned length:', cleaned.length);
              
              // 🔥 FIX: Add newline BEFORE any processing if there's text after
              // This ensures the newline is part of the content being processed
              const textAfter = editorContent.substring(selectionRange.end);
              const hasTextAfter = textAfter.trim().length > 0;
              
              // 🔥 CRITICAL: Normalize trailing newlines FIRST to prevent duplicates
              // Remove any trailing newlines, then add exactly ONE if needed
              cleaned = cleaned.replace(/\n+$/, ''); // Remove ALL trailing newlines
              
              // If there's text after, add exactly ONE newline
              if (hasTextAfter) {
                cleaned = cleaned + '\n';
                console.log('[RewriteModal] ✅ Added newline after formatting (normalized) - new length:', cleaned.length);
              }
              
              console.log('[RewriteModal] 📝 Final cleaned text before onReplace - length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
              
              // Final safety check: if cancelled during processing, don't apply changes
              if (controller.signal.aborted || isCancelledRef.current) {
                setIsLoading(false);
                setLoadingStage(null);
                setAbortController(null);
                toast('Rewrite cancelled - changes not applied');
                return;
              }
              
              // Replace the selected text
              onReplace(cleaned);
            } else {
              console.warn('[RewriteModal] ❌ JSON validation failed:', validation.errors);
              
              // 🔥 FIX: Add newline BEFORE cleaning if there's text after
              // This ensures the newline is preserved through the cleaning process
              const textAfter = editorContent.substring(selectionRange.end);
              const hasTextAfter = textAfter.trim().length > 0;
              const textAfterStartsWithNewline = textAfter.startsWith('\n') || textAfter.startsWith('\r\n');
              
              // 🔥 CRITICAL FIX: Check if selection ends at a newline character
              const selectionEndsAtNewline = selectionRange.end > 0 && 
                (editorContent[selectionRange.end - 1] === '\n' || 
                 (selectionRange.end > 1 && editorContent.substring(selectionRange.end - 2, selectionRange.end) === '\r\n'));
              
              console.log('[RewriteModal] 📝 Before cleaning - fullContent length:', fullContent.length, 'hasTextAfter:', hasTextAfter, 'textAfterStartsWithNewline:', textAfterStartsWithNewline, 'selectionEndsAtNewline:', selectionEndsAtNewline);
              console.log('[RewriteModal] 📝 Selection range:', { start: selectionRange.start, end: selectionRange.end });
              console.log('[RewriteModal] 📝 Text after selection (first 50 chars):', JSON.stringify(textAfter.substring(0, 50)));
              
              // 🔥 SIMPLIFIED: Add newline ONCE, AFTER cleaning
              // This prevents double newlines from multiple addition points
              let cleaned = cleanFountainOutput(fullContent);
              
              console.log('[RewriteModal] 📝 After cleaning - cleaned length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
              
              if (!cleaned || cleaned.trim().length === 0) {
                toast.error('No valid content returned from rewrite');
                setIsLoading(false);
                return;
              }
              
              // 🔥 CRITICAL: Normalize trailing newlines FIRST to prevent duplicates
              // Remove any trailing newlines, then add exactly ONE if needed
              cleaned = cleaned.replace(/\n+$/, ''); // Remove ALL trailing newlines
              
              // If there's text after, add exactly ONE newline
              if (hasTextAfter) {
                cleaned = cleaned + '\n';
                console.log('[RewriteModal] ✅ Added newline AFTER cleaning (normalized) - new length:', cleaned.length);
              }
              
              console.log('[RewriteModal] 📝 Final cleaned text before onReplace - length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
              
              // Replace the selected text
              onReplace(cleaned);
            }
          } else {
            // Fallback: Original text format
            // 🔥 FIX: Add newline BEFORE cleaning if there's text after
            const textAfter = editorContent.substring(selectionRange.end);
            const hasTextAfter = textAfter.trim().length > 0;
            const textAfterStartsWithNewline = textAfter.startsWith('\n') || textAfter.startsWith('\r\n');
            
            // 🔥 CRITICAL FIX: Check if selection ends at a newline character
            const selectionEndsAtNewline = selectionRange.end > 0 && 
              (editorContent[selectionRange.end - 1] === '\n' || 
               (selectionRange.end > 1 && editorContent.substring(selectionRange.end - 2, selectionRange.end) === '\r\n'));
            
            console.log('[RewriteModal] 📝 Original format - fullContent length:', fullContent.length, 'hasTextAfter:', hasTextAfter, 'selectionEndsAtNewline:', selectionEndsAtNewline);
            console.log('[RewriteModal] 📝 Selection range:', { start: selectionRange.start, end: selectionRange.end });
            console.log('[RewriteModal] 📝 Text after selection (first 50 chars):', JSON.stringify(textAfter.substring(0, 50)));
            
            // 🔥 SIMPLIFIED: Add newline ONCE, AFTER cleaning
            // This prevents double newlines from multiple addition points
            let cleaned = cleanFountainOutput(fullContent);
            
            console.log('[RewriteModal] 📝 After cleaning (original format) - length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
            
            if (!cleaned || cleaned.trim().length === 0) {
              toast.error('No valid content returned from rewrite');
              setIsLoading(false);
              return;
            }
            
            // 🔥 CRITICAL: Normalize trailing newlines FIRST to prevent duplicates
            // Remove any trailing newlines, then add exactly ONE if needed
            cleaned = cleaned.replace(/\n+$/, ''); // Remove ALL trailing newlines
            
            // If there's text after, add exactly ONE newline
            if (hasTextAfter) {
              cleaned = cleaned + '\n';
              console.log('[RewriteModal] ✅ Added newline AFTER cleaning (original format, normalized)');
            }
            
            console.log('[RewriteModal] 📝 Final text before onReplace (original format) - length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
            
            // Replace the selected text
            onReplace(cleaned);
          }
          
          // Reset loading state
          setIsLoading(false);
          setLoadingStage(null);
          setAbortController(null);
          
          // Close modal
          onClose();
          
          // Show success toast
          toast.success('Text rewritten successfully');
        },
        // onError
        (error) => {
          // Don't show error if cancelled
          if (controller.signal.aborted || isCancelledRef.current) {
            setIsLoading(false);
            setLoadingStage(null);
            setAbortController(null);
            return;
          }
          console.error('[RewriteModal] Error:', error);
          toast.error(error.message || 'Failed to rewrite text');
          setIsLoading(false);
          setLoadingStage(null);
          setAbortController(null);
        }
      );
      
    } catch (error) {
      // Don't show error if cancelled
      if (controller.signal.aborted || isCancelledRef.current) {
        setIsLoading(false);
        setLoadingStage(null);
        setAbortController(null);
        return;
      }
      console.error('[RewriteModal] Error:', error);
      toast.error(error.message || 'Failed to rewrite text');
      setIsLoading(false);
      setLoadingStage(null);
      setAbortController(null);
    }
  };
  
  // Cancel handler
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    setLoadingStage(null);
    toast('Rewrite cancelled. You will only be charged for tokens already processed.');
  };
  
  const handleQuickAction = (action) => {
    handleRewrite(action.prompt);
  };
  
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) {
      toast.error('Please enter a rewrite instruction');
      return;
    }
    handleRewrite(customPrompt.trim());
  };
  
  if (!isOpen) return null;
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isLoading ? () => {} : onClose}>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cinema-red to-red-800">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-base-content">
                        Rewrite Selected Text
                      </Dialog.Title>
                      <p className="text-xs text-base-content/60">
                        Rewrite selected text with AI assistance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <Select
                      key={`model-selector-${isOpen}`}
                      value={selectedModel}
                      onValueChange={handleModelChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="max-w-[140px] h-8 text-xs" title="Select AI model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectContentChildren}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="btn btn-ghost btn-sm btn-circle"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-6 py-6">
                  {/* Quick Actions */}
                  {!showCustomInput && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-base-content/80">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleQuickAction(action)}
                              disabled={isLoading}
                              className={`btn ${action.color} btn-outline w-full justify-start gap-2`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-xs">{action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Custom Rewrite Button */}
                      <button
                        onClick={() => setShowCustomInput(true)}
                        disabled={isLoading}
                        className="btn btn-ghost btn-block gap-2 border border-base-300"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="text-sm">Custom rewrite...</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Custom Input */}
                  {showCustomInput && (
                    <form onSubmit={handleCustomSubmit} className="space-y-3">
                      <div>
                        <label className="label">
                          <span className="label-text text-sm font-medium">Enter rewrite instruction</span>
                        </label>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          disabled={isLoading}
                          placeholder="e.g., make this more suspenseful, add internal monologue, improve pacing..."
                          className="textarea textarea-bordered w-full h-24 resize-none"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading || !customPrompt.trim()}
                          className="btn btn-primary btn-block gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Rewriting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span>Rewrite</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomPrompt('');
                          }}
                          disabled={isLoading}
                          className="btn btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {/* Enhanced Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100/90 backdrop-blur-sm z-10">
                      <div className="flex flex-col items-center gap-4 p-6 bg-base-200 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        
                        {/* Two-stage loading indicator with smooth animations */}
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div className="flex items-center gap-2 w-full">
                            {/* Building stage progress bar - CSS handles smooth animation */}
                            <div className="h-2 flex-1 rounded-full bg-base-300 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${
                                  loadingStage === 'building' || loadingStage === 'generating' 
                                    ? 'bg-primary w-full' 
                                    : 'bg-primary/30 w-0'
                                }`}
                              />
                            </div>
                            {/* Generating stage progress bar - CSS handles smooth animation */}
                            <div className="h-2 flex-1 rounded-full bg-base-300 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                  loadingStage === 'generating' 
                                    ? 'bg-primary w-full' 
                                    : 'bg-base-300 w-0'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between w-full text-xs text-base-content/60">
                            <span className={`transition-all duration-300 ${
                              loadingStage === 'building' || loadingStage === 'generating' 
                                ? 'text-primary font-medium' 
                                : ''
                            }`}>
                              Building context...
                            </span>
                            <span className={`transition-all duration-300 ${
                              loadingStage === 'generating' 
                                ? 'text-primary font-medium' 
                                : ''
                            }`}>
                              Generating...
                            </span>
                          </div>
                        </div>
                        
                        {/* Model-specific timing */}
                        <p className="text-xs text-base-content/50 text-center">
                          {getTimingMessage(selectedModel)}
                        </p>
                        
                        {/* Cancel button */}
                        <button
                          onClick={handleCancel}
                          className="btn btn-ghost btn-sm mt-2"
                          disabled={!isLoading}
                        >
                          Cancel
                        </button>
                      </div>
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

