/**
 * Production Hub Type Definitions
 * 
 * Shared types used across Production Hub components
 */

export interface ClipAssignment {
  clipIndex: number;
  source: 'ai-generate' | 'upload';
  
  // AI generation fields
  characterId?: string;
  characterName?: string;
  referenceId?: string;
  referenceUrl?: string;
  prompt?: string;
  
  // Upload fields
  uploadedFile?: File;
  uploadedS3Key?: string;
  uploadedUrl?: string;
  
  // Enhancement options (for uploaded clips)
  enhanceStyle?: boolean;
  reframe?: boolean;
  
  // Generation state
  status: 'pending' | 'uploading' | 'generating' | 'enhancing' | 'completed' | 'error';
  resultUrl?: string;
  resultS3Key?: string;
  creditsUsed: number;
  estimatedCost?: number;
  errorMessage?: string;
}

export interface AISuggestion {
  templateId: string;
  templateName: string;
  reasoning: string;
  clipCount: number;
  estimatedCost: number;
  clipRequirements: ClipRequirement[];
}

export interface ClipRequirement {
  clipIndex: number;
  description: string;
  suggestedCharacter?: string;
  suggestedCameraAngle: string;
  suggestedVisibility: 'face-visible' | 'body-only' | 'hands' | 'vfx' | 'establishing';
  estimatedCredits: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  type: 'lead' | 'supporting' | 'minor';
  description?: string;
  baseReference?: {
    imageUrl: string;
    s3Key?: string;
  };
  references: CharacterReference[]; // User-uploaded reference images
  poseReferences?: CharacterReference[]; // AI-generated pose images
  referenceCount: number;
  
  // Performance settings for character animation
  performanceSettings?: {
    facialPerformance: number;      // 0-2 range: 0=subtle, 1=natural (default), 2=dramatic
    animationStyle: 'full-body' | 'face-only';
  };
  
  // Creation section fields (read from Character, stored in CharacterProfile but don't sync back)
  arcStatus?: 'introduced' | 'developing' | 'resolved';
  arcNotes?: string;
  physicalAttributes?: {
    height?: 'short' | 'average' | 'tall';
    bodyType?: 'slim' | 'athletic' | 'muscular' | 'heavyset' | 'average';
    eyeColor?: string;
    hairColor?: string;
    hairLength?: 'bald' | 'very-short' | 'short' | 'medium' | 'long';
    hairStyle?: string;
    typicalClothing?: string;
  };
}

export interface CharacterReference {
  id: string;
  imageUrl: string;
  s3Key: string;
  label: string;
  referenceType: 'base' | 'angle' | 'expression' | 'action' | 'pose'; // Added 'pose' for AI-generated pose images
  metadata?: {
    outfitName?: string;
    poseId?: string;
    poseName?: string;
    packageId?: string;
    [key: string]: any; // Allow additional metadata fields
  };
}

