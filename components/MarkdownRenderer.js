'use client';

import { useEffect, useState, useRef } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

/**
 * MarkdownRenderer - Renders markdown text as HTML
 * Uses remark for safe markdown-to-HTML conversion
 * Optimized for chat UI with enhanced Fountain code block support
 */
export function MarkdownRenderer({ content, className = '' }) {
  const [htmlContent, setHtmlContent] = useState('');
  const containerRef = useRef(null);

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

  // Add copy buttons to code blocks after HTML is rendered
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;

    const container = containerRef.current;
    const preElements = container.querySelectorAll('pre');

    preElements.forEach((pre, index) => {
      // Skip if already has a copy button
      if (pre.parentElement?.querySelector('.code-block-copy-btn')) return;
      
      // Skip if already wrapped (but check if button exists)
      const existingWrapper = pre.parentElement?.classList.contains('code-block-wrapper') 
        ? pre.parentElement 
        : null;
      
      let wrapper = existingWrapper;
      
      // Create wrapper if it doesn't exist
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper relative group';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }

      // Create copy button (only if it doesn't exist)
      if (!wrapper.querySelector('.code-block-copy-btn')) {
        const copyButton = document.createElement('button');
        copyButton.className = 'code-block-copy-btn absolute top-2 right-2 p-1.5 rounded-md bg-base-300/80 hover:bg-base-300 text-base-content/70 hover:text-base-content transition-all opacity-60 hover:opacity-100 z-10';
        copyButton.setAttribute('data-index', index.toString());
        copyButton.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        `;
        copyButton.title = 'Copy code';
        
        // Get code content
        const codeElement = pre.querySelector('code');
        const codeText = codeElement ? codeElement.textContent || codeElement.innerText : pre.textContent || pre.innerText;

        // Add click handler
        copyButton.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          try {
            await navigator.clipboard.writeText(codeText);
            // Update button to show checkmark temporarily
            const originalHTML = copyButton.innerHTML;
            copyButton.innerHTML = `
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            `;
            copyButton.classList.add('text-green-500');
            toast.success('Copied to clipboard!', { duration: 2000 });
            setTimeout(() => {
              copyButton.innerHTML = originalHTML;
              copyButton.classList.remove('text-green-500');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy');
          }
        });

        wrapper.appendChild(copyButton);
      }
    });

    // No cleanup - buttons persist even when content updates
    // This ensures copy buttons remain available after streaming completes
  }, [htmlContent]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-chat-content {
          color: inherit;
          font-size: 0.75rem;
          line-height: 1.5;
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
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
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }
        .markdown-chat-content * {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }
        /* Ensure code blocks are also selectable */
        .markdown-chat-content pre,
        .markdown-chat-content code {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
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
          border: 2px solid rgba(0, 0, 0, 0.15);
          overflow-x: auto;
          overflow-y: visible;
          font-size: 0.75rem;
          line-height: 1.5;
          white-space: pre;
          position: relative;
          /* Hide scrollbar but keep scrolling functionality */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .markdown-chat-content pre::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        .code-block-wrapper {
          position: relative;
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        .code-block-copy-btn {
          backdrop-filter: blur(4px);
        }
        .code-block-copy-btn svg {
          display: block;
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
        ref={containerRef}
        className={`prose prose-sm sm:prose-base max-w-none dark:prose-invert markdown-chat-content ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
}

