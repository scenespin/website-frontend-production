/**
 * Scene Builder Service
 * 
 * Centralized API service for Scene Builder operations.
 * Handles all API calls with proper error handling and token management.
 */

import { api } from '@/lib/api';
import { SceneAnalysisResult } from '@/types/screenplay';

export interface ScenePropsResponse {
  id: string;
  name: string;
  imageUrl?: string;
  s3Key?: string;
}

export interface CharacterHeadshot {
  poseId?: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
  priority?: number;
  outfitName?: string;
}

export interface WorkflowExecution {
  executionId: string;
  status: string;
  currentStep?: number;
  totalSteps?: number;
  stepResults?: any[];
  totalCreditsUsed?: number;
  finalOutputs?: any[];
  metadata?: any;
}

export interface WorkflowStatusResponse {
  success: boolean;
  execution?: WorkflowExecution;
  message?: string;
}

export interface ShotPricing {
  shotSlot: number;
  hdPrice: number;
  k4Price: number;
}

export interface ScenePricingResult {
  shots: ShotPricing[];
  totalHdPrice: number;
  totalK4Price: number;
}

export class SceneBuilderService {
  /**
   * Get authentication token
   */
  private static async getToken(getTokenFn: (options: { template: string }) => Promise<string | null>): Promise<string> {
    const token = await getTokenFn({ template: 'wryda-backend' });
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  }

  /**
   * Analyze a scene
   */
  static async analyzeScene(
    screenplayId: string,
    sceneId: string
  ): Promise<SceneAnalysisResult> {
    const result = await api.sceneAnalyzer.analyze({
      screenplayId,
      sceneId
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to analyze scene');
    }
    
    return result.data;
  }

  /**
   * Fetch scene props from Asset Bank
   */
  static async fetchSceneProps(
    propIds: string[],
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<ScenePropsResponse[]> {
    if (propIds.length === 0) return [];
    
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/assets?ids=${propIds.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch props: ${response.statusText}`);
    }
    
    const data = await response.json();
    const props = Array.isArray(data) ? data : (data.assets || []);
    
    return props.map((prop: any) => ({
      id: prop.id || prop.assetId,
      name: prop.name || prop.assetName || 'Unnamed Prop',
      imageUrl: prop.imageUrl || prop.thumbnailUrl,
      s3Key: prop.s3Key || prop.imageS3Key
    }));
  }

  /**
   * Fetch style profiles for a project
   */
  static async fetchStyleProfiles(
    screenplayId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<any[]> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/style/project/${screenplayId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch style profiles: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.profiles || [];
  }

  /**
   * Fetch all characters from Character Bank
   */
  static async fetchCharacters(
    screenplayId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<any[]> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/character-bank/list?screenplayId=${encodeURIComponent(screenplayId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch characters: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.characters || data.data?.characters || [];
  }

  /**
   * Fetch character headshots with full deduplication and filtering logic
   */
  static async fetchCharacterHeadshots(
    characterId: string,
    screenplayId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<CharacterHeadshot[]> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/character-bank/${characterId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch character headshots: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    const character = responseData.data?.character || responseData.character;
    
    if (!character) {
      return [];
    }
    
    // Deduplicate poseReferences and angleReferences
    const seenRefs = new Set<string>();
    const allPoseReferences: any[] = [];
    
    // Add poseReferences first
    if (character.poseReferences) {
      for (const ref of character.poseReferences) {
        const key = ref.s3Key || ref.poseId || ref.metadata?.poseId || JSON.stringify(ref);
        if (!seenRefs.has(key)) {
          seenRefs.add(key);
          allPoseReferences.push(ref);
        }
      }
    }
    
    // Add angleReferences, skipping duplicates
    if (character.angleReferences) {
      for (const ref of character.angleReferences) {
        const key = ref.s3Key || ref.poseId || ref.metadata?.poseId || JSON.stringify(ref);
        if (!seenRefs.has(key)) {
          seenRefs.add(key);
          allPoseReferences.push(ref);
        }
      }
    }
    
    // Filter to headshot poses only
    const headshotPoseIds = ['close-up-front-facing', 'close-up', 'extreme-close-up', 'close-up-three-quarter', 'headshot-front', 'headshot-3/4', 'front-facing'];
    const headshotPoses = allPoseReferences.filter((ref: any) => {
      const poseId = ref.poseId || ref.metadata?.poseId;
      return poseId && headshotPoseIds.some(hp => poseId.toLowerCase().includes(hp.toLowerCase()));
    });
    
    // Transform to headshot format
    const beforeFinalDedup = headshotPoses
      .map((ref: any) => ({
        poseId: ref.poseId || ref.metadata?.poseId,
        s3Key: ref.s3Key,
        imageUrl: ref.imageUrl,
        label: ref.label || ref.metadata?.poseName || 'Headshot',
        priority: ref.priority || 999,
        outfitName: ref.outfitName || ref.metadata?.outfitName
      }))
      .filter((ref: any) => ref.imageUrl); // Only include headshots with imageUrl
    
    // Final deduplication pass: remove any remaining duplicates by s3Key or poseId
    const headshots = beforeFinalDedup
      .filter((ref: any, index: number, self: any[]) => {
        const key = ref.s3Key || ref.poseId;
        if (!key) return true; // Keep if no key (shouldn't happen)
        const firstIndex = self.findIndex((r: any) => (r.s3Key || r.poseId) === key);
        return index === firstIndex;
      })
      .slice(0, 10); // Limit to 10 headshots
    
    // If no Production Hub images exist, include baseReference (creation image) as last resort
    if (headshots.length === 0 && character.baseReference?.imageUrl) {
      headshots.push({
        poseId: 'base-reference',
        s3Key: character.baseReference.s3Key || '',
        imageUrl: character.baseReference.imageUrl,
        label: 'Creation Image (Last Resort)',
        priority: 9999, // Lowest priority (highest number) - this is last resort
        outfitName: undefined
      });
    }
    
    return headshots;
  }

  /**
   * Fetch voice profile for a character
   */
  static async fetchVoiceProfile(
    characterId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<{ hasVoice: boolean; voiceName?: string; voiceType?: string } | null> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/voice-profile/${characterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No voice profile
      }
      throw new Error(`Failed to fetch voice profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.voiceProfile || null;
  }

  /**
   * Recover workflow execution (check if still running)
   */
  static async recoverWorkflowExecution(
    executionId: string,
    screenplayId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<WorkflowExecution | null> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/workflows/${executionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return null; // Execution not found or expired
    }
    
    const data: WorkflowStatusResponse = await response.json();
    
    if (!data.success || !data.execution) {
      return null;
    }
    
    // Only return if still running
    if (['running', 'queued', 'awaiting_user_decision'].includes(data.execution.status)) {
      return data.execution;
    }
    
    return null;
  }

  /**
   * Poll workflow status
   */
  static async pollWorkflowStatus(
    executionId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<WorkflowExecution> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/workflows/${executionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workflow execution not found. It may have been deleted or expired.');
      }
      if (response.status === 401) {
        throw new Error('Authentication failed. Please refresh the page and try again.');
      }
      throw new Error(`Failed to poll workflow: ${response.statusText}`);
    }
    
    const data: WorkflowStatusResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Workflow status response not successful');
    }
    
    if (!data.execution) {
      throw new Error('Workflow status response missing execution data');
    }
    
    return data.execution;
  }

  /**
   * Execute workflow
   */
  static async executeWorkflow(
    workflowRequest: any,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<{ executionId: string }> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch('/api/workflows/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workflowRequest)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to execute workflow: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.executionId) {
      throw new Error(data.error || 'Failed to execute workflow');
    }
    
    return { executionId: data.executionId };
  }

  /**
   * Submit workflow decision
   */
  static async submitWorkflowDecision(
    executionId: string,
    decision: 'continue' | 'skip',
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<void> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(`/api/workflows/${executionId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ decision })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit decision: ${response.statusText}`);
    }
  }

