'use client';

import { useMemo } from 'react';
import { parseFountain, ParsedElement, SCREENPLAY_FORMAT } from '@/utils/pdfExport';

interface ScreenplayPreviewProps {
  content: string;
}

/**
 * Convert inches to pixels (1 inch = 96px at standard DPI)
 */
function inchesToPixels(inches: number): number {
  return inches * 96;
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
  const maxPageWidth = inchesToRem(SCREENPLAY_FORMAT.pageWidth);
  const actionWidth = inchesToRem(SCREENPLAY_FORMAT.width.action);
  const dialogueWidth = inchesToRem(SCREENPLAY_FORMAT.width.dialogue);
  const parentheticalWidth = inchesToRem(SCREENPLAY_FORMAT.width.parenthetical);
  const characterIndent = inchesToRem(SCREENPLAY_FORMAT.indent.character);
  const parentheticalIndent = inchesToRem(SCREENPLAY_FORMAT.indent.parenthetical);
  const dialogueIndent = inchesToRem(SCREENPLAY_FORMAT.indent.dialogue);

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
              maxWidth: `min(${actionWidth}, 100%)`,
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
              marginLeft: characterIndent,
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
              marginLeft: parentheticalIndent,
              marginRight: 0,
              maxWidth: `min(${parentheticalWidth}, calc(100% - ${parentheticalIndent}))`,
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
              marginLeft: dialogueIndent,
              marginRight: 0,
              maxWidth: `min(${dialogueWidth}, calc(100% - ${dialogueIndent}))`,
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
        @media (max-width: 767px) {
          .screenplay-preview-container {
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
            margin-left: clamp(3rem, 16vw, 5rem) !important;
            margin-right: 0 !important;
          }
          .screenplay-preview-container .screenplay-parenthetical {
            margin-left: clamp(2.25rem, 14vw, 4rem) !important;
            margin-right: 0 !important;
            max-width: min(20rem, calc(100% - 2.5rem)) !important;
          }
          .screenplay-preview-container .screenplay-dialogue {
            margin-left: clamp(2.5rem, 12vw, 4.5rem) !important;
            margin-right: 0 !important;
            max-width: min(22rem, calc(100% - 2.75rem)) !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .screenplay-preview-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .screenplay-preview-container .screenplay-character {
            margin-left: clamp(7rem, 14vw, 9.5rem) !important;
          }
          .screenplay-preview-container .screenplay-parenthetical {
            margin-left: clamp(5.25rem, 11vw, 7.5rem) !important;
            max-width: min(24rem, calc(100% - 5.5rem)) !important;
          }
          .screenplay-preview-container .screenplay-dialogue {
            margin-left: clamp(4.5rem, 10vw, 6.5rem) !important;
            max-width: min(30rem, calc(100% - 4.75rem)) !important;
          }
        }
      `}</style>
      <div
        className="h-full overflow-auto screenplay-preview-container"
        style={{
          paddingTop: topMargin,
          paddingBottom: bottomMargin,
          paddingLeft: 'clamp(0.75rem, 2.5vw, 1.5rem)',
          paddingRight: 'clamp(0.75rem, 2.5vw, 1.5rem)',
          margin: '0 auto',
          maxWidth: `min(100%, ${maxPageWidth})`,
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
