/**
 * Pipeline Help Modal
 * 
 * Explains how the Production Pipeline works, what's optional vs required,
 * and provides guidance for different user workflows
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  FileText,
  ListChecks,
  Film,
  Layers,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  Edit3,
  ArrowRight,
  Info,
  Zap,
  Lock
} from 'lucide-react';

interface PipelineHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage?: string;
  userPlan?: 'free' | 'pro' | 'ultra' | 'studio';
}

export function PipelineHelpModal({
  isOpen,
  onClose,
  currentStage = 'screenplay',
  userPlan = 'free'
}: PipelineHelpModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <HelpCircle className="w-6 h-6 text-black" />
            </div>
            Production Pipeline Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to use the complete screenplay-to-video workflow
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">
                    Flexible Workflow
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>You don&apos;t have to complete every stage!</strong> The Production Pipeline is a guided workflow,
                    not a required sequence. Each stage is optional except the Screenplay. Jump to whatever you need.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-base-content">
                How It Works
              </h3>
              
              <div className="space-y-3">
                <StageOverviewCard
                  icon={<FileText className="w-5 h-5" />}
                  title="1. Screenplay"
                  status="required"
                  description="Write your script in Fountain format. This is your starting point."
                  available="All plans"
                />
                
                <StageOverviewCard
                  icon={<ListChecks className="w-5 h-5" />}
                  title="2. Shot List"
                  status="optional"
                  description="AI auto-generates professional cinematography breakdown. You can edit all shots or skip entirely."
                  available="All plans (uses AI credits)"
                />
                
                <StageOverviewCard
                  icon={<Film className="w-5 h-5" />}
                  title="3. Timeline"
                  status="optional"
                  description="Drag-and-drop video/audio arrangement. 8 video + 8 audio tracks."
                  available="All plans"
                />
                
                <StageOverviewCard
                  icon={<Layers className="w-5 h-5" />}
                  title="4. Composition"
                  status="optional"
                  description="Apply cinematic layouts (split-screen, PIP, etc.). Costs 10-30 credits per composition."
                  available="All plans"
                />
                
                <StageOverviewCard
                  icon={<Download className="w-5 h-5" />}
                  title="5. Export"
                  status="required"
                  description="Render your final video from Timeline or Composition."
                  available="All plans"
                />
              </div>
            </div>
          </TabsContent>

          {/* STAGES TAB */}
          <TabsContent value="stages" className="space-y-6 mt-6">
            <div className="space-y-6">
              {/* Shot List Detail */}
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <ListChecks className="w-6 h-6 text-base-content" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-base-content mb-1">
                      Shot List Generator
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Professional cinematography breakdown from your screenplay
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-base-content mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      AI Auto-Generation
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      Click <strong>&quot;Generate Shot List&quot;</strong> and our AI analyzes your screenplay to suggest:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300 ml-4">
                      <li>• Shot types (Wide, Medium, Close-Up, OTS, POV)</li>
                      <li>• Camera movements (Static, Pan, Dolly, Handheld)</li>
                      <li>• Shot duration and timing</li>
                      <li>• Composition notes and framing</li>
                      <li>• Lens recommendations</li>
                      <li>• Lighting and color palette suggestions</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-base-content mb-2 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                      Manual Editing
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      After AI generation, you can:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300 ml-4">
                      <li>• Click <strong>&quot;Edit Shot&quot;</strong> on any shot card</li>
                      <li>• Modify descriptions and visual prompts</li>
                      <li>• Adjust shot types and camera movements</li>
                      <li>• Fine-tune AI video generation prompts</li>
                      <li>• Delete unwanted shots</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Manual Creation Coming Soon
                        </p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Currently, shot lists are AI-generated, then editable. We&apos;re adding manual shot creation
                          in a future update so you can build shot lists from scratch.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-base-content mb-2 flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      Skip This Stage
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      You can skip the Shot List entirely and go straight to Timeline or direct video generation.
                      It&apos;s most useful for:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300 ml-4">
                      <li>• Planning complex scenes with multiple shots</li>
                      <li>• Professional productions needing shot coverage</li>
                      <li>• Sharing cinematography plans with crew</li>
                      <li>• Batch video generation with consistent style</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Timeline Detail */}
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-green-500 rounded-lg">
                    <Film className="w-6 h-6 text-base-content" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-base-content mb-1">
                      Timeline Editor
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Multi-track video and audio arrangement
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>Drag and drop videos onto the timeline to:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Arrange clips in sequence</li>
                    <li>• Trim start/end points</li>
                    <li>• Layer up to 8 video tracks</li>
                    <li>• Add audio on 8 audio tracks</li>
                    <li>• Control timing and pacing</li>
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    💡 You can import videos from your Shot List, upload your own, or generate them directly.
                  </p>
                </div>
              </div>

              {/* Composition Detail */}
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-orange-500 rounded-lg">
                    <Layers className="w-6 h-6 text-base-content" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl text-slate-900 dark:text-base-content">
                        Composition Studio
                      </h3>
                      <Badge className="bg-blue-500 text-base-content border-0">Credit-Based</Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Professional multi-video layouts and effects
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>Apply cinematic compositions:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Split-screen layouts (2-way, 3-way, 4-way) — 10-20 credits</li>
                    <li>• Picture-in-picture effects — 10 credits</li>
                    <li>• Side-by-side comparisons — 15 credits</li>
                    <li>• Custom positioning and sizing — 10 credits</li>
                    <li>• Animated compositions — 30 credits</li>
                  </ul>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      💳 All composition layouts available to all users. Each composition costs 10-30 credits to render.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* WORKFLOWS TAB */}
          <TabsContent value="workflows" className="space-y-6 mt-6">
            <div className="space-y-6">
              <WorkflowCard
                title="Quick Pitch Reel (Free User)"
                steps={[
                  "Write 3-page screenplay",
                  "Generate 2-4 key scene videos",
                  "Arrange on Timeline",
                  "Export as pitch video"
                ]}
                time="30 minutes"
                difficulty="Beginner"
                stagesUsed={['screenplay', 'timeline', 'export']}
              />

              <WorkflowCard
                title="Professional Short Film (Pro User)"
                steps={[
                  "Write full screenplay",
                  "Generate AI shot list (100+ shots)",
                  "Review and edit shot descriptions",
                  "Generate all videos in batch",
                  "Arrange on Timeline with music",
                  "Apply split-screen for dialogue scenes",
                  "Export at 1080p"
                ]}
                time="2-3 hours"
                difficulty="Advanced"
                stagesUsed={['screenplay', 'shotlist', 'timeline', 'composition', 'export']}
              />

              <WorkflowCard
                title="Social Media Content (Any User)"
                steps={[
                  "Write short scene snippets",
                  "Skip Shot List",
                  "Generate 5-10 quick videos",
                  "Timeline: Trim to 15-60 seconds each",
                  "Export multiple versions"
                ]}
                time="45 minutes"
                difficulty="Beginner"
                stagesUsed={['screenplay', 'timeline', 'export']}
              />

              <WorkflowCard
                title="Director's Previsualization"
                steps={[
                  "Import existing screenplay",
                  "Generate comprehensive shot list",
                  "Edit and refine coverage",
                  "Export shot list PDF to share with crew",
                  "Generate reference videos for key shots"
                ]}
                time="1-2 hours"
                difficulty="Intermediate"
                stagesUsed={['screenplay', 'shotlist']}
              />
            </div>
          </TabsContent>

          {/* TIPS TAB */}
          <TabsContent value="tips" className="space-y-4 mt-6">
            <TipCard
              icon={<Zap className="w-5 h-5" />}
              title="Start Simple"
              tip="Your first project? Just use Screenplay → Videos → Timeline → Export. Skip Shot List and Composition until you're comfortable."
              color="yellow"
            />

            <TipCard
              icon={<Sparkles className="w-5 h-5" />}
              title="Shot Lists Are Optional"
              tip="If you just want a few quick videos, skip the Shot List and generate videos directly from your screenplay text."
              color="purple"
            />

            <TipCard
              icon={<Edit3 className="w-5 h-5" />}
              title="Edit AI Suggestions"
              tip="AI-generated shot lists are a starting point. Always review and customize them to match your vision."
              color="blue"
            />

            <TipCard
              icon={<Film className="w-5 h-5" />}
              title="Use Timeline for Everything"
              tip="Even if you only have one video, use the Timeline to trim, add audio, and control timing before export."
              color="green"
            />

            <TipCard
              icon={<Lock className="w-5 h-5" />}
              title="Plan for Composition"
              tip="If you want split-screen or PIP effects, you'll need Pro plan or higher. Plan accordingly when writing scenes."
              color="orange"
            />

            <TipCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="Save Often"
              tip="Your progress is auto-saved, but manually save after major changes. Use version control for important projects."
              color="green"
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button onClick={onClose} className="bg-yellow-400 text-black hover:bg-[#DC143C]">
            Got It!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
