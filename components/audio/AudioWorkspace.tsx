'use client';

import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Music, 
  UserCircle, 
  Globe, 
  Upload, 
  X, 
  Play,
  Pause,
  Download,
  Loader2,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ElevenLabsConnectionModal } from './ElevenLabsConnectionModal';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Slider component (inline since it's not in ui folder)
interface SliderProps {
  value: number[];
  onValueChange: (values: number[]) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

function Slider({ value, onValueChange, min, max, step, disabled }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)]);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      disabled={disabled}
      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
    />
  );
}

// Audio file validation constants
const MAX_AUDIO_SIZE_MB = 50;
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];

type AudioTab = 'tts' | 'sfx' | 'isolation' | 'dubbing' | 'clone' | 'transcribe';

interface AudioResult {
  url: string;
  taskId?: string;
  provider: string;
  type: string;
  duration?: number;
}

interface AudioWorkspaceProps {
  onClose?: () => void;
}

export function AudioWorkspace({ onClose }: AudioWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AudioTab>('tts');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioPlayerRef.current) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tts':
        return <TextToSpeechTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'sfx':
        return <SoundEffectsTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'isolation':
        return <VoiceIsolationTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'dubbing':
        return <AudioDubbingTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'transcribe':
        return <TranscriptionTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Volume2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Audio Workspace</h3>
            <p className="text-xs text-muted-foreground">
              Professional audio production suite
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/50 bg-accent/5 overflow-x-auto">
        <TabButton
          active={activeTab === 'tts'}
          onClick={() => setActiveTab('tts')}
          icon={<Mic className="w-4 h-4" />}
          label="Text-to-Speech"
          description="AI voices"
          provider="Runway"
        />
        <TabButton
          active={activeTab === 'sfx'}
          onClick={() => setActiveTab('sfx')}
          icon={<Music className="w-4 h-4" />}
          label="Sound Effects"
          description="AI audio"
          provider="Runway"
        />
        <TabButton
          active={activeTab === 'isolation'}
          onClick={() => setActiveTab('isolation')}
          icon={<UserCircle className="w-4 h-4" />}
          label="Voice Isolation"
          description="Remove noise"
          provider="Runway"
        />
        <TabButton
          active={activeTab === 'dubbing'}
          onClick={() => setActiveTab('dubbing')}
          icon={<Globe className="w-4 h-4" />}
          label="Audio Dubbing"
          description="Translate"
          provider="Runway"
        />
        <TabButton
          active={activeTab === 'transcribe'}
          onClick={() => setActiveTab('transcribe')}
          icon={<Upload className="w-4 h-4" />}
          label="Transcription"
          description="Speech-to-Text"
          provider="ElevenLabs"
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderTabContent()}
      </div>

      {/* Result Display */}
      {result && (
        <div className="p-4 border-t border-border/50 bg-accent/5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-foreground">✅ Audio Complete!</span>
              </div>
              <Button size="sm" className="gap-2" onClick={() => window.open(result.url, '_blank')}>
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            {/* Audio Player */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border border-border">
              <audio
                ref={audioPlayerRef}
                src={result.url}
                onEnded={() => setIsPlaying(false)}
                className="w-full"
              />
              
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  className="w-10 h-10 p-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '0%' }}></div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                  className="w-10 h-10 p-0"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Provider: {result.provider} · Type: {result.type}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 border-t border-border/50 bg-red-500/5">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-500">Error</p>
              <p className="text-xs text-red-500/80 mt-1">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  provider: string;
}

function TabButton({ active, onClick, icon, label, description, provider }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center p-3 border-b-2 transition-all
        ${active
          ? 'border-green-500 bg-green-500/5 text-green-600 dark:text-green-400'
          : 'border-transparent hover:bg-accent/5 text-muted-foreground hover:text-foreground'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs opacity-75">{description}</span>
      <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-accent/50">
        {provider}
      </span>
    </button>
  );
}

// =============================================================================
// TAB 1: TEXT-TO-SPEECH
// =============================================================================

interface TabProps {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  setResult: (result: AudioResult) => void;
  setError: (error: string | null) => void;
}

function TextToSpeechTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [language, setLanguage] = useState('en');
  const [speed, setSpeed] = useState(1.0);
  const [provider, setProvider] = useState<'runway' | 'elevenlabs'>('runway');
  const [model, setModel] = useState('eleven_turbo_v2.5');
  const [voices, setVoices] = useState<any[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  
  // ElevenLabs connection hook
  const elevenLabs = useElevenLabs();

  // Fetch voices when provider changes
  React.useEffect(() => {
    const fetchVoices = async () => {
      if (provider === 'runway') {
        // Use hardcoded Provider B voices (premium quality)
        return;
      }

      setLoadingVoices(true);
      try {
        const token = localStorage.getItem('jwt_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        
        const response = await fetch(`${apiUrl}/api/audio/voices/${provider}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const premadeVoices = data.voices || [];
          
          // Combine premade voices with user's verified voices from ElevenLabs
          const allVoices = [
            ...premadeVoices,
            ...elevenLabs.voices.map(v => ({
              voice_id: v.voice_id,
              name: `${v.name} (Your Voice) ✨`,
              category: v.category,
              description: 'Your verified voice from ElevenLabs',
            }))
          ];
          
          setVoices(allVoices);
          // Set first voice as default
          if (allVoices && allVoices.length > 0) {
            setVoice(allVoices[0].voice_id || allVoices[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch voices:', err);
      } finally {
        setLoadingVoices(false);
      }
    };

    fetchVoices();
  }, [provider, elevenLabs.voices]);

  // Calculate credit cost based on provider and model
  const getCreditCost = () => {
    if (provider === 'runway') return 5;
    if (provider === 'elevenlabs') {
      if (model === 'eleven_flash_v2.5') return 2;
      if (model === 'eleven_turbo_v2.5') return 7;
      if (model === 'eleven_multilingual_v2') return 10;
      return 5;
    }
    return 5;
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter text to convert to speech');
      return;
    }

    if (text.length > 5000) {
      setError('Text must be 5000 characters or less');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      const requestBody: any = {
        text,
        voice,
        language,
        speed,
        provider,
      };

      // Add model for ElevenLabs
      if (provider === 'elevenlabs') {
        requestBody.model = model;
      }

      const response = await fetch(`${apiUrl}/api/audio/text-to-speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.audioUrl || data.audio_url,
        taskId: data.taskId || data.task_id,
        provider: provider === 'elevenlabs' ? 'ElevenLabs' : 'Runway',
        type: 'Text-to-Speech',
        duration: data.duration,
      });

    } catch (err: any) {
      console.error('[TTS] Error:', err);
      setError(err.message || 'Failed to generate speech');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Provider Toggle */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎯 AI Provider</label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('runway')}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              provider === 'runway'
                ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                : 'border-border hover:border-green-500/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="text-sm font-medium">Runway ML</div>
            <div className="text-xs opacity-75">Budget • 6 voices • 5 credits</div>
          </button>
          <button
            onClick={() => setProvider('elevenlabs')}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              provider === 'elevenlabs'
                ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-[#DC143C]'
                : 'border-border hover:border-purple-500/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="text-sm font-medium">ElevenLabs</div>
            <div className="text-xs opacity-75">Premium • 100+ voices • 2-10 credits</div>
          </button>
        </div>
      </div>

      {/* ElevenLabs Model Selector (only show for ElevenLabs) */}
      {provider === 'elevenlabs' && (
        <div>
          <label className="text-sm font-medium mb-2 block">⚡ Model</label>
          <Select value={model} onValueChange={setModel} disabled={isProcessing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eleven_flash_v2.5">Flash v2.5 (2 credits) - Ultra-fast ~75ms</SelectItem>
              <SelectItem value="eleven_turbo_v2.5">Turbo v2.5 (7 credits) - Balanced</SelectItem>
              <SelectItem value="eleven_multilingual_v2">Multilingual v2 (10 credits) - 29 languages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ElevenLabs Connection Banner (only show for ElevenLabs) */}
      {provider === 'elevenlabs' && !elevenLabs.connected && (
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <UserCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600 dark:text-[#DC143C] mb-2">
                🎭 Use Your Own Voice!
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                Connect your ElevenLabs account to use voices you&apos;ve verified on elevenlabs.io
              </p>
              <Button
                onClick={() => setShowConnectionModal(true)}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600 text-base-content"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Connect ElevenLabs
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ElevenLabs Connected Status */}
      {provider === 'elevenlabs' && elevenLabs.connected && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                ✨ {elevenLabs.voices.length} verified voice{elevenLabs.voices.length !== 1 ? 's' : ''} available
              </span>
            </div>
            <Button
              onClick={() => elevenLabs.syncVoices()}
              size="sm"
              variant="ghost"
              disabled={elevenLabs.loading}
              className="text-xs"
            >
              {elevenLabs.loading ? 'Syncing...' : 'Sync Voices'}
            </Button>
          </div>
        </div>
      )}

      {/* Text Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎤 Text to Convert</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to convert to speech..."
          className="min-h-[150px]"
          disabled={isProcessing}
          maxLength={5000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {text.length}/5000 characters
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          🎭 Voice Style {loadingVoices && <span className="text-xs text-muted-foreground">(Loading...)</span>}
        </label>
        <Select value={voice} onValueChange={setVoice} disabled={isProcessing || loadingVoices}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {provider === 'runway' ? (
              <>
                <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                <SelectItem value="echo">Echo (Male, Deep)</SelectItem>
                <SelectItem value="fable">Fable (Male, British)</SelectItem>
                <SelectItem value="onyx">Onyx (Male, Strong)</SelectItem>
                <SelectItem value="nova">Nova (Female, Warm)</SelectItem>
                <SelectItem value="shimmer">Shimmer (Female, Bright)</SelectItem>
              </>
            ) : (
              <>
                {voices.map((v) => (
                  <SelectItem key={v.voice_id || v.id} value={v.voice_id || v.id}>
                    {v.name} {v.labels?.gender && `(${v.labels.gender})`}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Language Selection (hide for ElevenLabs - auto-detect) */}
      {provider === 'runway' && (
        <div>
          <label className="text-sm font-medium mb-2 block">🌍 Language</label>
          <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish (Español)</SelectItem>
              <SelectItem value="fr">French (Français)</SelectItem>
              <SelectItem value="de">German (Deutsch)</SelectItem>
              <SelectItem value="it">Italian (Italiano)</SelectItem>
              <SelectItem value="pt">Portuguese (Português)</SelectItem>
              <SelectItem value="ru">Russian (Русский)</SelectItem>
              <SelectItem value="ja">Japanese (日本語)</SelectItem>
              <SelectItem value="ko">Korean (한국어)</SelectItem>
              <SelectItem value="zh">Chinese (中文)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Speed Slider (only for Provider B - premium audio) */}
      {provider === 'runway' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">⚡ Speed</label>
            <span className="text-sm text-muted-foreground">{speed.toFixed(2)}×</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(values) => setSpeed(values[0])}
            min={0.5}
            max={2.0}
            step={0.1}
            disabled={isProcessing}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Slow (0.5×)</span>
            <span>Normal (1.0×)</span>
            <span>Fast (2.0×)</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !text.trim()}
        className={`w-full gap-2 ${
          provider === 'elevenlabs'
            ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Speech...
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Generate Speech with {provider === 'elevenlabs' ? 'ElevenLabs' : 'Runway'}
          </>
        )}
      </Button>

      {/* Cost Info */}
      <div className="p-3 rounded-lg bg-accent/10 border border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">💳 Cost:</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {getCreditCost()} credits
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {provider === 'elevenlabs' 
            ? `⚡ Ultra-low latency • 100+ premium voices • 29 languages`
            : `⏱️ Processing time: 10-20 seconds • 6 voices • 10 languages`
          }
        </p>
      </div>

      {/* ElevenLabs Connection Modal */}
      <ElevenLabsConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnected={(count) => {
          console.log(`ElevenLabs connected with ${count} voices`);
          elevenLabs.checkStatus();
        }}
      />
    </div>
  );
}

// =============================================================================
// TAB 2: SOUND EFFECTS
// =============================================================================

function SoundEffectsTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a sound effect prompt');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      const response = await fetch(`${apiUrl}/api/audio/sound-effect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          duration,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate sound effect: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.audio_url,
        taskId: data.task_id,
        provider: 'Wryda AI Audio',
        type: 'Sound Effect',
        duration: data.duration,
      });

    } catch (err: any) {
      console.error('[SFX] Error:', err);
      setError(err.message || 'Failed to generate sound effect');
    } finally {
      setIsProcessing(false);
    }
  };

  const examplePrompts = [
    'Thunder clap with rain',
    'Car engine starting',
    'Glass breaking',
    'Footsteps on wood floor',
    'Door creaking open',
    'Wind howling',
    'Ocean waves crashing',
    'Fire crackling',
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Prompt Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎵 Sound Effect Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the sound effect you want to generate..."
          className="min-h-[100px]"
          disabled={isProcessing}
        />
      </div>

      {/* Example Prompts */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">💡 Example Prompts:</label>
        <div className="grid grid-cols-2 gap-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              disabled={isProcessing}
              className="text-xs p-2 rounded border border-border hover:border-green-500 hover:bg-green-500/5 transition-all text-left"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">⏱️ Duration</label>
          <span className="text-sm text-muted-foreground">{duration}s</span>
        </div>
        <Slider
          value={[duration]}
          onValueChange={(values) => setDuration(values[0])}
          min={1}
          max={30}
          step={1}
          disabled={isProcessing}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 second</span>
          <span>30 seconds</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !prompt.trim()}
        className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Sound Effect...
          </>
        ) : (
          <>
            <Music className="w-4 h-4" />
            Generate Sound Effect with Runway
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~3 credits · ⏱️ Processing time: 15-30 seconds
      </p>
    </div>
  );
}

// =============================================================================
// TAB 3: VOICE ISOLATION
// =============================================================================

function VoiceIsolationTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAudioFile = (file: File): string | null => {
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      return `Invalid audio format. Supported: MP3, WAV, OGG. Your file: ${file.type}`;
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `Audio too large. Max: ${MAX_AUDIO_SIZE_MB}MB. Your file: ${fileSizeMB}MB`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const error = validateAudioFile(file);
    if (error) {
      setFileError(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAudioFile(file);
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      setError('Please upload an audio file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch(`${apiUrl}/api/audio/isolate-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to isolate voice: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.audio_url,
        taskId: data.task_id,
        provider: 'Wryda AI Audio',
        type: 'Voice Isolation',
      });

    } catch (err: any) {
      console.error('[VoiceIsolation] Error:', err);
      setError(err.message || 'Failed to isolate voice');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Audio Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎙️ Upload Audio</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {audioFile ? audioFile.name : 'Choose Audio File'}
        </Button>
        {fileError && (
          <p className="text-xs text-red-500 mt-1">{fileError}</p>
        )}
        {audioFile && !fileError && (
          <p className="text-xs text-muted-foreground mt-1">
            {(audioFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="text-xs text-blue-600 dark:text-blue-400">
            <p className="font-medium mb-1">🎤 Voice Isolation:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Removes background noise and music</li>
              <li>Isolates human voice from audio</li>
              <li>Perfect for dialogue cleanup</li>
              <li>Supports MP3, WAV, OGG formats</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !audioFile}
        className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Isolating Voice...
          </>
        ) : (
          <>
            <UserCircle className="w-4 h-4" />
            Isolate Voice with Runway
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~10 credits · ⏱️ Processing time: 20-40 seconds
      </p>
    </div>
  );
}

// =============================================================================
// TAB 4: AUDIO DUBBING
// =============================================================================

function AudioDubbingTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [preserveOriginalVoice, setPreserveOriginalVoice] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAudioFile = (file: File): string | null => {
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      return `Invalid audio format. Supported: MP3, WAV, OGG. Your file: ${file.type}`;
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `Audio too large. Max: ${MAX_AUDIO_SIZE_MB}MB. Your file: ${fileSizeMB}MB`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const error = validateAudioFile(file);
    if (error) {
      setFileError(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAudioFile(file);
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      setError('Please upload an audio file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('targetLanguage', targetLanguage);
      formData.append('preserveOriginalVoice', preserveOriginalVoice.toString());

      const response = await fetch(`${apiUrl}/api/audio/dub`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to dub audio: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.audio_url,
        taskId: data.task_id,
        provider: 'Runway',
        type: 'Audio Dubbing',
      });

    } catch (err: any) {
      console.error('[Dubbing] Error:', err);
      setError(err.message || 'Failed to dub audio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Audio Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎙️ Upload Audio</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {audioFile ? audioFile.name : 'Choose Audio File'}
        </Button>
        {fileError && (
          <p className="text-xs text-red-500 mt-1">{fileError}</p>
        )}
        {audioFile && !fileError && (
          <p className="text-xs text-muted-foreground mt-1">
            {(audioFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>

      {/* Target Language */}
      <div>
        <label className="text-sm font-medium mb-2 block">🌍 Target Language</label>
        <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isProcessing}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">Spanish (Español)</SelectItem>
            <SelectItem value="fr">French (Français)</SelectItem>
            <SelectItem value="de">German (Deutsch)</SelectItem>
            <SelectItem value="it">Italian (Italiano)</SelectItem>
            <SelectItem value="pt">Portuguese (Português)</SelectItem>
            <SelectItem value="ru">Russian (Русский)</SelectItem>
            <SelectItem value="ja">Japanese (日本語)</SelectItem>
            <SelectItem value="ko">Korean (한국어)</SelectItem>
            <SelectItem value="zh">Chinese (中文)</SelectItem>
            <SelectItem value="ar">Arabic (العربية)</SelectItem>
            <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preserve Voice Toggle */}
      <div className="flex items-center gap-2 p-3 rounded-md bg-accent/10 border border-border/50">
        <input
          type="checkbox"
          id="preserve-voice"
          checked={preserveOriginalVoice}
          onChange={(e) => setPreserveOriginalVoice(e.target.checked)}
          disabled={isProcessing}
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        />
        <label htmlFor="preserve-voice" className="text-sm cursor-pointer select-none flex-1">
          🎭 Preserve Original Voice
          <span className="block text-xs text-muted-foreground mt-0.5">
            Maintain speaker&apos;s voice characteristics in target language
          </span>
        </label>
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-500 mt-0.5" />
          <div className="text-xs text-purple-600 dark:text-[#DC143C]">
            <p className="font-medium mb-1">🌍 Audio Dubbing:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Translates speech to target language</li>
              <li>Maintains lip-sync timing</li>
              <li>Optionally preserves voice characteristics</li>
              <li>Perfect for multi-language content</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !audioFile}
        className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Dubbing Audio...
          </>
        ) : (
          <>
            <Globe className="w-4 h-4" />
            Dub Audio with Runway
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~15 credits · ⏱️ Processing time: 30-60 seconds
      </p>
    </div>
  );
}

// =============================================================================
// VOICE CLONING TAB REMOVED (Feature 0037)
// Users now clone voices on elevenlabs.io and connect their account to Wryda
// This tab has been removed - voice cloning now happens externally
// Old VoiceCloneTab component code removed (268 lines)
// =============================================================================
// ==================== TRANSCRIPTION TAB (ELEVENLABS SPEECH-TO-TEXT) ====================
function TranscriptionTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [transcript, setTranscript] = useState<any | null>(null);
  const [language, setLanguage] = useState<string>('auto');
  const [numSpeakers, setNumSpeakers] = useState<string>('1');
  const [enableDiarization, setEnableDiarization] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        setError(`File too large. Maximum size is ${MAX_AUDIO_SIZE_MB}MB`);
        return;
      }
      
      setAudioFile(file);
      setAudioUrl(''); // Clear URL if file is selected
      setError(null);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile && !audioUrl.trim()) {
      setError('Please upload an audio file or enter a URL');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTranscript(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      const formData = new FormData();
      if (audioFile) {
        formData.append('audio', audioFile);
      } else {
        formData.append('audioUrl', audioUrl);
      }
      
      if (language !== 'auto') {
        formData.append('language', language);
      }
      
      if (enableDiarization) {
        formData.append('enableDiarization', 'true');
        formData.append('numSpeakers', numSpeakers);
      }

      const response = await fetch(`${apiUrl}/api/audio/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to transcribe audio: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscript(data);
      setError(null);

    } catch (err: any) {
      console.error('[Transcription] Error:', err);
      setError(err.message || 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportTranscript = (format: 'txt' | 'srt' | 'vtt' | 'json' | 'fountain') => {
    if (!transcript) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'txt':
        content = transcript.text;
        filename = 'transcript.txt';
        mimeType = 'text/plain';
        break;
      case 'srt':
        content = generateSRT(transcript.words);
        filename = 'transcript.srt';
        mimeType = 'text/plain';
        break;
      case 'vtt':
        content = generateVTT(transcript.words);
        filename = 'transcript.vtt';
        mimeType = 'text/vtt';
        break;
      case 'fountain':
        content = generateFountain(transcript);
        filename = 'transcript.fountain';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify(transcript, null, 2);
        filename = 'transcript.json';
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSRT = (words: any[]) => {
    if (!words || words.length === 0) return '';
    
    let srt = '';
    let index = 1;
    let currentSubtitle = '';
    let startTime = 0;
    let endTime = 0;

    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    for (let i = 0; i < words.length; i++) {
      if (currentSubtitle === '') {
        startTime = words[i].start;
      }
      
      currentSubtitle += words[i].word + ' ';
      endTime = words[i].end;
      
      // Create subtitle every 10 words or at the end
      if ((i + 1) % 10 === 0 || i === words.length - 1) {
        srt += `${index}\n`;
        srt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
        srt += `${currentSubtitle.trim()}\n\n`;
        index++;
        currentSubtitle = '';
      }
    }

    return srt;
  };

  const generateVTT = (words: any[]) => {
    const srt = generateSRT(words);
    return 'WEBVTT\n\n' + srt.replace(/,/g, '.');
  };

  const generateFountain = (transcript: any) => {
    let fountain = '';
    
    // Add title page metadata
    fountain += 'Title: Transcript\n';
    fountain += `Date: ${new Date().toLocaleDateString()}\n`;
    fountain += 'Credit: Transcribed with ElevenLabs Scribe\n';
    fountain += '\n===\n\n';

    // If we have speaker diarization, format as dialogue
    if (transcript.speakers && transcript.speakers.length > 0) {
      // Build dialogue from words with speaker information
      const speakerWords: { [speakerId: string]: any[] } = {};
      
      // Group words by speaker
      transcript.words.forEach((word: any, index: number) => {
        // Find which speaker this word belongs to
        let speakerFound = false;
        for (const speaker of transcript.speakers) {
          if (speaker.words && speaker.words.includes(index)) {
            if (!speakerWords[speaker.speaker_id]) {
              speakerWords[speaker.speaker_id] = [];
            }
            speakerWords[speaker.speaker_id].push(word);
            speakerFound = true;
            break;
          }
        }
        
        // If no speaker found, add to SPEAKER 1 by default
        if (!speakerFound) {
          if (!speakerWords['SPEAKER_1']) {
            speakerWords['SPEAKER_1'] = [];
          }
          speakerWords['SPEAKER_1'].push(word);
        }
      });

      // Format as screenplay dialogue
      let currentSpeaker = '';
      let currentDialogue = '';
      let lastEndTime = 0;

      transcript.words.forEach((word: any, index: number) => {
        // Find speaker for this word
        let wordSpeaker = 'SPEAKER 1';
        for (const speaker of transcript.speakers) {
          if (speaker.words && speaker.words.includes(index)) {
            const speakerNum = transcript.speakers.indexOf(speaker) + 1;
            wordSpeaker = `SPEAKER ${speakerNum}`;
            break;
          }
        }

        // If speaker changed or there's a long pause, start new dialogue block
        const timeSinceLastWord = word.start - lastEndTime;
        if (wordSpeaker !== currentSpeaker || timeSinceLastWord > 2.0) {
          // Write previous dialogue block if exists
          if (currentDialogue.trim()) {
            fountain += `${currentSpeaker}\n`;
            fountain += `${currentDialogue.trim()}\n\n`;
          }
          
          currentSpeaker = wordSpeaker;
          currentDialogue = '';
        }

        currentDialogue += word.word + ' ';
        lastEndTime = word.end;
      });

      // Write final dialogue block
      if (currentDialogue.trim()) {
        fountain += `${currentSpeaker}\n`;
        fountain += `${currentDialogue.trim()}\n\n`;
      }
    } else {
      // No speaker diarization - format as single character or action
      // Split into paragraphs based on pauses
      let currentParagraph = '';
      let lastEndTime = 0;

      transcript.words.forEach((word: any, index: number) => {
        const timeSinceLastWord = word.start - lastEndTime;
        
        // If long pause (2+ seconds), start new paragraph
        if (timeSinceLastWord > 2.0 && currentParagraph.trim()) {
          fountain += `NARRATOR\n`;
          fountain += `${currentParagraph.trim()}\n\n`;
          currentParagraph = '';
        }

        currentParagraph += word.word + ' ';
        lastEndTime = word.end;
      });

      // Write final paragraph
      if (currentParagraph.trim()) {
        fountain += `NARRATOR\n`;
        fountain += `${currentParagraph.trim()}\n\n`;
      }
    }

    // Add notes section with metadata
    fountain += '\n[[TRANSCRIPTION METADATA]]\n';
    fountain += `[[Total Duration: ${transcript.duration || 'Unknown'}]]\n`;
    fountain += `[[Word Count: ${transcript.words?.length || 0}]]\n`;
    if (transcript.speakers) {
      fountain += `[[Speakers: ${transcript.speakers.length}]]\n`;
    }
    fountain += `[[Transcribed: ${new Date().toISOString()}]]\n`;

    return fountain;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Info Banner */}
      <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-500 mt-0.5" />
          <div className="text-xs text-purple-600 dark:text-[#DC143C]">
            <p className="font-medium mb-1">📝 Speech-to-Text with ElevenLabs Scribe:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>99 languages with auto-detection</li>
              <li>Word-level timestamps for subtitles</li>
              <li>Speaker diarization (who said what)</li>
              <li>⚡ Export to Fountain screenplay format</li>
              <li>Also export as SRT, VTT, JSON, or plain text</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload or URL Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎙️ Audio Source</label>
        
        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2 mb-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {audioFile ? audioFile.name : 'Upload Audio/Video File'}
        </Button>
        
        {/* OR divider */}
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 border-t border-border"></div>
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 border-t border-border"></div>
        </div>
        
        {/* URL Input */}
        <input
          type="url"
          value={audioUrl}
          onChange={(e) => {
            setAudioUrl(e.target.value);
            setAudioFile(null); // Clear file if URL is entered
          }}
          placeholder="Enter audio/video URL..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          disabled={isProcessing || !!audioFile}
        />
        
        {audioFile && (
          <p className="text-xs text-muted-foreground mt-1">
            • {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}
      </div>

      {/* Language Selector */}
      <div>
        <label className="text-sm font-medium mb-2 block">🌍 Language</label>
        <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect (recommended)</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="pt">Portuguese</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="ko">Korean</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Speaker Diarization */}
      <div>
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableDiarization}
            onChange={(e) => setEnableDiarization(e.target.checked)}
            disabled={isProcessing}
            className="rounded border-border"
          />
          👥 Separate Speakers (Diarization)
        </label>
        
        {enableDiarization && (
          <div className="ml-6 mt-2">
            <label className="text-xs text-muted-foreground mb-1 block">Number of Speakers</label>
            <Select value={numSpeakers} onValueChange={setNumSpeakers} disabled={isProcessing}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 speaker</SelectItem>
                <SelectItem value="2">2 speakers</SelectItem>
                <SelectItem value="3">3 speakers</SelectItem>
                <SelectItem value="4">4 speakers</SelectItem>
                <SelectItem value="5">5+ speakers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Transcribe Button */}
      <Button
        onClick={handleTranscribe}
        disabled={isProcessing || (!audioFile && !audioUrl.trim())}
        className="w-full gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Transcribing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Transcribe Audio
          </>
        )}
      </Button>

      {/* Cost Info */}
      <div className="p-3 rounded-lg bg-accent/10 border border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">💳 Cost:</span>
          <span className="text-sm font-bold text-purple-600 dark:text-[#DC143C]">
            5 credits per minute
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ⏱️ Processing time: ~30 seconds per minute of audio
        </p>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">✅ Transcription Complete</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTranscript('fountain')}
                className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/50"
              >
                ⚡ Fountain
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTranscript('srt')}
              >
                SRT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTranscript('vtt')}
              >
                VTT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTranscript('txt')}
              >
                TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTranscript('json')}
              >
                JSON
              </Button>
            </div>
          </div>

          {/* Full Text */}
          <div>
            <h5 className="text-xs font-medium mb-2">Full Transcript:</h5>
            <div className="p-3 rounded bg-accent/5 border border-border/50 max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{transcript.text}</p>
            </div>
          </div>

          {/* Word-Level Timestamps */}
          {transcript.words && transcript.words.length > 0 && (
            <div>
              <h5 className="text-xs font-medium mb-2">Word-Level Timestamps:</h5>
              <div className="p-3 rounded bg-accent/5 border border-border/50 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1 text-xs">
                  {transcript.words.slice(0, 100).map((word: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-[#DC143C]"
                      title={`${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s`}
                    >
                      {word.word}
                      <span className="text-[10px] ml-1 opacity-50">
                        [{word.start.toFixed(1)}s]
                      </span>
                    </span>
                  ))}
                  {transcript.words.length > 100 && (
                    <span className="text-muted-foreground">
                      ... and {transcript.words.length - 100} more words
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Speakers (if diarization enabled) */}
          {transcript.speakers && transcript.speakers.length > 0 && (
            <div>
              <h5 className="text-xs font-medium mb-2">Speakers:</h5>
              <div className="p-3 rounded bg-accent/5 border border-border/50">
                {transcript.speakers.map((speaker: any, i: number) => (
                  <div key={i} className="text-xs mb-2">
                    <span className="font-medium">Speaker {i + 1}:</span>{' '}
                    <span className="text-muted-foreground">
                      {speaker.words?.length || 0} words
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AudioWorkspace;

