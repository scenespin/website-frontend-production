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

/**
 * Convert inches to rem for mobile (smaller scale)
 */
function inchesToRemMobile(inches: number): string {
  return `${inches * 3}rem`; // Half scale for mobile
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
            className="font-bold uppercase mb-2 sm:mb-3 px-2 sm:px-0"
            style={{
              fontFamily: 'Courier, monospace',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)',
            }}
          >
            {element.text}
          </div>
        );

      case 'action':
        return (
          <div
            key={key}
            className="mb-1 px-2 sm:px-0"
            style={{
              marginLeft: '0',
              marginRight: '0',
              maxWidth: '100%',
              fontFamily: 'Courier, monospace',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)',
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
            className="mt-2 sm:mt-3 mb-1 px-2 sm:px-0"
            style={{
              marginLeft: '0',
              marginRight: '0',
              textAlign: 'center',
              fontFamily: 'Courier, monospace',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)',
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
            className="mb-1 px-2 sm:px-0"
            style={{
              marginLeft: '1rem',
              marginRight: '0',
              maxWidth: 'calc(100% - 2rem)',
              fontFamily: 'Courier, monospace',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)',
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
            className="mb-2 sm:mb-3 px-2 sm:px-0"
            style={{
              marginLeft: '0.5rem',
              marginRight: '0',
              maxWidth: 'calc(100% - 1rem)',
              fontFamily: 'Courier, monospace',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)',
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
            className="mt-2 sm:mt-3 mb-2 sm:mb-3 uppercase px-2 sm:px-0"
            style={{
              marginLeft: '0',
              marginRight: '0',
              textAlign: 'right',
              fontFamily: 'Courier, monospace',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)',
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
    <div
      className="h-full overflow-auto py-2 sm:py-4 px-0 sm:px-4"
      style={{
        fontFamily: 'Courier, monospace',
        fontSize: 'clamp(10pt, 2.5vw, 12pt)',
        lineHeight: '1.5',
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
      }}
    >
      {elements.map((element, index) => renderElement(element, index))}
    </div>
  );
}