  /**
   * Get presigned URL for S3 upload
   */
  static async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    screenplayId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<{ url: string; fields: Record<string, string>; s3Key: string }> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch(
      `/api/video/upload/get-presigned-url?` +
      `fileName=${encodeURIComponent(fileName)}` +
      `&fileType=${encodeURIComponent(fileType)}` +
      `&fileSize=${fileSize}` +
      `&projectId=${encodeURIComponent(screenplayId)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('File too large. Maximum size is 10MB.');
      }
      if (response.status === 401) {
        throw new Error('Please sign in to upload files.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get upload URL: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.url || !data.fields || !data.s3Key) {
      throw new Error('Invalid response from server');
    }
    
    return data;
  }

  /**
   * Upload file to S3 using presigned URL with detailed error handling
   */
  static async uploadToS3(
    url: string,
    fields: Record<string, string>,
    file: File,
    logPrefix?: string
  ): Promise<void> {
    const formData = new FormData();
    
    // Add all fields from presigned POST (skip 'bucket' field - policy only)
    Object.entries(fields).forEach(([key, value]) => {
      if (key.toLowerCase() === 'bucket') {
        console.log(`${logPrefix || '[SceneBuilderService]'} Skipping 'bucket' field (policy-only): ${value}`);
        return;
      }
      formData.append(key, value);
    });
    
    // Verify 'key' field is present
    if (!fields.key && !fields.Key) {
      console.error(`${logPrefix || '[SceneBuilderService]'} WARNING: No "key" field in presigned POST fields!`);
      console.error(`${logPrefix || '[SceneBuilderService]'} Available fields:`, Object.keys(fields));
    }
    
    // Add file last (required by S3)
    formData.append('file', file);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      // Enhanced error logging
      const errorText = await response.text().catch(() => 'No error details');
      
      // Parse XML error response
      let errorCode = 'Unknown';
      let errorMessage = errorText;
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(errorText, 'text/xml');
        errorCode = xmlDoc.querySelector('Code')?.textContent || 'Unknown';
        errorMessage = xmlDoc.querySelector('Message')?.textContent || errorText;
      } catch (e) {
        // Not XML, use as-is
      }
      
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}. ${errorCode}: ${errorMessage}`);
    }
  }

  /**
   * Register media in Media Library
   */
  static async registerMedia(
    s3Key: string,
    fileName: string,
    fileType: string,
    screenplayId: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<void> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch('/api/media/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        s3Key,
        fileName,
        fileType,
        screenplayId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to register media: ${response.statusText}`);
    }
  }

  /**
   * Get download URL for S3 file
   */
  static async getDownloadUrl(
    s3Key: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<string> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch('/api/s3/download-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ s3Key })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.downloadUrl || data.url;
  }

  /**
   * Generate first frame image
   */
  static async generateFirstFrame(
    prompt: string,
    referenceImageUrl: string,
    getTokenFn: (options: { template: string }) => Promise<string | null>
  ): Promise<{ imageUrl: string; s3Key: string }> {
    const token = await this.getToken(getTokenFn);
    
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt,
        referenceImageUrl,
        aspectRatio: '16:9',
        quality: 'high'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate first frame: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error('Failed to generate first frame: No image URL returned');
    }
    
    return {
      imageUrl: data.imageUrl,
      s3Key: data.s3Key || ''
    };
  }
}

