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
  ChevronRight,
  Check
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
import { CharacterOutfitSelector } from './CharacterOutfitSelector';
import { DialogueConfirmationPanel } from './DialogueConfirmationPanel';
import { UnifiedSceneConfiguration } from './UnifiedSceneConfiguration';
import { api } from '@/lib/api';
import { SceneAnalysisResult } from '@/types/screenplay';

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
  const [useNewWorkflow, setUseNewWorkflow] = useState(false); // Toggle for testing new VEO workflow
  
  // Per-character outfit selection state (NEW: Phase 3 - Outfit Integration)
  const [characterOutfits, setCharacterOutfits] = useState<Record<string, string>>({});
  
  // Feature 0163 Phase 1: Character headshot selection state
  const [selectedCharacterReferences, setSelectedCharacterReferences] = useState<Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>({});
  const [characterHeadshots, setCharacterHeadshots] = useState<Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>>({});
  const [loadingHeadshots, setLoadingHeadshots] = useState<Record<string, boolean>>({});
  
  // UnifiedSceneConfiguration: Track which shots are enabled
  const [enabledShots, setEnabledShots] = useState<number[]>([]);
  
  // UI State: Collapsible sections
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Wizard flow state (Step 3 removed - now part of UnifiedSceneConfiguration)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
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
  
  // Scene Analyzer state (Feature 0136 Phase 2.2)
  const [sceneAnalysisResult, setSceneAnalysisResult] = useState<SceneAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [characterReferenceUrls, setCharacterReferenceUrls] = useState<string[]>([]); // Pre-populated from analysis
  const [confirmedDialogue, setConfirmedDialogue] = useState<any>(null);
  const [dialogueReviewPreference, setDialogueReviewPreference] = useState<'always-review' | 'review-issues-only'>(
    () => {
      // Load from localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dialogueReviewPreference');
        return (saved === 'always-review' || saved === 'review-issues-only') ? saved : 'review-issues-only';
      }
      return 'review-issues-only';
    }
  );
  
  // Workflow Detection state (Feature Workflow Detection Phase 2)
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  
  // Auto-select workflows when analysis completes
  useEffect(() => {
    if (sceneAnalysisResult?.workflowRecommendations) {
      // Auto-select all workflows that can combine (default behavior)
      const combinableWorkflows = sceneAnalysisResult.workflowRecommendations
        .filter(rec => rec.canCombine)
        .map(rec => rec.workflowId);
      setSelectedWorkflows(combinableWorkflows);
    }
  }, [sceneAnalysisResult]);
  
  // Toggle workflow selection
  const toggleWorkflow = (workflowId: string) => {
    setSelectedWorkflows(prev => 
      prev.includes(workflowId)
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };
  
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
        
        console.log('[SceneBuilderPanel] Auto-selected scene from editor context:', {
          sceneId: sceneFromContext.id,
          heading: sceneFromContext.heading,
          foundInDatabase: true
        });
      } else {
        console.warn('[SceneBuilderPanel] ⚠️ Scene from editor context not found in database:', {
          editorSceneId,
          availableSceneIds: screenplay.scenes?.map(s => s.id).slice(0, 5),
          totalScenes: screenplay.scenes?.length || 0
        });
      }
    }
  }, [contextStore.context.currentSceneId, contextStore.context.projectId, screenplay.scenes, projectId]);

  // Phase 2.2: Auto-analyze scene when selectedSceneId changes (Feature 0136)
  useEffect(() => {
    if (!selectedSceneId || !projectId) {
      // Clear analysis if no scene selected
      setSceneAnalysisResult(null);
      setAnalysisError(null);
      setCharacterReferenceUrls([]);
      return;
    }

    // Auto-analyze the selected scene
    const analyzeScene = async () => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      try {
        // Build characterOutfits mapping (only include defined outfits, not undefined)
        const characterOutfitsToSend: Record<string, string> = {};
        Object.entries(characterOutfits).forEach(([charId, outfit]) => {
          if (outfit) {
            characterOutfitsToSend[charId] = outfit;
          }
        });
        
        const result = await api.sceneAnalyzer.analyze({
          screenplayId: projectId,
          sceneId: selectedSceneId,
          characterOutfits: Object.keys(characterOutfitsToSend).length > 0 ? characterOutfitsToSend : undefined
        });
        
        if (result.success && result.data) {
          const characterDetails = result.data.characters?.map(c => ({
            id: c.id,
            name: c.name,
            hasReferences: c.hasReferences,
            referencesCount: c.references?.length || 0,
            availableOutfits: c.availableOutfits,
            availableOutfitsCount: c.availableOutfits?.length || 0,
            defaultOutfit: c.defaultOutfit
          })) || [];
          
          console.log('[SceneBuilderPanel] ✅ Analysis result received:', {
            sceneType: result.data.sceneType,
            characterCount: result.data.characters?.length || 0,
            characters: characterDetails,
            characterNames: characterDetails.map(c => c.name).join(', '),
            location: result.data.location?.name,
            shotBreakdown: result.data.shotBreakdown?.totalShots
          });
          
          // Log outfit information for each character (explicit logging)
          characterDetails.forEach((char: any) => {
            const rawChar = result.data.characters?.find((c: any) => c.id === char.id);
            console.log(`[SceneBuilderPanel] 👔 OUTFIT INFO for ${char.name}:`, {
              availableOutfits: rawChar?.availableOutfits || 'NOT FOUND',
              availableOutfitsCount: rawChar?.availableOutfits?.length || 0,
              defaultOutfit: rawChar?.defaultOutfit || 'NOT SET',
              hasOutfits: (rawChar?.availableOutfits?.length || 0) > 0,
              fullCharacterObject: rawChar
            });
            
            // Explicit warning if outfits should exist but don't
            if (char.name === 'SARAH' && (!rawChar?.availableOutfits || rawChar.availableOutfits.length === 0)) {
              console.error(`[SceneBuilderPanel] ❌ SARAH has NO OUTFITS in API response!`, rawChar);
            }
          });
          
          // Log if Sarah is missing
          const hasSarah = characterDetails.some(c => 
            c.name.toLowerCase().includes('sarah') || c.name.toUpperCase() === 'SARAH'
          );
          if (!hasSarah && characterDetails.length > 0) {
            console.warn('[SceneBuilderPanel] ⚠️ Sarah not found in characters. Found:', characterDetails.map(c => c.name).join(', '));
          }
          
          setSceneAnalysisResult(result.data);
          
          // Task 5: Pre-populate character reference URLs from analysis
          const allCharacterRefs: string[] = [];
          result.data.characters.forEach(char => {
            if (char.hasReferences && char.references.length > 0) {
              allCharacterRefs.push(...char.references);
            }
          });
          
          // Limit to 3 references (max supported)
          setCharacterReferenceUrls(allCharacterRefs.slice(0, 3));
          
          // Auto-suggest quality tier based on analysis
          const shotBreakdown = result.data.shotBreakdown;
          const totalShots = shotBreakdown?.totalShots || 0;
          const totalCredits = shotBreakdown?.totalCredits || 0;
          // Check for VFX in shot breakdown (shots with type 'vfx')
          const hasVFX = shotBreakdown?.shots?.some(shot => shot.type === 'vfx') || false;
          const characterCount = result.data.characters?.length || 0;
          
          // Complex scene indicators:
          // - High shot count (>3 shots)
          // - High credit cost (>300 credits)
          // - VFX requirements
          // - Multiple characters (>2)
          const isComplex = 
            totalShots > 3 ||
            totalCredits > 300 ||
            hasVFX ||
            characterCount > 2;
          
          // Auto-suggest Premium for complex scenes, Professional for simple scenes
          if (isComplex) {
            setQualityTier('premium');
            console.log('[SceneBuilderPanel] Auto-suggested Premium tier (complex scene)');
          } else {
            setQualityTier('professional');
            console.log('[SceneBuilderPanel] Auto-suggested Professional tier (simple scene)');
          }
          
          // 🔥 NEW: Refresh scenes in context after analysis completes
          // This ensures the UI shows updated dialogue blocks and character information
          console.log('[SceneBuilderPanel] 🔄 Triggering scene refresh after analysis');
          window.dispatchEvent(new CustomEvent('refreshScenes'));
        } else {
          throw new Error(result.message || 'Analysis failed');
        }
      } catch (error: any) {
        console.error('[SceneBuilderPanel] Scene analysis failed:', error);
        setAnalysisError(error.message || 'Failed to analyze scene');
        toast.error('Failed to analyze scene', {
          description: error.message || 'Please try again'
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeScene();
  }, [selectedSceneId, projectId]);
  
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
  
  // Feature 0163 Phase 1: Fetch character headshots for dialogue shots
  useEffect(() => {
    async function fetchHeadshotsForDialogueShots() {
      if (!projectId || !sceneAnalysisResult?.shotBreakdown?.shots) return;
      
      const dialogueShots = sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => shot.type === 'dialogue' && shot.characterId);
      if (dialogueShots.length === 0) return;
      
      const characterIds = [...new Set(dialogueShots.map((shot: any) => shot.characterId))];
      
      for (const characterId of characterIds) {
        if (characterHeadshots[characterId] || loadingHeadshots[characterId]) continue; // Already loaded or loading
        
        setLoadingHeadshots(prev => ({ ...prev, [characterId]: true }));
        
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) continue;
          
          // Fetch character profile with all pose references
          const response = await fetch(`/api/character-bank/${characterId}?screenplayId=${encodeURIComponent(projectId)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const responseData = await response.json();
            // Backend wraps response in { success: true, data: { character: ... } }
            const character = responseData.data?.character || responseData.character;
            
            console.log(`[SceneBuilderPanel] Fetched character ${characterId}:`, {
              hasCharacter: !!character,
              poseRefsCount: character?.poseReferences?.length || 0,
              angleRefsCount: character?.angleReferences?.length || 0,
              responseStructure: {
                hasData: !!responseData.data,
                hasCharacter: !!responseData.character,
                hasDataCharacter: !!responseData.data?.character,
                keys: Object.keys(responseData)
              },
              poseRefs: character?.poseReferences?.slice(0, 3).map((r: any) => ({
                poseId: r.poseId || r.metadata?.poseId,
                hasImageUrl: !!r.imageUrl,
                hasS3Key: !!r.s3Key,
                label: r.label
              }))
            });
            
            // Filter to only headshot poses
            // Backend sets both poseReferences and angleReferences to the same array, so we need to deduplicate
            // Use a Set to track unique references by s3Key (or poseId if s3Key is missing)
            const seenRefs = new Set<string>();
            const allPoseReferences: any[] = [];
            
            // Add poseReferences first
            if (character?.poseReferences) {
              for (const ref of character.poseReferences) {
                const key = ref.s3Key || ref.poseId || ref.metadata?.poseId || JSON.stringify(ref);
                if (!seenRefs.has(key)) {
                  seenRefs.add(key);
                  allPoseReferences.push(ref);
                }
              }
            }
            
            // Add angleReferences, skipping duplicates
            if (character?.angleReferences) {
              for (const ref of character.angleReferences) {
                const key = ref.s3Key || ref.poseId || ref.metadata?.poseId || JSON.stringify(ref);
                if (!seenRefs.has(key)) {
                  seenRefs.add(key);
                  allPoseReferences.push(ref);
                }
              }
            }
            
            const beforeDedupCount = allPoseReferences.length;
            console.log(`[SceneBuilderPanel] Total pose references for ${characterId} (after initial deduplication):`, beforeDedupCount);
            
            // Filter headshots (we'll do this on backend validation, but filter by common headshot poseIds here)
            const headshotPoseIds = ['close-up-front-facing', 'close-up', 'extreme-close-up', 'close-up-three-quarter', 'headshot-front', 'headshot-3/4', 'front-facing'];
            const beforeFinalDedup = allPoseReferences
              .filter((ref: any) => {
                const poseId = ref.poseId || ref.metadata?.poseId;
                const matches = poseId && headshotPoseIds.some(hp => poseId.toLowerCase().includes(hp.toLowerCase()));
                if (!matches && poseId) {
                  console.log(`[SceneBuilderPanel] Pose ${poseId} did not match headshot filter`);
                }
                return matches;
              })
              .map((ref: any) => ({
                poseId: ref.poseId || ref.metadata?.poseId,
                s3Key: ref.s3Key,
                imageUrl: ref.imageUrl,
                label: ref.label || ref.metadata?.poseName || 'Headshot',
                priority: ref.priority || 999,
                outfitName: ref.outfitName || ref.metadata?.outfitName // Store outfit name for filtering
              }))
              .filter((ref: any) => ref.imageUrl); // Only include headshots with imageUrl
            
            // Final deduplication pass: remove any remaining duplicates by s3Key or poseId
            const headshots = beforeFinalDedup
              .filter((ref: any, index: number, self: any[]) => {
                const key = ref.s3Key || ref.poseId;
                if (!key) return true; // Keep if no key (shouldn't happen)
                const firstIndex = self.findIndex((r: any) => (r.s3Key || r.poseId) === key);
                const isDuplicate = index !== firstIndex;
                if (isDuplicate) {
                  console.log(`[SceneBuilderPanel] 🚫 Removed duplicate headshot:`, {
                    poseId: ref.poseId,
                    s3Key: ref.s3Key?.substring(0, 30) + '...',
                    duplicateIndex: index,
                    firstIndex: firstIndex
                  });
                }
                return !isDuplicate;
              })
              .slice(0, 10); // Limit to 10 headshots
            
            const duplicatesRemoved = beforeFinalDedup.length - headshots.length;
            if (duplicatesRemoved > 0) {
              console.log(`[SceneBuilderPanel] ✅ Deduplication: Removed ${duplicatesRemoved} duplicate headshot(s) for ${characterId}`);
            }
            
            console.log(`[SceneBuilderPanel] Filtered headshots for ${characterId}:`, {
              count: headshots.length,
              beforeDedup: beforeFinalDedup.length,
              duplicatesRemoved: duplicatesRemoved,
              headshots: headshots.map(h => ({ poseId: h.poseId, s3Key: h.s3Key?.substring(0, 20) + '...', hasImageUrl: !!h.imageUrl, label: h.label }))
            });
            
            if (headshots.length > 0) {
              setCharacterHeadshots(prev => ({ ...prev, [characterId]: headshots }));
              
              // Auto-select highest priority headshot (lowest priority number)
              const bestHeadshot = headshots.reduce((best: any, current: any) => 
                (current.priority || 999) < (best.priority || 999) ? current : best
              );
              
              // Ensure we store s3Key and imageUrl for precise matching (not just poseId)
              
              setSelectedCharacterReferences(prev => ({
                ...prev,
                [characterId]: {
                  poseId: bestHeadshot.poseId,
                  s3Key: bestHeadshot.s3Key,
                  imageUrl: bestHeadshot.imageUrl
                }
              }));
            } else {
              console.warn(`[SceneBuilderPanel] No headshots found for character ${characterId} after filtering`);
            }
          } else {
            console.error(`[SceneBuilderPanel] Failed to fetch character ${characterId}:`, response.status, response.statusText);
          }
        } catch (error) {
          console.error(`[SceneBuilderPanel] Failed to fetch headshots for character ${characterId}:`, error);
        } finally {
          setLoadingHeadshots(prev => ({ ...prev, [characterId]: false }));
        }
      }
    }
    
    fetchHeadshotsForDialogueShots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sceneAnalysisResult?.shotBreakdown?.shots]);
  
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
  
  // Initialize character outfits when analysis result is received
  useEffect(() => {
    if (sceneAnalysisResult?.characters) {
      setCharacterOutfits(prev => {
        const updated: Record<string, string> = { ...prev };
        let hasChanges = false;
        
        sceneAnalysisResult.characters.forEach(char => {
          // Only set if character doesn't have an outfit selected yet
          if (!prev[char.id]) {
            if (char.defaultOutfit) {
              // Use default outfit if set
              updated[char.id] = char.defaultOutfit;
              hasChanges = true;
            } else if (char.availableOutfits && char.availableOutfits.length > 0) {
              // Auto-select first outfit if no default is set
              updated[char.id] = char.availableOutfits[0];
              hasChanges = true;
            } else {
              // No outfits available - mark as using default (undefined)
              updated[char.id] = undefined as any;
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }
  }, [sceneAnalysisResult]);
  
  // 🔥 NEW: Recover workflow execution on mount (if user navigated away and came back)
  useEffect(() => {
    async function recoverWorkflowExecution() {
      // Only recover if we don't already have a workflowExecutionId
      if (workflowExecutionId || isGenerating) return;
      
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        
        // Check localStorage for saved workflowExecutionId
        const savedExecutionId = localStorage.getItem(`scene-builder-execution-${projectId}`);
        if (savedExecutionId) {
          console.log('[SceneBuilderPanel] Found saved workflow execution ID:', savedExecutionId);
          
          // Verify it still exists and is running
          const response = await fetch(`/api/workflows/${savedExecutionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.execution) {
              const execution = data.execution;
              
              // Only recover if it's still running
              if (execution.status === 'running' || execution.status === 'queued' || execution.status === 'awaiting_user_decision') {
                console.log('[SceneBuilderPanel] ✅ Recovered workflow execution:', savedExecutionId, execution.status);
                setWorkflowExecutionId(savedExecutionId);
                setIsGenerating(true);
                setWorkflowStatus({
                  id: execution.executionId,
                  status: execution.status,
                  currentStep: execution.currentStep || 1,
                  totalSteps: execution.totalSteps || 5,
                  stepResults: execution.stepResults || [],
                  totalCreditsUsed: execution.totalCreditsUsed || 0,
                  finalOutputs: execution.finalOutputs || []
                });
                setCurrentStep(2); // Stay on Step 2 (generation happens in UnifiedSceneConfiguration)
                toast.info('Resuming workflow generation...', {
                  description: 'Your previous generation is still running'
                });
              } else {
                // Execution completed or failed, remove from localStorage
                localStorage.removeItem(`scene-builder-execution-${projectId}`);
              }
            }
          } else {
            // Execution not found, remove from localStorage
            localStorage.removeItem(`scene-builder-execution-${projectId}`);
          }
        }
      } catch (error) {
        console.error('[SceneBuilderPanel] Failed to recover workflow execution:', error);
      }
    }
    
    // Only run recovery on mount (when component first loads)
    if (projectId) {
      recoverWorkflowExecution();
    }
  }, [projectId]); // Only run when projectId changes (on mount)
  
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
          // 🔥 NEW: Remove from localStorage when completed
          localStorage.removeItem(`scene-builder-execution-${projectId}`);
        }
        
        // Check if failed
        if (data.execution.status === 'failed') {
          handleGenerationFailed(data.execution);
          clearInterval(interval);
          // 🔥 NEW: Remove from localStorage when failed
          localStorage.removeItem(`scene-builder-execution-${projectId}`);
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
    
    // PRIORITY 1: Check Scene Analyzer result (most accurate - uses backend analysis)
    if (sceneAnalysisResult?.dialogue?.hasDialogue) {
      // Scene Analyzer detected dialogue - use dialogue generation endpoint
      console.log('[SceneBuilderPanel] Scene Analyzer detected dialogue, routing to /api/dialogue/generate');
      await handleDialogueGeneration({
        hasDialogue: true,
        characterName: sceneAnalysisResult.characters?.[0]?.name,
        dialogue: sceneDescription.trim() // Use full scene description for dialogue extraction
      });
      return;
    }
    
    // PRIORITY 2: Fallback to simple dialogue detection (for manual entry without analysis)
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
    // Get character ID from scene analyzer or selected character
    const characterId = sceneAnalysisResult?.characters?.[0]?.id || selectedCharacterId;
    
    // Validate character selection
    if (!characterId) {
      toast.error('Please select a character for dialogue generation', {
        description: 'Dialogue scenes require a character to be selected'
      });
      return;
    }
    
    // Get character image from scene analyzer references or manual upload
    let characterImageUrl: string | null = null;
    
    // PRIORITY 1: Use references from Scene Analyzer (already have presigned URLs)
    if (sceneAnalysisResult?.characters?.[0]?.references && sceneAnalysisResult.characters[0].references.length > 0) {
      characterImageUrl = sceneAnalysisResult.characters[0].references[0];
      console.log('[SceneBuilderPanel] Using character reference from Scene Analyzer');
    } 
    // PRIORITY 2: Use manually uploaded image
    else if (referenceImages[0]) {
      characterImageUrl = await uploadCharacterImage(referenceImages[0] as File);
    }
    
    if (!characterImageUrl) {
      toast.error('Character image required', {
        description: 'Please ensure character has references in Character Bank or upload a character reference image'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      // Extract dialogue text from Scene Analyzer dialogue blocks or fallback
      let dialogueText: string;
      if (sceneAnalysisResult?.dialogue?.blocks && sceneAnalysisResult.dialogue.blocks.length > 0) {
        // Use dialogue blocks from Scene Analyzer (most accurate)
        const characterDialogueBlocks = sceneAnalysisResult.dialogue.blocks.filter((block: any) => {
          const blockCharName = block.character?.toUpperCase().trim();
          const charName = sceneAnalysisResult.characters?.[0]?.name?.toUpperCase().trim();
          return blockCharName === charName || blockCharName?.includes(charName || '') || charName?.includes(blockCharName || '');
        });
        
        if (characterDialogueBlocks.length > 0) {
          // Combine all dialogue for this character
          dialogueText = characterDialogueBlocks.map((block: any) => block.dialogue || '').join(' ').trim();
          console.log(`[SceneBuilderPanel] Using ${characterDialogueBlocks.length} dialogue blocks from Scene Analyzer`);
        } else {
          // Fallback to full scene description
          dialogueText = sceneDescription.trim();
        }
      } else {
        // Fallback to detected dialogue or full scene description
        dialogueText = dialogueInfo.dialogue || sceneDescription.trim();
      }
      
      // Validate dialogue text is not empty
      if (!dialogueText || dialogueText.trim().length === 0) {
        toast.error('Dialogue text required', {
          description: 'Please ensure the scene contains dialogue or provide dialogue text'
        });
        setIsGenerating(false);
        return;
      }
      
      // Validate character image URL is provided
      if (!characterImageUrl) {
        toast.error('Character image required', {
          description: 'Please ensure character has references in Character Bank or upload a character reference image'
        });
        setIsGenerating(false);
        return;
      }
      
      // Validate all required fields before building request
      if (!characterId || typeof characterId !== 'string') {
        toast.error('Invalid character ID', {
          description: 'Character ID is required and must be a valid string'
        });
        setIsGenerating(false);
        return;
      }
      
      if (!projectId || typeof projectId !== 'string') {
        toast.error('Invalid screenplay ID', {
          description: 'Screenplay ID is required and must be a valid string'
        });
        setIsGenerating(false);
        return;
      }
      
      if (!dialogueText || typeof dialogueText !== 'string' || dialogueText.trim().length === 0) {
        toast.error('Invalid dialogue text', {
          description: 'Dialogue text is required and cannot be empty'
        });
        setIsGenerating(false);
        return;
      }
      
      // Parse duration safely
      let parsedDuration = 5; // Default
      if (duration && typeof duration === 'string') {
        const parsed = parseInt(duration.replace('s', ''), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
          parsedDuration = parsed;
        }
      } else if (typeof duration === 'number' && duration >= 1 && duration <= 10) {
        parsedDuration = duration;
      }
      
      // Validate characterImageUrl format if provided
      if (characterImageUrl && typeof characterImageUrl !== 'string') {
        toast.error('Invalid character image URL', {
          description: 'Character image URL must be a valid string'
        });
        setIsGenerating(false);
        return;
      }
      
      // Validate characterImageUrl is a valid URL if provided
      if (characterImageUrl && !characterImageUrl.startsWith('http://') && !characterImageUrl.startsWith('https://')) {
        toast.error('Invalid character image URL format', {
          description: 'Character image URL must be a valid HTTP/HTTPS URL'
        });
        setIsGenerating(false);
        return;
      }
      
      // Get sceneId - try selectedSceneId first, then fallback to editor context
      // sceneId is required for single source of truth enforcement
      const sceneId = selectedSceneId || contextStore.context.currentSceneId;
      
      // Validate sceneId is required (single source of truth enforcement)
      if (!sceneId) {
        toast.error('Scene selection required', {
          description: 'Please select a scene from the screenplay. Single source of truth enforcement: sceneId is required for dialogue generation.'
        });
        setIsGenerating(false);
        return;
      }
      
      // Prepare dialogue generation request
      // sceneId is required - backend will use hash system's extractSceneContent() (single source of truth)
      const dialogueRequest: any = {
        characterId: characterId, // Use character from scene analyzer or selected
        screenplayId: projectId,
        dialogue: dialogueText.trim(), // Ensure trimmed
        mode: dialogueMode || 'talking-head', // Ensure mode is set
        autoMatchVoice: true, // Default to auto-match if no voice profile
        duration: parsedDuration,
        sceneId: sceneId, // Required: Backend uses hash system's extractSceneContent() (single source of truth, no fallbacks)
        sceneDescription: sceneDescription.trim(), // For establishing shot prompt
        qualityTier: qualityTier || 'premium', // Quality tier for establishing shot
        aspectRatio: '16:9' // Default aspect ratio (can be made configurable later)
      };
      
      // Only include characterImageUrl if it's actually set (service can fetch from Character Bank if not provided)
      if (characterImageUrl && typeof characterImageUrl === 'string') {
        dialogueRequest.characterImageUrl = characterImageUrl;
      }
      
      // Add driving video URL if Mode 2 selected
      if (dialogueMode === 'user-video' && drivingVideoUrl) {
        dialogueRequest.drivingVideoUrl = drivingVideoUrl;
      }
      
      // Add location and assets for establishing shot generation
      if (sceneAnalysisResult?.location?.id) {
        dialogueRequest.locationId = sceneAnalysisResult.location.id;
        console.log('[SceneBuilderPanel] Including location for establishing shot:', sceneAnalysisResult.location.id);
      }
      
      if (sceneAnalysisResult?.assets && sceneAnalysisResult.assets.length > 0) {
        dialogueRequest.assetIds = sceneAnalysisResult.assets
          .filter((asset: any) => asset.hasReference)
          .map((asset: any) => asset.id);
        console.log('[SceneBuilderPanel] Including assets for establishing shot:', dialogueRequest.assetIds);
      }
      
      // Log request for debugging
      console.log('[SceneBuilderPanel] Dialogue request:', {
        characterId: dialogueRequest.characterId,
        screenplayId: dialogueRequest.screenplayId,
        dialogueLength: dialogueRequest.dialogue?.length,
        mode: dialogueRequest.mode,
        hasCharacterImageUrl: !!dialogueRequest.characterImageUrl,
        characterImageUrl: dialogueRequest.characterImageUrl ? dialogueRequest.characterImageUrl.substring(0, 50) + '...' : 'none',
        duration: dialogueRequest.duration,
        hasFountainContext: !!dialogueRequest.fountainContext
      });
      
      // Use new workflow endpoint if toggle is enabled
      const endpoint = useNewWorkflow 
        ? '/api/dialogue/generate-first-frame-lipsync'
        : '/api/dialogue/generate';
      
      console.log(`[SceneBuilderPanel] Using ${useNewWorkflow ? 'NEW' : 'ORIGINAL'} workflow endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dialogueRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Dialogue generation failed: ${response.status}`;
        console.error('[SceneBuilderPanel] Dialogue generation error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorData: errorData,
          requestBody: {
            characterId: dialogueRequest.characterId,
            screenplayId: dialogueRequest.screenplayId,
            dialogueLength: dialogueRequest.dialogue?.length,
            mode: dialogueRequest.mode,
            hasCharacterImageUrl: !!dialogueRequest.characterImageUrl
          }
        });
        throw new Error(errorMessage);
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
      
      // Task 5: Pre-populate character references from Scene Analyzer (Feature 0136 Phase 2.2)
      // Start with URLs from analysis (already URLs, no upload needed)
      const referenceImageUrls: string[] = [...characterReferenceUrls];
      
      // Upload any manually uploaded character reference images (merge with analysis URLs)
      const uploadedImages = referenceImages.filter(img => img !== null) as File[];
      
      if (uploadedImages.length > 0) {
        toast.info('Uploading additional character references...');
        
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
      
      // Limit to 3 references total (max supported by workflows)
      const finalCharacterRefs = referenceImageUrls.slice(0, 3);
      
      if (characterReferenceUrls.length > 0) {
        console.log('[SceneBuilderPanel] Using pre-populated character references from Scene Analyzer:', characterReferenceUrls.length);
      }
      
      // Start workflow execution with authentication
      
      // Get style profile data if selected
      const selectedProfile = selectedStyleProfile 
        ? styleProfiles.find(p => p.profileId === selectedStyleProfile)
        : null;
      
      // Prepare workflow inputs - backend expects flat structure, not nested in 'inputs'
      // Backend expects: workflowId, sceneDescription, characterRefs (not characterReferences), etc.
      // Task 5: Use workflow recommendations from Scene Analyzer if available (Feature 0136 Phase 2.2)
      // NEW: Support multiple workflow selection (Feature Workflow Detection Phase 3)
      // Use enabled shots to determine which workflows to run
      // If shot breakdown is available, use workflows from enabled shots
      // Otherwise fall back to selected workflows or recommendations
      let workflowIdsToUse: string[] = [];
      
      if (sceneAnalysisResult?.shotBreakdown && enabledShots.length > 0) {
        // Get unique workflows from enabled shots
        const enabledShotWorkflows = sceneAnalysisResult.shotBreakdown.shots
          .filter((shot: any) => enabledShots.includes(shot.slot))
          .map((shot: any) => shot.workflow)
          .filter((workflow: string) => workflow) as string[];
        
        workflowIdsToUse = [...new Set(enabledShotWorkflows)];
      }
      
      // Fallback to selected workflows or recommendations
      if (workflowIdsToUse.length === 0) {
        workflowIdsToUse = selectedWorkflows.length > 0 
          ? selectedWorkflows 
          : (sceneAnalysisResult?.workflowRecommendations?.[0]?.workflowId ? [sceneAnalysisResult.workflowRecommendations[0].workflowId] : ['complete-scene']);
      }
      
      const workflowRequest: any = {
        workflowIds: workflowIdsToUse, // NEW: Pass array of workflow IDs for combined execution
        sceneDescription: sceneDescription.trim(),
        characterRefs: finalCharacterRefs, // Pre-populated from analysis + manual uploads (max 3)
        aspectRatio: '16:9',
        duration,
        qualityTier,
        shotBreakdown: sceneAnalysisResult?.shotBreakdown ? {
          ...sceneAnalysisResult.shotBreakdown,
          shots: enabledShots.length > 0 
            ? sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => enabledShots.includes(shot.slot))
            : sceneAnalysisResult.shotBreakdown.shots,
          totalShots: enabledShots.length > 0 ? enabledShots.length : sceneAnalysisResult.shotBreakdown.totalShots,
          totalCredits: enabledShots.length > 0 
            ? sceneAnalysisResult.shotBreakdown.shots
                .filter((shot: any) => enabledShots.includes(shot.slot))
                .reduce((sum: number, shot: any) => sum + shot.credits, 0)
            : sceneAnalysisResult.shotBreakdown.totalCredits
        } : undefined, // NEW: Pass filtered shot breakdown (only enabled shots)
        selectedCharacterReferences: Object.keys(selectedCharacterReferences).length > 0 ? selectedCharacterReferences : undefined, // Feature 0163 Phase 1: Per-character selected references
        // Note: enableSound removed - sound is handled separately via audio workflows
        // Backend has enableSound = false as default, so we don't need to send it
      };
      
      // Log workflow selection
      if (workflowIdsToUse.length > 1) {
        console.log('[SceneBuilderPanel] Using combined workflows:', workflowIdsToUse);
      } else if (workflowIdsToUse[0] !== 'complete-scene') {
        console.log('[SceneBuilderPanel] Using recommended workflow from Scene Analyzer:', workflowIdsToUse[0]);
      }
      
      // Add optional fields if available
      if (selectedSceneId) {
        workflowRequest.sceneId = selectedSceneId;
      }
      
      // Note: Outfit selection is now handled per-character in the scene analysis phase
      // Character references are already filtered by outfit when fetched from the backend
      
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
        
        // 🔥 NEW: Save workflowExecutionId to localStorage for recovery
        localStorage.setItem(`scene-builder-execution-${projectId}`, data.executionId);
        
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
        setCurrentStep(2); // Stay on Step 2 (UnifiedSceneConfiguration handles generation)
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
    
    // 🔥 NEW: Clear localStorage when generation completes
    localStorage.removeItem(`scene-builder-execution-${projectId}`);
    
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-border p-4 md:p-5 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <Film className="w-5 h-5" />
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
    
    // 🔥 NEW: Clear localStorage when generation fails
    localStorage.removeItem(`scene-builder-execution-${projectId}`);
  }
  
  /**
   * Calculate credit estimate
   * Uses Scene Analyzer's detailed breakdown as source of truth
   * Adds quality tier adjustment (Premium = +100 credits for enhanced quality)
   */
  function calculateEstimate(): number {
    // If Scene Analyzer has calculated credits, use that as source of truth
    if (sceneAnalysisResult?.shotBreakdown?.totalCredits) {
      const baseCredits = sceneAnalysisResult.shotBreakdown.totalCredits;
      
      // Add quality tier adjustment (Premium = enhanced quality)
      // For dialogue scenes: Enhanced quality for establishing shot only (+100 credits)
      // For workflow scenes: Enhanced quality for all videos (+100 credits)
      if (qualityTier === 'premium') {
        return baseCredits + 100; // Add premium quality cost (establishing shot for dialogue, all videos for workflow)
      }
      
      return baseCredits;
    }
    
    // Fallback: If no Scene Analyzer result, use simplified calculation
    // This should rarely happen, but provides a fallback
    if (sceneAnalysisResult?.dialogue?.hasDialogue) {
      // Dialogue generation: ~5-10 credits (audio) + 100 credits (lip sync) = ~105-110 credits
      // Premium tier adds enhanced quality for establishing shot
      return 105; // Fixed cost for talking-head dialogue generation
    }
    
    // Workflow-based scene generation (fallback)
    const hasCharacterRefs = referenceImages.some(img => img !== null);
    const baseCredits = hasCharacterRefs ? 125 : 100; // Master + 3 angles
    const premiumCredits = qualityTier === 'premium' ? 100 : 0; // Premium quality enhancement
    return baseCredits + premiumCredits;
  }
  
  return (
    <div className="h-full overflow-auto bg-[#0A0A0A]">
      <div className="p-3 md:p-4 space-y-3">
        {/* Sticky Editor Context Banner (when scene auto-selected) */}
        {showEditorContextBanner && editorContextSceneName && (
          <div className="sticky top-0 z-10 -mx-3 md:-mx-4 px-3 md:px-4 pt-3 md:pt-4 pb-1.5 bg-[#0A0A0A]">
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
        <div className="space-y-3">
        {/* Step Indicator */}
        {!isGenerating && !workflowStatus && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#DC143C]' : 'text-[#808080]'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-[#DC143C] bg-[#DC143C]/10' : 'border-[#3F3F46] bg-[#141414]'}`}>
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-[#DC143C]" /> : <span className="text-sm font-bold">1</span>}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Select Scene</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#808080]" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#DC143C]' : currentStep === 1 ? 'text-[#808080]' : 'text-[#3F3F46] opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-[#DC143C] bg-[#DC143C]/10' : currentStep === 1 ? 'border-[#3F3F46] bg-[#141414]' : 'border-[#3F3F46] bg-[#141414] opacity-50'}`}>
                {currentStep >= 2 ? <CheckCircle2 className="w-5 h-5 text-[#DC143C]" /> : <span className="text-sm font-bold">2</span>}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Configure</span>
            </div>
          </div>
        )}

        {/* Scene Builder Form - Wizard Flow */}
        {!isGenerating && !workflowStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Step 1: Scene Selection */}
            {currentStep === 1 && (
              <Card className="bg-[#141414] border-[#3F3F46]">
                <CardHeader className="pb-1.5">
                  <CardTitle className="text-sm text-[#FFFFFF]">📝 Step 1: Scene Selection</CardTitle>
                  <CardDescription className="text-[10px] text-[#808080]">
                    Choose a scene from your screenplay or enter one manually
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                {/* Input Method Toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-[#808080]">Input Method:</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="inputMethod"
                        value="database"
                        checked={inputMethod === 'database'}
                        onChange={() => setInputMethod('database')}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">From Database</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="inputMethod"
                        value="manual"
                        checked={inputMethod === 'manual'}
                        onChange={() => setInputMethod('manual')}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">Manual Entry</span>
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

4. FOUNTAIN FORMAT (CRITICAL):
   - Character names in ALL CAPS
   - Character extensions are valid: CHARACTER (O.S.), CHARACTER (V.O.), CHARACTER (CONT'D)
   - Parentheticals in parentheses: (examining the USB drive)
   - Dialogue in plain text below character name
   - Action lines in normal case
   - Scene headings in ALL CAPS: INT. LOCATION - TIME
   - Transitions: CUT TO:, FADE OUT. are valid but use sparingly (modern screenwriting typically omits them)
   - Emphasis: Fountain uses *italics*, **bold**, _underline_ for emphasis (use sparingly)
   - NO markdown formatting (no # headers, no ---, no markdown syntax)
   - Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
   - Double dashes (--) are valid in Fountain but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
   - Proper spacing between elements

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
                <CardContent className="pt-0 pb-3">
                  <Button
                    onClick={() => {
                      if (!sceneDescription.trim()) {
                        toast.error('Please select or enter a scene first');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    disabled={!sceneDescription.trim()}
                    className="w-full bg-[#DC143C] hover:bg-[#B91238] text-white h-11 text-sm px-4 py-2.5"
                  >
                    Continue to Step 2
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Unified Scene Configuration */}
            {currentStep === 2 && (
              <>
                {selectedSceneId && !sceneAnalysisResult && !isAnalyzing && !analysisError && (
                  <Card className="bg-[#141414] border-[#3F3F46]">
                    <CardContent className="p-3">
                      <div className="text-xs text-[#808080]">No analysis available. Please select a scene.</div>
                    </CardContent>
                  </Card>
                )}

                {selectedSceneId && sceneAnalysisResult && (
                  <UnifiedSceneConfiguration
                    sceneAnalysisResult={sceneAnalysisResult}
                    qualityTier={qualityTier}
                    onQualityTierChange={setQualityTier}
                    selectedCharacterReferences={selectedCharacterReferences}
                    onCharacterReferenceChange={(characterId, reference) => {
                      setSelectedCharacterReferences(prev => ({
                        ...prev,
                        [characterId]: reference
                      }));
                    }}
                    characterHeadshots={characterHeadshots}
                    loadingHeadshots={loadingHeadshots}
                    characterOutfits={characterOutfits}
                    onCharacterOutfitChange={(characterId, outfitName) => {
                      setCharacterOutfits(prev => ({
                        ...prev,
                        [characterId]: outfitName || undefined
                      }));
                    }}
                    enabledShots={enabledShots}
                    onEnabledShotsChange={setEnabledShots}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    screenplayId={projectId}
                    getToken={getToken}
                  />
                )}

                {/* Back Button */}
                <Card className="bg-[#141414] border-[#3F3F46]">
                  <CardContent className="pt-3 pb-3">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="w-full h-11 text-sm px-4 py-2.5 bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10"
                    >
                      ← Back
                    </Button>
                  </CardContent>
                </Card>
              </>
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

