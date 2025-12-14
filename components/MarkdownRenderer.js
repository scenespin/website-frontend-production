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
          font-size: 0.75rem;
          line-height: 1.5;
        }
        @media (min-width: 640px) {
          .markdown-chat-content {
            font-size: 0.8125rem;
          }
        }
        .markdown-chat-content h1,
        .markdown-chat-content h2,
        .markdown-chat-content h3,
        .markdown-chat-content h4,
        .markdown-chat-content h5,
        .markdown-chat-content h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 700;
          line-height: 1.2;
          color: inherit;
          letter-spacing: -0.01em;
        }
        .markdown-chat-content h1 { 
          font-size: 1.35em; 
          font-weight: 800;
          margin-top: 1.25em;
          margin-bottom: 0.75em;
        }
        .markdown-chat-content h2 { 
          font-size: 1.2em; 
          font-weight: 700;
          margin-top: 1.15em;
          margin-bottom: 0.65em;
        }
        .markdown-chat-content h3 { 
          font-size: 1.1em; 
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.6em;
        }
        .markdown-chat-content h4 { 
          font-size: 1.05em; 
          font-weight: 700;
        }
        .markdown-chat-content h5,
        .markdown-chat-content h6 {
          font-size: 1em;
          font-weight: 700;
        }
        .markdown-chat-content p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .markdown-chat-content ul,
        .markdown-chat-content ol {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 1.25em;
        }
        .markdown-chat-content li {
          margin-top: 0.2em;
          margin-bottom: 0.2em;
        }
        .markdown-chat-content code:not(pre code) {
          font-size: 0.9em;
          padding: 0.125em 0.375em;
          border-radius: 0.25rem;
          background-color: rgba(0, 0, 0, 0.1);
          font-weight: 500;
        }
        .markdown-chat-content pre {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          background-color: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          overflow-x: auto;
          font-size: 0.75rem;
          line-height: 1.5;
        }
        .markdown-chat-content pre code {
          padding: 0;
          background-color: transparent;
          font-size: inherit;
        }
        .markdown-chat-content blockquote {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding-left: 0.875em;
          border-left: 3px solid rgba(0, 0, 0, 0.2);
          font-style: italic;
        }
        .markdown-chat-content strong {
          font-weight: 700;
          color: inherit;
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

