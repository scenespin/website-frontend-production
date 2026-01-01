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

import React, { useState, useEffect, useCallback, startTransition } from 'react';
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
  ArrowLeft,
  Film,
  Save,
  Loader2,
  ChevronRight,
  Check,
  MapPin,
  Users,
  Edit,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
// Removed SceneBuilderProgress - using Jobs panel instead
import { JobsDrawer } from './JobsDrawer';
import { SceneBuilderDecisionModal } from '@/components/video/SceneBuilderDecisionModal';
import { PartialDeliveryModal } from '@/components/video/PartialDeliveryModal';
import { ShotConfigurationStep } from './ShotConfigurationStep';
import { DialogueWorkflowType } from './UnifiedDialogueDropdown';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { MediaUploadSlot } from '@/components/production/MediaUploadSlot';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { extractS3Key } from '@/utils/s3';
import { getScreenplay } from '@/utils/screenplayStorage';
import { useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { VisualAnnotationPanel } from './VisualAnnotationPanel';
import { ScreenplayStatusBanner } from './ScreenplayStatusBanner';
import { SceneSelector } from './SceneSelector';
import { useContextStore } from '@/lib/contextStore';
import { OutfitSelector } from './OutfitSelector';
import { CharacterOutfitSelector } from './CharacterOutfitSelector';
import { DialogueConfirmationPanel } from './DialogueConfirmationPanel';
import { SceneAnalysisStep } from './SceneAnalysisStep';
import { SceneReviewStep } from './SceneReviewStep';
import { isValidCharacterId, filterValidCharacterIds } from './utils/characterIdValidation';
import { categorizeCharacters } from './utils/characterCategorization';
import {
  getFullShotText,
  actionShotHasExplicitCharacter,
  actionShotHasPronouns,
  getCharactersFromActionShot,
  getCharacterForShot,
  needsLocationAngle,
  isLocationAngleRequired,
  getCharacterWithExtractedOutfits,
  detectDialogue,
  findCharacterById,
  getCharacterName,
  getCharacterSource
} from './utils/sceneBuilderUtils';
import { api } from '@/lib/api';
import { SceneAnalysisResult } from '@/types/screenplay';
import { SceneBuilderService } from '@/services/SceneBuilderService';

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
  
  // Get context store (only for setting context when navigating TO editor, not for reading FROM editor)
  const contextStore = useContextStore();
  
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
  
  // Per-shot, per-character outfit selection state (NEW: Per-shot outfit selection for maximum flexibility)
  // Structure: shotSlot -> characterId -> outfitName
  const [characterOutfits, setCharacterOutfits] = useState<Record<number, Record<string, string>>>({});
  
  // Per-shot dialogue workflow selection (overrides auto-detection) - NEW: Unified dropdown
  const [selectedDialogueQualities, setSelectedDialogueQualities] = useState<Record<number, 'premium' | 'reliable'>>({});
  const [selectedDialogueWorkflows, setSelectedDialogueWorkflows] = useState<Record<number, DialogueWorkflowType>>({});
  const [voiceoverBaseWorkflows, setVoiceoverBaseWorkflows] = useState<Record<number, string>>({});
  
  // Per-shot workflow overrides (for action shots and dialogue shots) - NEW: General workflow override
  const [shotWorkflowOverrides, setShotWorkflowOverrides] = useState<Record<number, string>>({});
  
  // Per-shot dialogue workflow override prompts
  const [dialogueWorkflowPrompts, setDialogueWorkflowPrompts] = useState<Record<number, string>>({});
  
  // Per-shot, per-pronoun extras prompts (for skipped pronouns)
  const [pronounExtrasPrompts, setPronounExtrasPrompts] = useState<Record<number, Record<string, string>>>({});
  
  // Feature 0163 Phase 1: Character headshot selection state (per-shot for dialogue shots)
  const [selectedCharacterReferences, setSelectedCharacterReferences] = useState<Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>>({});
  
  // Pronoun Detection: Multi-character selection per shot (for pronouns like "they", "she", etc.)
  const [selectedCharactersForShots, setSelectedCharactersForShots] = useState<Record<number, string[]>>({});
  
  // Pronoun-to-character mapping: shot slot -> pronoun -> characterId
  // e.g., { 18: { "she": "char-123", "he": "char-456" } }
  const [pronounMappingsForShots, setPronounMappingsForShots] = useState<Record<number, Record<string, string | string[]>>>({});
  
  // Auto-resolution confirmations: track which suggestions have been shown/confirmed
  const [autoResolvedPronouns, setAutoResolvedPronouns] = useState<Record<number, Set<string>>>({});
  
  // REMOVED: autoResolvePronounsForShot - no longer needed with dropdown mapping UI
  
  // Phase 2: Location angle selection per shot
  const [selectedLocationReferences, setSelectedLocationReferences] = useState<Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>>({});
  const [characterHeadshots, setCharacterHeadshots] = useState<Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>>({});
  const [loadingHeadshots, setLoadingHeadshots] = useState<Record<string, boolean>>({});
  
  // Track which shots are enabled (for wizard flow)
  const [enabledShots, setEnabledShots] = useState<number[]>([]);
  
  // UI State: Collapsible sections
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Wizard flow state
  const [wizardStep, setWizardStep] = useState<'analysis' | 'shot-config' | 'review'>('analysis');
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  
  // Step navigation (for wizard flow)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  // Resolution is global only, set in review step (not per-shot)
  const [globalResolution, setGlobalResolution] = useState<'1080p' | '4k'>('4k');
  
  // Location opt-out state (for shots where user doesn't want to use location image)
  const [locationOptOuts, setLocationOptOuts] = useState<Record<number, boolean>>({});
  const [locationDescriptions, setLocationDescriptions] = useState<Record<number, string>>({});
  
  // Camera Angle state (per-shot, defaults to 'auto')
  const [shotCameraAngles, setShotCameraAngles] = useState<Record<number, 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto'>>({});
  // Shot Duration state (per-shot, defaults to 'quick-cut' = ~5s)
  const [shotDurations, setShotDurations] = useState<Record<number, 'quick-cut' | 'extended-take'>>({});
  // Reference Shot (First Frame) Model Selection (per-shot, defaults to 'nano-banana-pro')
  const [selectedReferenceShotModels, setSelectedReferenceShotModels] = useState<Record<number, 'nano-banana-pro' | 'flux2-max-4k-16:9'>>({});
  // Video Generation Type Selection (per-shot, defaults to 'cinematic-visuals')
  const [selectedVideoTypes, setSelectedVideoTypes] = useState<Record<number, 'cinematic-visuals' | 'natural-motion'>>({});
  // Video Quality Selection (per-shot, defaults to '4k')
  const [selectedVideoQualities, setSelectedVideoQualities] = useState<Record<number, 'hd' | '4k'>>({});
  
  // 🔥 NEW: Collect all headshot thumbnail S3 keys
  const headshotThumbnailS3Keys = React.useMemo(() => {
    const keys: string[] = [];
    Object.values(characterHeadshots).forEach(headshots => {
      headshots.forEach(headshot => {
        if (headshot.s3Key) {
          const thumbnailKey = headshot.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg');
          keys.push(`thumbnails/${thumbnailKey}`);
        }
      });
    });
    return keys;
  }, [characterHeadshots]);

  // 🔥 NEW: Fetch thumbnail URLs for all headshots
  const { data: thumbnailUrlsMap } = useBulkPresignedUrls(headshotThumbnailS3Keys, headshotThumbnailS3Keys.length > 0);

  // Helper function to scroll to top of the scroll container
  const scrollToTop = useCallback(() => {
    const scrollContainer = document.querySelector('.h-full.overflow-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  // Scroll to top when navigating between shots or steps
  useEffect(() => {
    scrollToTop();
  }, [currentShotIndex, wizardStep, currentStep, scrollToTop]);

  // Props state
  const [sceneProps, setSceneProps] = useState<Array<{ 
    id: string; 
    name: string; 
    imageUrl?: string; 
    s3Key?: string;
    angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
    images?: Array<{ url: string; s3Key?: string }>;
  }>>([]);
  const [propsToShots, setPropsToShots] = useState<Record<string, number[]>>({}); // propId -> shot slots
  const [shotProps, setShotProps] = useState<Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>>({}); // Per-shot prop configs
  const [fullSceneContent, setFullSceneContent] = useState<Record<string, string>>({}); // sceneId -> full content
  const [isLoadingSceneContent, setIsLoadingSceneContent] = useState<Record<string, boolean>>({}); // sceneId -> loading state
  
  // Phase 2: Scene selection state
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  
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

  // Removed: Auto-select scene from editor context
  // Users can now freely select any scene in Production Hub without being forced into editor context

  // Fetch props when scene is selected
  // NOTE: Props are stored in scene.fountain.tags.props (manually linked via UI)
  // The relationships.scenes[sceneId].props is NOT populated/synced, so we only use fountain.tags.props
  useEffect(() => {
    async function fetchSceneProps() {
      if (!selectedSceneId || !projectId) return;
      
      try {
        const scene = screenplay.scenes?.find(s => s.id === selectedSceneId);
        if (!scene) {
          setSceneProps([]);
      return;
    }
        
        // Get prop IDs from fountain tags (source of truth - manually linked via SceneDetailSidebar)
        const propIds = scene.fountain?.tags?.props || [];
        
        if (propIds.length > 0) {
          console.log('[SceneBuilderPanel] Fetching props for scene:', selectedSceneId, 'Prop IDs:', propIds);
          const props = await SceneBuilderService.fetchSceneProps(propIds, getToken);
          console.log('[SceneBuilderPanel] Fetched props:', props);
          setSceneProps(props);
      } else {
          console.log('[SceneBuilderPanel] No props found for scene:', selectedSceneId);
          setSceneProps([]);
        }
      } catch (error) {
        console.error('[SceneBuilderPanel] Failed to fetch scene props:', error);
        setSceneProps([]);
      }
    }
    
    fetchSceneProps();
  }, [selectedSceneId, projectId, screenplay.scenes, getToken]);

  // Fetch full scene content when scene is selected
  useEffect(() => {
    const fetchSceneContent = async () => {
      if (!selectedSceneId || !projectId) return;
      
      const scene = screenplay.scenes?.find(s => s.id === selectedSceneId);
      if (!scene || !scene.fountain?.startLine || !scene.fountain?.endLine) {
        // Fallback to heading + synopsis
        let fallback = '';
        if (scene?.heading) fallback = scene.heading;
        if (scene?.synopsis) {
          fallback = fallback ? fallback + '\n\n' + scene.synopsis : scene.synopsis;
        }
        if (fallback) {
          setFullSceneContent(prev => ({ ...prev, [selectedSceneId]: fallback }));
        }
        return;
      }
      
      // Check if already loaded
      if (fullSceneContent[selectedSceneId]) return;
      
      setIsLoadingSceneContent(prev => ({ ...prev, [selectedSceneId]: true }));
      try {
        const screenplayData = await getScreenplay(projectId, getToken);
        if (screenplayData?.content) {
          const fountainLines = screenplayData.content.split('\n');
          const rawContent = fountainLines.slice(scene.fountain.startLine, scene.fountain.endLine);
          // Filter out sections (#) and synopses (=) per Fountain spec
          const filteredContent = rawContent.filter(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith('#') && !trimmed.startsWith('=');
          });
          setFullSceneContent(prev => ({ ...prev, [selectedSceneId]: filteredContent.join('\n') }));
        } else {
          // Fallback
          let fallback = '';
          if (scene.heading) fallback = scene.heading;
          if (scene.synopsis) {
            fallback = fallback ? fallback + '\n\n' + scene.synopsis : scene.synopsis;
          }
          setFullSceneContent(prev => ({ ...prev, [selectedSceneId]: fallback }));
        }
      } catch (error) {
        console.error('[SceneBuilderPanel] Failed to fetch screenplay content:', error);
        // Fallback
        let fallback = '';
        if (scene.heading) fallback = scene.heading;
        if (scene.synopsis) {
          fallback = fallback ? fallback + '\n\n' + scene.synopsis : scene.synopsis;
        }
        setFullSceneContent(prev => ({ ...prev, [selectedSceneId]: fallback }));
      } finally {
        setIsLoadingSceneContent(prev => ({ ...prev, [selectedSceneId]: false }));
      }
    };
    
    fetchSceneContent();
  }, [selectedSceneId, projectId, screenplay.scenes, getToken, fullSceneContent]);

  // Phase 2.2: Auto-analyze scene when selectedSceneId changes (Feature 0136)
  // BUT: Only auto-analyze if user has explicitly confirmed (not on initial selection)
  const [hasConfirmedSceneSelection, setHasConfirmedSceneSelection] = useState(false);

    // Auto-analyze the selected scene
  const analyzeScene = useCallback(async () => {
    if (!selectedSceneId || !projectId) {
      return;
    }
    
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      try {
      const result = await SceneBuilderService.analyzeScene(projectId, selectedSceneId);
      
      if (result) {
          const characterDetails = result.characters?.map(c => ({
            id: c.id,
            name: c.name,
            hasReferences: c.hasReferences,
            referencesCount: c.references?.length || 0,
            availableOutfits: c.availableOutfits,
            availableOutfitsCount: c.availableOutfits?.length || 0,
            defaultOutfit: c.defaultOutfit
          })) || [];
          
          console.log('[SceneBuilderPanel] ✅ Analysis result received:', {
            sceneType: result.sceneType,
            characterCount: result.characters?.length || 0,
            characters: characterDetails,
            characterNames: characterDetails.map(c => c.name).join(', '),
            location: result.location?.name,
            shotBreakdown: result.shotBreakdown?.totalShots
          });
          
          // Log outfit information for each character (explicit logging)
          characterDetails.forEach((char: any) => {
            const rawChar = result.characters?.find((c: any) => c.id === char.id);
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
          
          setSceneAnalysisResult(result);
          
          // Task 5: Pre-populate character reference URLs from analysis
          const allCharacterRefs: string[] = [];
          result.characters.forEach(char => {
            if (char.hasReferences && char.references.length > 0) {
              allCharacterRefs.push(...char.references);
            }
          });
          
          // Limit to 3 references (max supported)
          setCharacterReferenceUrls(allCharacterRefs.slice(0, 3));
          
          // Auto-suggest quality tier based on analysis
          const shotBreakdown = result.shotBreakdown;
          const totalShots = shotBreakdown?.totalShots || 0;
          const totalCredits = shotBreakdown?.totalCredits || 0;
          // Check for VFX in shot breakdown (shots with type 'vfx')
          const hasVFX = shotBreakdown?.shots?.some(shot => shot.type === 'vfx') || false;
          const characterCount = result.characters?.length || 0;
          
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
  }, [selectedSceneId, projectId]);
  
  useEffect(() => {
    if (!selectedSceneId || !projectId) {
      // Clear analysis if no scene selected
      setSceneAnalysisResult(null);
      setAnalysisError(null);
      setCharacterReferenceUrls([]);
      setHasConfirmedSceneSelection(false);
      return;
    }

    // Only auto-analyze if user has confirmed scene selection
    if (!hasConfirmedSceneSelection) {
      return;
    }

    // Trigger analysis
    analyzeScene();
  }, [selectedSceneId, projectId, hasConfirmedSceneSelection, analyzeScene]);
  
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
  
  // Jobs panel integration - replace legacy progress bar
  const [isJobsDrawerOpen, setIsJobsDrawerOpen] = useState(false);
  
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
  
  // Load characters for dialogue selection AND pronoun detection character selector
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadCharacters() {
      if (!projectId) return;
      
      try {
        const characters = await SceneBuilderService.fetchCharacters(projectId, getToken);
          // 🔥 FIX: Defer state update to prevent React error #300
          setTimeout(() => {
            startTransition(() => {
              setCharacters(characters);
              setAllCharacters(characters); // Store for pronoun detection selector
            });
          }, 0);
      } catch (error) {
        console.error('[SceneBuilder] Failed to load characters:', error);
      }
    }
    
    loadCharacters();
  }, [projectId, getToken]);
  
  // Feature 0163 Phase 1: Fetch character headshots for dialogue shots and action shots with characters
  useEffect(() => {
    async function fetchHeadshotsForDialogueShots() {
      if (!projectId || !sceneAnalysisResult?.shotBreakdown?.shots || !sceneAnalysisResult?.characters) return;
      
      // Helper to detect if action shot mentions characters (returns all mentioned characters)
      const actionShotHasCharacters = (shot: any): { hasCharacters: boolean; characterIds: string[] } => {
        if (shot.type !== 'action') {
          return { hasCharacters: false, characterIds: [] };
        }
        
        // Get full text (narrationBlock.text if available, otherwise description)
        const fullText = shot.narrationBlock?.text || shot.description || '';
        if (!fullText) {
          return { hasCharacters: false, characterIds: [] };
        }
        
        const textLower = fullText.toLowerCase();
        const originalText = fullText;
        const mentionedCharacterIds: string[] = [];
        const foundCharIds = new Set<string>();
        
        // Check for regular case character names first (use word boundaries for precision)
        for (const char of sceneAnalysisResult.characters) {
          if (!char.name || foundCharIds.has(char.id)) continue;
          const charName = char.name.toLowerCase();
          // Use word boundary regex for more precise matching
          const charNameRegex = new RegExp(`\\b${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          const possessiveRegex = new RegExp(`\\b${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'s\\b`, 'i');
          
          if (charNameRegex.test(fullText) || possessiveRegex.test(fullText)) {
            mentionedCharacterIds.push(char.id);
            foundCharIds.add(char.id);
          }
        }
        
        // Check for ALL CAPS character names (if not already found)
        for (const char of sceneAnalysisResult.characters) {
          if (!char.name || foundCharIds.has(char.id)) continue;
          if (originalText.includes(char.name.toUpperCase())) {
            mentionedCharacterIds.push(char.id);
            foundCharIds.add(char.id);
          }
        }
        
        return {
          hasCharacters: mentionedCharacterIds.length > 0,
          characterIds: mentionedCharacterIds
        };
      };
      
      // Get dialogue shots with characterId
      const dialogueShots = sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => shot.type === 'dialogue' && shot.characterId);
      
      // Get action shots that mention characters (can have multiple characters)
      const actionShotsWithCharacters = sceneAnalysisResult.shotBreakdown.shots
        .filter((shot: any) => {
          const result = actionShotHasCharacters(shot);
          if (result.hasCharacters && result.characterIds.length > 0) {
            // Store all mentioned character IDs for later use
            shot.mentionedCharacterIds = result.characterIds;
            // For backward compatibility, also set characterId to first character
            shot.characterId = result.characterIds[0];
            return true;
          }
          return false;
        });
      
      // Combine all shots that need character headshots
      const allShotsNeedingHeadshots = [...dialogueShots, ...actionShotsWithCharacters];
      
      // Also include characters selected via pronoun detection
      const pronounSelectedCharacterIds = Object.values(selectedCharactersForShots).flat();
      
      // Extract unique character IDs (filter out invalid IDs like '__ignore__')
      const characterIds = filterValidCharacterIds([
        ...allShotsNeedingHeadshots.map((shot: any) => shot.characterId),
        ...pronounSelectedCharacterIds
      ]);
      const uniqueCharacterIds = [...new Set(characterIds)];
      
      if (uniqueCharacterIds.length === 0) return;
      
      for (const characterId of uniqueCharacterIds) {
        // Skip if already loaded or loading
        if (!isValidCharacterId(characterId) || characterHeadshots[characterId] || loadingHeadshots[characterId]) continue;
        
        setLoadingHeadshots(prev => ({ ...prev, [characterId]: true }));
        
        try {
          const headshots = await SceneBuilderService.fetchCharacterHeadshots(characterId, projectId, getToken);
            
            if (headshots.length > 0) {
              setCharacterHeadshots(prev => ({ ...prev, [characterId]: headshots }));
              
              // Auto-select highest priority headshot (lowest priority number)
              const bestHeadshot = headshots.reduce((best: any, current: any) => 
                (current.priority || 999) < (best.priority || 999) ? current : best
              );
              
              // Store per-shot, per-character so each character in each shot can have its own selection
              // Find all shots (dialogue or action) for this character and auto-select the same headshot
              const shotsForCharacter = sceneAnalysisResult?.shotBreakdown?.shots?.filter((s: any) => 
                s.characterId === characterId && (s.type === 'dialogue' || s.type === 'action')
              ) || [];
              
              // Update references for each shot, preserving existing character references
              setSelectedCharacterReferences(prev => {
                const updated = { ...prev };
                shotsForCharacter.forEach((shot: any) => {
                  const shotRefs = updated[shot.slot] || {};
                  updated[shot.slot] = {
                    ...shotRefs,
                    [characterId]: {
                      poseId: bestHeadshot.poseId,
                      s3Key: bestHeadshot.s3Key,
                      imageUrl: bestHeadshot.imageUrl
                    }
                  };
                });
                return updated;
              });
            } else {
              console.warn(`[SceneBuilderPanel] No headshots found for character ${characterId} after filtering`);
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
  }, [projectId, sceneAnalysisResult?.shotBreakdown?.shots, selectedCharactersForShots]);
  
  // Fetch headshots for characters selected via pronoun detection
  useEffect(() => {
    async function fetchHeadshotsForPronounSelectedCharacters() {
      if (!projectId || !selectedCharactersForShots) return;
      
      // Get all unique character IDs from pronoun-selected characters
      const pronounSelectedCharacterIds = [...new Set(Object.values(selectedCharactersForShots).flat())].filter(id => id !== '__ignore__');
      
      for (const characterId of pronounSelectedCharacterIds) {
        // Skip '__ignore__', invalid IDs, or if already loaded or loading
        if (characterId === '__ignore__' || !characterId || characterHeadshots[characterId] || loadingHeadshots[characterId]) continue;
        
        setLoadingHeadshots(prev => ({ ...prev, [characterId]: true }));
        
        try {
          const headshots = await SceneBuilderService.fetchCharacterHeadshots(characterId, projectId, getToken);
            
            if (headshots.length > 0) {
              setCharacterHeadshots(prev => ({ ...prev, [characterId]: headshots }));
              
              // Auto-select highest priority headshot for the first shot that uses this character
              const bestHeadshot = headshots.reduce((best: any, current: any) => 
                (current.priority || 999) < (best.priority || 999) ? current : best
              );
              
              // Find the first shot slot that selected this character
              const shotSlot = Object.entries(selectedCharactersForShots).find(([_, ids]) => ids.includes(characterId))?.[0];
              if (shotSlot && characterId && !selectedCharacterReferences[Number(shotSlot)]?.[characterId]) {
                setSelectedCharacterReferences(prev => {
                  const shotRefs = prev[Number(shotSlot)] || {};
                  return {
                    ...prev,
                    [Number(shotSlot)]: {
                      ...shotRefs,
                      [characterId]: {
                        poseId: bestHeadshot.poseId,
                        s3Key: bestHeadshot.s3Key,
                        imageUrl: bestHeadshot.imageUrl
                      }
                    }
                  };
                });
            }
          }
        } catch (error) {
          console.error(`[SceneBuilderPanel] Failed to fetch headshots for pronoun-selected character ${characterId}:`, error);
        } finally {
          setLoadingHeadshots(prev => ({ ...prev, [characterId]: false }));
        }
      }
    }
    
    fetchHeadshotsForPronounSelectedCharacters();
  }, [projectId, selectedCharactersForShots, characterHeadshots, loadingHeadshots, selectedCharacterReferences, getToken]);
  
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
  
  // Initialize character outfits per-shot when analysis result is received
  useEffect(() => {
    if (sceneAnalysisResult?.shotBreakdown?.shots && sceneAnalysisResult?.characters) {
      setCharacterOutfits(prev => {
        const updated: Record<number, Record<string, string>> = { ...prev };
        let hasChanges = false;
        
        sceneAnalysisResult.shotBreakdown.shots.forEach((shot: any) => {
          const shotSlot = shot.slot;
          if (!updated[shotSlot]) {
            updated[shotSlot] = {};
          }
          
          // Initialize outfits for characters in this shot
          sceneAnalysisResult.characters.forEach(char => {
            // Only set if character doesn't have an outfit selected for this shot yet
            if (!updated[shotSlot][char.id]) {
              if (char.defaultOutfit) {
                // Use default outfit if set
                updated[shotSlot][char.id] = char.defaultOutfit;
                hasChanges = true;
              } else if (char.availableOutfits && char.availableOutfits.length > 0) {
                // Auto-select first outfit if no default is set
                updated[shotSlot][char.id] = char.availableOutfits[0];
                hasChanges = true;
              }
            }
          });
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
        // Check localStorage for saved workflowExecutionId
        const savedExecutionId = localStorage.getItem(`scene-builder-execution-${projectId}`);
        if (savedExecutionId) {
          console.log('[SceneBuilderPanel] Found saved workflow execution ID:', savedExecutionId);
          
          // 🔥 FIX: Use pollWorkflowStatus with screenplayId instead of recoverWorkflowExecution
          // This uses the executions endpoint which works across containers
          try {
            const execution = await SceneBuilderService.pollWorkflowStatus(savedExecutionId, getToken, projectId);
            
            // Only recover if still running (same logic as recoverWorkflowExecution)
            if (execution && ['running', 'queued', 'awaiting_user_decision'].includes(execution.status)) {
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
                setCurrentStep(2); // Stay on Step 2 (wizard flow)
              // Toast removed - progress indicator shows this status
              } else {
                // Execution completed or failed, remove from localStorage
                localStorage.removeItem(`scene-builder-execution-${projectId}`);
              }
          } catch (error: any) {
            // Execution not found or error, remove from localStorage
            console.warn('[SceneBuilderPanel] Execution not found or error:', error.message);
            localStorage.removeItem(`scene-builder-execution-${projectId}`);
          }
        }
      } catch (error) {
        console.error('[SceneBuilderPanel] Failed to recover workflow execution:', error);
            // Execution not found, remove from localStorage
            localStorage.removeItem(`scene-builder-execution-${projectId}`);
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
        // 🔥 FIX: Pass screenplayId (projectId) to use executions endpoint (works across containers)
        const execution = await SceneBuilderService.pollWorkflowStatus(workflowExecutionId, getToken, projectId);
        
        setWorkflowStatus({
          id: execution.executionId,
          status: execution.status,
          currentStep: execution.currentStep || 1,
          totalSteps: execution.totalSteps || 5,
          stepResults: execution.stepResults || [],
          totalCreditsUsed: execution.totalCreditsUsed || 0,
          finalOutputs: execution.finalOutputs || []
        });
        
        // Check if awaiting user decision
        if (execution.status === 'awaiting_user_decision') {
          setShowDecisionModal(true);
          setIsGenerating(false);
        }
        
        // Convert WorkflowExecution to WorkflowStatus format
        const workflowStatus: WorkflowStatus = {
          id: execution.executionId,
          status: execution.status,
          currentStep: execution.currentStep || 1,
          totalSteps: execution.totalSteps || 5,
          stepResults: execution.stepResults || [],
          totalCreditsUsed: execution.totalCreditsUsed || 0,
          finalOutputs: execution.finalOutputs || []
        };
        
        // Check if partial delivery (Premium tier - dialog rejected)
        if (execution.status === 'partial_delivery') {
          await handlePartialDelivery(workflowStatus);
          clearInterval(interval);
        }
        
        // Check if completed
        if (execution.status === 'completed') {
          handleGenerationComplete(workflowStatus);
          clearInterval(interval);
          // 🔥 NEW: Remove from localStorage when completed
          localStorage.removeItem(`scene-builder-execution-${projectId}`);
        }
        
        // Check if failed
        if (execution.status === 'failed') {
          handleGenerationFailed(workflowStatus);
          clearInterval(interval);
          // 🔥 NEW: Remove from localStorage when failed
          localStorage.removeItem(`scene-builder-execution-${projectId}`);
        }
      } catch (error: any) {
        console.error('[SceneBuilderPanel] Failed to poll workflow:', error);
        // Handle specific errors
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          clearInterval(interval);
          setIsGenerating(false);
          toast.error('Workflow execution not found. It may have been deleted or expired.');
        } else if (error.message?.includes('Authentication') || error.message?.includes('401')) {
          clearInterval(interval);
          setIsGenerating(false);
          toast.error('Authentication failed. Please refresh the page and try again.');
        }
        // Don't stop polling on network errors - might be temporary
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [workflowExecutionId, isGenerating]);
  
  // detectDialogue function moved to sceneBuilderUtils.ts
  
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
      // Step 1: Get presigned URL
      const { url, fields, s3Key } = await SceneBuilderService.getPresignedUploadUrl(
        file.name,
        fileType,
        file.size,
        projectId,
        getToken
      );
      
      // Step 2: Upload to S3
      await SceneBuilderService.uploadToS3(url, fields, file, '[SceneBuilderPanel] First frame');
      
      // Step 3: Register media
      await SceneBuilderService.registerMedia(s3Key, file.name, file.type, projectId, getToken);
      
      // Step 4: Get download URL
      const downloadUrl = await SceneBuilderService.getDownloadUrl(s3Key, getToken);
      
      setFirstFrameUrl(downloadUrl);
        setShowAnnotationPanel(true);
        toast.success('Image uploaded! Add annotations or proceed to generation.');
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
    
    // Validate pronoun mappings for action shots with pronouns
    if (sceneAnalysisResult?.shotBreakdown) {
      const shots = sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => enabledShots.includes(shot.slot));
      const validationErrors: string[] = [];
      
      for (const shot of shots) {
        if (shot.type !== 'action') continue;
        
        // Detect pronouns
        const fullText = shot.narrationBlock?.text || shot.description || '';
        if (!fullText) continue;
        
        const textLower = fullText.toLowerCase();
        const detectedPronouns: string[] = [];
        const pronounPatterns = {
          singular: /\b(she|her|hers|he|him|his)\b/g,
          plural: /\b(they|them|their|theirs)\b/g
        };
        
        let match;
        while ((match = pronounPatterns.singular.exec(textLower)) !== null) {
          if (!detectedPronouns.includes(match[0])) {
            detectedPronouns.push(match[0]);
          }
        }
        pronounPatterns.singular.lastIndex = 0;
        
        while ((match = pronounPatterns.plural.exec(textLower)) !== null) {
          if (!detectedPronouns.includes(match[0])) {
            detectedPronouns.push(match[0]);
          }
        }
        
        if (detectedPronouns.length === 0) continue;
        
        // Require all pronouns to be mapped OR explicitly skipped
        // Users must select a character OR "Skip mapping" for each pronoun
        const shotMappings = pronounMappingsForShots[shot.slot] || {};
        const shotPrompts = pronounExtrasPrompts[shot.slot] || {};
        const unmappedPronouns = detectedPronouns.filter(p => {
          const mapping = shotMappings[p.toLowerCase()];
          // Allow "__ignore__" (skip mapping) as a valid mapping, but require prompt text
          if (mapping === '__ignore__') {
            const prompt = shotPrompts[p.toLowerCase()] || '';
            // If skipped, prompt is required
            return !prompt.trim();
          }
          // Empty mapping or empty array means not mapped - require action
          return !mapping || (Array.isArray(mapping) && mapping.length === 0);
        });
        
        // Require all pronouns to be addressed (mapped to character or skipped with prompt)
        if (unmappedPronouns.length > 0) {
          validationErrors.push(
            `Shot ${shot.slot}: ${unmappedPronouns.length === 1 
              ? `Pronoun "${unmappedPronouns[0]}" must be mapped to a character, or if skipped, a description is required`
              : `Pronouns "${unmappedPronouns.join('", "')}" must be mapped to characters, or if skipped, descriptions are required`
            }`
          );
        }
      }
      
      if (validationErrors.length > 0) {
        toast.error('Please map all pronouns', {
          description: validationErrors.join('. ') + '. Select a character or choose "Skip mapping" for each pronoun.',
          duration: 8000
        });
        return;
      }
      
      // Validate location images (required unless opted out)
      for (const shot of shots) {
        if (needsLocationAngle(shot, sceneAnalysisResult) && isLocationAngleRequired(shot, sceneAnalysisResult)) {
          const hasLocation = selectedLocationReferences[shot.slot] !== undefined;
          const hasOptOut = locationOptOuts[shot.slot] === true;
          
          if (!hasLocation && !hasOptOut) {
            validationErrors.push(
              `Shot ${shot.slot}: Please select a location image or check "Don't use location image"`
            );
          }
          
          // If opted out, location description is required
          if (hasOptOut) {
            const locationDesc = locationDescriptions[shot.slot] || '';
            if (!locationDesc.trim()) {
              validationErrors.push(
                `Shot ${shot.slot}: Location description is required when "Don't use location image" is checked`
              );
            }
          }
        }
      }
      
      // Validate character headshots (required - no checkbox override)
      for (const shot of shots) {
        // Collect all character IDs for this shot
        const shotCharacterIds = new Set<string>();
        
        // Add explicit characters from action/dialogue
        if (shot.type === 'dialogue' && shot.dialogueBlock?.character) {
          const dialogueChar = getCharacterSource(allCharacters, sceneAnalysisResult)
        .find((c: any) => c.name?.toUpperCase().trim() === shot.dialogueBlock.character?.toUpperCase().trim());
      if (dialogueChar) shotCharacterIds.add(dialogueChar.id);
        }
        
        // Add characters from pronoun mappings
        const shotMappings = pronounMappingsForShots[shot.slot] || {};
        for (const [pronoun, mapping] of Object.entries(shotMappings)) {
          if (mapping && mapping !== '__ignore__') {
            if (Array.isArray(mapping)) {
              mapping.forEach(charId => shotCharacterIds.add(charId));
            } else {
              shotCharacterIds.add(mapping);
            }
          }
        }
        
        // Add additional characters for dialogue workflows
        const additionalChars = selectedCharactersForShots[shot.slot] || [];
        additionalChars.forEach(charId => shotCharacterIds.add(charId));
        
        // Check each character has headshots
        for (const charId of shotCharacterIds) {
          const headshots = characterHeadshots[charId] || [];
          const hasSelectedReference = selectedCharacterReferences[shot.slot]?.[charId] !== undefined;
          
          // Character must have headshots available OR a selected reference
          if (headshots.length === 0 && !hasSelectedReference) {
            const charName = getCharacterName(charId, allCharacters, sceneAnalysisResult);
            validationErrors.push(
              `Shot ${shot.slot}: ${charName} requires a character image. Please add headshots in the Character Bank or Creation Hub.`
            );
          }
        }
      }
      
      if (validationErrors.length > 0) {
        toast.error('Please complete all required fields', {
          description: validationErrors.join('. '),
          duration: 8000
        });
        return;
      }
    }
    
    // PRIORITY 0: If shot breakdown exists, ALWAYS use workflow generation (shot-based generation)
    // This is the new system that supports shot-based generation with media organization
    if (sceneAnalysisResult?.shotBreakdown && sceneAnalysisResult.shotBreakdown.shots.length > 0) {
      console.log('[SceneBuilderPanel] Shot breakdown detected, using workflow generation (shot-based)');
      await handleWorkflowGeneration();
      return;
    }
    
    // PRIORITY 1: Check Scene Analyzer result (most accurate - uses backend analysis)
    // Only use old dialogue endpoint if NO shot breakdown exists
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
      
      // Get sceneId - use selectedSceneId only (no editor context fallback)
      // sceneId is required for single source of truth enforcement
      const sceneId = selectedSceneId;
      
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
      
      // Check if awaiting input (safety fallback)
      if (data.status === 'awaiting_input' && data.requiresAction) {
        toast.warning('⚠️ Additional Input Required', {
          description: 'Your video generation needs a driving video to continue. Check the Jobs panel to upload.',
          duration: 10000,
          action: {
            label: 'View Jobs',
            onClick: () => {
              // Scroll to jobs panel or open it
              const jobsPanel = document.querySelector('[data-jobs-panel]');
              if (jobsPanel) {
                jobsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          }
        });
        
        // Don't throw error - user can continue via jobs panel
        return;
      }
      
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
        // Toast removed - progress indicator shows upload status
        
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
          shots: (enabledShots.length > 0 
            ? sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => enabledShots.includes(shot.slot))
            : sceneAnalysisResult.shotBreakdown.shots
          ).map((shot: any) => ({
            ...shot,
            // Add per-shot character reference if selected (backend Priority 1)
            // For dialogue shots, get the reference for the shot's characterId
            selectedCharacterReference: shot.type === 'dialogue' && shot.characterId && selectedCharacterReferences[shot.slot]?.[shot.characterId]
              ? selectedCharacterReferences[shot.slot][shot.characterId]
              : undefined
          })),
          totalShots: enabledShots.length > 0 ? enabledShots.length : sceneAnalysisResult.shotBreakdown.totalShots,
          totalCredits: enabledShots.length > 0 
            ? sceneAnalysisResult.shotBreakdown.shots
                .filter((shot: any) => enabledShots.includes(shot.slot))
                .reduce((sum: number, shot: any) => sum + shot.credits, 0)
            : sceneAnalysisResult.shotBreakdown.totalCredits
        } : undefined, // NEW: Pass filtered shot breakdown (only enabled shots) with per-shot character references
        selectedCharacterReferences: Object.keys(selectedCharacterReferences).length > 0 ? selectedCharacterReferences : undefined, // Feature 0163 Phase 1: Per-shot selected references (fallback for backend Priority 3)
        selectedLocationReferences: Object.keys(selectedLocationReferences).length > 0 ? selectedLocationReferences : undefined, // Phase 2: Per-shot location angle selection
        locationOptOuts: Object.keys(locationOptOuts).length > 0 ? locationOptOuts : undefined, // Per-shot location opt-out state
        locationDescriptions: Object.keys(locationDescriptions).length > 0 ? locationDescriptions : undefined, // Per-shot location descriptions when opted out
        selectedCharactersForShots: Object.keys(selectedCharactersForShots).length > 0 ? selectedCharactersForShots : undefined, // Pronoun Detection: Multi-character selection per shot
        pronounMappingsForShots: Object.keys(pronounMappingsForShots).length > 0 ? pronounMappingsForShots : undefined, // Pronoun-to-character mappings: { shotSlot: { pronoun: characterId } }
        characterOutfits: Object.keys(characterOutfits).length > 0 ? characterOutfits : undefined, // Per-shot, per-character outfit selection: { shotSlot: { characterId: outfitName } }
        selectedDialogueQualities: Object.keys(selectedDialogueQualities).length > 0 ? selectedDialogueQualities : undefined, // NEW: Per-shot dialogue quality selection (Premium vs Reliable): { shotSlot: 'premium' | 'reliable' }
        selectedDialogueWorkflows: Object.keys(selectedDialogueWorkflows).length > 0 ? selectedDialogueWorkflows : undefined, // Per-shot dialogue workflow selection: { shotSlot: workflowType }
        voiceoverBaseWorkflows: Object.keys(voiceoverBaseWorkflows).length > 0 ? voiceoverBaseWorkflows : undefined, // NEW: Per-shot voiceover base workflows (for Narrate Shot and Hidden Mouth Dialogue): { shotSlot: baseWorkflow }
        shotWorkflowOverrides: Object.keys(shotWorkflowOverrides).length > 0 ? shotWorkflowOverrides : undefined, // NEW: Per-shot workflow overrides (for action shots and dialogue shots): { shotSlot: workflow }
        dialogueWorkflowPrompts: Object.keys(dialogueWorkflowPrompts).length > 0 ? dialogueWorkflowPrompts : undefined, // Per-shot dialogue workflow override prompts: { shotSlot: prompt }
        pronounExtrasPrompts: Object.keys(pronounExtrasPrompts).length > 0 ? pronounExtrasPrompts : undefined, // Per-shot, per-pronoun extras prompts: { shotSlot: { pronoun: prompt } }
        globalResolution: globalResolution !== '1080p' ? globalResolution : undefined, // Only send if not default (set in review step)
        // Note: Resolution is global only (no per-shot resolution) - set in review step before generation
        // Camera Angles (per-shot, defaults to 'auto' if not specified)
        shotCameraAngles: Object.keys(shotCameraAngles).length > 0 ? shotCameraAngles : undefined, // Per-shot camera angle overrides: { shotSlot: angle }
        // Shot Durations (per-shot, defaults to 'quick-cut' = ~5s if not specified)
        shotDurations: Object.keys(shotDurations).length > 0 ? shotDurations : undefined, // Per-shot duration: { shotSlot: 'quick-cut' | 'extended-take' }
        // Props Integration
        propsToShots: Object.keys(propsToShots).length > 0 ? propsToShots : undefined, // Props-to-shots assignment: { propId: [shotSlot1, shotSlot2] }
        shotProps: Object.keys(shotProps).length > 0 ? shotProps : undefined, // Per-shot prop configurations: { shotSlot: { propId: { usageDescription, selectedImageId } } }
        // Note: enableSound removed - sound is handled separately via audio workflows
        // Backend has enableSound = false as default, so we don't need to send it
      };
      
      // Log workflow selection
      if (workflowIdsToUse.length > 1) {
        console.log('[SceneBuilderPanel] Using combined workflows:', workflowIdsToUse);
      } else if (workflowIdsToUse[0] !== 'complete-scene') {
        console.log('[SceneBuilderPanel] Using recommended workflow from Scene Analyzer:', workflowIdsToUse[0]);
      }
      
      // Add scene information for media organization (Feature 0170)
      // Priority: sceneAnalysisResult.sceneId > selectedSceneId (no editor context fallback)
      const sceneId = sceneAnalysisResult?.sceneId || selectedSceneId;
      if (sceneId) {
        workflowRequest.sceneId = sceneId;
      }
      
      // 🔥 FIX: Add screenplayId (projectId) to workflow request for character lookup
      // Backend needs screenplayId to look up characters, not sceneId
      if (projectId) {
        workflowRequest.screenplayId = projectId;
      }
      
      // Add scene number and name if available from selected scene
      if (selectedSceneId && screenplay.scenes) {
        const selectedScene = screenplay.scenes.find(s => s.id === selectedSceneId);
        if (selectedScene) {
          workflowRequest.sceneNumber = selectedScene.number;
          workflowRequest.sceneName = selectedScene.heading || selectedScene.synopsis || undefined;
        }
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
      
      const { executionId } = await SceneBuilderService.executeWorkflow(workflowRequest, getToken);
      
      console.log('[SceneBuilderPanel] ✅ Workflow execution started:', executionId);
      setWorkflowExecutionId(executionId);
        
        // 🔥 NEW: Save workflowExecutionId to localStorage for recovery
      localStorage.setItem(`scene-builder-execution-${projectId}`, executionId);
        
        // Set initial workflow status to show progress immediately
        setWorkflowStatus({
        id: executionId,
          status: 'running',
          currentStep: 1,
          totalSteps: 5,
          stepResults: [],
          totalCreditsUsed: 0,
          finalOutputs: []
        });
        // Move to a "generating" view - hide wizard, show progress
        setCurrentStep(2); // Stay on Step 2 (wizard flow)
        // Toast removed - progress indicator shows generation status
      
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
      await SceneBuilderService.submitWorkflowDecision(workflowExecutionId, 'continue', getToken);
        // Toast removed - user already made the choice, progress indicator shows status
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
      await SceneBuilderService.submitWorkflowDecision(workflowExecutionId, 'skip', getToken);
        toast.info('Generation cancelled (no charges)');
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
      
      // Toast removed - progress indicator shows upload status
      
      // Get presigned URL
      const { url, fields, s3Key } = await SceneBuilderService.getPresignedUploadUrl(
        file.name,
        file.type,
        file.size,
        projectId,
        getToken
      );
      
      // Toast removed - technical detail, not user-facing
      
      // Upload to S3
      await SceneBuilderService.uploadToS3(url, fields, file, '[SceneBuilderPanel] Media');
      
      // Generate S3 URL
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
      <div className="p-3 md:p-4 space-y-3 pb-20">
        {/* Content */}
        <div className="space-y-3">
        {/* Scene Builder Form - Wizard Flow */}
        {!isGenerating && !workflowStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Scene Selection */}
            {currentStep === 1 && !hasConfirmedSceneSelection && (
              <div className={`grid ${isMobile ? 'grid-cols-1 space-y-4' : 'grid-cols-2 gap-4'}`}>
                {/* Left: Scene Navigator with Title/Description (1/2 width) */}
                <div className={isMobile ? 'w-full' : 'col-span-1'}>
              <Card className="bg-[#141414] border-[#3F3F46]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Scene Selection
                      </CardTitle>
                  <CardDescription className="text-[10px] text-[#808080]">
                        Choose a scene from your screenplay
                  </CardDescription>
                </CardHeader>
                    <CardContent>
                  <SceneSelector
                    selectedSceneId={selectedSceneId}
                    onSceneSelect={(sceneId) => {
                          if (sceneId) {
                      setSelectedSceneId(sceneId);
                            setHasConfirmedSceneSelection(false); // Reset confirmation when scene changes
                            setSceneAnalysisResult(null); // Clear previous analysis
                            setAnalysisError(null); // Clear any errors
                      const scene = screenplay.scenes?.find(s => s.id === sceneId);
                      if (scene) {
                        // Load scene content into description
                        const sceneText = scene.synopsis || 
                          `${scene.heading || ''}\n\n${scene.synopsis || ''}`.trim();
                        setSceneDescription(sceneText);
                      }
                      } else {
                            // If empty selection, clear everything
                            setSelectedSceneId(null);
                            setHasConfirmedSceneSelection(false);
                            setSceneAnalysisResult(null);
                            setAnalysisError(null);
                          }
                        }}
                        projectId={projectId}
                    isMobile={isMobile}
                  />
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right: Scene Preview (1/2 width) */}
                {selectedSceneId && (() => {
                  const scene = screenplay.scenes?.find(s => s.id === selectedSceneId);
                  if (!scene) return null;
                  
                  // Get location and characters for display
                  const sceneRel = screenplay.relationships?.scenes?.[scene.id];
                  const location = sceneRel?.location 
                    ? screenplay.locations?.find(l => l.id === sceneRel.location)
                    : (scene.fountain?.tags?.location 
                      ? screenplay.locations?.find(l => l.id === scene.fountain.tags.location)
                      : null);
                  const characters = (scene.fountain?.tags?.characters || [])
                    .map(charId => screenplay.characters?.find(c => c.id === charId))
                    .filter(Boolean);
                  
                  return (
                    <div className={isMobile ? 'w-full' : 'col-span-1'}>
                      <Card className="bg-[#0A0A0A] border-[#3F3F46]">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xs text-[#FFFFFF]">Scene Preview</CardTitle>
                            <div className="flex items-center gap-2">
                              {(scene.order !== undefined && scene.order !== null) || (scene.number !== undefined && scene.number !== null) ? (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                  Scene {scene.order ?? scene.number ?? '?'}
                                </Badge>
                              ) : null}
                              <Button
                                onClick={() => {
                                  // Use context store to set scene, then navigate to editor
                                  contextStore.setCurrentScene(scene.id, scene.heading || scene.synopsis || 'Scene');
                                  window.location.href = `/write?sceneId=${scene.id}`;
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-[#808080] hover:text-[#FFFFFF]"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Start Button - Moved to top of Scene Preview */}
                          <Button
                            onClick={() => {
                              setHasConfirmedSceneSelection(true);
                              setAnalysisError(null); // Clear any previous errors
                              // Toast removed - loading state shows this
                              // Analysis will be triggered by useEffect when hasConfirmedSceneSelection changes
                            }}
                            className="w-full bg-[#DC143C] hover:bg-[#B91238] text-white"
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <span className="mr-2 animate-spin">🤖</span>
                                Analyzing Scene...
                              </>
                            ) : (
                              <>
                                🤖 Start
                              </>
                            )}
                          </Button>
                          
                          {/* Scene Heading */}
                          {scene.heading && (
                            <div>
                              <h3 className="text-xs text-[#FFFFFF] font-medium mb-1">
                                {scene.heading}
                              </h3>
                            </div>
                          )}
                          
                          {/* Location, Characters, and Props */}
                          {(location || characters.length > 0 || (scene.fountain?.tags?.props || []).length > 0) && (
                            <div className="flex flex-wrap items-center gap-2">
                              {location && (
                                <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                                  <MapPin className="w-3 h-3" />
                                  <span>{location.name}</span>
                                </div>
                              )}
                              {characters.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                                  <Users className="w-3 h-3" />
                                  <span>{characters.map(c => c?.name).filter(Boolean).join(', ')}</span>
                                </div>
                              )}
                              {(scene.fountain?.tags?.props || []).length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                                  <Package className="w-3 h-3" />
                                  <span>{(scene.fountain?.tags?.props || []).length} prop{(scene.fountain?.tags?.props || []).length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Scene Content - Full scene from screenplay */}
                          {isLoadingSceneContent[selectedSceneId] ? (
                            <div className="text-xs text-[#808080] italic">Loading scene content...</div>
                          ) : fullSceneContent[selectedSceneId] ? (
                            <div>
                              <div className="text-[10px] text-[#808080] mb-1.5">Scene Content</div>
                              <div className="p-2.5 bg-[#141414] rounded text-[10px] text-[#808080] whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                                {fullSceneContent[selectedSceneId]}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-[#808080] italic">No scene content available</div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Scene Analysis & Shot Selection (after scene is selected and confirmed) */}
            {(currentStep === 1 && hasConfirmedSceneSelection && selectedSceneId) && (
              <>
                {isAnalyzing && !sceneAnalysisResult ? (
                  <Card className="bg-[#141414] border-[#3F3F46]">
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-4xl animate-spin">🤖</span>
                        <div className="text-sm text-[#FFFFFF]">Analyzing scene...</div>
                        <div className="text-xs text-[#808080]">This may take a moment</div>
                      </div>
                    </CardContent>
                  </Card>
                ) : sceneAnalysisResult ? (
                  <div className={`grid ${isMobile ? 'grid-cols-1 space-y-4' : 'grid-cols-2 gap-4'}`}>
                    {/* Left: Scene Analysis Step (1/2 width) */}
                    <div className={isMobile ? 'w-full' : 'col-span-1'}>
                      <SceneAnalysisStep
                        sceneAnalysisResult={sceneAnalysisResult}
                        enabledShots={enabledShots}
                        onEnabledShotsChange={setEnabledShots}
                        onNext={() => {
                          if (wizardStep === 'analysis') {
                            // Move to first shot configuration
                            setWizardStep('shot-config');
                            setCurrentShotIndex(0);
                            setCurrentStep(2);
                          }
                        }}
                        isAnalyzing={isAnalyzing}
                        sceneProps={sceneProps}
                        propsToShots={propsToShots}
                        onPropsToShotsChange={setPropsToShots}
                      />
                    </div>
                    
                    {/* Right: Scene Preview (1/2 width) */}
                    {selectedSceneId && (() => {
                      const scene = screenplay.scenes?.find(s => s.id === selectedSceneId);
                      if (!scene) return null;
                      
                      // Get location and characters for display
                      const sceneRel = screenplay.relationships?.scenes?.[scene.id];
                      const location = sceneRel?.location 
                        ? screenplay.locations?.find(l => l.id === sceneRel.location)
                        : (scene.fountain?.tags?.location 
                          ? screenplay.locations?.find(l => l.id === scene.fountain.tags.location)
                          : null);
                      const characters = (scene.fountain?.tags?.characters || [])
                        .map(charId => screenplay.characters?.find(c => c.id === charId))
                        .filter(Boolean);
                      
                      return (
                        <div className={isMobile ? 'w-full' : 'col-span-1'}>
                          <Card className="bg-[#0A0A0A] border-[#3F3F46]">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-xs text-[#FFFFFF]">Scene Preview</CardTitle>
                                <div className="flex items-center gap-2">
                                  {(scene.order !== undefined && scene.order !== null) || (scene.number !== undefined && scene.number !== null) ? (
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                      Scene {scene.order ?? scene.number ?? '?'}
                                    </Badge>
                                  ) : null}
                                  <Button
                                    onClick={() => {
                                      // Use context store to set scene, then navigate to editor
                                      contextStore.setCurrentScene(scene.id, scene.heading || scene.synopsis || 'Scene');
                                      window.location.href = `/write?sceneId=${scene.id}`;
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-[#808080] hover:text-[#FFFFFF]"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Navigation Buttons - Back to Scene Selection and Direct Shots */}
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    scrollToTop();
                                    // Go back to Scene Selection
                                    setCurrentStep(1);
                                    setHasConfirmedSceneSelection(false);
                                    setWizardStep('analysis');
                                    setSceneAnalysisResult(null);
                                    setAnalysisError(null);
                                  }}
                                  variant="outline"
                                  className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A] h-11 text-sm"
                                >
                                  <ArrowLeft className="w-4 h-4 mr-2" />
                                  Back to Selection
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (wizardStep === 'analysis') {
                                      scrollToTop();
                                      // Move to first shot configuration
                                      setWizardStep('shot-config');
                                      setCurrentShotIndex(0);
                                      setCurrentStep(2); // Step 2 is used for shot configuration when wizardStep === 'shot-config'
                                    }
                                  }}
                                  disabled={enabledShots.length === 0}
                                  className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white h-11 text-sm"
                                >
                                  Direct {enabledShots.length} {enabledShots.length === 1 ? 'Shot' : 'Shots'}
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </div>
                              
                              {/* Scene Heading */}
                              {scene.heading && (
                                <div>
                                  <h3 className="text-xs text-[#FFFFFF] font-medium mb-1">
                                    {scene.heading}
                                  </h3>
                                </div>
                              )}
                              
                              {/* Location, Characters, and Props */}
                              {(location || characters.length > 0 || (scene.fountain?.tags?.props || []).length > 0) && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {location && (
                                    <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                                      <MapPin className="w-3 h-3" />
                                      <span>{location.name}</span>
                                    </div>
                                  )}
                                  {characters.length > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                                      <Users className="w-3 h-3" />
                                      <span>{characters.map(c => c?.name).filter(Boolean).join(', ')}</span>
                                    </div>
                                  )}
                                  {(scene.fountain?.tags?.props || []).length > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                                      <Package className="w-3 h-3" />
                                      <span>{(scene.fountain?.tags?.props || []).length} prop{(scene.fountain?.tags?.props || []).length !== 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Scene Content - Full scene from screenplay */}
                              {isLoadingSceneContent[selectedSceneId] ? (
                                <div className="text-xs text-[#808080] italic">Loading scene content...</div>
                              ) : fullSceneContent[selectedSceneId] ? (
                                <div>
                                  <div className="text-[10px] text-[#808080] mb-1.5">Scene Content</div>
                                  <div className="p-2.5 bg-[#141414] rounded text-[10px] text-[#808080] whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                                    {fullSceneContent[selectedSceneId]}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-[#808080] italic">No scene content available</div>
                )}
                </CardContent>
                          </Card>
                        </div>
                      );
                    })()}
                  </div>
                ) : analysisError ? (
                  <Card className="bg-[#141414] border-[#3F3F46]">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm text-red-400 mb-2">Analysis failed</div>
                      <div className="text-xs text-[#808080] mb-4">{analysisError}</div>
                  <Button
                    onClick={() => {
                          setHasConfirmedSceneSelection(false);
                          setAnalysisError(null);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Go Back
                  </Button>
                </CardContent>
              </Card>
                ) : null}
              </>
            )}

            {/* Step 2-N: Individual Shot Configuration (one shot per step) */}
            {currentStep === 2 && wizardStep === 'shot-config' && selectedSceneId && sceneAnalysisResult && (() => {
              const shots = sceneAnalysisResult.shotBreakdown?.shots || [];
              const enabledShotsList = shots.filter((s: any) => enabledShots.includes(s.slot));
              
              if (enabledShotsList.length === 0) {
                return (
                  <Card className="bg-[#141414] border-[#3F3F46]">
                    <CardContent className="p-3">
                      <div className="text-xs text-[#808080]">No shots selected. Please go back and select shots.</div>
                    </CardContent>
                  </Card>
                );
              }
              
              const currentShot = enabledShotsList[currentShotIndex];
              if (!currentShot) {
                // All shots configured, move to review
                setWizardStep('review');
                return null;
              }
              
              // Helper functions imported from sceneBuilderUtils.ts
              // Wrapper functions to pass sceneAnalysisResult context
              const getFullShotTextWrapper = (shot: any) => getFullShotText(shot);
              const actionShotHasExplicitCharacterWrapper = (shot: any) => actionShotHasExplicitCharacter(shot, sceneAnalysisResult);
              const actionShotHasPronounsWrapper = (shot: any) => actionShotHasPronouns(shot);
              const getCharactersFromActionShotWrapper = (shot: any) => getCharactersFromActionShot(shot, sceneAnalysisResult);
              const getCharacterForShotWrapper = (shot: any) => getCharacterForShot(shot, sceneAnalysisResult);
              const needsLocationAngleWrapper = (shot: any) => needsLocationAngle(shot, sceneAnalysisResult);
              const isLocationAngleRequiredWrapper = (shot: any) => isLocationAngleRequired(shot, sceneAnalysisResult);
              const getCharacterWithExtractedOutfitsWrapper = (charId: string, char: any) => getCharacterWithExtractedOutfits(charId, char, characterHeadshots);
              
              const renderCharacterControlsOnly = (
                charId: string,
                shotSlot: number,
                shotMappings: Record<string, string | string[]>,
                hasPronouns: boolean,
                category: 'explicit' | 'singular' | 'plural'
              ) => {
                const baseChar = findCharacterById(charId, allCharacters, sceneAnalysisResult);
                if (!baseChar) return null;
                const char = getCharacterWithExtractedOutfitsWrapper(charId, baseChar);
                const selectedOutfit = characterOutfits[shotSlot]?.[charId];
                const hasAnyOutfits = (char.availableOutfits?.length || 0) > 0 || !!char.defaultOutfit;
                const pronounsForThisChar = hasPronouns ? Object.entries(shotMappings)
                  .filter(([_, mappedIdOrIds]) => {
                    if (Array.isArray(mappedIdOrIds)) return mappedIdOrIds.includes(charId);
                    return mappedIdOrIds === charId;
                  })
                  .map(([pronoun]) => pronoun) : [];
                return (
                  <div key={charId} className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-xs font-medium text-[#FFFFFF]">{char.name}</div>
                      {pronounsForThisChar.length > 0 && (
                        <div className="text-[10px] text-[#808080]">({pronounsForThisChar.join(', ')})</div>
                      )}
                      {hasAnyOutfits && (
                        <CharacterOutfitSelector
                          characterId={char.id}
                          characterName={char.name}
                          availableOutfits={char.availableOutfits || []}
                          defaultOutfit={char.defaultOutfit}
                          selectedOutfit={selectedOutfit}
                          onOutfitChange={(charId, outfitName) => {
                            setCharacterOutfits(prev => {
                              const updated = { ...prev };
                              if (!updated[shotSlot]) updated[shotSlot] = {};
                              updated[shotSlot] = { ...updated[shotSlot], [charId]: outfitName || undefined };
                              return updated;
                            });
                          }}
                          compact={true}
                          hideLabel={true}
                        />
                      )}
                    </div>
                  </div>
                );
              };
              
              const renderCharacterImagesOnly = (charId: string, shotSlot: number, pronounsForChar?: string[]) => {
                const char = findCharacterById(charId, allCharacters, sceneAnalysisResult);
                if (!char) return null;
                const allHeadshots = characterHeadshots[charId] || [];
                const selectedHeadshot = selectedCharacterReferences[shotSlot]?.[charId];
                const selectedOutfit = characterOutfits[shotSlot]?.[charId];
                const headshots = selectedOutfit && selectedOutfit !== 'default' 
                  ? allHeadshots.filter((h: any) => {
                      const headshotOutfit = h.outfitName || h.metadata?.outfitName;
                      return headshotOutfit === selectedOutfit;
                    })
                  : allHeadshots;
                
                return (
                  <div key={charId} className="space-y-2">
                    {pronounsForChar && pronounsForChar.length > 0 && (
                      <div className="text-[10px] text-[#808080] mb-1">({pronounsForChar.join(', ')})</div>
                    )}
                    {loadingHeadshots[charId] ? (
                      <div className="text-[10px] text-[#808080]">Loading headshots...</div>
                    ) : headshots.length > 0 ? (
                      <div>
                        {selectedOutfit && selectedOutfit !== 'default' && (
                          <div className="text-[10px] text-[#808080] mb-1.5">
                            Outfit: <span className="text-[#DC143C] font-medium">{selectedOutfit}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-6 gap-1.5">
                          {headshots.map((headshot: any, idx: number) => {
                            const uniqueKey = headshot.s3Key || headshot.imageUrl || `${headshot.poseId || 'unknown'}-${idx}`;
                            const isSelected = selectedHeadshot && (
                              (headshot.s3Key && selectedHeadshot.s3Key === headshot.s3Key) ||
                              (headshot.imageUrl && selectedHeadshot.imageUrl === headshot.imageUrl) ||
                              (!headshot.s3Key && !headshot.imageUrl && headshot.poseId && selectedHeadshot.poseId === headshot.poseId)
                            );
                            
                            // 🔥 NEW: Get thumbnail URL if available, otherwise use full image
                            const thumbnailKey = headshot.s3Key 
                              ? `thumbnails/${headshot.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg')}`
                              : null;
                            const thumbnailUrl = thumbnailKey && thumbnailUrlsMap?.get(thumbnailKey);
                            const displayUrl = thumbnailUrl || headshot.imageUrl;
                            
                            return (
                              <button
                                key={uniqueKey}
                                onClick={() => {
                                  const newRef = isSelected ? undefined : {
                                    poseId: headshot.poseId,
                                    s3Key: headshot.s3Key,
                                    imageUrl: headshot.imageUrl
                                  };
                                  setSelectedCharacterReferences(prev => {
                                    const shotRefs = prev[shotSlot] || {};
                                    const updatedShotRefs = newRef 
                                      ? { ...shotRefs, [charId]: newRef }
                                      : { ...shotRefs };
                                    if (!newRef) delete updatedShotRefs[charId];
                                    return {
                                      ...prev,
                                      [shotSlot]: Object.keys(updatedShotRefs).length > 0 ? updatedShotRefs : undefined
                                    };
                                  });
                                }}
                                className={`relative aspect-square rounded border-2 transition-all ${
                                  isSelected
                                    ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                    : 'border-[#3F3F46] hover:border-[#808080]'
                                }`}
                              >
                                {displayUrl && (
                                  <img
                                    src={displayUrl}
                                    alt={headshot.label || `Headshot ${idx + 1}`}
                                    className="w-full h-full object-cover rounded"
                                    loading="lazy"
                                  />
                                )}
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-[#DC143C]/20">
                                    <Check className="w-3 h-3 text-[#DC143C]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#808080]">No headshots available</div>
                    )}
                  </div>
                );
              };
              
              // Get pronoun info and mappings for current shot
              const pronounInfo = currentShot.type === 'action' ? actionShotHasPronounsWrapper(currentShot) : { hasPronouns: false, pronouns: [] };
              const hasPronouns = !!(pronounInfo.hasPronouns && sceneAnalysisResult?.characters);
              const shotMappings = hasPronouns ? (pronounMappingsForShots[currentShot.slot] || {}) : {};
              const { explicitCharacters, singularPronounCharacters, pluralPronounCharacters } = categorizeCharacters(
                currentShot,
                shotMappings,
                getCharactersFromActionShotWrapper,
                getCharacterForShotWrapper
              );
              
              // Calculate completed shots - shots that have all required fields filled
              const completedShots = new Set<number>();
              enabledShotsList.forEach((s: any) => {
                let isComplete = true;
                
                // Check location requirement
                if (isLocationAngleRequiredWrapper(s) && needsLocationAngleWrapper(s)) {
                  const hasLocation = selectedLocationReferences[s.slot] !== undefined;
                  const hasOptOut = locationOptOuts[s.slot] === true;
                  if (!hasLocation && !hasOptOut) {
                    isComplete = false;
                  }
                  // If opted out, location description is required
                  if (hasOptOut) {
                    const locationDesc = locationDescriptions[s.slot] || '';
                    if (!locationDesc.trim()) {
                      isComplete = false;
                    }
                  }
                }
                
                // Check character references for dialogue shots
                if (s.type === 'dialogue' && s.characterId) {
                  const hasCharacterRef = selectedCharacterReferences[s.slot]?.[s.characterId] !== undefined;
                  if (!hasCharacterRef) {
                    isComplete = false;
                  }
                }
                
                // Check pronoun mappings (all pronouns must be mapped or skipped)
                if (s.type === 'action') {
                  const actionPronounInfo = actionShotHasPronounsWrapper(s);
                  if (actionPronounInfo.hasPronouns) {
                    const mappings = pronounMappingsForShots[s.slot] || {};
                    const shotPrompts = pronounExtrasPrompts[s.slot] || {};
                    const unmappedPronouns = actionPronounInfo.pronouns.filter((p: string) => {
                      const mapping = mappings[p.toLowerCase()];
                      // Allow "__ignore__" (skip mapping) as a valid mapping, but require prompt text
                      if (mapping === '__ignore__') {
                        const prompt = shotPrompts[p.toLowerCase()] || '';
                        // If skipped, prompt is required
                        return !prompt.trim();
                      }
                      // Empty mapping or empty array means not mapped - require action
                      return !mapping || (Array.isArray(mapping) && mapping.length === 0);
                    });
                    if (unmappedPronouns.length > 0) {
                      isComplete = false;
                    }
                  }
                }
                
                if (isComplete) {
                  completedShots.add(s.slot);
                }
              });
              
              // Handler for shot navigation
              const handleShotSelect = (shotSlot: number) => {
                const shotIndex = enabledShotsList.findIndex((s: any) => s.slot === shotSlot);
                if (shotIndex !== -1) {
                  // Check if shot is navigable
                  const currentIndex = enabledShotsList.findIndex((s: any) => s.slot === currentShot.slot);
                  const nextShotSlot = currentIndex >= 0 && currentIndex < enabledShotsList.length - 1 
                    ? enabledShotsList[currentIndex + 1].slot 
                    : null;
                  
                  const isCurrentShotComplete = completedShots.has(currentShot.slot);
                  
                  // Navigation rules:
                  // 1. Current shot - always navigable
                  // 2. Previous shots - navigable if completed
                  // 3. Next shot - navigable ONLY if current shot is complete
                  // 4. Shots beyond next - not navigable until reached sequentially
                  let isNavigable = false;
                  if (shotSlot === currentShot.slot) {
                    isNavigable = true;
                  } else if (shotIndex < currentIndex) {
                    // Previous shot - must be completed
                    isNavigable = completedShots.has(shotSlot);
                  } else if (shotSlot === nextShotSlot) {
                    // Next shot - only if current is complete
                    isNavigable = isCurrentShotComplete;
                  }
                  
                  if (isNavigable) {
                    setCurrentShotIndex(shotIndex);
                    // Scroll to top when switching shots
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  } else {
                    if (shotSlot === nextShotSlot && !isCurrentShotComplete) {
                      toast.error('Complete current shot first', {
                        description: 'Please fill out all required fields for this shot before moving to the next one.',
                        duration: 3000
                      });
                    } else {
                      toast.error('Complete previous shots first', {
                        description: 'You can only navigate to completed shots or the next shot (if current is complete).',
                        duration: 3000
                      });
                    }
                  }
                }
              };

              return (
                <ShotConfigurationStep
                  shot={currentShot}
                  sceneAnalysisResult={sceneAnalysisResult}
                  shotIndex={currentShotIndex}
                  totalShots={enabledShotsList.length}
                  explicitCharacters={explicitCharacters}
                  singularPronounCharacters={singularPronounCharacters}
                  pluralPronounCharacters={pluralPronounCharacters}
                  shotMappings={shotMappings}
                  hasPronouns={hasPronouns}
                  pronounInfo={pronounInfo}
                  renderCharacterControlsOnly={renderCharacterControlsOnly}
                  renderCharacterImagesOnly={renderCharacterImagesOnly}
                  selectedLocationReferences={selectedLocationReferences}
                  onLocationAngleChange={(shotSlot, locationId, angle) => {
                    setSelectedLocationReferences(prev => ({
                      ...prev,
                      [shotSlot]: angle
                    }));
                  }}
                  isLocationAngleRequired={isLocationAngleRequiredWrapper}
                  needsLocationAngle={needsLocationAngleWrapper}
                  locationOptOuts={locationOptOuts}
                  onLocationOptOutChange={(shotSlot, optOut) => {
                    setLocationOptOuts(prev => ({
                      ...prev,
                      [shotSlot]: optOut
                    }));
                  }}
                  locationDescriptions={locationDescriptions}
                  onLocationDescriptionChange={(shotSlot, description) => {
                    setLocationDescriptions(prev => ({
                      ...prev,
                      [shotSlot]: description
                    }));
                  }}
                  allCharacters={allCharacters}
                  selectedCharactersForShots={selectedCharactersForShots}
                  onCharactersForShotChange={(shotSlot, characterIds) => {
                    setSelectedCharactersForShots(prev => ({
                      ...prev,
                      [shotSlot]: characterIds
                    }));
                  }}
                  onPronounMappingChange={(shotSlot, pronoun, characterIdOrIds) => {
                    setPronounMappingsForShots(prev => {
                      const shotMappings = prev[shotSlot] || {};
                      const newMappings = { ...shotMappings };
                      if (characterIdOrIds) {
                        newMappings[pronoun] = characterIdOrIds;
                        
                        // Initialize outfit for newly selected characters
                        const charIds = Array.isArray(characterIdOrIds) ? characterIdOrIds : [characterIdOrIds];
                        setCharacterOutfits(prevOutfits => {
                          const shotOutfits = prevOutfits[shotSlot] || {};
                          const updatedOutfits = { ...shotOutfits };
                          let hasChanges = false;
                          
                          // Don't initialize outfits - let them default to "All Outfits" (undefined)
                          // This matches the behavior on the right side where all images are shown by default
                          
                          return hasChanges ? {
                            ...prevOutfits,
                            [shotSlot]: updatedOutfits
                          } : prevOutfits;
                        });
                      } else {
                        delete newMappings[pronoun];
                      }
                      return {
                        ...prev,
                        [shotSlot]: Object.keys(newMappings).length > 0 ? newMappings : undefined
                      };
                    });
                  }}
                  characterHeadshots={characterHeadshots}
                  loadingHeadshots={loadingHeadshots}
                  selectedCharacterReferences={selectedCharacterReferences}
                  characterOutfits={characterOutfits}
                  onCharacterReferenceChange={(shotSlot, characterId, reference) => {
                    setSelectedCharacterReferences(prev => {
                      const shotRefs = prev[shotSlot] || {};
                      const updatedShotRefs = reference 
                        ? { ...shotRefs, [characterId]: reference }
                        : { ...shotRefs };
                      if (!reference) delete updatedShotRefs[characterId];
                      return {
                        ...prev,
                        [shotSlot]: Object.keys(updatedShotRefs).length > 0 ? updatedShotRefs : undefined
                      };
                    });
                  }}
                  onCharacterOutfitChange={(shotSlot, characterId, outfitName) => {
                    setCharacterOutfits(prev => {
                      const updated = { ...prev };
                      if (!updated[shotSlot]) updated[shotSlot] = {};
                      updated[shotSlot] = {
                        ...updated[shotSlot],
                        [characterId]: outfitName || undefined
                      };
                      return updated;
                    });
                  }}
                  selectedDialogueQuality={selectedDialogueQualities[currentShot.slot]}
                  selectedDialogueWorkflow={selectedDialogueWorkflows[currentShot.slot]}
                  selectedBaseWorkflow={voiceoverBaseWorkflows[currentShot.slot]}
                  onDialogueQualityChange={(shotSlot, quality) => {
                    setSelectedDialogueQualities(prev => ({
                      ...prev,
                      [shotSlot]: quality
                    }));
                  }}
                  onDialogueWorkflowChange={(shotSlot, workflowType) => {
                    setSelectedDialogueWorkflows(prev => ({
                      ...prev,
                      [shotSlot]: workflowType
                    }));
                  }}
                  onBaseWorkflowChange={(shotSlot, baseWorkflow) => {
                    setVoiceoverBaseWorkflows(prev => ({
                      ...prev,
                      [shotSlot]: baseWorkflow
                    }));
                  }}
                  dialogueWorkflowPrompt={dialogueWorkflowPrompts[currentShot.slot]}
                  onDialogueWorkflowPromptChange={(shotSlot, prompt) => {
                    setDialogueWorkflowPrompts(prev => ({
                      ...prev,
                      [shotSlot]: prompt
                    }));
                  }}
                  pronounExtrasPrompts={pronounExtrasPrompts[currentShot.slot] || {}}
                  onPronounExtrasPromptChange={(pronoun, prompt) => {
                    setPronounExtrasPrompts(prev => {
                      const shotPrompts = prev[currentShot.slot] || {};
                      const updated = { ...prev };
                      updated[currentShot.slot] = {
                        ...shotPrompts,
                        [pronoun]: prompt
                      };
                      if (!prompt || prompt.trim() === '') {
                        delete updated[currentShot.slot][pronoun];
                        if (Object.keys(updated[currentShot.slot]).length === 0) {
                          delete updated[currentShot.slot];
                        }
                      }
                      return updated;
                    });
                  }}
                  shotCameraAngle={shotCameraAngles[currentShot.slot]}
                  onCameraAngleChange={(shotSlot, angle) => {
                    if (angle === undefined) {
                      setShotCameraAngles(prev => {
                        const updated = { ...prev };
                        delete updated[shotSlot];
                        return updated;
                      });
                    } else {
                      setShotCameraAngles(prev => ({ ...prev, [shotSlot]: angle }));
                    }
                  }}
                  shotDuration={shotDurations[currentShot.slot] || 'quick-cut'}
                  onDurationChange={(shotSlot, duration) => {
                    setShotDurations(prev => ({
                      ...prev,
                      [shotSlot]: duration || 'quick-cut'
                    }));
                  }}
                  sceneProps={sceneProps}
                  propsToShots={propsToShots}
                  shotProps={shotProps}
                  onPropDescriptionChange={(shotSlot, propId, description) => {
                    setShotProps(prev => {
                      const shotConfig = prev[shotSlot] || {};
                      const updated = { ...prev };
                      updated[shotSlot] = {
                        ...shotConfig,
                        [propId]: {
                          ...shotConfig[propId],
                          usageDescription: description || undefined
                        }
                      };
                      if (!description || description.trim() === '') {
                        delete updated[shotSlot][propId];
                        if (Object.keys(updated[shotSlot]).length === 0) {
                          delete updated[shotSlot];
                        }
                      }
                      return updated;
                    });
                  }}
                  onPropImageChange={(shotSlot, propId, imageId) => {
                    setShotProps(prev => {
                      const shotConfig = prev[shotSlot] || {};
                      const updated = { ...prev };
                      updated[shotSlot] = {
                        ...shotConfig,
                        [propId]: {
                          ...shotConfig[propId],
                          selectedImageId: imageId || undefined
                        }
                      };
                      if (!imageId) {
                        // If imageId is cleared, keep the prop config but remove selectedImageId
                        if (updated[shotSlot][propId] && !updated[shotSlot][propId].usageDescription) {
                          delete updated[shotSlot][propId];
                          if (Object.keys(updated[shotSlot]).length === 0) {
                            delete updated[shotSlot];
                          }
                        } else if (updated[shotSlot][propId]) {
                          delete updated[shotSlot][propId].selectedImageId;
                        }
                      }
                      return updated;
                    });
                  }}
                  selectedReferenceShotModel={selectedReferenceShotModels}
                  onReferenceShotModelChange={(shotSlot, model) => {
                    setSelectedReferenceShotModels(prev => ({ ...prev, [shotSlot]: model }));
                  }}
                  selectedVideoType={selectedVideoTypes}
                  selectedVideoQuality={selectedVideoQualities}
                  onVideoTypeChange={(shotSlot, videoType) => {
                    setSelectedVideoTypes(prev => ({ ...prev, [shotSlot]: videoType }));
                  }}
                  onVideoQualityChange={(shotSlot, quality) => {
                    setSelectedVideoQualities(prev => ({ ...prev, [shotSlot]: quality }));
                  }}
                  onPrevious={() => {
                    if (currentShotIndex > 0) {
                      setCurrentShotIndex(currentShotIndex - 1);
                    } else {
                      // Go back to Scene Analysis & Shot Selection
                      // Scene Analysis is shown when currentStep === 1 && hasConfirmedSceneSelection
                      setWizardStep('analysis');
                      setCurrentStep(1);
                    }
                  }}
                  onNext={() => {
                    if (currentShotIndex < enabledShotsList.length - 1) {
                      setCurrentShotIndex(currentShotIndex + 1);
                    } else {
                      setWizardStep('review');
                    }
                  }}
                  onShotSelect={handleShotSelect}
                  enabledShots={enabledShots}
                  completedShots={completedShots}
                  isMobile={isMobile}
                />
              );
            })()}

            {/* Review Step */}
            {wizardStep === 'review' && selectedSceneId && sceneAnalysisResult && (
              <SceneReviewStep
                sceneAnalysisResult={sceneAnalysisResult}
                enabledShots={enabledShots}
                globalResolution={globalResolution}
                onGlobalResolutionChange={setGlobalResolution}
                shotCameraAngles={shotCameraAngles}
                shotDurations={shotDurations}
                selectedCharacterReferences={selectedCharacterReferences}
                characterOutfits={characterOutfits}
                selectedLocationReferences={selectedLocationReferences}
                selectedDialogueWorkflows={selectedDialogueWorkflows}
                dialogueWorkflowPrompts={dialogueWorkflowPrompts}
                shotWorkflowOverrides={shotWorkflowOverrides}
                onShotWorkflowOverrideChange={(shotSlot, workflow) => {
                  setShotWorkflowOverrides(prev => {
                    if (!workflow || workflow === '') {
                      const updated = { ...prev };
                      delete updated[shotSlot];
                      return updated;
                    }
                    return { ...prev, [shotSlot]: workflow };
                  });
                }}
                pronounMappingsForShots={pronounMappingsForShots}
                pronounExtrasPrompts={pronounExtrasPrompts}
                selectedCharactersForShots={selectedCharactersForShots}
                sceneProps={sceneProps}
                propsToShots={propsToShots}
                shotProps={shotProps}
                selectedReferenceShotModels={selectedReferenceShotModels}
                onBack={() => {
                  scrollToTop();
                  const shots = sceneAnalysisResult.shotBreakdown?.shots || [];
                  const enabledShotsList = shots.filter((s: any) => enabledShots.includes(s.slot));
                  setCurrentShotIndex(enabledShotsList.length - 1);
                  setWizardStep('shot-config');
                }}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                allCharacters={allCharacters}
              />
            )}

            {/* Legacy Unified Configuration removed - using wizard flow only */}

          </motion.div>
        )}
        
        {/* Jobs Panel Integration - Replace legacy progress bar */}
        {((isGenerating || workflowStatus) && workflowStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="bg-[#141414] border-[#3F3F46]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {workflowStatus.status === 'running' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {workflowStatus.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {workflowStatus.status === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-semibold text-sm">
                        {workflowStatus.status === 'running' && 'Generation in progress...'}
                        {workflowStatus.status === 'completed' && 'Generation completed!'}
                        {workflowStatus.status === 'failed' && 'Generation failed'}
                        {workflowStatus.status === 'awaiting_user_decision' && 'Awaiting your decision'}
                      </div>
                      <div className="text-xs text-[#808080]">
                        Step {workflowStatus.currentStep} of {workflowStatus.totalSteps} • {workflowStatus.totalCreditsUsed || 0} credits used
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsJobsDrawerOpen(true);
                      // Auto-open jobs drawer to show job details
                    }}
                    className="border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    View in Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
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
      
      {/* Jobs Drawer - Replace legacy progress bar */}
      <JobsDrawer
        isOpen={isJobsDrawerOpen}
        onClose={() => setIsJobsDrawerOpen(false)}
        onOpen={() => setIsJobsDrawerOpen(true)}
        onToggle={() => setIsJobsDrawerOpen(!isJobsDrawerOpen)}
        autoOpen={false}
        compact={false}
        jobCount={workflowStatus ? 1 : 0}
        onNavigateToEntity={(type, id) => {
          // Handle navigation to character/location/asset from jobs drawer
          console.log(`[SceneBuilderPanel] Navigate to ${type}: ${id}`);
        }}
      />
    </div>
  );
}

