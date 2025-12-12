'use client';

/**
 * Scene Builder Panel - Feature 0062
 * 
 * Standalone Scene Builder for Production page (/app/production).
 * Generates complete scene packages (4-7 videos) with perfect consistency.
 * 
 * Features:
 * - Scene description input (screenplay or plain English)
 * - Character reference upload (1-3 images)
 * - Quality tier selection (Professional/Premium)
 * - Audio toggle with safety warning
 * - Real-time progress tracking
 * - Generation history
 * - Asset library for timeline integration
 */

import React, { useState, useEffect, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Upload,
  X,
  Play,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  ArrowRight,
  Film,
  Save,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { SceneBuilderProgress } from '@/components/video/SceneBuilderProgress';
import { SceneBuilderDecisionModal } from '@/components/video/SceneBuilderDecisionModal';
import { PartialDeliveryModal } from '@/components/video/PartialDeliveryModal';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { MediaUploadSlot } from '@/components/production/MediaUploadSlot';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { extractS3Key } from '@/utils/s3';
import { VisualAnnotationPanel } from './VisualAnnotationPanel';
import { ScreenplayStatusBanner } from './ScreenplayStatusBanner';
import { EditorContextBanner } from './EditorContextBanner';
import { SceneSelector } from './SceneSelector';
import { ManualSceneEntry } from './ManualSceneEntry';
import { useContextStore } from '@/lib/contextStore';
import { OutfitSelector } from './OutfitSelector';

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface SceneBuilderPanelProps {
  projectId: string; // Actually screenplayId - kept as projectId for backward compatibility
  onVideoGenerated?: (videos: GeneratedVideo[]) => void;
  isMobile?: boolean;       // NEW: Feature 0069
  simplified?: boolean;     // NEW: Feature 0069
}

interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  clipType: string;
  creditsUsed: number;
  duration: number;
}

interface GenerationHistoryItem {
  id: string;
  sceneDescription: string;
  characterReferences: string[];
  qualityTier: 'professional' | 'premium';
  // Note: enableSound removed - sound is handled separately via audio workflows
  createdAt: string;
  status: 'completed' | 'failed';
  workflowExecutionId: string;
  outputs: GeneratedVideo[];
  totalCredits: number;
}

interface WorkflowStatus {
  id: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  stepResults: any[];
  totalCreditsUsed: number;
  finalOutputs: any[];
  videos?: string[];  // Optional: URLs of generated videos
  metadata?: any;
}

