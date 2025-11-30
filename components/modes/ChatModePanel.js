'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useDrawer } from '@/contexts/DrawerContext';
import { FileText, Sparkles, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt, extractSelectionContext } from '@/utils/sceneDetection';
import { buildChatContentPrompt, buildRewritePrompt } from '@/utils/promptBuilders';
import { validateScreenplayContent, supportsNativeJSON, buildRetryPrompt } from '@/utils/jsonValidator';
import toast from 'react-hot-toast';

// Helper to clean AI output: strip markdown and remove writing notes
// Also removes duplicate content that matches context before cursor
// Now accepts sceneContext to detect and skip duplicate scene headings
function cleanFountainOutput(text, contextBeforeCursor = null, sceneContext = null) {
  if (!text) return text;
  
  let cleaned = text;
  
  // 🔥 AGGRESSIVE: Remove markdown formatting FIRST (before processing)
  cleaned = cleaned
    // Remove markdown headers (# Revised Scene, ## Scene, etc.)
    .replace(/^#+\s*(Revised Scene|REVISED SCENE|REVISION|Scene|SCENE)\s*:?\s*$/gim, '')
    // Remove bold markdown (**text** or __text__) - be aggressive
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic markdown (*text* or _text_) - use word boundaries to avoid issues
    .replace(/\b\*([^*\n]+)\*\b/g, '$1')
    .replace(/\b_([^_\n]+)_\b/g, '$1')
    // Remove markdown scene headings (# INT. or ## INT.)
    .replace(/^#+\s*(INT\.|EXT\.|I\/E\.)/gim, '$1')
    // Remove standalone asterisks used for emphasis (but preserve in dialogue)
    .replace(/^\*\s+/gm, '') // Remove leading asterisk + space
    .replace(/\s+\*$/gm, '') // Remove trailing asterisk + space
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove markdown code blocks
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '')
    // Remove "[SCREENWRITING ASSISTANT]" headers (with or without brackets)
    .replace(/^\[SCREENWRITING ASSISTANT\]\s*$/gim, '')
    .replace(/^SCREENWRITING ASSISTANT\s*$/gim, '')
    // Remove "INSERT - NOTE" patterns
    .replace(/\*\*INSERT - NOTE\*\*/gi, '')
    .replace(/INSERT - NOTE/gi, '')
    // Remove "BACK TO SCENE" patterns
    .replace(/\*\*BACK TO SCENE\*\*/gi, '')
    .replace(/BACK TO SCENE/gi, '');
  
  // Remove common AI response patterns that aren't screenplay content
  const unwantedPatterns = [
    // Remove "Here's..." or "I'll write..." intros
    /^(Here's|Here is|I'll|I will|Let me|This version|Here's the|This is|Here are|Here is the|I've|I have|Perfect|Great|Excellent|Good|Nice|Sure|Okay|OK|Ah,|Ah!)[\s:]*/i,
    // Remove analysis intros like "Ah, interesting detail!" or "Adding that..."
    /^(Ah,|Ah!|Interesting|Adding that|What it might suggest|Potential|A few thoughts)[\s:]*/i,
    // Remove "Great emotional note" or similar praise
    /Great (emotional|physical|character|story|writing|detail|note|suggestion|idea).*$/i,
    // Remove analysis patterns
    /(could create|might suggest|adds a|What it might|Potential line|What tone are you|Could you clarify|Are you referring|I'm not sure what you're referring|In the current scene|There's nothing described).*$/i,
    // Remove "SCREENWRITING NOTE:" or "NOTE:" sections (case insensitive, multiline)
    /(SCREENWRITING\s+)?NOTE:.*$/is,
    // Remove "REVISION" or "REVISED SCENE" headers (with or without markdown, with or without colon)
    /^#?\s*REVISION\s*:?\s*$/im,
    /^#?\s*REVISED\s+SCENE\s*:?\s*$/im,
    // Remove "ALTERNATIVE OPTIONS:" sections
    /ALTERNATIVE OPTIONS?:.*$/is,
    // Remove "Option 1:", "Option 2:", etc.
    /Option \d+[:\-].*$/im,
    // Remove "Which direction..." questions
    /Which direction.*$/is,
    // Remove "This version:" explanations
    /This version:.*$/is,
    // Remove "What comes next?" questions
    /What comes next\?.*$/is,
    // Remove "What feeling..." questions
    /What feeling.*$/is,
    // Remove "Would you like..." questions
    /Would you like.*$/is,
    // Remove "Here are some suggestions:" patterns
    /Here are (some|a few) (suggestions|options|ideas|ways|things).*$/is,
  // Remove writing notes section (everything after "---" or "WRITING NOTE" or similar)
    /---\s*\n\s*\*\*WRITING NOTE\*\*.*$/is,
    /---\s*\n\s*WRITING NOTE.*$/is,
    /\*\*WRITING NOTE\*\*.*$/is,
    /WRITING NOTE.*$/is,
    /---\s*\n\s*\*\*NOTE\*\*.*$/is,
    /---\s*\n\s*NOTE.*$/is,
    /\*\*NOTE\*\*.*$/is,
    /^---\s*$/m,
    // Remove explanations that start with "This version:" or "This Sarah is..."
    /This (version|Sarah|character|scene|moment).*$/is,
    // Remove "Works perfectly for..." explanations
    /Works perfectly.*$/is,
    // Remove "What happens next?" questions
    /What happens next\?.*$/is,
    // Remove "For your scene" or "For this scene" explanations
    /For (your|this) scene.*$/is,
    // Remove "Recommendation:" patterns
    /Recommendation:.*$/is,
    // Remove "Current line:" patterns
    /Current line:.*$/is,
    // Remove "Enhanced options:" patterns
    /Enhanced options?:.*$/is
  ];
  
  for (const pattern of unwantedPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      cleaned = cleaned.substring(0, match.index).trim();
      break;
    }
  }
  
    // Remove lines that are clearly explanations (contain "This", "That", "Which", etc. at start)
    const lines = cleaned.split('\n');
    const screenplayLines = [];
    let foundFirstScreenplayContent = false;
    let sceneHeadingFound = false; // Track if we've seen a scene heading (means full scene was generated)
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines at the start
      if (!foundFirstScreenplayContent && !trimmedLine) continue;
      
      // 🔥 CRITICAL: Stop immediately on options/suggestions patterns
      // These indicate the AI is giving options instead of writing content
      if (/^(Option \d+|Here are|Here's|I can help|I'll|Let me)/i.test(line)) {
        break; // Stop on options/suggestions
      }
      
      // If line starts with "NOTE:" or explanation words, stop here
      if (/^NOTE:/i.test(line)) {
        break;
      }
      
      // CRITICAL: Stop on meta-commentary patterns (analysis, explanations about the story)
      // Pattern: "This [verb] [something]" - indicates analysis/explanation, not screenplay content
      if (/^\*?\s*This\s+(adds|creates|raises|builds|establishes|introduces|sets up|develops|enhances|improves|strengthens|deepens|expands|explores|reveals|highlights|emphasizes|underscores|reinforces|supports|connects|links|ties|bridges|transitions|moves|shifts|changes|transforms|evolves|progresses|advances|drives|propels|pushes|pulls|draws|brings|takes|leads|guides|directs|steers|navigates|maneuvers|positions|places|situates|locates|anchors|grounds|roots|bases|founds|sets|puts|makes|turns|converts|becomes)/i.test(line)) {
        break; // Stop on meta-commentary like "This adds immediate digital threat..."
      }
      
      // Also stop on lines that start with asterisk (markdown emphasis) followed by "This"
      if (/^\*\s*This\s+/i.test(line)) {
        break;
      }
      
      // 🔥 NEW: Stop on note/analysis patterns like "[Note:" or "*[Note:"
      if (/^(\*?\s*)?\[Note:/i.test(line)) {
        break; // STOP on notes/analysis
      }
      
      // Stop on lines that start with "*" followed by bracket (markdown analysis notes)
      if (/^\*\s*\[/i.test(line)) {
        break; // STOP on markdown analysis notes like "*[Note: This addition..."
      }
      
      // If line starts with explanation words, stop here (but allow short lines that might be dialogue)
      // IMPORTANT: Don't stop on lines that are clearly dialogue (short, or follow a character name)
      const isLikelyDialogue = line.length < 50 && (
        /^[A-Z][A-Z\s]+$/.test(lines[i-1]?.trim() || '') || // Previous line was a character name
        /^\(/.test(line) || // Starts with parenthetical
        /[!?.]$/.test(line) // Ends with punctuation (dialogue markers)
      );
      
      // Stop on questions (especially at the end of responses)
      if (/\?.*$/.test(line) && /(Should|Want|Would|Do you|Can you|Shall|Want me|keep going|continue|next)/i.test(line)) {
        break; // Stop on questions like "Should the footsteps enter, or pass by? Want me to keep going?"
      }
      
      // 🔥 FIX: Only stop on explanation patterns if we HAVEN'T found screenplay content yet
      // Once we've found screenplay content (character names, action lines), be more lenient
      // This prevents stopping on legitimate narrative action lines like "This is what she became a journalist for."
      if (!foundFirstScreenplayContent) {
        // Before finding screenplay content, be strict about stopping on explanation patterns
        const isMetaCommentary = /^(This|That)\s+(adds|creates|raises|builds|establishes|introduces|sets up|develops|enhances|improves|strengthens|deepens|expands|explores|reveals|highlights|emphasizes|underscores|reinforces|supports|connects|links|ties|bridges|transitions|moves|shifts|changes|transforms|evolves|progresses|advances|drives|propels|pushes|pulls|draws|brings|takes|leads|guides|directs|steers|navigates|maneuvers|positions|places|situates|locates|anchors|grounds|roots|bases|founds|sets|puts|makes|turns|converts|becomes)/i.test(line);
        
        // Only stop on explanation words if they're clearly meta-commentary OR if they're questions/instructions
        if (!isLikelyDialogue && !isMetaCommentary &&
            /^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure)/i.test(line) && 
            !/^(INT\.|EXT\.|I\/E\.)/i.test(line) && // But allow scene headings
            !/^[A-Z][A-Z\s]+$/.test(line) && // But allow character names in ALL CAPS
            line.length > 15 && // Only if it's a longer explanation
            /(should|would|could|might|may|can|will|shall|want|need|must|try|use|do|make|think|consider|remember|keep|ensure|make sure)/i.test(line)) { // Must contain instruction/analysis words
          break;
        }
      }
      // After finding screenplay content, only stop on clear meta-commentary patterns (already handled above)
      
      // Skip "REVISED SCENE:" or "REVISION:" headers (with or without colon, with or without markdown)
      if (/^#?\s*(REVISED\s+SCENE|REVISION|GOT IT|Got it|SCENE ANALYSIS|Scene Analysis)\s*:?\s*$/i.test(line)) {
        continue; // Skip revision/analysis headers
      }
      
      // Skip markdown headers like "# REVISED SCENE" or "# Revised Scene" (must start with #, have space, then REVISED/REVISION)
      // This won't match character names like "REPORTER #1" because # is not at the start
      if (/^#+\s+(REVISED|REVISION|Revised Scene|GOT IT|Got it|SCENE ANALYSIS|Scene Analysis)/i.test(line)) {
        continue; // Skip markdown revision/analysis headers
      }
      
      // 🔥 NEW: Skip "Scene Addition" headers (with or without markdown)
      if (/^#?\s*Scene\s+Addition\s*:?\s*$/i.test(line)) {
        continue; // Skip "Scene Addition" header but continue processing
      }
      
      // 🔥 NEW: Skip "[CONTINUED]" headers (screenplay continuation markers)
      if (/^\[CONTINUED\]\s*$/i.test(line)) {
        continue; // Skip "[CONTINUED]" header but continue processing
      }
      
      // 🔥 CRITICAL: Stop on "FADE OUT" or "THE END" - these shouldn't be in middle of screenplay
      // Screenwriter agent should never generate endings
      if (/^(FADE OUT|THE END|FADE TO BLACK)\.?\s*$/i.test(line)) {
        break; // STOP on endings - Screenwriter should not generate them
      }
      
      // Also stop on notes/analysis patterns like "[Note:" or "*[Note:" or "NOTE TO WRITER:"
      // But only if we've already found screenplay content (don't stop before finding content)
      if (foundFirstScreenplayContent && (/^(\*?\s*)?\[Note:/i.test(line) || /^NOTE\s+TO\s+WRITER:/i.test(line))) {
        break; // STOP on notes/analysis (but only after finding screenplay content)
      }
      
      // Stop on lines that start with "*" followed by analysis (like "*[Note: This addition...")
      // But only if we've already found screenplay content
      if (foundFirstScreenplayContent && /^\*\s*\[/i.test(line)) {
        break; // STOP on markdown analysis notes (but only after finding screenplay content)
      }
      
      // 🔥 NEW: Stop immediately on analysis patterns (even before finding content)
      // These indicate the AI is analyzing instead of writing
      if (/^(Ah,|Ah!|Interesting|Adding that|What it might suggest|Potential|A few thoughts|Great addition|GOT IT|Got it)/i.test(trimmedLine)) {
        break; // STOP on analysis intros
      }
      if (/^(Here's how that could|Here's how it could|Here's how this could|This gives you|Want to develop|Want to adjust|You're right|You're talking about|Let me revise)/i.test(trimmedLine)) {
        break; // STOP on analysis/suggestion patterns
      }
      if (/^(could create|might suggest|adds a|What tone are you|Could you clarify|Are you referring|I'm not sure what you're referring|The problem|THE PROBLEM|Missing|SUGGESTED|Suggested)/i.test(trimmedLine)) {
        break; // STOP on analysis questions
      }
      if (/What it might suggest:/i.test(trimmedLine) || /Potential line adjustment:/i.test(trimmedLine) || /This gives you:/i.test(trimmedLine) || /SCENE ANALYSIS/i.test(trimmedLine) || /Scene Analysis/i.test(trimmedLine)) {
        break; // STOP on analysis sections
      }
      // 🔥 NEW: Stop on revision/rewrite patterns
      if (/^(Here's a revision|Here's how it could be|Here's how it might|Here's the revision|Here's the rewrite|Here's a rewrite|Here's how that could play out|REVISED SCENE|Revised Scene)/i.test(trimmedLine)) {
        break; // STOP on revision intros
      }
      // 🔥 NEW: Stop on analysis explanations
      if (/^(This adds|CHANGES:|Changes:|Does this capture|Does this hit)/i.test(trimmedLine)) {
        break; // STOP on analysis explanations
      }
      
      // Skip "[SCREENWRITING ASSISTANT]" headers (with or without brackets)
      if (/^\[?SCREENWRITING ASSISTANT\]?\s*$/i.test(line)) {
        continue; // Skip assistant headers
      }
      
      // 🔥 CRITICAL: Check for scene headings (with or without markdown)
      // Screenwriter agent should NEVER generate scene headings for normal continuation
      // But if it does, we need to:
      // 1. Skip duplicate scenes (current scene heading)
      // 2. Stop on new scene headings (different location)
      if (/^(#+\s*)?(INT\.|EXT\.|I\/E\.)/i.test(line) || /(INT\.|EXT\.|I\/E\.)/i.test(line)) {
        // Extract scene heading (remove markdown if present)
        const sceneHeadingMatch = line.match(/(INT\.|EXT\.|I\/E\.\s+[^-]+(?:\s*-\s*[^-]+)?)/i);
        if (sceneHeadingMatch) {
          const detectedHeading = sceneHeadingMatch[1].trim();
          
          // Check if this matches the current scene (duplicate/revised scene)
          if (sceneContext?.heading) {
            const normalizeHeading = (heading) => {
              return heading.toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/\s*-\s*/g, ' - ')
                .trim();
            };
            
            const currentNormalized = normalizeHeading(sceneContext.heading);
            const newNormalized = normalizeHeading(detectedHeading);
            
            // Check if locations match (before the dash)
            const currentLocation = currentNormalized.split(' - ')[0].trim();
            const newLocation = newNormalized.split(' - ')[0].trim();
            
            // Check if full headings match (exact match) or locations match (same location)
            const isExactMatch = currentNormalized === newNormalized;
            const isLocationMatch = currentLocation === newLocation && currentLocation.length > 0;
            
            if (isExactMatch || isLocationMatch) {
              console.log('[ChatModePanel] ⚠️ Skipping duplicate/revised scene heading:', detectedHeading, 'matches current:', sceneContext.heading);
              // Skip this duplicate scene and continue looking for actual content
              // Skip all content until we find something that's not the duplicate scene
              let foundContentAfterDuplicate = false;
              for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                // If we find another scene heading (different location), stop
                if (/^(INT\.|EXT\.|I\/E\.)/i.test(nextLine)) {
                  const nextHeadingMatch = nextLine.match(/(INT\.|EXT\.|I\/E\.\s+[^-]+(?:\s*-\s*[^-]+)?)/i);
                  if (nextHeadingMatch) {
                    const nextNormalized = normalizeHeading(nextHeadingMatch[1].trim());
                    const nextLocation = nextNormalized.split(' - ')[0].trim();
                    if (nextLocation !== currentLocation) {
                      // Different location - this is a new scene, stop processing
                      break;
                    }
                  }
                }
                // If we find actual content (not scene heading), we can continue
                if (nextLine && !/^(INT\.|EXT\.|I\/E\.)/i.test(nextLine) && nextLine.length > 5) {
                  foundContentAfterDuplicate = true;
                  i = j - 1; // Process from here
                  break;
                }
              }
              if (!foundContentAfterDuplicate) {
                // No content after duplicate scene, stop processing
                break;
              }
              continue; // Skip the duplicate scene heading
            } else {
              // Different scene heading - Screenwriter shouldn't generate new scenes
              // Stop processing
              sceneHeadingFound = true;
              break;
            }
          } else {
            // No current scene context, but Screenwriter shouldn't generate scene headings
            sceneHeadingFound = true;
            break;
          }
        }
      }
      
      // 🔥 CRITICAL: Stop on markdown formatting that contains scene headings
      // Pattern: "**Continuation of INT. COFFEE SHOP - DAY**" or similar
      if (/^\*\*.*(INT\.|EXT\.|I\/E\.).*\*\*/i.test(line)) {
        break; // STOP on markdown scene heading references
      }
      
      // 🔥 RELAXED: Don't break on scene headings - just skip them and continue
      // This allows users to insert content even if AI generated a full scene
      // The scene heading is removed, but the rest of the content is preserved
      
      // 🔥 NEW: Smart duplicate detection with partial content extraction
      // This prevents AI from repeating content that already exists
      // BUT: If a line starts with duplicate content but has new content after, extract just the new part
      if (contextBeforeCursor) {
        const contextLines = contextBeforeCursor.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const currentLineTrimmed = line.trim();

        // Only check for duplicates if the line is substantial (avoid false positives)
        if (currentLineTrimmed.length > 5) {
          let isDuplicate = false;
          let newContentStart = -1;
          
          // Check each context line for matches
          for (const contextLine of contextLines) {
            // Only check substantial context lines
            if (contextLine.length < 5) continue;
            
            // 🔥 FIX: Declare these at the top of the loop so they're accessible throughout
            const contextLineOriginal = contextLine.trim();
            const currentLineOriginal = currentLineTrimmed;
            
            const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedCurrent = currentLineTrimmed.toLowerCase().replace(/\s+/g, ' ').trim();
            
            // Exact match - skip entire line
            if (normalizedContext === normalizedCurrent) {
              isDuplicate = true;
              break;
            }
            
            // 🔥 FIX: Don't extract partial content if the match is just a character name
            // Character names (ALL CAPS, short) are common and shouldn't trigger extraction
            const isCharacterName = /^[A-Z][A-Z\s#0-9']+$/.test(contextLine.trim()) && contextLine.trim().length < 30;
            
            // Check if current line STARTS with context line (partial match at beginning)
            // This means AI repeated the end of existing content but added new content after
            // BUT: Skip if context line is just a character name (common in screenplays)
            if (!isCharacterName && normalizedCurrent.startsWith(normalizedContext) && normalizedCurrent.length > normalizedContext.length) {
              // Find where the new content starts in the original (case-sensitive) line
              
              // Try to find the context line at the start of current line (case-insensitive)
              const contextLower = contextLineOriginal.toLowerCase();
              const currentLower = currentLineOriginal.toLowerCase();
              
              if (currentLower.startsWith(contextLower)) {
                // Extract the new content (everything after the duplicate part)
                newContentStart = contextLineOriginal.length;
                // Skip whitespace after the duplicate
                while (newContentStart < currentLineOriginal.length && /\s/.test(currentLineOriginal[newContentStart])) {
                  newContentStart++;
                }
                // If there's substantial new content, use it instead of skipping
                const extractedContent = currentLineOriginal.substring(newContentStart).trim();
                if (extractedContent.length > 3) {
                  console.log('[cleanFountainOutput] Extracting new content from partial duplicate:', {
                    original: currentLineOriginal,
                    duplicate: contextLineOriginal,
                    newContent: extractedContent
                  });
                  // Replace the line with just the new content (preserve original line structure)
                  screenplayLines.push(lines[i].substring(lines[i].indexOf(currentLineOriginal) + newContentStart).trimStart());
                  isDuplicate = true; // Mark as handled
                  break;
                }
              }
            }
            
            // 🔥 FIX: Also check if current line starts with a character name that appears in context
            // But only if it's followed by action (not just the character name alone)
            // Example: Context has "SARAH (whispers) Holy shit." and AI generates "SARAH glances at..."
            // We should keep "SARAH glances at..." not extract just "glances at..."
            if (isCharacterName) {
              // If context line is a character name, check if current line starts with it
              const contextName = contextLineOriginal.trim();
              const currentStartsWithName = currentLineOriginal.trim().toLowerCase().startsWith(contextName.toLowerCase());
              
              if (currentStartsWithName && currentLineOriginal.trim().length > contextName.length + 5) {
                // Current line starts with the character name but has more content
                // This is valid - character names appear in action lines, don't extract
                // Just continue to next check (don't mark as duplicate)
                continue;
              }
            }
            
            // Check if context line contains current line (current is substring of context)
            // Only if both are substantial (avoid removing short lines)
            if (normalizedContext.length > 25 && normalizedCurrent.length > 25) {
              if (normalizedContext.includes(normalizedCurrent)) {
                isDuplicate = true;
                break;
              }
            }
          }
          
          if (isDuplicate && newContentStart === -1) {
            // Only skip if we didn't extract new content
            console.log('[cleanFountainOutput] Skipping duplicate line:', line);
            continue;
          } else if (newContentStart !== -1) {
            // Already added the new content above, skip adding the original line
            continue;
          }
        }
      }
      
      // If we find a character name in ALL CAPS, we're in screenplay content
      if (/^[A-Z][A-Z\s#0-9']+$/.test(line) && line.length > 2 && line.length < 50) {
        foundFirstScreenplayContent = true;
      }
      
      // 🔥 FIX: Also mark screenplay content when we find substantial action lines
      // Action lines are typically longer, contain action verbs, and don't start with explanation words
      if (!foundFirstScreenplayContent && line.length > 10 && 
          !/^(This|That|Which|What|How|Why|When|Where|Here|There|I|You|We|They|It|These|Those|Consider|Think|Remember|Keep|Make sure|Note|NOTE)/i.test(line) &&
          !/^(INT\.|EXT\.|I\/E\.)/i.test(line) && // Not a scene heading
          !/^[A-Z][A-Z\s#0-9']+$/.test(line) && // Not a character name
          /[.!?]$/.test(line)) { // Ends with punctuation (typical of action lines)
        foundFirstScreenplayContent = true;
      }
      
      // If we've found screenplay content, include this line
      // 🔥 FIX: Preserve original line structure (including leading/trailing whitespace for newlines)
      // Use original line from lines array to preserve newline structure
      if (foundFirstScreenplayContent || line.length > 0) {
        screenplayLines.push(lines[i]); // Use original line to preserve structure
      }
    }
  
  cleaned = screenplayLines.join('\n');
  
  // 🔥 AGGRESSIVE: Remove markdown formatting (bold, italic, etc.)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove **bold**
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // Remove *italic*
  cleaned = cleaned.replace(/^#+\s*/gm, ''); // Remove markdown headers
  
  // 🔥 AGGRESSIVE: Stop on analysis patterns that might have slipped through
  // Check for patterns like "This gives you:" or "Want to develop" anywhere in the content
  const analysisPatterns = [
    /This gives you:/i,
    /Want to develop/i,
    /Want to adjust/i,
    /Great addition!/i,
    /Here's how that could play out/i
  ];
  
  for (const pattern of analysisPatterns) {
    const match = cleaned.search(pattern);
    if (match !== -1) {
      cleaned = cleaned.substring(0, match).trim();
      console.log('[ChatModePanel] ⚠️ Stopped on analysis pattern:', pattern);
      break;
    }
  }
  
  // 🔥 CRITICAL: Remove notes at the end (after --- separator)
  // Pattern: "---\n*This adds tension..." or "---\n**NOTE:**" etc.
  const notesPattern = /---\s*\n\s*\*?.*(adds|suggests|gives|creates|builds|develops|enhances|improves|strengthens|tension|story|character|arc|redemption|journey|transformation|development|growth|evolution|determination|instinct|skill|talent|ability|expertise|conspiracy|chance|engage).*$/is;
  if (notesPattern.test(cleaned)) {
    const match = cleaned.search(/---\s*\n/i);
    if (match !== -1) {
      cleaned = cleaned.substring(0, match).trim();
      console.log('[ChatModePanel] ⚠️ Removed notes after --- separator');
    }
  }
  
  // Also remove standalone analysis notes at the end (even without ---)
  const endNotesPattern = /\n\s*\*?This (adds|suggests|gives|creates|builds|develops|enhances|improves|strengthens).*$/is;
  if (endNotesPattern.test(cleaned)) {
    const match = cleaned.search(/\n\s*\*?This (adds|suggests|gives|creates|builds|develops|enhances|improves|strengthens)/i);
    if (match !== -1) {
      cleaned = cleaned.substring(0, match).trim();
      console.log('[ChatModePanel] ⚠️ Removed analysis notes at end');
    }
  }
  
  // Remove "FADE OUT" and "THE END" at the end
  cleaned = cleaned.replace(/\n\s*(FADE OUT\.?|THE END\.?)\s*$/gi, '');
  
  // 🔥 AGGRESSIVE: Limit to first 3 lines maximum for Screenwriter agent
  // This ensures we never get more than 3 lines even if AI generates more
  const allLines = cleaned.split('\n').filter(line => line.trim().length > 0);
  if (allLines.length > 3) {
    cleaned = allLines.slice(0, 3).join('\n');
    console.log('[ChatModePanel] ⚠️ Truncated to 3 lines (Screenwriter agent limit)');
  }
  
  // Whitespace normalization
  // 1. Trim trailing whitespace from each line (but preserve newlines)
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // 2. Normalize multiple consecutive newlines (but preserve single newlines between lines)
  // This ensures consistent spacing without losing line breaks
  // Keep single newlines between lines, but limit multiple newlines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines (for scene breaks if needed)
  
  // 3. 🔥 FIX: Preserve newlines but still trim excessive whitespace
  // Limit excessive leading/trailing newlines but preserve single newlines
  // This preserves newlines before character names like "SARAH"
  if (cleaned.startsWith('\n\n\n')) {
    cleaned = cleaned.replace(/^\n+/, '\n\n'); // Limit leading newlines to 2
  } else if (cleaned.startsWith('\n\n')) {
    // Keep 2 newlines at start (for scene breaks)
    // Don't trim
  } else if (cleaned.startsWith('\n')) {
    // Keep single newline at start
    // Don't trim
  }
  
  if (cleaned.endsWith('\n\n\n')) {
    cleaned = cleaned.replace(/\n+$/, '\n\n'); // Limit trailing newlines to 2
  } else if (cleaned.endsWith('\n\n')) {
    // Keep 2 newlines at end (for scene breaks)
    // Don't trim
  } else if (cleaned.endsWith('\n')) {
    // Keep single newline at end
    // Don't trim
  }
  
  // Final trim only removes spaces/tabs, not newlines
  // This ensures content validation works (trim().length check)
  cleaned = cleaned.trim(); // This removes spaces/tabs but newlines are preserved in the content
  
  return cleaned;
}

// Helper to parse 3 rewrite options from AI response
function parseRewriteOptions(text) {
  if (!text) return null;
  
  // Look for "Option 1", "Option 2", "Option 3" patterns
  const optionPattern = /Option\s+(\d+)\s*[-:]?\s*([^\n]*)\n([\s\S]*?)(?=Option\s+\d+|$)/gi;
  const options = [];
  let match;
  
  while ((match = optionPattern.exec(text)) !== null && options.length < 3) {
    const optionNum = parseInt(match[1]);
    const description = match[2].trim();
    let content = match[3].trim();
    
    // Clean the content (remove markdown, etc.)
    content = cleanFountainOutput(content, null, null);
    
    if (content) {
      options.push({
        number: optionNum,
        description: description || `Option ${optionNum}`,
        content: content
      });
    }
  }
  
  // If we found 3 options, return them
  if (options.length === 3) {
    return options;
  }
  
  // Fallback: try to split by "Option 1", "Option 2", "Option 3" more flexibly
  const lines = text.split('\n');
  const foundOptions = [];
  let currentOption = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const optionMatch = line.match(/Option\s+(\d+)\s*[-:]?\s*(.*)/i);
    
    if (optionMatch) {
      // Save previous option if exists
      if (currentOption && currentOption.content.trim()) {
        foundOptions.push(currentOption);
      }
      
      // Start new option
      currentOption = {
        number: parseInt(optionMatch[1]),
        description: optionMatch[2].trim() || `Option ${optionMatch[1]}`,
        content: ''
      };
    } else if (currentOption) {
      // Add line to current option
      currentOption.content += (currentOption.content ? '\n' : '') + line;
    }
  }
  
  // Add last option
  if (currentOption && currentOption.content.trim()) {
    foundOptions.push(currentOption);
  }
  
  // Clean each option's content
  foundOptions.forEach(opt => {
    opt.content = cleanFountainOutput(opt.content, null, null);
  });
  
  return foundOptions.length >= 2 ? foundOptions : null; // Return if we found at least 2 options
}

export function ChatModePanel({ onInsert, onWorkflowComplete, editorContent, cursorPosition }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext, setSelectedTextContext } = useChatContext();
  const { closeDrawer } = useDrawer();
  const {
    activeWorkflow,
    workflowCompletionData,
    clearWorkflowCompletion,
    isScreenplayContent
  } = useChatMode();
  
  // Model selection for AI chat
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom ONLY while streaming (so user can see new content)
  // Once streaming stops, don't auto-scroll (allows copy/paste without chat jumping)
  useEffect(() => {
    if (state.isStreaming) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.isStreaming, state.streamingText]); // Only trigger when streaming state or streaming text changes
  
  // Auto-send rewrite request when selected text context is set (but no messages yet)
  const hasAutoSentRef = useRef(false);
  useEffect(() => {
    // If we have selected text context but no messages and no input, auto-generate 3 options
    if (state.selectedTextContext && 
        state.messages.filter(m => m.mode === 'chat').length === 0 && 
        !state.input && 
        !isSending && 
        !hasAutoSentRef.current) {
      console.log('[ChatModePanel] Auto-generating 3 rewrite options for selected text');
        hasAutoSentRef.current = true;
      
      // Auto-send empty string to trigger generic rewrite (will generate 3 options)
      setTimeout(() => {
        handleSend(''); // Empty string triggers generic rewrite with 3 options
        // Reset flag after sending completes
          setTimeout(() => {
            hasAutoSentRef.current = false;
        }, 3000);
      }, 300);
    }
  }, [state.selectedTextContext, state.messages, state.input, isSending]);
  
  // Detect scene context when drawer opens or editor content/cursor changes
  // If cursorPosition is undefined, try to detect from editor content (find last scene heading)
  useEffect(() => {
    if (editorContent) {
      // If cursor position is available, use it; otherwise, try to detect from content
      let detectedContext = null;
      
      if (cursorPosition !== undefined) {
        detectedContext = detectCurrentScene(editorContent, cursorPosition);
      } else {
        // Fallback: find the last scene heading in the content
        const lines = editorContent.split('\n');
        let lastSceneLine = -1;
        const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;
        
        for (let i = lines.length - 1; i >= 0; i--) {
          if (sceneHeadingRegex.test(lines[i])) {
            lastSceneLine = i;
            break;
          }
        }
        
        if (lastSceneLine >= 0) {
          // Calculate approximate cursor position at the last scene heading
          const approximateCursor = editorContent.split('\n').slice(0, lastSceneLine + 1).join('\n').length;
          detectedContext = detectCurrentScene(editorContent, approximateCursor);
        }
      }
      
      if (detectedContext) {
        setSceneContext({
          heading: detectedContext.heading,
          act: detectedContext.act,
          characters: detectedContext.characters,
          pageNumber: detectedContext.pageNumber,
          totalPages: detectedContext.totalPages
        });
        console.log('[ChatModePanel] Scene context detected:', detectedContext.heading, 'cursorPosition:', cursorPosition);
      } else {
        console.warn('[ChatModePanel] No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
      }
    }
  }, [editorContent, cursorPosition, setSceneContext]);
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    // Allow empty prompt for auto-rewrite (will generate 3 options)
    if (isSending) return;
    if (!prompt || !prompt.trim()) {
      // If empty prompt and in rewrite mode, use generic rewrite request
      if (state.selectedTextContext) {
        prompt = ''; // Will trigger generic rewrite in buildRewritePrompt
      } else {
        return; // Don't send empty prompts in regular mode
      }
    }
    
    setIsSending(true);
    
    try {
      // ALWAYS detect current scene for context (re-detect on each message)
      let sceneContext = detectCurrentScene(editorContent, cursorPosition);
      
      // Fallback to state scene context if detection fails
      if (!sceneContext && state.sceneContext) {
        console.log('[ChatModePanel] Using state scene context as fallback');
        // Try to extract actual scene content from editorContent based on scene heading
        let sceneContent = '';
        if (editorContent && state.sceneContext.heading) {
          const lines = editorContent.split('\n');
          const headingIndex = lines.findIndex(line => 
            line.trim().toUpperCase().includes(state.sceneContext.heading.toUpperCase())
          );
          if (headingIndex >= 0) {
            // Extract content from this scene heading to the next scene heading (or end)
            const sceneLines = [];
            for (let i = headingIndex; i < lines.length; i++) {
              const line = lines[i];
              // Stop at next scene heading (but not the current one)
              if (i > headingIndex && /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i.test(line)) {
                break;
              }
              sceneLines.push(line);
            }
            sceneContent = sceneLines.join('\n').substring(0, 1000);
          } else {
            // Fallback to first 1000 chars if scene heading not found
            sceneContent = editorContent.substring(0, 1000);
          }
        }
        // Reconstruct full scene context from state (we need content for the prompt)
        sceneContext = {
          heading: state.sceneContext.heading,
          act: state.sceneContext.act,
          characters: state.sceneContext.characters || [],
          pageNumber: state.sceneContext.pageNumber,
          totalPages: state.sceneContext.totalPages || 100,
          content: sceneContent
        };
      }
      
      // Update global scene context state (for banner display)
      if (sceneContext) {
        setSceneContext({
          heading: sceneContext.heading,
          act: sceneContext.act,
          characters: sceneContext.characters,
          pageNumber: sceneContext.pageNumber,
          totalPages: sceneContext.totalPages
        });
        console.log('[ChatModePanel] Scene context:', sceneContext.heading, 'Act:', sceneContext.act, 'Characters:', sceneContext.characters?.length || 0);
      } else {
        console.warn('[ChatModePanel] No scene context detected. editorContent:', !!editorContent, 'cursorPosition:', cursorPosition);
      }
      
      // 🔥 CRITICAL: Rewrite is now handled by RewriteModal, NOT the chat window
      // The chat window is ONLY for content generation (continuing the scene) or advice
      // If selectedTextContext exists, clear it and use regular content generation
      if (state.selectedTextContext) {
        console.warn('[ChatModePanel] selectedTextContext detected in chat window - rewrite should use RewriteModal, clearing context');
        // Clear the selected text context - rewrite should be done via modal
        setSelectedTextContext(null, null);
      }
      
      // 🔥 SIMPLIFIED: Screenwriter agent ONLY generates 1-3 lines of Fountain format text
      // No advice mode, no questions, no analysis - just text generation
      let builtPrompt;
      let systemPrompt;
      
      // 🔥 SIMPLIFIED: No JSON for Screenwriter agent - just simple text, aggressive cleaning
      // JSON adds complexity and the AI often ignores it anyway
      const useJSONFormat = false; // Always use simple text format
      
      // Build prompt - ALWAYS content generation (no advice mode)
      builtPrompt = buildChatContentPrompt(prompt, sceneContext, useJSONFormat);
      
      // Build system prompt - ALWAYS content generation
      systemPrompt = `You are a screenwriting assistant. Write 1-3 lines that continue the scene. No scene headings. No analysis. No questions. Just write the lines.`;
      
      // Add scene context if available (minimal, just for context)
      if (sceneContext) {
        systemPrompt += `\n\nCurrent Scene: ${sceneContext.heading} (for context only - do NOT include in output)`;
        if (sceneContext.characters && sceneContext.characters.length > 0) {
          systemPrompt += `\nCharacters: ${sceneContext.characters.join(', ')}`;
        }
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'chat'
      });
      
      // 🔥 SIMPLIFIED: Screenwriter agent uses EMPTY history to prevent confusion
      // Always generate fresh content, don't continue previous conversations
      let conversationHistory = [];
      
      console.log('[ChatModePanel] API call params:', {
        useJSONFormat,
        modelSupportsNativeJSON,
        conversationHistoryLength: conversationHistory.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: builtPrompt.length
      });
      
      // 🔥 PHASE 4: Prepare API request with JSON format support
      const apiRequestData = {
          userPrompt: builtPrompt, // Use built prompt instead of raw prompt
          systemPrompt: systemPrompt,
          desiredModelId: selectedModel,
          conversationHistory,
          sceneContext: sceneContext ? {
            heading: sceneContext.heading,
            act: sceneContext.act,
            characters: sceneContext.characters,
            pageNumber: sceneContext.pageNumber
          } : null
      };
      
      // 🔥 PHASE 4: Note: Backend doesn't support responseFormat yet
      // For now, we use prompt engineering (works for all models)
      // TODO: Add backend support for responseFormat when available
      if (useJSONFormat && modelSupportsNativeJSON) {
        console.log('[ChatModePanel] Model supports native JSON, but backend support pending. Using prompt engineering.');
        // apiRequestData.responseFormat = { type: 'json_object' }; // Will work when backend supports it
      }
      
      // Call streaming AI API
      setStreaming(true, '');
      let accumulatedText = '';
      const maxRetries = 1; // Only retry once
      
      // Use a ref-like object to track retry attempts across async callbacks
      const retryState = { attempts: 0 };
      
      const makeApiCall = async (isRetry = false, retryErrors = []) => {
        const requestData = isRetry && useJSONFormat && retryErrors.length > 0
          ? {
              ...apiRequestData,
              userPrompt: buildRetryPrompt(builtPrompt, retryErrors)
            }
          : apiRequestData;
        
        await api.chat.generateStream(
          requestData,
        // onChunk
        (chunk) => {
          accumulatedText += chunk;
          setStreaming(true, accumulatedText);
        },
        // onComplete
        async (fullContent) => {
          // 🔥 PHASE 4: Validate JSON for content requests (currently disabled, but keeping structure)
          if (useJSONFormat) {
            console.log('[ChatModePanel] Validating JSON response...');
            const validation = validateScreenplayContent(fullContent, sceneContext?.contextBeforeCursor || null);
            
            if (validation.valid) {
              console.log('[ChatModePanel] ✅ JSON validation passed');
              addMessage({
                role: 'assistant',
                content: validation.content,
                mode: 'chat'
              });
              setTimeout(() => {
                setStreaming(false, '');
              }, 100);
            } else {
              console.warn('[ChatModePanel] ❌ JSON validation failed:', validation.errors);
              console.warn('[ChatModePanel] Raw JSON:', validation.rawJson);
              console.warn('[ChatModePanel] Full content (first 1000 chars):', fullContent.substring(0, 1000));
              console.warn('[ChatModePanel] Full content length:', fullContent.length);
              
              // 🔥 SIMPLIFIED: Don't retry JSON - just fall back to text cleaning immediately
              // JSON is optional, text cleaning is the reliable primary path
              console.warn('[ChatModePanel] JSON validation failed, using text cleaning (primary path)...');
              console.warn('[ChatModePanel] Full content before cleaning:', fullContent.substring(0, 500));
              const cleanedContent = cleanFountainOutput(fullContent, sceneContext?.contextBeforeCursor || null, sceneContext);
              console.warn('[ChatModePanel] Cleaned content length:', cleanedContent?.length || 0);
              console.warn('[ChatModePanel] Cleaned content preview:', cleanedContent?.substring(0, 500) || '(empty)');
              
              if (!cleanedContent || cleanedContent.trim().length < 3) {
                toast.error('Failed to generate valid content. Please try again.');
                addMessage({
                  role: 'assistant',
                  content: '❌ Sorry, I encountered an error generating content. Please try again.',
                  mode: 'chat'
                });
              } else {
                addMessage({
                  role: 'assistant',
                  content: cleanedContent,
                  mode: 'chat'
                });
              }
              setTimeout(() => {
                setStreaming(false, '');
              }, 100);
            }
          } else {
            // Fallback: use text cleaning
            const cleanedContent = cleanFountainOutput(fullContent, sceneContext?.contextBeforeCursor || null, sceneContext);
            
            // 🔥 PHASE 1 FIX: Validate content before adding message
            if (!cleanedContent || cleanedContent.trim().length < 3) {
              console.warn('[ChatModePanel] ⚠️ Cleaned content is empty or too short. Original length:', fullContent?.length, 'Cleaned length:', cleanedContent?.length);
              console.warn('[ChatModePanel] Original content preview:', fullContent?.substring(0, 200));
              const fallbackContent = fullContent?.trim() || 'No content generated';
              addMessage({
                role: 'assistant',
                content: fallbackContent,
                mode: 'chat'
              });
            } else {
          addMessage({
            role: 'assistant',
                content: cleanedContent,
            mode: 'chat'
          });
            }
          setTimeout(() => {
            setStreaming(false, '');
          }, 100);
          }
        },
        // onError
        (error) => {
          console.error('Error in streaming:', error);
          setStreaming(false, '');
          toast.error(error.message || 'Failed to get AI response');
          addMessage({
            role: 'assistant',
            content: '❌ Sorry, I encountered an error. Please try again.',
            mode: 'chat'
          });
        }
      );
      };
      
      // Make the initial API call
      await makeApiCall(false);
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setStreaming(false, '');
      toast.error(error.response?.data?.message || error.message || 'Failed to get AI response');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        mode: 'chat'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleInsertAndCreate = () => {
    if (!workflowCompletionData || !onWorkflowComplete) return;
    
    console.log('[ChatModePanel] Insert & Create clicked:', workflowCompletionData);
    
    // Trigger parent callback
    onWorkflowComplete(workflowCompletionData.type, workflowCompletionData.parsedData);
    
    // Clear completion data
    clearWorkflowCompletion();
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workflow Completion Banner */}
      {workflowCompletionData && (
        <div className="flex items-center justify-between px-4 py-3 bg-base-300 border-b border-cinema-red/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cinema-gold" />
            <span className="text-base-content">
              {workflowCompletionData.type.charAt(0).toUpperCase() + workflowCompletionData.type.slice(1)} profile complete!
            </span>
          </div>
          <button
            onClick={handleInsertAndCreate}
            className="btn btn-sm btn-primary"
          >
            Insert & Create
          </button>
        </div>
      )}
      
      {/* Active Workflow Indicator */}
      {activeWorkflow && (
        <div className="px-4 py-2 border-b border-base-300 flex items-center gap-2 bg-base-200">
          <div className="w-2 h-2 rounded-full animate-pulse bg-cinema-blue" />
          <span className="text-sm text-base-content/80">
            AI Interview in progress: {activeWorkflow.type.charAt(0).toUpperCase() + activeWorkflow.type.slice(1)} creation
          </span>
        </div>
      )}
      
      {/* Quick Action Buttons for Rewrite Mode */}
      {state.selectedTextContext && state.messages.filter(m => m.mode === 'chat').length === 0 && !state.input && (
        <div className="px-4 py-3 border-b border-base-300 bg-base-200/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-medium text-base-content/70 mb-2">Quick Actions:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSend('Make this more concise')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                ✂️ Make Concise
              </button>
              <button
                onClick={() => handleSend('Expand this with more detail')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                📝 Expand Detail
              </button>
              <button
                onClick={() => handleSend('Make this more dramatic and intense')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                🎭 More Dramatic
              </button>
              <button
                onClick={() => handleSend('Improve the dialogue to sound more natural')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                💬 Polish Dialogue
              </button>
              <button
                onClick={() => handleSend('Fix any grammar or formatting issues')}
                disabled={isSending}
                className="px-3 py-1.5 text-sm rounded-md bg-base-100 hover:bg-base-200 text-base-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300"
              >
                ✅ Fix Grammar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instruction Messages */}
      {state.messages.filter(m => m.mode === 'chat').length === 0 && !state.input && !state.selectedTextContext && (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-2">Screenwriter Agent</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Generates 1-3 lines of Fountain format text that continue your scene from the cursor. No scene headings. No analysis. Just screenplay content.
              </p>
              <div className="text-xs text-base-content/50 space-y-1 mb-3">
                <p>Try: "Sarah enters the room"</p>
                <p>or "She's terrified and ready to leave"</p>
                <p>or "Write one line where he discovers the truth"</p>
              </div>
              <div className="text-xs text-base-content/40 pt-3 border-t border-base-300">
                <p>💡 <strong>Tip:</strong> Select any text in your screenplay to enable <strong>Rewrite mode</strong> with quick action buttons</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Messages Area - ChatGPT/Claude Style */}
      <div className="flex-1 chat-scroll-container">
        {state.messages
          .filter(m => m.mode === 'chat')
          .map((message, index) => {
            const isUser = message.role === 'user';
            const isLastAssistantMessage = 
              !isUser && 
              index === state.messages.filter(m => m.mode === 'chat').length - 1;
            
            // Show insert button for screenplay content
            // Also check if user's previous message was a content request (not a question)
            const previousUserMessage = state.messages
              .filter(m => m.mode === 'chat')
              .slice(0, index + 1)
              .reverse()
              .find(m => m.role === 'user');
            // 🔥 SIMPLIFIED: Screenwriter agent always generates content, so always show insert button if there's content
            const showInsertButton = 
              !isUser && 
              isLastAssistantMessage && 
              !activeWorkflow && 
              !workflowCompletionData &&
              (isScreenplayContent(message.content) || message.content.trim().length > 20);
            
            // Check if this message contains 3 rewrite options
            const rewriteOptions = !isUser && state.selectedTextContext ? parseRewriteOptions(message.content) : null;
            
            return (
              <div
                key={index}
                className={`group w-full ${isUser ? 'bg-transparent' : 'bg-base-200/30'} hover:bg-base-200/50 transition-colors`}
              >
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 relative">
                  <div className="flex gap-4 md:gap-6">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'bg-gradient-to-br from-cinema-red to-cinema-red/80 text-base-content' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600 text-base-content'
                    }`}>
                      {isUser ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Only show raw message content if we're not displaying parsed rewrite options */}
                      {!rewriteOptions && (
                      <div className="prose prose-sm md:prose-base max-w-none chat-message-content">
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words text-base-content">
                            {message.content}
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                      </div>
                      )}
                      
                      {/* Rewrite Options with Individual Insert Buttons */}
                      {rewriteOptions && rewriteOptions.length >= 2 && onInsert && (
                        <div className="space-y-4 mt-4">
                          {rewriteOptions.map((option, optIndex) => (
                            <div key={optIndex} className="bg-base-100 border border-base-300 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-base-content">
                                  {option.description || `Option ${option.number}`}
                                </h4>
                                <button
                                  onClick={() => {
                                    // If in rewrite mode, pass selection range info
                                    if (state.selectedTextContext && state.selectionRange) {
                                      onInsert(option.content, {
                                        isRewrite: true,
                                        selectionRange: state.selectionRange
                                      });
                                    } else {
                                      onInsert(option.content);
                                    }
                                    closeDrawer();
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Insert into script
                                </button>
                              </div>
                              <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-wrap font-mono text-xs bg-base-200 p-3 rounded border border-base-300">
                                {option.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Single Insert Button (if not showing rewrite options) */}
                      {showInsertButton && !rewriteOptions && onInsert && (
                        <div className="flex items-center gap-2 flex-wrap relative z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('[ChatModePanel] Insert button clicked (completed message)');
                              console.log('[ChatModePanel] onInsert function:', typeof onInsert);
                              console.log('[ChatModePanel] Message content length:', message.content?.length);
                              console.log('[ChatModePanel] Message content preview:', message.content?.substring(0, 500));
                              
                              // Clean the content before inserting (strip markdown, remove notes, remove duplicates)
                              // Get scene context for duplicate detection
                              const currentSceneContext = detectCurrentScene(editorContent, cursorPosition);
                              const cleanedContent = cleanFountainOutput(message.content, currentSceneContext?.contextBeforeCursor || null, currentSceneContext);
                              
                              console.log('[ChatModePanel] Cleaned content length:', cleanedContent?.length || 0);
                              console.log('[ChatModePanel] Cleaned content preview:', cleanedContent?.substring(0, 500) || '(empty)');
                              
                              // 🔥 PHASE 1 FIX: Validate content before inserting
                              if (!cleanedContent || cleanedContent.trim().length < 3) {
                                console.error('[ChatModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                                console.error('[ChatModePanel] Original content full:', message.content);
                                console.error('[ChatModePanel] Original content length:', message.content?.length);
                                console.error('[ChatModePanel] Cleaned content:', cleanedContent);
                                console.error('[ChatModePanel] Cleaned content length:', cleanedContent?.length);
                                
                                // Try using raw content if cleaned is empty
                                if (message.content && message.content.trim().length > 10) {
                                  console.warn('[ChatModePanel] Using raw content as fallback');
                                  onInsert(message.content);
                                  closeDrawer();
                                  return;
                                }
                                
                                toast.error('Content is empty after cleaning. Please try again or use the original response.');
                                return; // Don't insert empty content
                              }
                              
                              console.log('[ChatModePanel] ✅ Calling onInsert with cleaned content');
                              
                              // If in rewrite mode, pass selection range info
                              if (state.selectedTextContext && state.selectionRange) {
                                onInsert(cleanedContent, {
                                  isRewrite: true,
                                  selectionRange: state.selectionRange
                                });
                              } else {
                                onInsert(cleanedContent);
                              }
                              closeDrawer();
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200 cursor-pointer relative z-10"
                            type="button"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Insert into script
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Streaming text - show insert button while streaming AND after streaming completes if it's screenplay content */}
        {state.streamingText && state.streamingText.trim().length > 0 && (
          <div className="group w-full bg-base-200/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <div className="flex gap-4 md:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-base-content">
                  <Bot className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                
                {/* Streaming Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="prose prose-sm md:prose-base max-w-none chat-message-content">
                    <MarkdownRenderer content={state.streamingText} />
                    {state.isStreaming && (
                      <span className="inline-block w-0.5 h-5 ml-1 bg-purple-500 animate-pulse"></span>
                    )}
                  </div>
                  
                  {/* Insert button for streaming text (always show if there's content) */}
                  {onInsert && state.streamingText && state.streamingText.trim().length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap relative z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[ChatModePanel] Insert button clicked (streaming)');
                          console.log('[ChatModePanel] onInsert function:', typeof onInsert);
                          console.log('[ChatModePanel] Streaming text length:', state.streamingText?.length);
                          
                          // Clean the content before inserting (strip markdown, remove notes, remove duplicates)
                          // Get scene context for duplicate detection
                          const currentSceneContext = detectCurrentScene(editorContent, cursorPosition);
                          const cleanedContent = cleanFountainOutput(state.streamingText, currentSceneContext?.contextBeforeCursor || null, currentSceneContext);
                          
                          console.log('[ChatModePanel] Cleaned content length:', cleanedContent?.length || 0);
                          
                          // 🔥 PHASE 1 FIX: Validate content before inserting
                          if (!cleanedContent || cleanedContent.trim().length < 3) {
                            console.error('[ChatModePanel] ❌ Cannot insert: cleaned content is empty or too short');
                            console.error('[ChatModePanel] Original content length:', state.streamingText?.length);
                            console.error('[ChatModePanel] Cleaned content length:', cleanedContent?.length);
                            toast.error('Content is empty after cleaning. Please try again or use the original response.');
                            return; // Don't insert empty content
                          }
                          
                          console.log('[ChatModePanel] ✅ Calling onInsert with cleaned content');
                          
                          // If in rewrite mode, pass selection range info
                          if (state.selectedTextContext && state.selectionRange) {
                            onInsert(cleanedContent, {
                              isRewrite: true,
                              selectionRange: state.selectionRange
                            });
                          } else {
                            onInsert(cleanedContent);
                          }
                          closeDrawer();
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200 cursor-pointer relative z-10"
                        type="button"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Insert into script
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor - only scrolls while streaming */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Placeholder Info with New Chat button */}
      <div className="px-4 py-2 border-t border-base-300 flex items-center justify-between">
        <span className="text-xs text-base-content/60">
          {activeWorkflow ? (
            'Answer the question to continue the interview...'
          ) : (
            'Write 1-3 lines that continue the scene'
          )}
        </span>
        {state.messages.filter(m => m.mode === 'chat').length > 0 && (
          <button
            onClick={() => clearMessagesForMode('chat')}
            className="btn btn-xs btn-ghost gap-1.5 text-base-content/60 hover:text-base-content"
            title="Start new chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs">New Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}

