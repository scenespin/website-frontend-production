'use client';

import { useMemo } from 'react';
import { parseFountain, ParsedElement, SCREENPLAY_FORMAT } from '@/utils/pdfExport';

interface ScreenplayPreviewProps {
  content: string;
}

/**
 * Convert inches to rem (assuming 1rem = 16px base, so 1 inch = 6rem)
 */
function inchesToRem(inches: number): string {
  return `${inches * 6}rem`;
}

export default function ScreenplayPreview({ content }: ScreenplayPreviewProps) {
  // Parse Fountain content into elements
  const elements = useMemo(() => {
    if (!content.trim()) {
      return [];
    }
    return parseFountain(content);
  }, [content]);

  // Convert formatting constants to CSS values
  const topMargin = inchesToRem(SCREENPLAY_FORMAT.marginTop);
  const bottomMargin = inchesToRem(SCREENPLAY_FORMAT.marginBottom);
  const baseActionWidth = SCREENPLAY_FORMAT.width.action * 6;
  const baseDialogueWidth = SCREENPLAY_FORMAT.width.dialogue * 6;
  const baseParentheticalWidth = SCREENPLAY_FORMAT.width.parenthetical * 6;
  const baseCharacterIndent = SCREENPLAY_FORMAT.indent.character * 6;
  const baseParentheticalIndent = SCREENPLAY_FORMAT.indent.parenthetical * 6;
  const baseDialogueIndent = SCREENPLAY_FORMAT.indent.dialogue * 6;

  const renderElement = (element: ParsedElement, index: number) => {
    const key = `element-${index}`;

    switch (element.type) {
      case 'blank':
        return <div key={key} className="h-3" />; // Line spacing

      case 'scene':
        return (
          <div
            key={key}
            className="font-bold uppercase mb-3 screenplay-scene"
            style={{
              marginLeft: 0,
              marginRight: 0,
              fontFamily: 'Courier, monospace',
              fontSize: '12pt',
            }}
          >
            {element.text}
          </div>
        );

      case 'action':
        return (
          <div
            key={key}
            className="mb-1 screenplay-action"
            style={{
              marginLeft: 0,
              marginRight: 0,
              maxWidth: `min(var(--preview-action-width, ${baseActionWidth}rem), 100%)`,
              fontFamily: 'Courier, monospace',
              fontSize: '12pt',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {element.text}
          </div>
        );

      case 'character':
        return (
          <div
            key={key}
            className="mt-3 mb-1 screenplay-character"
            style={{
              marginLeft: `var(--preview-character-indent, ${baseCharacterIndent}rem)`,
              marginRight: 0,
              fontFamily: 'Courier, monospace',
              fontSize: '12pt',
              fontWeight: 'normal',
            }}
          >
            {element.text}
          </div>
        );

      case 'parenthetical':
        return (
          <div
            key={key}
            className="mb-1 screenplay-parenthetical"
            style={{
              marginLeft: `var(--preview-parenthetical-indent, ${baseParentheticalIndent}rem)`,
              marginRight: 0,
              maxWidth: `min(var(--preview-parenthetical-width, ${baseParentheticalWidth}rem), calc(100% - var(--preview-parenthetical-indent, ${baseParentheticalIndent}rem)))`,
              fontFamily: 'Courier, monospace',
              fontSize: '12pt',
              wordWrap: 'break-word',
            }}
          >
            {element.text}
          </div>
        );

      case 'dialogue':
        return (
          <div
            key={key}
            className="mb-3 screenplay-dialogue"
            style={{
              marginLeft: `var(--preview-dialogue-indent, ${baseDialogueIndent}rem)`,
              marginRight: 0,
              maxWidth: `min(var(--preview-dialogue-width, ${baseDialogueWidth}rem), calc(100% - var(--preview-dialogue-indent, ${baseDialogueIndent}rem)))`,
              fontFamily: 'Courier, monospace',
              fontSize: '12pt',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {element.text}
          </div>
        );

      case 'transition':
        return (
          <div
            key={key}
            className="mt-3 mb-3 uppercase screenplay-transition"
            style={{
              marginLeft: 0,
              marginRight: 0,
              textAlign: 'right',
              fontFamily: 'Courier, monospace',
              fontSize: '12pt',
            }}
          >
            {element.text}
          </div>
        );

      default:
        return null;
    }
  };

  if (elements.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-base-content/60"
        style={{
          fontFamily: 'Courier, monospace',
          fontSize: '12pt',
        }}
      >
        No content to preview
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .screenplay-preview-container {
          --preview-frame-max-width: 68rem;
          --preview-frame-padding-x: clamp(1rem, 2.2vw, 1.75rem);
          --preview-action-width: 45rem;
          --preview-character-indent: 9rem;
          --preview-parenthetical-indent: 7rem;
          --preview-parenthetical-width: 24rem;
          --preview-dialogue-indent: 7rem;
          --preview-dialogue-width: 32rem;
        }

        @media (max-width: 767px) {
          .screenplay-preview-container {
            --preview-frame-max-width: 100%;
            --preview-frame-padding-x: 0.75rem;
            --preview-action-width: 100%;
            --preview-character-indent: clamp(3rem, 16vw, 5rem);
            --preview-parenthetical-indent: clamp(2.25rem, 14vw, 4rem);
            --preview-parenthetical-width: min(20rem, calc(100% - 2.5rem));
            --preview-dialogue-indent: clamp(2.5rem, 12vw, 4.5rem);
            --preview-dialogue-width: min(22rem, calc(100% - 2.75rem));
            padding: 0.75rem !important;
            font-size: clamp(10pt, 2.8vw, 12pt) !important;
            line-height: 1.45 !important;
          }
          .screenplay-preview-container .screenplay-scene,
          .screenplay-preview-container .screenplay-action,
          .screenplay-preview-container .screenplay-transition {
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 100% !important;
          }
          .screenplay-preview-container .screenplay-character {
            margin-left: var(--preview-character-indent) !important;
            margin-right: 0 !important;
          }
          .screenplay-preview-container .screenplay-parenthetical {
            margin-left: var(--preview-parenthetical-indent) !important;
            margin-right: 0 !important;
            max-width: var(--preview-parenthetical-width) !important;
          }
          .screenplay-preview-container .screenplay-dialogue {
            margin-left: var(--preview-dialogue-indent) !important;
            margin-right: 0 !important;
            max-width: var(--preview-dialogue-width) !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .screenplay-preview-container {
            --preview-frame-max-width: 74rem;
            --preview-frame-padding-x: 1.25rem;
            --preview-action-width: 52rem;
            --preview-character-indent: 7.5rem;
            --preview-parenthetical-indent: 5.75rem;
            --preview-parenthetical-width: 25rem;
            --preview-dialogue-indent: 5.5rem;
            --preview-dialogue-width: 34rem;
            padding-left: var(--preview-frame-padding-x) !important;
            padding-right: var(--preview-frame-padding-x) !important;
          }
          .screenplay-preview-container .screenplay-character {
            margin-left: var(--preview-character-indent) !important;
          }
          .screenplay-preview-container .screenplay-parenthetical {
            margin-left: var(--preview-parenthetical-indent) !important;
            max-width: var(--preview-parenthetical-width) !important;
          }
          .screenplay-preview-container .screenplay-dialogue {
            margin-left: var(--preview-dialogue-indent) !important;
            max-width: var(--preview-dialogue-width) !important;
          }
        }
      `}</style>
      <div
        className="h-full overflow-auto screenplay-preview-container"
        style={{
          paddingTop: topMargin,
          paddingBottom: bottomMargin,
          paddingLeft: 'var(--preview-frame-padding-x)',
          paddingRight: 'var(--preview-frame-padding-x)',
          margin: '0 auto',
          maxWidth: 'var(--preview-frame-max-width)',
          fontFamily: 'Courier, monospace',
          fontSize: '12pt',
          lineHeight: '1.5',
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        {elements.map((element, index) => renderElement(element, index))}
      </div>
    </>
  );
}