export function SceneBuilderPanel({ projectId, onVideoGenerated, isMobile = false, simplified = false }: SceneBuilderPanelProps) {
  // Authentication
  const { getToken } = useAuth();
  
  // Get screenplay context (for scene data from database)
  const screenplay = useScreenplay();
  
  // Form state
  const [sceneDescription, setSceneDescription] = useState('');
  const [referenceImages, setReferenceImages] = useState<(File | null)[]>([null, null, null]);
  const [qualityTier, setQualityTier] = useState<'professional' | 'premium'>('professional');
  const [duration, setDuration] = useState('5s');
  const [enableSound, setEnableSound] = useState(false);
  const [hasDialogue, setHasDialogue] = useState(false);
  
  // Dialogue system state (Feature 0130)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [voiceProfileStatus, setVoiceProfileStatus] = useState<{
    hasVoice: boolean;
    voiceName?: string;
    voiceType?: string;
  } | null>(null);
  const [dialogueMode, setDialogueMode] = useState<'talking-head' | 'user-video'>('talking-head');
  const [dialogueText, setDialogueText] = useState('');
  const [drivingVideoUrl, setDrivingVideoUrl] = useState<string | null>(null);
  
  // Outfit selection state (Phase 3)
  const [selectedOutfit, setSelectedOutfit] = useState<string | undefined>(undefined);
  const [characterDefaultOutfit, setCharacterDefaultOutfit] = useState<string | undefined>(undefined);
  
  // Wizard flow state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Phase 2: Scene selection state
  const [inputMethod, setInputMethod] = useState<'database' | 'manual'>('database');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [showEditorContextBanner, setShowEditorContextBanner] = useState(false);
  const [editorContextSceneName, setEditorContextSceneName] = useState<string | null>(null);
  
  // Get editor context for auto-select
  const contextStore = useContextStore();
  
  // Style matching state (Feature 0109)
  const [selectedStyleProfile, setSelectedStyleProfile] = useState<string | null>(null);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [styleProfiles, setStyleProfiles] = useState<any[]>([]);
  
  // Media uploads state (Feature 0070)
  const [mediaUploads, setMediaUploads] = useState<(File | null)[]>([null, null, null]);
  const [uploadingMedia, setUploadingMedia] = useState<boolean[]>([false, false, false]);
  
  // Annotation system state (Feature 0105/Phase 6)
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
  const [isGeneratingFirstFrame, setIsGeneratingFirstFrame] = useState(false);
  const [isUploadingFirstFrame, setIsUploadingFirstFrame] = useState(false);
  const [visualAnnotations, setVisualAnnotations] = useState<any>(null);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  
  // Note: Mobile no longer forces defaults - users can choose any options
  
  // Auto-advance to Step 2 when scene is selected
  useEffect(() => {
    if (sceneDescription.trim() && currentStep === 1) {
      // Don't auto-advance, let user click Continue button
      // setCurrentStep(2);
    }
  }, [sceneDescription, currentStep]);

  // Phase 2: Auto-select scene from editor context
  useEffect(() => {
    const editorSceneId = contextStore.context.currentSceneId;
    const editorProjectId = contextStore.context.projectId;
    
    // Only auto-select if:
    // 1. Context has a scene ID
    // 2. Project IDs match (or context has no project ID)
    // 3. Scenes are loaded
    // 4. Scene exists in database
    if (
      editorSceneId && 
      screenplay.scenes && 
      screenplay.scenes.length > 0 &&
      (!editorProjectId || editorProjectId === projectId)
    ) {
      const sceneFromContext = screenplay.scenes.find(s => s.id === editorSceneId);
      
      if (sceneFromContext) {
        // Auto-select this scene
        setSelectedSceneId(sceneFromContext.id);
        setInputMethod('database'); // Force database mode
        
        // Load scene content
        const sceneText = sceneFromContext.synopsis || 
          `${sceneFromContext.heading || ''}\n\n${sceneFromContext.synopsis || ''}`.trim();
        setSceneDescription(sceneText);
        
        // Show banner
        setEditorContextSceneName(sceneFromContext.heading || sceneFromContext.synopsis || 'Current Scene');
        setShowEditorContextBanner(true);
        
        console.log('[SceneBuilderPanel] Auto-selected scene from editor context:', sceneFromContext.id);
      } else {
        console.log('[SceneBuilderPanel] Scene from editor context not found in database:', editorSceneId);
      }
    }
  }, [contextStore.context.currentSceneId, contextStore.context.projectId, screenplay.scenes, projectId]);
  
  // Load style profiles for this project (Feature 0109)
  useEffect(() => {
    async function loadStyleProfiles() {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const response = await fetch(`/api/style/project/${projectId}`, { // projectId is actually screenplayId
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStyleProfiles(data.profiles || []);
          console.log(`[SceneBuilder] Loaded ${data.profiles?.length || 0} style profiles`);
        }
      } catch (error) {
        console.error('[SceneBuilder] Failed to load style profiles:', error);
      }
    }
    
    if (projectId) {
      loadStyleProfiles();
    }
  }, [projectId, getToken]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowExecutionId, setWorkflowExecutionId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showPartialDeliveryModal, setShowPartialDeliveryModal] = useState(false);
  const [partialDeliveryData, setPartialDeliveryData] = useState<any>(null);
  
  // History state
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  
  // Storage modal state (Feature 0066)
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    s3Key: string;
    name: string;
    type: 'video' | 'image' | 'composition';
  } | null>(null);
  
  // Load history from localStorage on mount
  useEffect(() => {
    loadHistory();
  }, [projectId]);
  
  // Dialogue detection: Check if scene description contains dialogue
  useEffect(() => {
    if (sceneDescription.trim()) {
      const detected = detectDialogue(sceneDescription);
      // 🔥 FIX: Defer state updates to prevent React error #300
      setTimeout(() => {
        startTransition(() => {
          setHasDialogue(detected.hasDialogue);
          
          // If dialogue detected and no character selected, try to extract character name
          if (detected.hasDialogue && !selectedCharacterId && detected.characterName) {
            // Try to find matching character
            const matchingChar = characters.find(c => 
              c.name?.toLowerCase() === detected.characterName?.toLowerCase()
            );
            if (matchingChar) {
              setSelectedCharacterId(matchingChar.id);
            }
          }
        });
      }, 0);
    } else {
      // 🔥 FIX: Defer state update to prevent React error #300
      setTimeout(() => {
        startTransition(() => {
          setHasDialogue(false);
        });
      }, 0);
    }
  }, [sceneDescription, characters, selectedCharacterId]);
  
  // Load characters for dialogue selection
  useEffect(() => {
    async function loadCharacters() {
      if (!projectId) return;
      
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        
        // Load characters from Character Bank (use new endpoint format)
        const response = await fetch(`/api/character-bank/list?screenplayId=${encodeURIComponent(projectId)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // 🔥 FIX: Defer state update to prevent React error #300
          setTimeout(() => {
            startTransition(() => {
              setCharacters(data.characters || []);
            });
          }, 0);
        }
      } catch (error) {
        console.error('[SceneBuilder] Failed to load characters:', error);
      }
    }
    
    loadCharacters();
  }, [projectId, getToken]);
  
  // Check voice profile when character is selected
  useEffect(() => {
    async function checkVoiceProfile() {
      if (!selectedCharacterId || !projectId) {
        setVoiceProfileStatus(null);
        return;
      }
      
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        
        const response = await fetch(`/api/voice-profile/${selectedCharacterId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.voiceProfile) {
            setVoiceProfileStatus({
              hasVoice: true,
              voiceName: data.voiceProfile.voiceName || data.voiceProfile.autoMatchedVoiceName,
              voiceType: data.voiceProfile.voiceType || 'custom'
            });
          } else {
            setVoiceProfileStatus({ hasVoice: false });
          }
        } else {
          setVoiceProfileStatus({ hasVoice: false });
        }
      } catch (error) {
        console.error('[SceneBuilder] Failed to check voice profile:', error);
        setVoiceProfileStatus({ hasVoice: false });
      }
    }
    
    checkVoiceProfile();
  }, [selectedCharacterId, projectId, getToken]);
  
  // Fetch character's default outfit when character is selected (Phase 3)
  useEffect(() => {
    async function fetchCharacterOutfit() {
      if (!selectedCharacterId || !projectId) {
        setCharacterDefaultOutfit(undefined);
        setSelectedOutfit(undefined);
        return;
      }
      
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        
        const response = await fetch(`/api/screenplays/${projectId}/characters/${selectedCharacterId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const outfit = data.data?.physicalAttributes?.typicalClothing;
          if (outfit) {
            setCharacterDefaultOutfit(outfit);
            // Auto-select default outfit if none selected
            if (!selectedOutfit) {
              setSelectedOutfit(undefined); // undefined means use character default
            }
          } else {
            setCharacterDefaultOutfit(undefined);
          }
        }
      } catch (error) {
        console.error('[SceneBuilder] Failed to fetch character outfit:', error);
        // Non-fatal - continue without default
      }
    }
    
    fetchCharacterOutfit();
  }, [selectedCharacterId, projectId, getToken, selectedOutfit]);
  
  // Poll workflow status every 3 seconds
  useEffect(() => {
    if (!workflowExecutionId || !isGenerating) return;
    
    const interval = setInterval(async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          console.error('[SceneBuilderPanel] No auth token for workflow status');
          return;
        }
        
        const response = await fetch(`/api/workflows/${workflowExecutionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // 🔥 FIX: Handle 404, 401, and other error responses
        if (!response.ok) {
          if (response.status === 404) {
            console.warn('[SceneBuilderPanel] Workflow execution not found (404), stopping poll:', workflowExecutionId);
            clearInterval(interval);
            setIsGenerating(false);
            toast.error('Workflow execution not found. It may have been deleted or expired.');
            return;
          }
          if (response.status === 401) {
            console.error('[SceneBuilderPanel] Authentication failed (401), stopping poll:', workflowExecutionId);
            clearInterval(interval);
            setIsGenerating(false);
            toast.error('Authentication failed. Please refresh the page and try again.');
            return;
          }
          // For other errors, log and continue polling (might be temporary)
          console.warn('[SceneBuilderPanel] Workflow status check failed:', response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        
        // 🔥 FIX: Validate response structure before accessing properties
        if (!data.success) {
          console.warn('[SceneBuilderPanel] Workflow status response not successful:', data);
          return;
        }
        
        if (!data.execution) {
          console.warn('[SceneBuilderPanel] Workflow status response missing execution data:', data);
          return;
        }
        
        setWorkflowStatus(data.execution);
        
        // Check if awaiting user decision
        if (data.execution.status === 'awaiting_user_decision') {
          setShowDecisionModal(true);
          setIsGenerating(false);
        }
        
        // Check if partial delivery (Premium tier - dialog rejected)
        if (data.execution.status === 'partial_delivery') {
          await handlePartialDelivery(data.execution);
          clearInterval(interval);
        }
        
        // Check if completed
        if (data.execution.status === 'completed') {
          handleGenerationComplete(data.execution);
          clearInterval(interval);
        }
        
        // Check if failed
        if (data.execution.status === 'failed') {
          handleGenerationFailed(data.execution);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('[SceneBuilderPanel] Failed to poll workflow:', error);
        // Don't stop polling on network errors - might be temporary
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [workflowExecutionId, isGenerating]);
  
  /**
   * Detect if scene description contains dialogue
   * Simple detection for Phase 1 - will be enhanced in Phase 2
   */
  function detectDialogue(text: string): { hasDialogue: boolean; characterName?: string; dialogue?: string } {
    const trimmed = text.trim();
    if (!trimmed) return { hasDialogue: false };
    
    // Method 1: Screenplay format - CHARACTER NAME followed by dialogue
    const screenplayRegex = /\n\s*([A-Z\s]{2,})\n\s*([^\n]+)/;
    const screenplayMatch = trimmed.match(screenplayRegex);
    if (screenplayMatch) {
      const speaker = screenplayMatch[1].trim();
      const dialogue = screenplayMatch[2].trim();
      // Filter out sluglines
      if (!dialogue.match(/^(INT\.|EXT\.|FADE|CUT TO|DISSOLVE)/i)) {
        return { hasDialogue: true, characterName: speaker, dialogue };
      }
    }
    
    // Method 2: Quoted dialogue - "dialog text" or 'dialog text'
    const quotedRegex = /["']([^"']{10,})["']/;
    const quotedMatch = trimmed.match(quotedRegex);
    if (quotedMatch) {
      return { hasDialogue: true, dialogue: quotedMatch[1].trim() };
    }
    
    // Method 3: Says/speaks pattern
    const saysRegex = /(\w+)\s+(says?|speaks?|yells?|shouts?|whispers?)[:\s]+["']?([^"'\n.]{10,})["']?/i;
    const saysMatch = trimmed.match(saysRegex);
    if (saysMatch) {
      return { hasDialogue: true, characterName: saysMatch[1].trim(), dialogue: saysMatch[3].trim() };
    }
    
    // Method 4: Colon format - "CHARACTER: dialog text"
    const colonRegex = /(\w+):\s*["']?([^"\n]{10,})["']?/;
    const colonMatch = trimmed.match(colonRegex);
    if (colonMatch) {
      return { hasDialogue: true, characterName: colonMatch[1].trim(), dialogue: colonMatch[2].trim() };
    }
    
    return { hasDialogue: false };
  }
  
  /**
   * Load generation history from localStorage
   */
  function loadHistory() {
    try {
      const stored = localStorage.getItem(`scene-builder-history-${projectId}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Failed to load history:', error);
    }
  }
  
  /**
   * Save history to localStorage
   */
  function saveHistory(newItem: GenerationHistoryItem) {
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem(`scene-builder-history-${projectId}`, JSON.stringify(updated));
  }
  
  /**
   * Upload custom first frame image (Feature 0105/Phase 6)
   * Uses pre-signed URL flow (same as MediaLibrary) to avoid 403 errors
   */
  async function handleUploadFirstFrame(file: File) {
    // Validate file type - with fallback detection
    let fileType = file.type;
    if (!fileType || !fileType.startsWith('image/')) {
      // Try to detect from extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
      };
      fileType = mimeTypes[extension || ''] || 'image/jpeg';
      
      if (!file.type) {
        console.warn('[SceneBuilderPanel] File type was empty, detected:', fileType);
      } else {
        toast.error('Please upload an image file');
        return;
      }
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 10MB');
      return;
    }
    
    setIsUploadingFirstFrame(true);
    setFirstFrameUrl(null);
    setVisualAnnotations(null);
    setShowAnnotationPanel(false);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      // Step 1: Get pre-signed URL for S3 upload (same flow as MediaLibrary)
      // CRITICAL: Use fileType (not file.type) to ensure consistency
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` + 
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(fileType)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(projectId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error(`File too large. Maximum size is 10MB.`);
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
        }
      }
      
      const { url, fields, s3Key } = await presignedResponse.json();
      
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
      }
      
      // Step 2: Upload directly to S3 using FormData POST (presigned POST)
      // This is the recommended approach for browser uploads - Content-Type is handled
      // as form data, not headers, preventing 403 Forbidden errors
      const formData = new FormData();
      
      // Add all the fields returned from createPresignedPost
      // CRITICAL: The 'key' field must be present and match the S3 key exactly
      // NOTE: Do NOT include 'bucket' field in FormData - it's only for policy validation
      console.log('[SceneBuilderPanel] Presigned POST fields (first frame):', fields);
      console.log('[SceneBuilderPanel] Expected S3 key (first frame):', s3Key);
      
      Object.entries(fields).forEach(([key, value]) => {
        // Skip 'bucket' field - it's only used in the policy, not in FormData
        if (key.toLowerCase() === 'bucket') {
          console.log(`[SceneBuilderPanel] Skipping 'bucket' field (policy-only): ${value}`);
          return;
        }
        formData.append(key, value as string);
        console.log(`[SceneBuilderPanel] Added field (first frame): ${key} = ${value}`);
      });
      
      // Verify 'key' field is present (required for presigned POST)
      if (!fields.key && !fields.Key) {
        console.error('[SceneBuilderPanel] WARNING: No "key" field in presigned POST fields!');
        console.error('[SceneBuilderPanel] Available fields:', Object.keys(fields));
      } else {
        const keyField = fields.key || fields.Key;
        if (keyField !== s3Key) {
          console.error('[SceneBuilderPanel] WARNING: Key field mismatch!', {
            fieldsKey: keyField,
            expectedS3Key: s3Key
          });
        }
      }
      
      // Add the file last (must be last field in FormData per AWS requirements)
      formData.append('file', file);
      console.log('[SceneBuilderPanel] Added file (first frame):', file.name, `(${file.size} bytes, ${file.type})`);
      console.log('[SceneBuilderPanel] Uploading to URL (first frame):', url);
      console.log('[SceneBuilderPanel] FormData field count (first frame):', Array.from(formData.keys()).length);
      
      const s3Response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!s3Response.ok) {
        // Enhanced error logging for debugging
        const errorText = await s3Response.text().catch(() => 'No error details');
        
        // Parse XML error response for detailed error code
        let errorCode = 'Unknown';
        let errorMessage = errorText;
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(errorText, 'text/xml');
          errorCode = xmlDoc.querySelector('Code')?.textContent || 'Unknown';
          errorMessage = xmlDoc.querySelector('Message')?.textContent || errorText;
          const requestId = xmlDoc.querySelector('RequestId')?.textContent;
          
          console.error('[SceneBuilderPanel] S3 Error Details:', {
            Code: errorCode,
            Message: errorMessage,
            RequestId: requestId
          });
        } catch (e) {
          // Not XML, use as-is
        }
        
        // Log FormData contents for debugging
        const formDataEntries = Array.from(formData.entries());
        console.error('[SceneBuilderPanel] FormData contents:', formDataEntries.map(([k, v]) => [
          k,
          typeof v === 'string' 
            ? (v.length > 100 ? v.substring(0, 100) + '...' : v)
            : `File: ${(v as File).name} (${(v as File).size} bytes)`
        ]));
        
        console.error('[SceneBuilderPanel] S3 upload failed:', {
          status: s3Response.status,
          statusText: s3Response.statusText,
          errorCode,
          errorMessage,
          errorText: errorText.substring(0, 500),
          fileType: fileType,
          fileName: file.name,
          fileSize: file.size,
          url: url.substring(0, 150),
          fieldsCount: formDataEntries.length,
          fieldNames: formDataEntries.map(([k]) => k)
        });
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}. ${errorCode}: ${errorMessage}`);
      }
      
      // Step 3: Register the file with the backend
      const registerResponse = await fetch('/api/media/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          s3Key,
        }),
      });
      
      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to register file');
      }
      
      const registerData = await registerResponse.json();
      
      // Step 4: Generate presigned download URL from s3Key
      // Use the backend API proxy to get download URL
      const downloadUrlResponse = await fetch('/api/s3/download-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
          expiresIn: 3600 // 1 hour
        }),
      });
      
      if (!downloadUrlResponse.ok) {
        // If download URL generation fails, log the error and show user-friendly message
        const errorText = await downloadUrlResponse.text().catch(() => 'Unknown error');
        console.error('[SceneBuilderPanel] Failed to generate download URL:', {
          status: downloadUrlResponse.status,
          statusText: downloadUrlResponse.statusText,
          error: errorText,
          s3Key
        });
        
        // Don't use direct S3 URL fallback - bucket is private and requires presigned URLs
        // Instead, show error and let user retry
        throw new Error(
          downloadUrlResponse.status === 401 
            ? 'Authentication failed. Please refresh and try again.'
            : downloadUrlResponse.status === 403
            ? 'Access denied. Please contact support if this persists.'
            : `Failed to generate image URL (${downloadUrlResponse.status}). Please try again.`
        );
      }
      
      const downloadUrlData = await downloadUrlResponse.json();
      
      if (downloadUrlData.downloadUrl) {
        setFirstFrameUrl(downloadUrlData.downloadUrl);
        setShowAnnotationPanel(true);
        toast.success('Image uploaded! Add annotations or proceed to generation.');
      } else {
        throw new Error('No download URL returned');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Image upload failed:', error);
      toast.error('Failed to upload image', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsUploadingFirstFrame(false);
    }
  }
  
  /**
   * Generate first frame for annotation (Feature 0105/Phase 6)
   */
  async function handleGenerateFirstFrame() {
    if (!sceneDescription.trim()) {
      toast.error('Please enter a scene description');
      return;
    }
    
    setIsGeneratingFirstFrame(true);
    setFirstFrameUrl(null);
    setVisualAnnotations(null);
    setShowAnnotationPanel(false);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      
      // Upload character reference images if any
      const referenceImageUrls: string[] = [];
      const uploadedImages = referenceImages.filter(img => img !== null) as File[];
      
      if (uploadedImages.length > 0) {
        for (const file of uploadedImages) {
          // Use presigned POST upload (same as first frame upload)
          const fileType = file.type || 'image/jpeg';
          const presignedResponse = await fetch(
            `/api/video/upload/get-presigned-url?` +
            `fileName=${encodeURIComponent(file.name)}` +
            `&fileType=${encodeURIComponent(fileType)}` +
            `&fileSize=${file.size}` +
            `&projectId=${encodeURIComponent(projectId)}`,
            { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to get presigned URL: ${presignedResponse.statusText}`);
          }
          
          const { url, fields, s3Key } = await presignedResponse.json();
          
          // Upload directly to S3 using FormData POST
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            if (key.toLowerCase() !== 'bucket') {
              formData.append(key, value as string);
            }
          });
          formData.append('file', file); // File must be last
          
          const s3Response = await fetch(url, { method: 'POST', body: formData });
          if (!s3Response.ok) {
            const errorText = await s3Response.text();
            throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}. ${errorText}`);
          }
          
          // Register file in DynamoDB
          await fetch('/api/media/register', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              fileName: file.name,
              fileType,
              fileSize: file.size,
              s3Key,
            }),
          });
          
          // Get download URL for reference
          const downloadUrlResponse = await fetch('/api/s3/download-url', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ s3Key }),
          });
          
          if (downloadUrlResponse.ok) {
            const { downloadUrl } = await downloadUrlResponse.json();
            referenceImageUrls.push(downloadUrl);
          }
        }
      }
      
      // Generate first frame using image generation API
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: sceneDescription.trim(),
          size: '1024x576' // 16:9 aspect ratio (1024x576 = 16:9)
          // Note: aspectRatio is not a valid parameter - use size instead
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setFirstFrameUrl(data.imageUrl);
        setShowAnnotationPanel(true);
        toast.success('First frame generated! Add annotations or proceed to generation.');
      } else {
        throw new Error(data.message || 'Failed to generate first frame');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] First frame generation failed:', error);
      toast.error('Failed to generate first frame', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGeneratingFirstFrame(false);
    }
  }
  
  /**
   * Start Scene Builder generation
   * Routes to dialogue video API if dialogue detected, otherwise uses workflow API
   */
  async function handleGenerate() {
    if (!sceneDescription.trim()) {
      toast.error('Please enter a scene description');
      return;
    }
    
    // Check if this is a dialogue scene
    const dialogueInfo = detectDialogue(sceneDescription);
    
    if (dialogueInfo.hasDialogue) {
      // Route to dialogue video generation
      await handleDialogueGeneration(dialogueInfo);
      return;
    }
    
    // Otherwise, use standard workflow generation
    await handleWorkflowGeneration();
  }
  
  /**
   * Handle dialogue video generation (Phase 1: Core Integration)
   */
  async function handleDialogueGeneration(dialogueInfo: { hasDialogue: boolean; characterName?: string; dialogue?: string }) {
    // Validate character selection
    if (!selectedCharacterId) {
      toast.error('Please select a character for dialogue generation', {
        description: 'Dialogue scenes require a character to be selected'
      });
      return;
    }
    
    // Validate character image (required for dialogue)
    const characterImageUrl = referenceImages[0] 
      ? await uploadCharacterImage(referenceImages[0] as File)
      : null;
    
    if (!characterImageUrl) {
      toast.error('Character image required', {
        description: 'Please upload a character reference image for dialogue generation'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      // Extract dialogue text (use detected or full scene description)
      const dialogueText = dialogueInfo.dialogue || sceneDescription.trim();
      
      // Prepare dialogue generation request
      const dialogueRequest: any = {
        characterId: selectedCharacterId,
        screenplayId: projectId,
        dialogue: dialogueText,
        mode: dialogueMode,
        characterImageUrl,
        autoMatchVoice: true, // Default to auto-match if no voice profile
        duration: parseInt(duration.replace('s', '')) || 5,
        fountainContext: sceneDescription.trim() // Pass full Fountain context for enhancement
      };
      
      // Add driving video URL if Mode 2 selected
      if (dialogueMode === 'user-video' && drivingVideoUrl) {
        dialogueRequest.drivingVideoUrl = drivingVideoUrl;
      }
      
      const response = await fetch('/api/dialogue/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dialogueRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Dialogue generation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.result) {
        toast.success('🎬 Dialogue video generated!', {
          description: `Used ${data.result.creditsUsed} credits`
        });
        
        // Create history item
        const historyItem: GenerationHistoryItem = {
          id: `dialogue-${Date.now()}`,
          sceneDescription,
          characterReferences: [characterImageUrl],
          qualityTier,
          createdAt: new Date().toISOString(),
          status: 'completed',
          workflowExecutionId: `dialogue-${Date.now()}`,
          outputs: [{
            id: `dialogue-video-${Date.now()}`,
            url: data.result.videoUrl,
            thumbnailUrl: data.result.videoUrl,
            clipType: 'dialogue',
            creditsUsed: data.result.creditsUsed,
            duration: parseInt(duration.replace('s', '')) || 5
          }],
          totalCredits: data.result.creditsUsed
        };
        
        saveHistory(historyItem);
        
        // Callback
        if (onVideoGenerated) {
          onVideoGenerated(historyItem.outputs);
        }
        
        // Reset form
        setSceneDescription('');
        setReferenceImages([null, null, null]);
        setSelectedCharacterId(null);
        setHasDialogue(false);
      } else {
        throw new Error(data.message || 'Failed to generate dialogue video');
      }
      
    } catch (error) {
      console.error('[SceneBuilderPanel] Dialogue generation failed:', error);
      toast.error('Failed to generate dialogue video', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  }
  
  /**
   * Upload character image and return URL
   */
  async function uploadCharacterImage(file: File): Promise<string | null> {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return null;
      
      const fileType = file.type || 'image/jpeg';
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(fileType)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(projectId)}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      if (!presignedResponse.ok) return null;
      
      const { url, fields, s3Key } = await presignedResponse.json();
      
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'bucket') {
          formData.append(key, value as string);
        }
      });
      formData.append('file', file);
      
      const s3Response = await fetch(url, { method: 'POST', body: formData });
      if (!s3Response.ok) return null;
      
      const downloadUrlResponse = await fetch('/api/s3/download-url', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key, expiresIn: 3600 })
      });
      
      if (downloadUrlResponse.ok) {
        const { downloadUrl } = await downloadUrlResponse.json();
        return downloadUrl;
      }
      
      return null;
    } catch (error) {
      console.error('[SceneBuilderPanel] Failed to upload character image:', error);
      return null;
    }
  }
  
  /**
   * Handle standard workflow generation (existing logic)
   */
  async function handleWorkflowGeneration() {
    setIsGenerating(true);
    setWorkflowStatus(null);
    
    try {
      // Get authentication token first (needed for uploads and workflow execution)
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      // Upload character reference images if any
      const referenceImageUrls: string[] = [];
      const uploadedImages = referenceImages.filter(img => img !== null) as File[];
      
      if (uploadedImages.length > 0) {
        toast.info('Uploading character references...');
        
        for (const file of uploadedImages) {
          // Use presigned POST upload (same as first frame upload)
          const fileType = file.type || 'image/jpeg';
          const presignedResponse = await fetch(
            `/api/video/upload/get-presigned-url?` +
            `fileName=${encodeURIComponent(file.name)}` +
            `&fileType=${encodeURIComponent(fileType)}` +
            `&fileSize=${file.size}` +
            `&projectId=${encodeURIComponent(projectId)}`,
            { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to get presigned URL: ${presignedResponse.statusText}`);
          }
          
          const { url, fields, s3Key } = await presignedResponse.json();
          
          // Upload directly to S3 using FormData POST
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            if (key.toLowerCase() !== 'bucket') {
              formData.append(key, value as string);
            }
          });
          formData.append('file', file); // File must be last
          
          const s3Response = await fetch(url, { method: 'POST', body: formData });
          if (!s3Response.ok) {
            throw new Error(`S3 upload failed: ${s3Response.statusText}`);
          }
          
          // Get download URL
          const downloadUrlResponse = await fetch('/api/s3/download-url', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ s3Key, expiresIn: 3600 })
          });
          
          if (!downloadUrlResponse.ok) {
            throw new Error(`Failed to get download URL: ${downloadUrlResponse.statusText}`);
          }
          
          const { downloadUrl } = await downloadUrlResponse.json();
          if (downloadUrl) {
            referenceImageUrls.push(downloadUrl);
          }
        }
      }
      
      // Start workflow execution with authentication
      
      // Get style profile data if selected
      const selectedProfile = selectedStyleProfile 
        ? styleProfiles.find(p => p.profileId === selectedStyleProfile)
        : null;
      
      // Prepare workflow inputs - backend expects flat structure, not nested in 'inputs'
      // Backend expects: workflowId, sceneDescription, characterRefs (not characterReferences), etc.
      const workflowRequest: any = {
        workflowId: 'complete-scene',
        sceneDescription: sceneDescription.trim(),
        characterRefs: referenceImageUrls, // Backend expects 'characterRefs', not 'characterReferences'
        aspectRatio: '16:9',
        duration,
        qualityTier,
        // Note: enableSound removed - sound is handled separately via audio workflows
        // Backend has enableSound = false as default, so we don't need to send it
      };
      
      // Add optional fields if available
      if (selectedSceneId) {
        workflowRequest.sceneId = selectedSceneId;
      }
      
      // Phase 3: Add outfit selection if character is selected
      if (selectedCharacterId && selectedOutfit !== undefined) {
        // undefined means use character default, otherwise use selected outfit
        workflowRequest.typicalClothing = selectedOutfit;
      }
      
      // Feature 0109: Style matching support (if backend supports it)
      if (selectedProfile) {
        // Note: Backend may not support styleProfile yet - check if it causes errors
        // workflowRequest.styleProfile = {
        //   profileId: selectedProfile.profileId,
        //   stylePromptAdditions: selectedProfile.stylePromptAdditions,
        //   confidence: selectedProfile.confidence
        // };
      }
      
      // Feature 0105/Phase 6: Add visual annotations if available
      if (visualAnnotations && firstFrameUrl) {
        // Note: Backend may not support visualAnnotations yet - check if it causes errors
        // workflowRequest.visualAnnotations = {
        //   imageUrl: firstFrameUrl,
        //   annotations: visualAnnotations.annotations || []
        // };
        // workflowRequest.startImageUrl = firstFrameUrl;
      }
      
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
        throw new Error(errorData.error || errorData.message || `Workflow execution failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.executionId) {
        setWorkflowExecutionId(data.executionId);
        // Set initial workflow status to show progress immediately
        setWorkflowStatus({
          id: data.executionId,
          status: 'running',
          currentStep: 1,
          totalSteps: 5,
          stepResults: [],
          totalCreditsUsed: 0,
          finalOutputs: []
        });
        // Move to a "generating" view - hide wizard, show progress
        setCurrentStep(3); // Keep on Step 3 but show progress instead
        toast.success('Scene Builder started!', {
          description: 'Generating your complete scene package...'
        });
      } else {
        throw new Error(data.message || data.error || 'Failed to start workflow');
      }
      
    } catch (error) {
      console.error('[SceneBuilderPanel] Generation failed:', error);
      toast.error('Failed to start generation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsGenerating(false);
    }
  }
  
  /**
   * Handle user decision (continue without audio / cancel)
   */
  async function handleDecisionContinue() {
    if (!workflowExecutionId) return;
    
    setShowDecisionModal(false);
    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/workflows/${workflowExecutionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'continue' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Continuing without audio...');
      } else {
        throw new Error(data.message || 'Failed to continue');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Decision failed:', error);
      toast.error('Failed to continue workflow');
      setIsGenerating(false);
    }
  }
  
  async function handleDecisionCancel() {
    if (!workflowExecutionId) return;
    
    setShowDecisionModal(false);
    
    try {
      const response = await fetch(`/api/workflows/${workflowExecutionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'cancel' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.info('Generation cancelled (no charges)');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Cancel failed:', error);
    }
    
    setIsGenerating(false);
    setWorkflowExecutionId(null);
    setWorkflowStatus(null);
  }
  
  /**
   * Handle media upload with storage integration (Feature 0070)
   */
  async function handleMediaUpload(index: number, file: File) {
    try {
      // Set uploading state
      const newUploadingState = [...uploadingMedia];
      newUploadingState[index] = true;
      setUploadingMedia(newUploadingState);
      
      const fileType = file.type.startsWith('video/') ? 'video' : 
                       file.type.startsWith('audio/') ? 'audio' : 'image';
      
      toast.info('Uploading...');
      
      // PROFESSIONAL UPLOAD: Direct to S3 using pre-signed URL
      // Step 1: Get pre-signed URL with authentication
      const token = await getToken({ template: 'wryda-backend' });
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(projectId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error('File too large. Maximum size is 50GB.');
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json();
          throw new Error(errorData.error || `Upload failed: ${presignedResponse.status}`);
        }
      }
      
      const { url, fields, s3Key } = await presignedResponse.json();
      
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
      }
      
      toast.info('Uploading to S3...');
      
      // Step 2: Upload directly to S3 using FormData POST (presigned POST)
      // This is the recommended approach for browser uploads - Content-Type is handled
      // as form data, not headers, preventing 403 Forbidden errors
      const formData = new FormData();
      
      // Add all the fields returned from createPresignedPost
      // CRITICAL: The 'key' field must be present and match the S3 key exactly
      // NOTE: Do NOT include 'bucket' field in FormData - it's only for policy validation
      console.log('[SceneBuilderPanel] Presigned POST fields (media upload):', fields);
      console.log('[SceneBuilderPanel] Expected S3 key (media upload):', s3Key);
      
      Object.entries(fields).forEach(([key, value]) => {
        // Skip 'bucket' field - it's only used in the policy, not in FormData
        if (key.toLowerCase() === 'bucket') {
          console.log(`[SceneBuilderPanel] Skipping 'bucket' field (policy-only): ${value}`);
          return;
        }
        formData.append(key, value as string);
        console.log(`[SceneBuilderPanel] Added field (media): ${key} = ${value}`);
      });
      
      // Verify 'key' field is present (required for presigned POST)
      if (!fields.key && !fields.Key) {
        console.error('[SceneBuilderPanel] WARNING: No "key" field in presigned POST fields!');
        console.error('[SceneBuilderPanel] Available fields:', Object.keys(fields));
      }
      
      // Add the file last (must be last field in FormData per AWS requirements)
      formData.append('file', file);
      console.log('[SceneBuilderPanel] Added file (media):', file.name, `(${file.size} bytes, ${file.type})`);
      console.log('[SceneBuilderPanel] Uploading to URL (media):', url);
      
      const s3Response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!s3Response.ok) {
        const errorText = await s3Response.text().catch(() => 'No error details');
        
        // Parse XML error response for detailed error code
        let errorCode = 'Unknown';
        let errorMessage = errorText;
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(errorText, 'text/xml');
          errorCode = xmlDoc.querySelector('Code')?.textContent || 'Unknown';
          errorMessage = xmlDoc.querySelector('Message')?.textContent || errorText;
          const requestId = xmlDoc.querySelector('RequestId')?.textContent;
          
          console.error('[SceneBuilderPanel] S3 Error Details (media):', {
            Code: errorCode,
            Message: errorMessage,
            RequestId: requestId
          });
        } catch (e) {
          // Not XML, use as-is
        }
        
        // Log FormData contents for debugging
        const formDataEntries = Array.from(formData.entries());
        console.error('[SceneBuilderPanel] FormData contents (media):', formDataEntries.map(([k, v]) => [
          k,
          typeof v === 'string' 
            ? (v.length > 100 ? v.substring(0, 100) + '...' : v)
            : `File: ${(v as File).name} (${(v as File).size} bytes)`
        ]));
        
        console.error('[SceneBuilderPanel] S3 upload failed (media):', {
          status: s3Response.status,
          statusText: s3Response.statusText,
          errorCode,
          errorMessage,
          errorText: errorText.substring(0, 500),
          url: url.substring(0, 150),
          fields: Object.keys(fields),
          s3Key: s3Key,
          fieldsCount: formDataEntries.length,
          fieldNames: formDataEntries.map(([k]) => k)
        });
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}. ${errorCode}: ${errorMessage}`);
      }
      
      // Step 3: Generate S3 URL
      const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
      const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
      const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
      
      // Update local state
      const newUploads = [...mediaUploads];
      newUploads[index] = file;
      setMediaUploads(newUploads);
      
      // Show storage decision modal
      setSelectedAsset({
        url: s3Url,
        s3Key: s3Key,
        name: file.name,
        type: fileType as 'video' | 'image'
      });
      setShowStorageModal(true);
      
      toast.success('✅ File uploaded! Choose where to save it.');
      
    } catch (error: any) {
      console.error('[SceneBuilderPanel] Upload failed:', error);
      const errorMessage = error?.message || 'Upload failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      // Clear uploading state
      const newUploadingState = [...uploadingMedia];
      newUploadingState[index] = false;
      setUploadingMedia(newUploadingState);
    }
  }
  
  /**
   * Handle media removal
   */
  function handleRemoveMedia(index: number) {
    const newUploads = [...mediaUploads];
    newUploads[index] = null;
    setMediaUploads(newUploads);
  }
  
  /**
   * Send generated videos to Timeline (Feature 0070)
   */
  function handleSendToTimeline(historyItem: GenerationHistoryItem) {
    const clipsData = historyItem.outputs.map((output, index) => ({
      url: output.url,
      type: 'video',
      name: `${historyItem.sceneDescription.substring(0, 20)}_${index + 1}.mp4`
    }));
    
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    window.location.href = `/app/timeline?preloadClips=${encoded}`;
    
    toast.success(`✅ Sent ${clipsData.length} videos to Timeline!`, {
      description: 'Your clips are ready to edit'
    });
  }
  
  /**
   * Handle generation completion
   */
  
  /**
   * Handle partial delivery (Premium tier - dialog rejected)
   * USER-FACING: Simple message, no technical details
   */
  async function handlePartialDelivery(execution: WorkflowStatus) {
    setIsGenerating(false);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Fetch partial delivery details
      const response = await fetch(`/api/workflows/${execution.id}/partial-delivery`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.partialDelivery) {
        // Set partial delivery data for modal
        setPartialDeliveryData({
          deliveredVideo: {
            url: data.partialDelivery.deliveredAssets[0]?.url || (execution.videos && execution.videos[0]) || '',
            s3Key: data.partialDelivery.deliveredAssets[0]?.s3Key || ''
          },
          pricing: {
            original: data.partialDelivery.pricing.originalCharge,
            charged: data.partialDelivery.pricing.actualCharge,
            refunded: data.partialDelivery.pricing.refundAmount
          },
          rejectionReason: data.partialDelivery.rejectionReason
        });
        
        // Show the partial delivery modal
        setShowPartialDeliveryModal(true);
        
        // Show success toast (simple message)
        toast.success('Premium Quality Master Scene Delivered', {
          description: `Charged ${data.partialDelivery.pricing.actualCharge} credits. Refunded ${data.partialDelivery.pricing.refundAmount} credits.`
        });
        
      } else {
        // Fallback if API fails
        toast.info('Scene delivered with partial results');
      }
      
    } catch (error) {
      console.error('[SceneBuilderPanel] Error fetching partial delivery details:', error);
      toast.info('Your master scene has been delivered');
    }
  }
  
  function handleGenerationComplete(execution: WorkflowStatus) {
    setIsGenerating(false);
    
    // Create history item
    const historyItem: GenerationHistoryItem = {
      id: execution.id,
      sceneDescription,
      characterReferences: referenceImages.filter(img => img !== null).map((_, i) => `char-${i}`),
      qualityTier,
      // Note: enableSound removed - sound is handled separately via audio workflows
      createdAt: new Date().toISOString(),
      status: 'completed',
      workflowExecutionId: execution.id,
      outputs: execution.finalOutputs.map((output: any) => ({
        id: output.id || `output-${Date.now()}`,
        url: output.videoUrl,
        thumbnailUrl: output.thumbnailUrl || output.videoUrl,
        clipType: output.clipType || 'unknown',
        creditsUsed: output.creditsUsed || 0,
        duration: output.duration || 5
      })),
      totalCredits: execution.totalCreditsUsed
    };
    
    saveHistory(historyItem);
    
    // Show success with multiple action options
    toast.success(`Scene Builder complete! 🎉`, {
      description: `${execution.finalOutputs.length} videos generated (${execution.totalCreditsUsed} credits)`,
      duration: 15000 // Show for 15 seconds
    });
    
    // Show follow-up options toast
    setTimeout(() => {
      handleShowNextStepOptions(historyItem.outputs);
    }, 500);
    
    // NEW (Feature 0066): Show storage modal for first video
    if (historyItem.outputs.length > 0) {
      const firstVideo = historyItem.outputs[0];
      setSelectedAsset({
        url: firstVideo.url,
        s3Key: extractS3Key(firstVideo.url),
        name: `scene_video_${Date.now()}.mp4`,
        type: 'video'
      });
      // Delay modal slightly so toast appears first
      setTimeout(() => {
        setShowStorageModal(true);
      }, 2000);
    }
    
    // Reset form
    setSceneDescription('');
    setReferenceImages([null, null, null]);
    setWorkflowExecutionId(null);
    setWorkflowStatus(null);
    
    // Callback
    if (onVideoGenerated) {
      onVideoGenerated(historyItem.outputs);
    }
  }
  
  /**
   * Show next step options after generation
   */
  function handleShowNextStepOptions(videos: GeneratedVideo[]) {
    // Encode videos for URL params
    const clipsData = videos.map((video, index) => ({
      url: video.url,
      type: 'video',
      name: `scene_${index + 1}.mp4`
    }));
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    
    toast.info('✨ What would you like to do next?', {
      description: 'Choose how to continue with your generated videos',
      duration: 20000, // 20 seconds
      action: {
        label: 'View Options',
        onClick: () => {} // Keep toast open
      }
    });
    
    // Show detailed options toast after a brief delay
    setTimeout(() => {
      toast.custom((t) => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-border p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            <div>
              <h3 className="font-bold text-lg">Next Steps</h3>
              <p className="text-sm text-muted-foreground">Choose your workflow</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Composition First */}
            <button
              onClick={() => {
                window.location.href = `/app/composition?preloadClips=${encoded}`;
              }}
              className="w-full p-3 rounded-lg border-2 border-[#DC143C] bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#DC143C] rounded">
                  <span className="text-base-content text-lg">🎨</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Composition Studio</div>
                  <div className="text-xs text-muted-foreground">Apply layouts, effects, and transitions first</div>
                </div>
              </div>
            </button>
            
            {/* Timeline Direct */}
            <button
              onClick={() => {
                window.location.href = `/app/timeline?preloadClips=${encoded}`;
              }}
              className="w-full p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#DC143C] rounded">
                  <span className="text-base-content text-lg">⏱️</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Timeline Editor</div>
                  <div className="text-xs text-muted-foreground">Go directly to 8-track editing</div>
                </div>
              </div>
            </button>
            
            {/* Add Audio */}
            <button
              onClick={() => {
                window.location.href = '/app/production-hub?tab=audio';
              }}
              className="w-full p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded">
                  <span className="text-base-content text-lg">🎵</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Add Audio</div>
                  <div className="text-xs text-muted-foreground">Music or sound effects (Suno/ElevenLabs)</div>
                </div>
              </div>
            </button>
            
            {/* Stay Here */}
            <button
              onClick={() => {
                toast.dismiss(t);
              }}
              className="w-full p-2 rounded-lg border border-border hover:bg-muted transition-colors text-center text-sm text-muted-foreground"
            >
              Stay here and generate more
            </button>
          </div>
        </div>
      ), { duration: Infinity });
    }, 1000);
  }
  
  /**
   * Handle generation failure
   */
  function handleGenerationFailed(execution: WorkflowStatus) {
    setIsGenerating(false);
    
    toast.error('Scene Builder failed', {
      description: 'Some steps could not be completed'
    });
    
    setWorkflowExecutionId(null);
    setWorkflowStatus(null);
  }
  
  /**
   * Calculate credit estimate
   */
  function calculateEstimate(): number {
    const hasCharacterRefs = referenceImages.some(img => img !== null);
    const baseCredits = hasCharacterRefs ? 125 : 100; // Master + 3 angles
    const premiumCredits = qualityTier === 'premium' ? 100 : 0; // 4K upscaling
    return baseCredits + premiumCredits;
  }
  
  return (
    <div className="h-full overflow-auto bg-[#0A0A0A]">
      <div className="p-4 md:p-5 space-y-4 md:space-y-5">
        {/* Sticky Editor Context Banner (when scene auto-selected) */}
        {showEditorContextBanner && editorContextSceneName && (
          <div className="sticky top-0 z-10 -mx-4 md:-mx-5 px-4 md:px-5 pt-4 md:pt-5 pb-2 bg-[#0A0A0A]">
            <EditorContextBanner
              sceneName={editorContextSceneName}
              onDismiss={() => setShowEditorContextBanner(false)}
            />
          </div>
        )}
        
        {/* Screenplay Connection Banner - Scrollable */}
        <ScreenplayStatusBanner
          onViewEditor={() => {
            window.location.href = '/write';
          }}
        />
        
        {/* Content */}
        <div className="space-y-4 md:space-y-5">
        {/* Step Indicator */}
        {!isGenerating && !workflowStatus && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#DC143C]' : 'text-[#808080]'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-[#DC143C] bg-[#DC143C]/10' : 'border-[#3F3F46] bg-[#141414]'}`}>
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-[#DC143C]" /> : <span className="text-sm font-bold">1</span>}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Select Scene</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#808080]" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#DC143C]' : currentStep === 1 ? 'text-[#808080]' : 'text-[#3F3F46] opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-[#DC143C] bg-[#DC143C]/10' : currentStep === 1 ? 'border-[#3F3F46] bg-[#141414]' : 'border-[#3F3F46] bg-[#141414] opacity-50'}`}>
                {currentStep > 2 ? <CheckCircle2 className="w-5 h-5 text-[#DC143C]" /> : <span className="text-sm font-bold">2</span>}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Configure</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#808080]" />
            <div className={`flex items-center gap-2 ${currentStep === 3 ? 'text-[#DC143C]' : 'text-[#3F3F46] opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 3 ? 'border-[#DC143C] bg-[#DC143C]/10' : 'border-[#3F3F46] bg-[#141414] opacity-50'}`}>
                <span className="text-sm font-bold">3</span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">Generate</span>
            </div>
          </div>
        )}

        {/* Scene Builder Form - Wizard Flow */}
        {!isGenerating && !workflowStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Step 1: Scene Selection */}
            {currentStep === 1 && (
              <Card className="bg-[#141414] border-[#3F3F46]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#FFFFFF]">📝 Step 1: Scene Selection</CardTitle>
                  <CardDescription className="text-[#808080]">
                    Choose a scene from your screenplay or enter one manually
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {/* Input Method Toggle */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Input Method:</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="inputMethod"
                        value="database"
                        checked={inputMethod === 'database'}
                        onChange={() => setInputMethod('database')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">From Database</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="inputMethod"
                        value="manual"
                        checked={inputMethod === 'manual'}
                        onChange={() => setInputMethod('manual')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Manual Entry</span>
                    </label>
                  </div>
                </div>

                {/* Database Selection */}
                {inputMethod === 'database' && (
                  <SceneSelector
                    selectedSceneId={selectedSceneId}
                    onSceneSelect={(sceneId) => {
                      setSelectedSceneId(sceneId);
                      const scene = screenplay.scenes?.find(s => s.id === sceneId);
                      if (scene) {
                        // Load scene content into description
                        const sceneText = scene.synopsis || 
                          `${scene.heading || ''}\n\n${scene.synopsis || ''}`.trim();
                        setSceneDescription(sceneText);
                      }
                    }}
                    onUseScene={(scene) => {
                      // Scene already loaded in onSceneSelect, just confirm
                      toast.success('Scene loaded! Ready to generate.');
                    }}
                    onEditScene={(sceneId) => {
                      // Use context store to set scene, then navigate to editor
                      const scene = screenplay.scenes?.find(s => s.id === sceneId);
                      if (scene) {
                        // Set scene in context store so editor can jump to it
                        contextStore.setCurrentScene(scene.id, scene.heading || scene.synopsis || 'Scene');
                        // Navigate to editor - it will read context and jump to scene.startLine
                        window.location.href = `/write?sceneId=${sceneId}`;
                      } else {
                        window.location.href = '/write';
                      }
                    }}
                    isMobile={isMobile}
                  />
                )}

                {/* Manual Entry */}
                {inputMethod === 'manual' && (
                  <ManualSceneEntry
                    value={sceneDescription}
                    onChange={setSceneDescription}
                    onUseAsIs={() => {
                      if (!sceneDescription.trim()) {
                        toast.error('Please enter a scene description');
                        return;
                      }
                      toast.success('Scene ready! Set generation options below.');
                    }}
                    onGenerateWithAI={async () => {
                      // Generate scene using Director agent
                      if (!sceneDescription.trim()) {
                        toast.error('Please enter a scene description first');
                        return;
                      }
                      
                      try {
                        const token = await getToken({ template: 'wryda-backend' });
                        
                        // Build prompt for Director agent (full scene generation)
                        const directorPrompt = `User's request: "${sceneDescription}"

DIRECTOR MODE - SCENE DEVELOPMENT:

You are a professional screenplay director helping develop full scenes. Your role is to:

1. EXPAND THE IDEA: Take the user's concept and develop it into complete scene content
2. SCENE LENGTH: Write a complete, full scene (15-30+ lines)
3. INCLUDE ELEMENTS:
   - Scene heading (INT./EXT. LOCATION - TIME)
   - Action lines that set the mood and visual
   - Character reactions and emotions
   - Dialogue when appropriate
   - Parentheticals for tone/delivery
   - Scene atmosphere and tension
   - Visual storytelling and cinematic direction

4. FOUNTAIN FORMAT (CRITICAL - NO MARKDOWN):
   - Character names in ALL CAPS (NOT bold/markdown)
   - Parentheticals in parentheses: (examining the USB drive)
   - Dialogue in plain text below character name
   - Action lines in normal case
   - NO markdown formatting (no **, no *, no ---)
   - Proper spacing between elements
   - Scene headings in ALL CAPS: INT. LOCATION - TIME

5. OUTPUT ONLY: Provide ONLY the screenplay content. Do NOT add explanations, questions, or meta-commentary.

Output: A complete, cinematic scene in proper Fountain format (NO MARKDOWN).`;
                        
                        const response = await fetch('/api/chat/generate', {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            userPrompt: directorPrompt,
                            desiredModelId: 'gemini-2.0-flash-001', // Fast and affordable
                            conversationHistory: [],
                          }),
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.message || `HTTP ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        if (data.success && data.content) {
                          // Update textarea with generated scene
                          setSceneDescription(data.content);
                          toast.success('Scene generated! Review and edit if needed.');
                        } else {
                          throw new Error(data.message || 'Failed to generate scene');
                        }
                      } catch (error: any) {
                        console.error('[SceneBuilderPanel] AI scene generation failed:', error);
                        toast.error(error.message || 'Failed to generate scene. Please try again.');
                        throw error; // Re-throw so ManualSceneEntry can handle it
                      }
                    }}
                    isMobile={isMobile}
                  />
                )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => {
                      if (!sceneDescription.trim()) {
                        toast.error('Please select or enter a scene first');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    disabled={!sceneDescription.trim()}
                    className="w-full bg-[#DC143C] hover:bg-[#B91238] text-white"
                  >
                    Continue to Step 2
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 2 && (
              <>
                {/* Generation Options - REQUIRED (First) */}
                <Card className="bg-[#141414] border-[#3F3F46]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#FFFFFF]">⚙️ Step 2: Generation Options</CardTitle>
                    <CardDescription className="text-[#808080]">
                      Configure quality and duration for your scene
                      {selectedSceneId && (
                        <span className="block mt-2 text-xs text-[#DC143C]">
                          💡 Note: Scene Analyzer integration coming soon. For now, please configure these options manually.
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                {/* Quality Tier */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quality Tier</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setQualityTier('professional')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        qualityTier === 'professional'
                          ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                          : 'border-[#3F3F46] bg-[#141414] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
                      }`}
                    >
                      <div className="font-semibold text-sm">Professional 1080p</div>
                      <div className="text-xs text-[#808080] mt-1">100-125 credits</div>
                    </button>
                    
                    <button
                      onClick={() => setQualityTier('premium')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        qualityTier === 'premium'
                          ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                          : 'border-[#3F3F46] bg-[#141414] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
                      }`}
                    >
                      <div className="font-semibold text-sm flex items-center gap-2">
                        Premium 4K
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <div className="text-xs text-[#808080] mt-1">200-225 credits</div>
                    </button>
                  </div>
                </div>
                
                {/* Dialogue Detection & Configuration (Phase 1: Core Integration) */}
                {hasDialogue && (
                  <div className="p-4 bg-[#DC143C]/10 border-2 border-[#DC143C]/50 rounded-lg space-y-4">
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-[#DC143C]" />
                      <div>
                        <div className="font-semibold text-sm text-[#FFFFFF]">Dialogue Scene Detected</div>
                        <div className="text-xs text-[#808080]">Configure character and voice settings</div>
                      </div>
                    </div>
                    
                    {/* Character Selection */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-[#FFFFFF]">Character *</Label>
                      <select
                        value={selectedCharacterId || ''}
                        onChange={(e) => setSelectedCharacterId(e.target.value || null)}
                        className="w-full p-2 bg-[#141414] border border-[#3F3F46] rounded text-[#FFFFFF] text-sm"
                      >
                        <option value="">Select a character...</option>
                        {characters.map((char) => (
                          <option key={char.id} value={char.id}>
                            {char.name}
                          </option>
                        ))}
                      </select>
                      {!selectedCharacterId && (
                        <p className="text-xs text-[#DC143C] mt-1">Character selection required for dialogue</p>
                      )}
                    </div>
                    
                    {/* Voice Profile Status */}
                    {selectedCharacterId && voiceProfileStatus && (
                      <div className="p-3 bg-[#141414] rounded border border-[#3F3F46]">
                        <div className="flex items-center gap-2">
                          {voiceProfileStatus.hasVoice ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-[#FFFFFF]">
                                Voice: {voiceProfileStatus.voiceName || 'Configured'} ({voiceProfileStatus.voiceType || 'custom'})
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs text-yellow-500">
                                No voice profile. Will auto-match voice (10 credits)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Outfit Selection (Phase 3) */}
                    {selectedCharacterId && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-[#FFFFFF]">Character Outfit</Label>
                        <OutfitSelector
                          value={selectedOutfit}
                          defaultValue={characterDefaultOutfit}
                          onChange={(outfit) => setSelectedOutfit(outfit)}
                          label=""
                          showDefaultOption={true}
                        />
                        <p className="text-xs text-[#808080] mt-2">
                          Select the outfit the character should wear in this scene
                        </p>
                      </div>
                    )}
                    
                    {/* Mode Selection */}
                    {selectedCharacterId && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-[#FFFFFF]">Generation Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setDialogueMode('talking-head')}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              dialogueMode === 'talking-head'
                                ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                                : 'border-[#3F3F46] bg-[#141414] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
                            }`}
                          >
                            <div className="font-semibold text-xs">Talking Head</div>
                            <div className="text-xs text-[#808080] mt-1">Static portrait, perfect lip-sync</div>
                          </button>
                          
                          <button
                            onClick={() => setDialogueMode('user-video')}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              dialogueMode === 'user-video'
                                ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                                : 'border-[#3F3F46] bg-[#141414] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
                            }`}
                          >
                            <div className="font-semibold text-xs">Video-to-Video</div>
                            <div className="text-xs text-[#808080] mt-1">Motion + performance transfer</div>
                          </button>
                        </div>
                        {dialogueMode === 'user-video' && (
                          <p className="text-xs text-[#808080] mt-2">
                            ⚠️ Requires driving video upload (coming in Phase 2)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Duration */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Duration</Label>
                  <div className="flex gap-2">
                    {['4s', '5s', '6s', '8s', '10s'].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setDuration(dur)}
                        className={`flex-1 py-2 px-3 rounded border text-sm font-medium transition-all ${
                          duration === dur
                            ? 'bg-[#DC143C] text-white border-[#DC143C]'
                            : 'bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Audio Toggle - REMOVED: Sound is handled separately via audio workflows */}
                
                {/* Style Matching (Feature 0109) */}
                {styleProfiles.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-2 text-[#FFFFFF]">
                      🎨 Style Matching
                      <Badge variant="secondary" className="text-xs">NEW</Badge>
                    </Label>
                    <div className="space-y-3">
                      <div className="text-xs text-[#808080]">
                        Match the visual style of your uploaded footage ({styleProfiles.length} profile{styleProfiles.length > 1 ? 's' : ''} available)
                      </div>
                      
                      {!showStyleSelector ? (
                        <button
                          onClick={() => setShowStyleSelector(true)}
                          className="w-full p-3 rounded-lg border-2 border-dashed border-[#3F3F46] hover:border-[#DC143C] hover:bg-[#DC143C]/10 transition-all text-sm text-[#808080]"
                        >
                          Click to select style profile
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg">
                            {styleProfiles.map((profile) => (
                              <button
                                key={profile.profileId}
                                onClick={() => {
                                  setSelectedStyleProfile(profile.profileId);
                                  setShowStyleSelector(false);
                                }}
                                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                  selectedStyleProfile === profile.profileId
                                    ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                                    : 'border-[#3F3F46] bg-[#141414] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {profile.extractedFrames?.[0] && (
                                    <img 
                                      src={profile.extractedFrames[0]} 
                                      alt="Style preview" 
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm">
                                      {profile.sceneId || 'Default Style'}
                                    </div>
                                    <div className="text-xs text-[#808080]">
                                      Confidence: {profile.confidence}%
                                    </div>
                                  </div>
                                  {selectedStyleProfile === profile.profileId && (
                                    <CheckCircle2 className="w-5 h-5 text-[#DC143C]" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                          
                          {selectedStyleProfile && (
                            <div className="p-3 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-[#DC143C] flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-[#FFFFFF]">
                                  Style profile selected! Your generated videos will match the visual style of your uploaded footage.
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              setShowStyleSelector(false);
                              setSelectedStyleProfile(null);
                            }}
                            className="text-xs text-[#808080] hover:text-[#FFFFFF] transition-colors"
                          >
                            Clear selection
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  </CardContent>
                </Card>

                {/* Character References (Optional) */}
                <Card className="bg-[#141414] border-[#3F3F46]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#FFFFFF]">🎭 Character References (Optional)</CardTitle>
                    <CardDescription className="text-[#808080]">
                      Upload headshots for consistent character appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`grid gap-3 ${isMobile || simplified ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      {(isMobile || simplified ? [0] : [0, 1, 2]).map((index) => {
                        const file = referenceImages[index];
                        const preview = file ? URL.createObjectURL(file) : null;
                        
                        return (
                          <div key={index}>
                            {preview ? (
                              <div className="relative">
                                <img
                                  src={preview}
                                  alt={`Character ${index + 1}`}
                                  className={`w-full object-cover rounded border-2 border-[#DC143C] ${isMobile || simplified ? 'h-20' : 'h-20'}`}
                                />
                                <button
                                  onClick={() => {
                                    const newImages = [...referenceImages];
                                    newImages[index] = null;
                                    setReferenceImages(newImages);
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-[#0A0A0A]/90 rounded-full hover:bg-[#DC143C] shadow-lg"
                                >
                                  <X className="w-3 h-3 text-[#FFFFFF]" />
                                </button>
                                <div className="text-[10px] text-center text-[#808080] mt-1 font-medium">
                                  Character {isMobile || simplified ? 'Ref' : index + 1}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = SUPPORTED_IMAGE_TYPES.join(',');
                                  input.onchange = (e: any) => {
                                    const selectedFile = e.target?.files?.[0];
                                    if (selectedFile) {
                                      if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
                                        toast.error(`Image too large. Max ${MAX_IMAGE_SIZE_MB}MB`);
                                        return;
                                      }
                                      if (!SUPPORTED_IMAGE_TYPES.includes(selectedFile.type)) {
                                        toast.error('Unsupported format. Use JPG, PNG, GIF, or WebP.');
                                        return;
                                      }
                                      const newImages = [...referenceImages];
                                      newImages[index] = selectedFile;
                                      setReferenceImages(newImages);
                                    }
                                  };
                                  input.click();
                                }}
                                className={`w-full border-2 border-dashed border-[#3F3F46] rounded flex flex-col items-center justify-center hover:border-[#DC143C] hover:bg-[#DC143C]/10 transition-colors ${isMobile || simplified ? 'h-20' : 'h-20'}`}
                              >
                                <Upload className="w-4 h-4 text-[#808080] mb-1" />
                                <span className="text-[10px] text-[#808080] font-medium">
                                  {isMobile || simplified ? 'Headshot' : `Headshot ${index + 1}`}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 p-2 rounded-lg bg-[#1F1F1F] border border-[#3F3F46]">
                      <p className="text-xs text-[#808080]">
                        💡 <strong className="text-[#FFFFFF]">With character refs:</strong> 4 videos (establishing + 3 character angles)<br />
                        <strong className="text-[#FFFFFF]">Without character refs:</strong> 4 videos (establishing + 3 scene variations)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Media Uploads (Optional) */}
                <Card className="bg-[#141414] border-[#3F3F46]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#FFFFFF]">📁 Media Uploads (Optional)</CardTitle>
                    <CardDescription className="text-[#808080]">
                      Upload video, audio, or images to include in your scene
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`grid gap-3 ${isMobile || simplified ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      {(isMobile || simplified ? [0] : [0, 1, 2]).map((index) => (
                        <MediaUploadSlot
                          key={index}
                          index={index}
                          file={mediaUploads[index]}
                          onUpload={(file) => handleMediaUpload(index, file)}
                          onRemove={() => handleRemoveMedia(index)}
                          isMobile={isMobile || simplified}
                          uploading={uploadingMedia[index]}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-3 p-2 rounded-lg bg-[#1F1F1F] border border-[#3F3F46]">
                      <p className="text-xs text-[#808080]">
                        💡 <strong className="text-[#FFFFFF]">Tip:</strong> Uploaded media can be used as reference material or incorporated directly into your generated scene
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview & Annotate (Optional) */}
                {!firstFrameUrl && !isGeneratingFirstFrame && !isUploadingFirstFrame && (
                  <Card className="bg-[#141414] border-2 border-dashed border-[#3F3F46]">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#FFFFFF]">👁️ Preview & Annotate (Optional)</CardTitle>
                      <CardDescription className="text-[#808080]">
                        Generate a first frame preview or upload your own image, then add camera motion or action annotations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleGenerateFirstFrame}
                          disabled={!sceneDescription.trim() || isGenerating}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Generate Preview
                        </Button>
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadFirstFrame(file);
                              }
                            }}
                            className="hidden"
                            disabled={isGenerating}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10"
                            disabled={isGenerating}
                            asChild
                          >
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </span>
                          </Button>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* First Frame Generation/Upload Progress */}
                {(isGeneratingFirstFrame || isUploadingFirstFrame) && (
                  <Card className="bg-[#141414] border-2 border-[#DC143C]/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-[#DC143C]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#FFFFFF]">
                            {isGeneratingFirstFrame ? 'Generating first frame...' : 'Uploading image...'}
                          </p>
                          <p className="text-xs text-[#808080]">
                            {isGeneratingFirstFrame ? 'This will take a few seconds' : 'Please wait'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Annotation Panel */}
                {showAnnotationPanel && firstFrameUrl && (
                  <Card className="bg-[#141414] border-2 border-[#DC143C]/50">
                    <CardContent className="p-4">
                      <VisualAnnotationPanel
                        imageUrl={firstFrameUrl}
                        onAnnotationsComplete={(annotations) => {
                          setVisualAnnotations(annotations);
                          toast.success('Annotations saved! They will be used in video generation.');
                        }}
                        disabled={isGenerating}
                        defaultExpanded={true}
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() => {
                            setFirstFrameUrl(null);
                            setVisualAnnotations(null);
                            setShowAnnotationPanel(false);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C]"
                        >
                          Clear & Regenerate
                        </Button>
                        <Button
                          onClick={() => setShowAnnotationPanel(false)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-[#808080] hover:text-[#FFFFFF]"
                        >
                          Hide Panel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Continue to Step 3 Button */}
                <Card className="bg-[#141414] border-[#3F3F46]">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                        className="flex-1 bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10"
                      >
                        ← Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white"
                      >
                        Continue to Step 3
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 3: Review & Generate */}
            {currentStep === 3 && (
              <Card className="bg-gradient-to-r from-[#DC143C] to-[#B01030] text-white border-none">
                <CardHeader>
                  <CardTitle className="text-xl text-white">✨ Step 3: Review & Generate</CardTitle>
                  <CardDescription className="text-white/80">
                    Review your selections and generate your scene package
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* What You'll Get Preview */}
                  <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="text-sm font-semibold mb-3 text-white">What You'll Get:</div>
                    <ul className="text-xs opacity-90 space-y-1 mb-3 text-white">
                      <li>• {referenceImages.some(img => img !== null) ? '4 videos (establishing + 3 character angles)' : '4 videos (establishing + 3 scene variations)'}</li>
                      <li>• {qualityTier === 'premium' ? 'Premium 4K quality' : 'Professional 1080p quality'}</li>
                      <li>• {duration} each</li>
                      <li>• Perfect consistency across all clips</li>
                    </ul>
                  </div>

                  {/* Selected Options Summary */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                    <div className="text-sm font-semibold text-white mb-2">Your Selections:</div>
                    <div className="text-xs opacity-90 space-y-1 text-white">
                      <div><strong>Scene:</strong> {sceneDescription.split('\n')[0] || 'Custom scene'}</div>
                      <div><strong>Quality:</strong> {qualityTier === 'premium' ? 'Premium 4K' : 'Professional 1080p'}</div>
                      <div><strong>Duration:</strong> {duration}</div>
                      <div><strong>Character References:</strong> {referenceImages.filter(img => img !== null).length} uploaded</div>
                      {mediaUploads.some(m => m !== null) && (
                        <div><strong>Media Files:</strong> {mediaUploads.filter(m => m !== null).length} uploaded</div>
                      )}
                      {visualAnnotations && (
                        <div><strong>Annotations:</strong> ✓ Applied</div>
                      )}
                    </div>
                  </div>

                  {/* Cost & Time */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <div className="text-sm opacity-90 text-white">Estimated Cost</div>
                      <div className="text-3xl font-bold text-white">{calculateEstimate()} credits</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90 text-white">Estimated Time</div>
                      <div className="text-xl font-semibold text-white">8-15 min</div>
                    </div>
                  </div>

                  {visualAnnotations && (
                    <div className="p-3 bg-white/20 rounded-lg text-sm text-white">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Annotations will be applied to generation</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!sceneDescription.trim() || isGenerating || isGeneratingFirstFrame}
                      className="flex-1 bg-white text-[#DC143C] hover:bg-gray-100 font-bold text-lg h-12"
                      size="lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Complete Scene
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
        
        {/* Progress Tracking - Show when generating or workflow is active */}
        {((isGenerating || workflowStatus) && workflowStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <SceneBuilderProgress 
              executionId={workflowStatus.id}
              status={workflowStatus.status as 'idle' | 'running' | 'completed' | 'failed' | 'awaiting_user_decision' | 'cancelled'}
              currentStep={workflowStatus.currentStep}
              totalSteps={workflowStatus.totalSteps}
              stepResults={workflowStatus.stepResults}
              totalCreditsUsed={workflowStatus.totalCreditsUsed || 0}
            />
          </motion.div>
        )}
        
        {/* Generation History */}
        {!isGenerating && !workflowStatus && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Generations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showHistory && (
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <Card key={item.id} className="overflow-hidden bg-[#141414] border-[#3F3F46]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail Grid */}
                        <div className="grid grid-cols-2 gap-1 w-32 h-32 flex-shrink-0">
                          {item.outputs.slice(0, 4).map((video, idx) => (
                            <img
                              key={idx}
                              src={video.thumbnailUrl}
                              alt={video.clipType}
                              className="w-full h-full object-cover rounded"
                            />
                          ))}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 mb-2">
                            {item.sceneDescription}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              {item.outputs.length} videos
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {item.totalCredits} credits
                            </span>
                            <Badge variant={item.qualityTier === 'premium' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                              {item.qualityTier}
                            </Badge>
                            {/* Note: enableSound removed - sound is handled separately via audio workflows */}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="text-xs h-7"
                              onClick={() => {
                                if (item.outputs.length > 0) {
                                  const firstVideo = item.outputs[0];
                                  setSelectedAsset({
                                    url: firstVideo.url,
                                    s3Key: extractS3Key(firstVideo.url),
                                    name: `scene_video_${Date.now()}.mp4`,
                                    type: 'video'
                                  });
                                  setShowStorageModal(true);
                                }
                              }}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="text-xs h-7"
                              onClick={() => handleSendToTimeline(item)}
                            >
                              <Film className="w-3 h-3 mr-1" />
                              Edit in Timeline
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Download className="w-3 h-3 mr-1" />
                              Download All
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
        </div>
      </div>
      
      {/* Decision Modal */}
      <SceneBuilderDecisionModal
        isOpen={showDecisionModal}
        onContinue={handleDecisionContinue}
        onCancel={handleDecisionCancel}
        message={workflowStatus?.metadata?.message}
      />
      
      {/* Storage Decision Modal (Feature 0066) */}
      {showStorageModal && selectedAsset && (
        <StorageDecisionModal
          isOpen={showStorageModal}
          onClose={() => {
            setShowStorageModal(false);
            setSelectedAsset(null);
          }}
          assetType={selectedAsset.type}
          assetName={selectedAsset.name}
          s3TempUrl={selectedAsset.url}
          s3Key={selectedAsset.s3Key}
          fileSize={undefined}
          metadata={{}}
        />
      )}
      
      {/* Partial Delivery Modal (Feature 0077) */}
      {showPartialDeliveryModal && partialDeliveryData && (
        <PartialDeliveryModal
          isOpen={showPartialDeliveryModal}
          onClose={() => {
            setShowPartialDeliveryModal(false);
            setPartialDeliveryData(null);
          }}
          deliveredVideo={partialDeliveryData.deliveredVideo}
          pricing={partialDeliveryData.pricing}
          rejectionReason={partialDeliveryData.rejectionReason}
          onDownload={() => {
            // Download the master scene
            const link = document.createElement('a');
            link.href = partialDeliveryData.deliveredVideo.url;
            link.download = 'wryda-master-scene.mp4';
            link.click();
            toast.success('Downloading your Premium quality master scene');
          }}
          onRetry={() => {
            // Close modal and let user modify dialog
            setShowPartialDeliveryModal(false);
            setPartialDeliveryData(null);
            toast.info('Modify your scene dialog and try again');
          }}
        />
      )}
    </div>
  );
}

