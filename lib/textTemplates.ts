/**
 * Text Templates Library
 * 
 * Pre-made text styling templates for common use cases
 * Feature 0104 Phase 2
 */

import { TimelineAsset } from '@/hooks/useTimeline';

export interface TextTemplate {
  id: string;
  name: string;
  category: 'social' | 'corporate' | 'cinematic' | 'education';
  description: string;
  thumbnail?: string;
  
  // Template configuration (everything except actual text content)
  config: Omit<NonNullable<TimelineAsset['textContent']>, 'text'> & { text: string };
  
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Built-in template library
export const BUILT_IN_TEMPLATES: TextTemplate[] = [
  // ========== SOCIAL MEDIA TEMPLATES ==========
  {
    id: 'youtube-lower-third',
    name: 'YouTube Lower Third',
    category: 'social',
    description: 'Bold white text with red background, slides in from left',
    config: {
      text: 'Your Channel Name',
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      textColor: '#FFFFFF',
      backgroundColor: '#FF0000',
      opacity: 1.0,
      positionPreset: 'bottom-left',
      positionX: 10,
      positionY: 85,
      textAlign: 'left',
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 2,
      animations: {
        slideIn: { enabled: true, from: 'left', duration: 0.5, easing: 'ease-out' },
        fadeOut: { enabled: true, duration: 0.3, easing: 'ease-in' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'instagram-story-title',
    name: 'Instagram Story Title',
    category: 'social',
    description: 'Large bold center text with background, perfect for stories',
    config: {
      text: 'Your Title Here',
      fontFamily: 'Impact',
      fontSize: 64,
      fontWeight: 'bold',
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      opacity: 0.9,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      shadow: true,
      shadowColor: '#FF00FF',
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      animations: {
        scaleIn: { enabled: true, from: 0.5, duration: 0.4, easing: 'bounce' },
        scaleOut: { enabled: true, to: 0.5, duration: 0.3, easing: 'ease-in' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'tiktok-caption',
    name: 'TikTok Caption',
    category: 'social',
    description: 'Bold white text with thick black outline, bottom center',
    config: {
      text: 'Your Caption',
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      textColor: '#FFFFFF',
      opacity: 1.0,
      positionPreset: 'bottom-center',
      positionX: 50,
      positionY: 85,
      textAlign: 'center',
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 4,
      animations: {
        fadeIn: { enabled: true, duration: 0.2, easing: 'ease-in' },
        fadeOut: { enabled: true, duration: 0.2, easing: 'ease-out' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'social-call-to-action',
    name: 'Call to Action',
    category: 'social',
    description: 'Eye-catching text that scales in and pulses attention',
    config: {
      text: 'SUBSCRIBE NOW!',
      fontFamily: 'Impact',
      fontSize: 72,
      fontWeight: 'bold',
      textColor: '#FFFF00',
      backgroundColor: '#FF0000',
      opacity: 1.0,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 3,
      shadow: true,
      shadowColor: '#000000',
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      animations: {
        scaleIn: { enabled: true, from: 0, duration: 0.4, easing: 'bounce' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // ========== CORPORATE TEMPLATES ==========
  {
    id: 'corporate-title',
    name: 'Corporate Title',
    category: 'corporate',
    description: 'Professional clean title, fades in elegantly',
    config: {
      text: 'Company Name',
      fontFamily: 'Helvetica',
      fontSize: 56,
      fontWeight: 'normal',
      textColor: '#FFFFFF',
      opacity: 1.0,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      animations: {
        fadeIn: { enabled: true, duration: 1.0, easing: 'ease-in' },
        fadeOut: { enabled: true, duration: 1.0, easing: 'ease-out' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'corporate-lower-third',
    name: 'Corporate Lower Third',
    category: 'corporate',
    description: 'Professional name plate with subtle entrance',
    config: {
      text: 'John Doe - CEO',
      fontFamily: 'Georgia',
      fontSize: 32,
      fontWeight: 'normal',
      textColor: '#FFFFFF',
      backgroundColor: '#1E3A8A',
      opacity: 0.95,
      positionPreset: 'bottom-left',
      positionX: 10,
      positionY: 88,
      textAlign: 'left',
      animations: {
        slideIn: { enabled: true, from: 'left', duration: 0.6, easing: 'ease-out' },
        fadeOut: { enabled: true, duration: 0.4, easing: 'ease-in' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'presentation-point',
    name: 'Presentation Point',
    category: 'corporate',
    description: 'Bullet point style for presentations',
    config: {
      text: '• Key Takeaway',
      fontFamily: 'Verdana',
      fontSize: 40,
      fontWeight: 'normal',
      textColor: '#FFFFFF',
      backgroundColor: '#374151',
      opacity: 0.9,
      positionPreset: 'center-left',
      positionX: 15,
      positionY: 50,
      textAlign: 'left',
      animations: {
        slideIn: { enabled: true, from: 'left', duration: 0.5, easing: 'ease-out' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // ========== CINEMATIC TEMPLATES ==========
  {
    id: 'movie-title',
    name: 'Movie Title',
    category: 'cinematic',
    description: 'Epic movie-style title that scales and fades in',
    config: {
      text: 'THE BEGINNING',
      fontFamily: 'Times New Roman',
      fontSize: 80,
      fontWeight: 'bold',
      textColor: '#FFFFFF',
      opacity: 1.0,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      shadow: true,
      shadowColor: '#000000',
      shadowOffsetX: 6,
      shadowOffsetY: 6,
      animations: {
        scaleIn: { enabled: true, from: 0.5, duration: 1.5, easing: 'ease-out' },
        fadeIn: { enabled: true, duration: 1.5, easing: 'ease-in' },
        fadeOut: { enabled: true, duration: 1.0, easing: 'ease-out' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'end-credits',
    name: 'End Credits',
    category: 'cinematic',
    description: 'Classic rolling credits style',
    config: {
      text: 'Directed by You',
      fontFamily: 'Georgia',
      fontSize: 36,
      fontWeight: 'normal',
      textColor: '#FFFFFF',
      opacity: 1.0,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      animations: {
        fadeIn: { enabled: true, duration: 0.8, easing: 'ease-in' },
        fadeOut: { enabled: true, duration: 0.8, easing: 'ease-out' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'dramatic-reveal',
    name: 'Dramatic Reveal',
    category: 'cinematic',
    description: 'Slow scale-in for dramatic moments',
    config: {
      text: 'THE TRUTH',
      fontFamily: 'Impact',
      fontSize: 96,
      fontWeight: 'bold',
      textColor: '#FF0000',
      opacity: 1.0,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 4,
      shadow: true,
      shadowColor: '#000000',
      shadowOffsetX: 8,
      shadowOffsetY: 8,
      animations: {
        scaleIn: { enabled: true, from: 0, duration: 2.0, easing: 'ease-out' },
        fadeIn: { enabled: true, duration: 1.5, easing: 'ease-in' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // ========== EDUCATION TEMPLATES ==========
  {
    id: 'edu-chapter-title',
    name: 'Chapter Title',
    category: 'education',
    description: 'Clear chapter heading for educational content',
    config: {
      text: 'Chapter 1: Introduction',
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      textColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      opacity: 0.95,
      positionPreset: 'top-center',
      positionX: 50,
      positionY: 15,
      textAlign: 'center',
      animations: {
        slideIn: { enabled: true, from: 'top', duration: 0.5, easing: 'ease-out' },
        fadeOut: { enabled: true, duration: 0.4, easing: 'ease-in' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'edu-subtitle',
    name: 'Educational Subtitle',
    category: 'education',
    description: 'Bottom-placed subtitle for narration',
    config: {
      text: 'This is the main concept',
      fontFamily: 'Verdana',
      fontSize: 32,
      fontWeight: 'normal',
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      opacity: 0.85,
      positionPreset: 'bottom-center',
      positionX: 50,
      positionY: 90,
      textAlign: 'center',
      animations: {
        fadeIn: { enabled: true, duration: 0.3, easing: 'ease-in' },
        fadeOut: { enabled: true, duration: 0.3, easing: 'ease-out' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    id: 'edu-key-term',
    name: 'Key Term Highlight',
    category: 'education',
    description: 'Highlight important terms with scale effect',
    config: {
      text: 'IMPORTANT',
      fontFamily: 'Arial',
      fontSize: 56,
      fontWeight: 'bold',
      textColor: '#FBBF24',
      backgroundColor: '#1F2937',
      opacity: 0.95,
      positionPreset: 'center',
      positionX: 50,
      positionY: 50,
      textAlign: 'center',
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 2,
      animations: {
        scaleIn: { enabled: true, from: 0.5, duration: 0.3, easing: 'ease-out' },
        scaleOut: { enabled: true, to: 0.5, duration: 0.3, easing: 'ease-in' }
      }
    },
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

// Helper function to get template by ID
export function getTemplateById(id: string): TextTemplate | undefined {
  return BUILT_IN_TEMPLATES.find(t => t.id === id);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: TextTemplate['category']): TextTemplate[] {
  return BUILT_IN_TEMPLATES.filter(t => t.category === category);
}

// Helper function to get all categories
export function getAllCategories(): TextTemplate['category'][] {
  return ['social', 'corporate', 'cinematic', 'education'];
}

