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
  const leftMargin = inchesToRem(SCREENPLAY_FORMAT.marginLeft);
  const rightMargin = inchesToRem(SCREENPLAY_FORMAT.marginRight);
  const topMargin = inchesToRem(SCREENPLAY_FORMAT.marginTop);
  const bottomMargin = inchesToRem(SCREENPLAY_FORMAT.marginBottom);

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
              marginLeft: leftMargin,
              marginRight: rightMargin,
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
              marginLeft: leftMargin,
              marginRight: rightMargin,
              maxWidth: `calc(100% - ${leftMargin} - ${rightMargin})`,
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
              marginLeft: `calc(${leftMargin} + ${inchesToRem(SCREENPLAY_FORMAT.indent.character)})`,
              marginRight: rightMargin,
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
              marginLeft: `calc(${leftMargin} + ${inchesToRem(SCREENPLAY_FORMAT.indent.parenthetical)})`,
              marginRight: rightMargin,
              maxWidth: inchesToRem(SCREENPLAY_FORMAT.width.parenthetical),
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
              marginLeft: `calc(${leftMargin} + ${inchesToRem(SCREENPLAY_FORMAT.indent.dialogue)})`,
              marginRight: rightMargin,
              maxWidth: inchesToRem(SCREENPLAY_FORMAT.width.dialogue),
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
              marginLeft: leftMargin,
              marginRight: rightMargin,
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
        @media (max-width: 640px) {
          .screenplay-preview-container {
            padding: 0.5rem !important;
            font-size: clamp(10pt, 2.5vw, 12pt) !important;
          }
          .screenplay-preview-container .screenplay-scene {
            margin-left: 0.5rem !important;
            margin-right: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .screenplay-preview-container .screenplay-action {
            margin-left: 0.5rem !important;
            margin-right: 0.5rem !important;
            max-width: calc(100% - 1rem) !important;
          }
          .screenplay-preview-container .screenplay-character {
            margin-left: 0 !important;
            margin-right: 0 !important;
            text-align: center !important;
          }
          .screenplay-preview-container .screenplay-parenthetical {
            margin-left: 0 !important;
            margin-right: 0 !important;
            text-align: center !important;
            max-width: 100% !important;
          }
          .screenplay-preview-container .screenplay-dialogue {
            margin-left: 0 !important;
            margin-right: 0 !important;
            text-align: center !important;
            max-width: 100% !important;
          }
          .screenplay-preview-container .screenplay-transition {
            margin-left: 0.5rem !important;
            margin-right: 0.5rem !important;
          }
        }
      `}</style>
      <div
        className="h-full overflow-auto screenplay-preview-container"
        style={{
          paddingTop: topMargin,
          paddingBottom: bottomMargin,
          paddingLeft: leftMargin,
          paddingRight: rightMargin,
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
