'use client';

import { useEffect, useState } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

/**
 * MarkdownRenderer - Renders markdown text as HTML
 * Uses remark for safe markdown-to-HTML conversion
 * Optimized for chat UI with enhanced Fountain code block support
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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-chat-content {
          color: inherit;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        @media (min-width: 640px) {
          .markdown-chat-content {
            font-size: 1rem;
          }
        }
        .markdown-chat-content h1,
        .markdown-chat-content h2,
        .markdown-chat-content h3,
        .markdown-chat-content h4,
        .markdown-chat-content h5,
        .markdown-chat-content h6 {
          margin-top: 1.25em;
          margin-bottom: 0.75em;
          font-weight: 600;
          line-height: 1.3;
        }
        .markdown-chat-content h1 { font-size: 1.5em; }
        .markdown-chat-content h2 { font-size: 1.3em; }
        .markdown-chat-content h3 { font-size: 1.15em; }
        .markdown-chat-content p {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        .markdown-chat-content ul,
        .markdown-chat-content ol {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding-left: 1.5em;
        }
        .markdown-chat-content li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
        .markdown-chat-content code:not(pre code) {
          font-size: 0.9em;
          padding: 0.125em 0.375em;
          border-radius: 0.25rem;
          background-color: rgba(0, 0, 0, 0.1);
        }
        .markdown-chat-content pre {
          margin-top: 1em;
          margin-bottom: 1em;
          padding: 0.875rem 1rem;
          border-radius: 0.5rem;
          background-color: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          overflow-x: auto;
          font-size: 0.8125rem;
          line-height: 1.5;
        }
        .markdown-chat-content pre code {
          padding: 0;
          background-color: transparent;
          font-size: inherit;
        }
        .markdown-chat-content blockquote {
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 1em;
          border-left: 3px solid rgba(0, 0, 0, 0.2);
          font-style: italic;
        }
        .markdown-chat-content strong {
          font-weight: 600;
        }
        .markdown-chat-content em {
          font-style: italic;
        }
      ` }} />
      <div 
        className={`prose prose-sm sm:prose-base max-w-none dark:prose-invert markdown-chat-content ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
}

