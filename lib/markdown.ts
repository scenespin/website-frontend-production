import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const docsDirectory = path.join(process.cwd(), '..', 'docs');

export interface DocMetadata {
  title: string;
  description: string;
  content: string;
}

/**
 * Get markdown content from a file path
 */
export async function getMarkdownContent(filePath: string): Promise<string> {
  const fullPath = path.join(docsDirectory, filePath);
  
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { content } = matter(fileContents);
    
    const processedContent = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, etc.)
      .use(html, { sanitize: false })
      .process(content);
    
    return processedContent.toString();
  } catch (error) {
    console.error(`Error reading markdown file: ${filePath}`, error);
    return '<p>Documentation not found.</p>';
  }
}

/**
 * Get all documentation files
 */
export function getAllDocs(): string[] {
  const userGuidePath = path.join(docsDirectory, 'user-guide');
  
  try {
    const files = fs.readdirSync(userGuidePath);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error('Error reading docs directory:', error);
    return [];
  }
}

/**
 * Get documentation metadata
 */
export function getDocMetadata(slug: string): { title: string; description: string } {
  const docMap: Record<string, { title: string; description: string }> = {
    'getting-started': {
      title: 'Getting Started',
      description: 'New to Wryda.ai? Start here with our comprehensive onboarding guide.',
    },
    'editor': {
      title: 'Editor Guide',
      description: 'Master the screenplay editor with complete Fountain format reference.',
    },
    'ai-agents': {
      title: 'AI Agents Guide',
      description: 'Unlock the power of three specialized AI writing agents for screenwriting.',
    },
    'video': {
      title: 'Video Generation Guide',
      description: 'Create stunning AI-generated videos from your screenplay scenes.',
    },
    'quick-reference': {
      title: 'Quick Reference',
      description: 'Keyboard shortcuts, commands, and syntax quick lookup.',
    },
  };

  return docMap[slug] || { title: 'Documentation', description: 'Wryda.ai documentation' };
}

/**
 * Map URL slug to file path
 */
export function getFilePathFromSlug(slug: string): string {
  const fileMap: Record<string, string> = {
    'getting-started': 'user-guide/GETTING_STARTED.md',
    'editor': 'user-guide/EDITOR_GUIDE.md',
    'ai-agents': 'user-guide/AI_AGENTS_GUIDE.md',
    'video': 'user-guide/VIDEO_GENERATION_GUIDE.md',
    'quick-reference': 'QUICK_REFERENCE.md',
  };

  return fileMap[slug] || 'README.md';
}

