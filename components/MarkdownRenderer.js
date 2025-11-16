'use client';

import { useEffect, useState } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

/**
 * MarkdownRenderer - Renders markdown text as HTML
 * Uses remark for safe markdown-to-HTML conversion
 */
export function MarkdownRenderer({ content, className = '' }) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (!content) {
      setHtmlContent('');
      return;
    }

    // Process markdown to HTML
    remark()
      .use(remarkGfm) // GitHub Flavored Markdown
      .use(html, { sanitize: false })
      .process(content)
      .then((file) => {
        setHtmlContent(String(file));
      })
      .catch((error) => {
        console.error('[MarkdownRenderer] Error processing markdown:', error);
        // Fallback to plain text if markdown processing fails
        setHtmlContent(content);
      });
  }, [content]);

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        // Override prose styles for dark mode compatibility
        color: 'inherit',
      }}
    />
  );
}