interface StageOverviewCardProps {
  icon: React.ReactNode;
  title: string;
  status: 'required' | 'optional';
  description: string;
  available: string;
  locked?: boolean;
}

function StageOverviewCard({ icon, title, status, description, available, locked }: StageOverviewCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className={`p-2 rounded-lg ${locked ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-900 dark:bg-white'}`}>
        <div className={locked ? 'text-slate-500' : 'text-base-content dark:text-slate-900'}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-slate-900 dark:text-base-content">{title}</h4>
          <Badge className={status === 'required' ? 'bg-red-100 text-red-800 border-0' : 'bg-blue-100 text-blue-800 border-0'}>
            {status}
          </Badge>
          {locked && <Lock className="w-4 h-4 text-red-500" />}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{description}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{available}</p>
      </div>
    </div>
  );
}

interface WorkflowCardProps {
  title: string;
  steps: string[];
  time: string;
  difficulty: string;
  stagesUsed: string[];
}

function WorkflowCard({ title, steps, time, difficulty, stagesUsed }: WorkflowCardProps) {
  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-base-content">{title}</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{time}</Badge>
          <Badge className={difficulty === 'Beginner' ? 'bg-green-100 text-green-800 border-0' : difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 border-0' : 'bg-red-100 text-red-800 border-0'}>
            {difficulty}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Stages used:</span>
        {stagesUsed.map(stage => (
          <Badge key={stage} variant="outline" className="text-xs">{stage}</Badge>
        ))}
      </div>
    </div>
  );
}

interface TipCardProps {
  icon: React.ReactNode;
  title: string;
  tip: string;
  color: string;
}

function TipCard({ icon, title, tip, color }: TipCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h4 className="font-bold text-slate-900 dark:text-base-content mb-1">{title}</h4>
        <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
      </div>
    </div>
  );
}

