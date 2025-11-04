'use client';

/**
 * Story Beat Production Panel
 * 
 * THE CENTERPIECE of the composition-first workflow!
 * 
 * Users can:
 * - View story beats organized hierarchically
 * - Select composition templates (AI-suggested or manual)
 * - Assign characters to clips
 * - Generate multiple video clips per beat
 * - Preview and manage generated clips
 * - Track costs and credits
 * 
 * This is the REVOLUTIONARY workflow that changes everything!
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Wand2,
  Video,
  Users,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  Grid3x3,
  Maximize2,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Film
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Slider } from '@/components/ui/slider'; // Not used yet
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SceneBuilderProgress } from '@/components/video/SceneBuilderProgress';
import { SceneBuilderDecisionModal } from '@/components/video/SceneBuilderDecisionModal';

// Types
interface StoryBeat {
  id: string;
  title: string;
  synopsis: string;
  order: number;
  sceneIds: string[];
  production?: BeatProduction;
}

interface BeatProduction {
  compositionTemplateId: string;
  characterAssignments: CharacterAssignment[];
  clipCount: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  clipIds: string[];
  creditsUsed: number;
  lastGeneratedAt?: string;
}

interface CharacterAssignment {
  clipIndex: number;
  characterId: string;
  characterName: string;
  referenceImageUrl: string;
  cameraAngle: string;
  framing: string;
  action?: string;
}

interface CompositionTemplate {
  id: string;
  name: string;
  category: string;
  clipCount: number;
  description: string;
  suggestedCameraAngles: string[];
  isPremium: boolean;
  layout: {
    type: string;
    aspectRatio: string;
  };
}

interface GeneratedClip {
  id: string;
  clipIndex: number;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  creditsUsed: number;
}

interface Props {
  projectId: string;
  storyBeats: StoryBeat[];
  onRefresh: () => void;
}

export default function StoryBeatProductionPanel({ projectId, storyBeats, onRefresh }: Props) {
  // State
  const [expandedBeats, setExpandedBeats] = useState<Set<string>>(new Set());
  const [selectedBeat, setSelectedBeat] = useState<StoryBeat | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [templates, setTemplates] = useState<CompositionTemplate[]>([]);
  const [generatingClips, setGeneratingClips] = useState<Map<string, GeneratedClip>>(new Map());
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);
  
  async function loadTemplates() {
    try {
      const response = await fetch('/api/composition/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }
  
  function toggleBeatExpanded(beatId: string) {
    const newExpanded = new Set(expandedBeats);
    if (newExpanded.has(beatId)) {
      newExpanded.delete(beatId);
    } else {
      newExpanded.add(beatId);
    }
    setExpandedBeats(newExpanded);
  }
  
  function handleSelectBeat(beat: StoryBeat) {
    setSelectedBeat(beat);
    setShowTemplateDialog(true);
  }
  
  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#DC143C]/10 rounded-lg">
            <Video className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Story Beat Production</h2>
            <p className="text-sm text-slate-500">Composition-first video generation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Video className="w-4 h-4 mr-2" />
            {storyBeats.filter(b => b.production?.status === 'completed').length} / {storyBeats.length} Complete
          </Badge>
          
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Story Beat List (Left Panel) */}
        <Card className="col-span-5 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-medium">Story Beats ({storyBeats.length})</CardTitle>
            <CardDescription className="text-xs">Organize production by narrative structure</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {storyBeats.map((beat) => (
                  <StoryBeatCard
                    key={beat.id}
                    beat={beat}
                    isExpanded={expandedBeats.has(beat.id)}
                    onToggle={() => toggleBeatExpanded(beat.id)}
                    onSelect={() => handleSelectBeat(beat)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Production Workspace (Right Panel) */}
        <Card className="col-span-7 flex flex-col overflow-hidden">
          {selectedBeat ? (
            <ProductionWorkspace 
              beat={selectedBeat}
              templates={templates}
              onClose={() => setSelectedBeat(null)}
              onUpdate={onRefresh}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="font-semibold text-lg mb-2">Select a Story Beat</h3>
                <p className="text-sm">Choose a beat to start generating video clips</p>
                <p className="text-xs mt-2 text-slate-400">
                  AI will suggest optimal composition templates based on beat content
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * Story Beat Card - Collapsible list item
 */
function StoryBeatCard({ 
  beat, 
  isExpanded, 
  onToggle,
  onSelect 
}: { 
  beat: StoryBeat; 
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const status = beat.production?.status || 'not_started';
  const hasProduction = !!beat.production;
  
  // Status colors
  const statusColors = {
    not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-800',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };
  
  const statusIcons = {
    not_started: Square,
    in_progress: Loader2,
    completed: CheckCircle2,
    failed: AlertCircle
  };
  
  const StatusIcon = statusIcons[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-start gap-3">
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          {/* Beat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{beat.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{beat.synopsis}</p>
              </div>
              
              {/* Status Badge */}
              <Badge className={`${statusColors[status]} flex items-center gap-1 text-xs`}>
                <StatusIcon className={`w-3 h-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
                {status.replace('_', ' ')}
              </Badge>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                {beat.sceneIds.length} scenes
              </span>
              
              {hasProduction && (
                <>
                  <span className="flex items-center gap-1">
                    <Grid3x3 className="w-3 h-3" />
                    {beat.production?.clipCount || 0} clips
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {beat.production?.creditsUsed || 0} credits
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              {hasProduction && beat.production?.status === 'completed' ? (
                <div>
                  <p className="text-xs font-medium mb-2">Generated Clips ({beat.production?.clipIds.length || 0})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(beat.production?.clipIds || []).map((clipId, idx) => (
                      <div key={clipId} className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-6 h-6 text-base-content opacity-70" />
                        </div>
                        <div className="absolute bottom-1 right-1">
                          <Badge variant="secondary" className="text-xs">#{idx + 1}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-3" onClick={onSelect}>
                    <Edit className="w-3 h-3 mr-2" />
                    Edit Production
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Video className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-medium mb-1">No production yet</p>
                  <Button size="sm" onClick={onSelect} className="mt-2">
                    <Sparkles className="w-3 h-3 mr-2" />
                    Start Production
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Production Workspace - The main production interface
 */
function ProductionWorkspace({ 
  beat, 
  templates,
  onClose,
  onUpdate 
}: { 
  beat: StoryBeat;
  templates: CompositionTemplate[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [generationMode, setGenerationMode] = useState<'template' | 'scene-builder'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<CompositionTemplate | null>(null);
  const [suggestedTemplate, setSuggestedTemplate] = useState<CompositionTemplate | null>(null);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [characterAssignments, setCharacterAssignments] = useState<CharacterAssignment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Scene Builder state
  const [workflowExecutionId, setWorkflowExecutionId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  
  // Load AI suggestion on mount
  useEffect(() => {
    loadAISuggestion();
  }, [beat.id]);
  
  async function loadAISuggestion() {
    setIsLoadingSuggestion(true);
    try {
      const response = await fetch('/api/composition/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId: beat.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestedTemplate(data.suggestedTemplate);
        setAiReasoning(data.reasoning);
        setAiConfidence(data.confidence);
        setSelectedTemplate(data.suggestedTemplate);
      }
    } catch (error) {
      console.error('Failed to load AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }
  
  async function handleGenerate() {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      const response = await fetch('/api/production/generate-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatId: beat.id,
          templateId: selectedTemplate.id,
          characterAssignments
        })
      });
      
      if (response.ok) {
        // Simulate progress
        for (let i = 0; i <= 100; i += 5) {
          setGenerationProgress(i);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        onUpdate();
        onClose();
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }
  
  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{beat.title}</CardTitle>
            <CardDescription className="mt-1">{beat.synopsis}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="template" className="h-full flex flex-col">
          <TabsList className="m-4 mb-0">
            <TabsTrigger value="template">
              <Grid3x3 className="w-4 h-4 mr-2" />
              1. Template
            </TabsTrigger>
            <TabsTrigger value="characters" disabled={!selectedTemplate}>
              <Users className="w-4 h-4 mr-2" />
              2. Characters
            </TabsTrigger>
            <TabsTrigger value="generate" disabled={!selectedTemplate}>
              <Sparkles className="w-4 h-4 mr-2" />
              3. Generate
            </TabsTrigger>
          </TabsList>
          
          {/* Template Selection */}
          <TabsContent value="template" className="flex-1 overflow-hidden m-4 mt-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 py-4">
                {/* Generation Mode Toggle */}
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">Generation Method</h3>
                      <p className="text-xs text-muted-foreground">
                        Choose between composition templates or complete scene packages
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={generationMode === 'template' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGenerationMode('template')}
                        className="flex items-center gap-2"
                      >
                        <Grid3x3 className="w-4 h-4" />
                        Templates
                      </Button>
                      <Button
                        variant={generationMode === 'scene-builder' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGenerationMode('scene-builder')}
                        className={`flex items-center gap-2 ${
                          generationMode === 'scene-builder' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                            : ''
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        Scene Builder
                      </Button>
                    </div>
                  </div>
                </Card>
                
                {/* Show Template Selection or Scene Builder */}
                {generationMode === 'template' ? (
                  <>
                    {/* AI Suggestion */}
                    {isLoadingSuggestion ? (
                      <Card className="p-6 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-500" />
                        <p className="text-sm font-medium">AI analyzing beat...</p>
                      </Card>
                    ) : suggestedTemplate && (
                      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-[#DC143C] rounded-lg">
                              <Sparkles className="w-5 h-5 text-base-content" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">AI Recommendation</CardTitle>
                              <CardDescription className="mt-1">{aiReasoning}</CardDescription>
                              <div className="mt-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Confidence:</span>
                                  <Progress value={aiConfidence} className="flex-1 h-2" />
                                  <span className="font-semibold">{aiConfidence}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <TemplateCard 
                            template={suggestedTemplate} 
                            isSelected={selectedTemplate?.id === suggestedTemplate.id}
                            onSelect={() => setSelectedTemplate(suggestedTemplate)}
                          />
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* All Templates */}
                    <div>
                      <h3 className="font-semibold text-sm mb-3">All Templates</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {templates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplate?.id === template.id}
                            onSelect={() => setSelectedTemplate(template)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Scene Builder Preview/Info */
                  <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🎪</span>
                        <div>
                          <CardTitle>Scene Builder</CardTitle>
                          <CardDescription className="mt-1">
                            Generate a complete scene package with perfect consistency
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Auto-populated info */}
                        <div className="p-3 rounded-lg bg-background/50">
                          <div className="text-xs font-medium text-muted-foreground mb-2">AUTO-POPULATED FROM BEAT:</div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium">Scene Description:</span>
                              <p className="text-sm mt-1">{beat.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{beat.synopsis}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* What you'll get */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded bg-background/50 border border-border/30">
                            <div className="font-medium">📦 4-7 Videos</div>
                            <div className="text-muted-foreground text-[10px]">Complete package</div>
                          </div>
                          <div className="p-2 rounded bg-background/50 border border-border/30">
                            <div className="font-medium">⚡ 8-15 min</div>
                            <div className="text-muted-foreground text-[10px]">Parallel execution</div>
                          </div>
                          <div className="p-2 rounded bg-background/50 border border-border/30">
                            <div className="font-medium">💎 100-200 cr</div>
                            <div className="text-muted-foreground text-[10px]">Based on options</div>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          onClick={() => {
                            // Switch to generate tab to show Scene Builder
                          }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Continue with Scene Builder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Character Assignment */}
          <TabsContent value="characters" className="flex-1 overflow-hidden m-4 mt-0">
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Character assignment coming soon...</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Generate */}
          <TabsContent value="generate" className="flex-1 overflow-hidden m-4 mt-0">
            <div className="h-full flex flex-col justify-center items-center p-8">
              {isGenerating ? (
                <div className="w-full max-w-md text-center">
                  <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-purple-500" />
                  <h3 className="font-semibold text-lg mb-2">Generating Clips...</h3>
                  <Progress value={generationProgress} className="mb-2" />
                  <p className="text-sm text-slate-500">{generationProgress}% complete</p>
                </div>
              ) : (
                <div className="w-full max-w-md text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="font-semibold text-lg mb-2">Ready to Generate</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Generate {selectedTemplate?.clipCount || 0} video clips using {selectedTemplate?.name}
                  </p>
                  
                  <div className="space-y-3 mb-6 text-left bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span>Clips:</span>
                      <span className="font-semibold">{selectedTemplate?.clipCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Est. Duration:</span>
                      <span className="font-semibold">{(selectedTemplate?.clipCount || 0) * 5}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Est. Credits:</span>
                      <span className="font-semibold">{(selectedTemplate?.clipCount || 0) * 75}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gen. Time:</span>
                      <span className="font-semibold">~{(selectedTemplate?.clipCount || 0) * 2} min</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate All Clips
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
}

/**
 * Template Card - Individual template selection
 */
function TemplateCard({ 
  template, 
  isSelected, 
  onSelect 
}: { 
  template: CompositionTemplate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative p-4 rounded-lg cursor-pointer border-2 transition-all
        ${isSelected 
          ? 'bg-[#DC143C]/10 border-[#DC143C] shadow-lg' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
        }
      `}
    >
      {/* Premium Badge */}
      {template.isPremium && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-base-content text-xs">
            Premium
          </Badge>
        </div>
      )}
      
      {/* Layout Preview Icon */}
      <div className={`
        w-full aspect-video rounded-lg mb-3 flex items-center justify-center
        ${isSelected ? 'bg-[#DC143C]/20' : 'bg-slate-100 dark:bg-slate-700'}
      `}>
        <Grid3x3 className={`w-8 h-8 ${isSelected ? 'text-purple-500' : 'text-slate-400'}`} />
      </div>
      
      {/* Template Info */}
      <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{template.description}</p>
      
      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="text-xs">
          {template.clipCount} clips
        </Badge>
        <Badge variant="outline" className="text-xs">
          {template.layout.aspectRatio}
        </Badge>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="bg-[#DC143C] rounded-full p-1">
            <CheckCircle2 className="w-4 h-4 text-base-content" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

