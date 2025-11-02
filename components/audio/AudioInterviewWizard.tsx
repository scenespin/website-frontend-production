'use client';

/**
 * Audio Interview Wizard
 * 
 * Feature 0074: Interactive multi-step wizard for generating better audio
 * by asking targeted questions instead of requiring free-form prompts.
 * 
 * Two modes:
 * - SFX: 2-3 questions → ElevenLabs (3 credits, <10s)
 * - Music: 6-8 questions → Suno (100 credits, 60-120s)
 * 
 * Flow:
 * 1. Mode selection (if not provided)
 * 2. Question steps (with progress)
 * 3. Preview screen (compiled prompt)
 * 4. Generation (with progress)
 * 5. Result (audio player + actions)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Music,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Play,
  Download,
  Check,
  X,
  Loader2,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  SingleSelectInput,
  MultiSelectInput,
  TextInputComponent,
  TextareaInput,
  SliderInput,
  TagsInput,
} from './QuestionInputs';

// ============================================================================
// TYPES
// ============================================================================

type InterviewMode = 'sfx' | 'music';

interface InterviewQuestion {
  id: string;
  text: string;
  type: 'single-select' | 'multi-select' | 'text' | 'textarea' | 'slider' | 'tags';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: any;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  conditionalOn?: {
    questionId: string;
    value: any;
  };
  icon?: string;
}

interface InterviewTemplate {
  mode: InterviewMode;
  name: string;
  description: string;
  icon: string;
  questions: InterviewQuestion[];
  estimatedCredits: number;
  estimatedDuration: string;
  provider: string;
  color: string;
  badge?: string;
}

interface AudioResult {
  audioUrl: string;
  s3Key: string;
  taskId: string;
  type: string;
  provider: string;
  duration?: number;
  creditsUsed: number;
  generatedAt: string;
  prompt: string;
}

// ============================================================================
// PROPS
// ============================================================================

interface AudioInterviewWizardProps {
  mode?: InterviewMode;
  sceneContext?: string;
  onComplete: (result: AudioResult) => void;
  onCancel: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AudioInterviewWizard({
  mode: initialMode,
  sceneContext,
  onComplete,
  onCancel,
}: AudioInterviewWizardProps) {
  // State
  const [step, setStep] = useState<'mode-select' | 'questions' | 'preview' | 'generating' | 'result'>(
    initialMode ? 'questions' : 'mode-select'
  );
  const [mode, setMode] = useState<InterviewMode | null>(initialMode || null);
  const [template, setTemplate] = useState<InterviewTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [compiledPrompt, setCompiledPrompt] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load template when mode is selected
  useEffect(() => {
    if (mode && !template) {
      loadTemplate(mode);
    }
  }, [mode, template]);

  // Load template from API
  const loadTemplate = async (selectedMode: InterviewMode) => {
    try {
      const queryParams = sceneContext ? `?sceneContext=${encodeURIComponent(sceneContext)}` : '';
      const response = await fetch(`/api/audio/interview/template/${selectedMode}${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      
      const data = await response.json();
      setTemplate(data.template);
      
      // Pre-fill suggested answers if provided
      if (data.suggestedAnswers) {
        setAnswers(prev => ({ ...prev, ...data.suggestedAnswers }));
      }
      
      setStep('questions');
    } catch (err: any) {
      toast.error('Failed to load wizard', {
        description: err.message,
      });
      onCancel();
    }
  };

  // Get visible questions (accounting for conditional logic)
  const getVisibleQuestions = (): InterviewQuestion[] => {
    if (!template) return [];
    
    return template.questions.filter(q => {
      if (!q.conditionalOn) return true;
      
      const conditionAnswer = answers[q.conditionalOn.questionId];
      return conditionAnswer === q.conditionalOn.value;
    });
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Last question → go to preview
      compilePrompt();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (!currentQuestion.required) {
      handleNext();
    }
  };

  // Update answer
  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Compile prompt (preview)
  const compilePrompt = async () => {
    try {
      const response = await fetch('/api/audio/interview/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            mode,
            answers,
            sceneContext,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to compile prompt');
      }
      
      const data = await response.json();
      setCompiledPrompt(data.compiledPrompt);
      setStep('preview');
    } catch (err: any) {
      toast.error('Failed to preview', {
        description: err.message,
      });
    }
  };

  // Generate audio
  const generateAudio = async () => {
    setIsGenerating(true);
    setStep('generating');
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please sign in to generate audio');
      }
      
      const response = await fetch('/api/audio/interview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: {
            mode,
            answers,
            sceneContext,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }
      
      const data = await response.json();
      setResult(data.audio);
      setStep('result');
      
      toast.success('Audio generated!', {
        description: `Used ${data.audio.creditsUsed} credits`,
      });
    } catch (err: any) {
      setError(err.message);
      setStep('preview');
      toast.error('Generation failed', {
        description: err.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Can proceed to next question?
  const canProceed = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null || answer === '') return false;
    
    if (currentQuestion.type === 'multi-select') {
      return Array.isArray(answer) && answer.length > 0;
    }
    
    return true;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-base-200 border-base-300 shadow-2xl">
          {/* Header */}
          <CardHeader className="border-b border-base-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mode === 'sfx' && <Zap className="w-6 h-6 text-red-400" />}
                {mode === 'music' && <Music className="w-6 h-6 text-cyan-400" />}
                <div>
                  <CardTitle className="text-base-content">
                    {template?.name || 'Audio Wizard'}
                  </CardTitle>
                  <CardDescription>
                    {template?.description || 'Generate perfect audio in a few steps'}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-base-content/60 hover:text-base-content"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Progress bar (questions only) */}
            {step === 'questions' && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">
                    Question {currentQuestionIndex + 1} of {visibleQuestions.length}
                  </span>
                  <span className="text-base-content/60">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardHeader>

          {/* Content */}
          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {/* Mode Selection */}
              {step === 'mode-select' && (
                <ModeSelection onSelectMode={(m) => setMode(m)} />
              )}

              {/* Question Steps */}
              {step === 'questions' && currentQuestion && (
                <QuestionStep
                  key={currentQuestion.id}
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onAnswer={(value) => updateAnswer(currentQuestion.id, value)}
                />
              )}

              {/* Preview */}
              {step === 'preview' && compiledPrompt && (
                <PreviewStep
                  compiledPrompt={compiledPrompt}
                  template={template!}
                />
              )}

              {/* Generating */}
              {step === 'generating' && (
                <GeneratingStep mode={mode!} />
              )}

              {/* Result */}
              {step === 'result' && result && (
                <ResultStep
                  result={result}
                  onComplete={() => onComplete(result)}
                  onGenerateAnother={() => {
                    setStep('questions');
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                    setResult(null);
                  }}
                />
              )}
            </AnimatePresence>
          </CardContent>

          {/* Footer (navigation) */}
          {step === 'questions' && (
            <div className="border-t border-base-300 p-4 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className="text-base-content/60 hover:text-base-content"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {!currentQuestion?.required && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-base-content/60 hover:text-base-content"
                  >
                    Skip
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {currentQuestionIndex === visibleQuestions.length - 1 ? (
                    <>
                      Preview
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="border-t border-base-300 p-4 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('questions');
                  setCurrentQuestionIndex(visibleQuestions.length - 1);
                }}
                className="text-base-content/60 hover:text-base-content"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Answers
              </Button>

              <Button
                onClick={generateAudio}
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Audio
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ModeSelection({ onSelectMode }: { onSelectMode: (mode: InterviewMode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* SFX Card */}
      <Card
        className="bg-base-300/50 border-base-content/20 hover:border-red-500 cursor-pointer transition-all group"
        onClick={() => onSelectMode('sfx')}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-red-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-base-content mb-2">Sound Effects</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Quick 3-step wizard for perfect sound effects
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                Fast
              </Badge>
              <span className="text-base-content/60">3 credits</span>
              <span className="text-base-content/60">&lt; 10s</span>
            </div>
            
            <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-red-400 transition-colors" />
          </div>
        </CardContent>
      </Card>

      {/* Music Card */}
      <Card
        className="bg-base-300/50 border-base-content/20 hover:border-cyan-500 cursor-pointer transition-all group"
        onClick={() => onSelectMode('music')}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music className="w-8 h-8 text-cyan-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-base-content mb-2">Music & Soundtrack</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Compose the perfect soundtrack with our guided wizard
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                Premium
              </Badge>
              <span className="text-base-content/60">100 credits</span>
              <span className="text-base-content/60">60-120s</span>
            </div>
            
            <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-cyan-400 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// QUESTION STEP (will create separate components)
// ============================================================================

function QuestionStep({
  question,
  answer,
  onAnswer,
}: {
  question: InterviewQuestion;
  answer: any;
  onAnswer: (value: any) => void;
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Question */}
      <div>
        <h3 className="text-2xl font-bold text-base-content mb-2">{question.text}</h3>
        {question.helpText && (
          <p className="text-sm text-base-content/60 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {question.helpText}
          </p>
        )}
      </div>

      {/* Input based on type */}
      <div>
        {question.type === 'single-select' && question.options && (
          <SingleSelectInput
            options={question.options}
            value={answer}
            onChange={onAnswer}
          />
        )}

        {question.type === 'multi-select' && question.options && (
          <MultiSelectInput
            options={question.options}
            value={answer || []}
            onChange={onAnswer}
            maxSelections={3}
          />
        )}

        {question.type === 'text' && (
          <TextInputComponent
            value={answer || ''}
            onChange={onAnswer}
            placeholder={question.placeholder}
          />
        )}

        {question.type === 'textarea' && (
          <TextareaInput
            value={answer || ''}
            onChange={onAnswer}
            placeholder={question.placeholder}
          />
        )}

        {question.type === 'slider' && (
          <SliderInput
            value={answer || question.defaultValue || 60}
            onChange={onAnswer}
            min={question.min}
            max={question.max}
            step={question.step}
            unit={question.unit}
          />
        )}

        {question.type === 'tags' && (
          <TagsInput
            value={answer || []}
            onChange={onAnswer}
            placeholder={question.placeholder}
          />
        )}
      </div>
    </motion.div>
  );
}

// Preview, Generating, and Result steps - will create in next files
function PreviewStep({ compiledPrompt, template }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-base-300/50 rounded-lg p-6 border border-base-content/20">
        <h3 className="text-lg font-semibold text-base-content mb-4">Compiled Prompt:</h3>
        <p className="text-base-content/70 leading-relaxed">{compiledPrompt.prompt}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-base-300/50 rounded-lg p-4 border border-base-content/20">
          <div className="text-sm text-base-content/60 mb-1">Provider</div>
          <div className="text-base-content font-semibold">{compiledPrompt.provider}</div>
        </div>
        <div className="bg-base-300/50 rounded-lg p-4 border border-base-content/20">
          <div className="text-sm text-base-content/60 mb-1">Credits</div>
          <div className="text-base-content font-semibold">{compiledPrompt.estimatedCredits}</div>
        </div>
      </div>
    </div>
  );
}

function GeneratingStep({ mode }: { mode: InterviewMode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse">
          {mode === 'sfx' ? (
            <Zap className="w-12 h-12 text-base-content" />
          ) : (
            <Music className="w-12 h-12 text-base-content" />
          )}
        </div>
        <Loader2 className="w-32 h-32 text-violet-400 animate-spin absolute -inset-4" />
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-base-content mb-2">Generating your audio...</h3>
        <p className="text-base-content/60">
          {mode === 'sfx' ? 'This should take less than 10 seconds' : 'This may take 60-120 seconds'}
        </p>
      </div>
    </div>
  );
}

function ResultStep({ result, onComplete, onGenerateAnother }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-400" />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-base-content mb-2">Audio Generated!</h3>
        <p className="text-base-content/60">Used {result.creditsUsed} credits</p>
      </div>
      
      <div className="bg-base-300/50 rounded-lg p-6 border border-base-content/20">
        <audio controls className="w-full" src={result.audioUrl}>
          Your browser does not support the audio element.
        </audio>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onGenerateAnother}>
          Generate Another
        </Button>
        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
          Use This Audio
        </Button>
      </div>
    </div>
  );
}

