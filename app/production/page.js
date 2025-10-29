'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { VoiceProfileModal } from '@/components/production/VoiceProfileModal';
import { Export3DModal } from '@/components/production/Export3DModal';
import CharacterBank from '@/components/production/CharacterBank';
import { 
  Video, 
  Zap, 
  Youtube, 
  Instagram,
  Film,
  Globe,
  Sparkles,
  Clock,
  Check,
  Users,
  Box,
  Mic
} from 'lucide-react';

// Platform icons mapping
const PlatformIcon = ({ platform }) => {
  const icons = {
    'youtube': Youtube,
    'tiktok': Video,
    'instagram': Instagram,
    'facebook': Instagram,
    'cinema': Film,
  };
  const Icon = icons[platform] || Video;
  return <Icon className="w-5 h-5" />;
};

export default function ProductionPage() {
  const { user } = useUser();
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState('professional');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(50);
  
  // Character Bank state
  const [showCharacterBank, setShowCharacterBank] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [export3DModalOpen, setExport3DModalOpen] = useState(false);

  const qualityTiers = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'High-quality 1080p',
      baseCost: 50,
      resolution: '1080p',
      time: '30-60s',
    },
    {
      id: 'premium',
      name: 'Premium 4K',
      description: 'Enhanced 4K quality',
      baseCost: 75,
      resolution: '4K',
      time: '60-90s',
      popular: true,
    },
    {
      id: 'ultra',
      name: 'Ultra Native 4K',
      description: 'Maximum quality',
      baseCost: 150,
      resolution: '4K Native',
      time: '90-120s',
    },
  ];

  const aspectRatios = [
    { id: '16:9', name: 'YouTube', platform: 'youtube', icon: '📺', description: 'Landscape', multiplier: 1 },
    { id: '9:16', name: 'TikTok', platform: 'tiktok', icon: '📱', description: 'Vertical', multiplier: 1, badge: 'Popular' },
    { id: '1:1', name: 'Instagram', platform: 'instagram', icon: '⬛', description: 'Square', multiplier: 1 },
    { id: '4:3', name: 'Facebook', platform: 'facebook', icon: '📷', description: 'Classic', multiplier: 1 },
    { id: '21:9', name: 'Cinema', platform: 'cinema', icon: '🎬', description: 'Ultra Wide', multiplier: 1.3, premium: true },
  ];

  const bundles = [
    {
      id: 'social',
      name: 'Social Bundle',
      formats: ['16:9', '9:16', '1:1'],
      cost: 120,
      savings: 30,
      description: 'All 3 formats',
    },
    {
      id: 'filmmaker',
      name: 'Filmmaker Bundle',
      formats: ['16:9', '21:9'],
      cost: 100,
      savings: 15,
      description: 'Standard + Cinema',
    },
  ];

  // Calculate cost
  const calculateCost = () => {
    const tier = qualityTiers.find(t => t.id === quality);
    const ratio = aspectRatios.find(r => r.id === aspectRatio);
    const baseCost = tier.baseCost * (duration / 5);
    const multiplier = ratio?.multiplier || 1;
    return Math.round(baseCost * multiplier);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await api.video.generateAsync({
        prompt,
        qualityTier: quality,
        aspectRatio,
        duration,
        videoMode: 'text-only',
      });

      setResult({
        jobId: response.data.jobId,
        status: 'processing',
        estimatedTime: qualityTiers.find(t => t.id === quality).time,
      });

      // Poll for status (in real implementation, use webhooks or SSE)
      pollJobStatus(response.data.jobId);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to start video generation. Please try again.');
      setIsGenerating(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const status = await api.video.getJobStatus(jobId);
        
        if (status.data.status === 'completed') {
          setResult({
            jobId,
            status: 'completed',
            videoUrl: status.data.videoUrl,
          });
          setIsGenerating(false);
          clearInterval(interval);
        } else if (status.data.status === 'failed') {
          setResult({
            jobId,
            status: 'failed',
            error: status.data.error,
          });
          setIsGenerating(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">AI Video Generation 🎬</h1>
            <p className="text-white/80">Create professional videos from text in seconds</p>
          </div>
        </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <Sparkles className="w-5 h-5 text-cinema-gold" />
                  What do you want to create?
                </h2>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video... (e.g., 'A cinematic sunset over the ocean with waves crashing')"
                  className="textarea textarea-bordered textarea-lg w-full min-h-32"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Quality Tier */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Quality Tier</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {qualityTiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setQuality(tier.id)}
                      className={`btn btn-lg flex-col h-auto py-4 ${
                        quality === tier.id
                          ? 'bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none'
                          : 'btn-outline'
                      }`}
                      disabled={isGenerating}
                    >
                      {tier.popular && (
                        <span className="badge badge-success badge-sm absolute top-2 right-2">
                          Popular
                        </span>
                      )}
                      <span className="font-bold">{tier.name}</span>
                      <span className="text-sm opacity-80">{tier.resolution}</span>
                      <span className="text-xs opacity-60">{tier.baseCost} cr/5s</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Platform / Aspect Ratio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`btn flex-col h-auto py-4 relative ${
                        aspectRatio === ratio.id
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                      disabled={isGenerating}
                    >
                      {ratio.badge && (
                        <span className="badge badge-sm badge-accent absolute top-1 right-1">
                          {ratio.badge}
                        </span>
                      )}
                      {ratio.premium && (
                        <span className="badge badge-sm badge-warning absolute top-1 right-1">
                          +15cr
                        </span>
                      )}
                      <span className="text-2xl">{ratio.icon}</span>
                      <span className="text-sm font-bold">{ratio.name}</span>
                      <span className="text-xs opacity-60">{ratio.description}</span>
                    </button>
                  ))}
                </div>

                {/* Bundles */}
                <div className="divider">Or get multiple formats</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="card bg-base-300 border border-cinema-gold/30 hover:border-cinema-gold cursor-pointer"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">{bundle.name}</h3>
                            <p className="text-xs opacity-60">{bundle.description}</p>
                            <div className="flex gap-1 mt-2">
                              {bundle.formats.map(f => (
                                <span key={f} className="badge badge-sm">{f}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-cinema-gold">{bundle.cost} cr</p>
                            <p className="text-xs text-success">Save {bundle.savings}!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <Clock className="w-5 h-5" />
                  Duration
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDuration(5)}
                    className={`btn btn-lg ${duration === 5 ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isGenerating}
                  >
                    5 seconds
                  </button>
                  <button
                    onClick={() => setDuration(10)}
                    className={`btn btn-lg ${duration === 10 ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isGenerating}
                  >
                    10 seconds (2× cost)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Cost & Generate */}
          <div className="space-y-6">
            {/* Cost Estimate */}
            <div className="card bg-gradient-to-br from-cinema-red/10 to-cinema-blue/10 border border-cinema-red/30 shadow-xl sticky top-6">
              <div className="card-body">
                <h2 className="card-title text-2xl">
                  <Zap className="w-6 h-6 text-cinema-gold" />
                  Cost
                </h2>
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-cinema-red">
                    {calculateCost()}
                  </p>
                  <p className="text-sm opacity-60">credits</p>
                </div>

                <div className="divider"></div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-60">Quality:</span>
                    <span className="font-semibold">{qualityTiers.find(t => t.id === quality)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Format:</span>
                    <span className="font-semibold">{aspectRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Duration:</span>
                    <span className="font-semibold">{duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Est. Time:</span>
                    <span className="font-semibold">{qualityTiers.find(t => t.id === quality)?.time}</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none w-full mt-4"
                >
                  {isGenerating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Generate Video
                    </>
                  )}
                </button>

                <p className="text-xs text-center opacity-50 mt-2">
                  Provider-agnostic • Best quality automatically selected
                </p>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">
                    {result.status === 'processing' && '⏳ Processing...'}
                    {result.status === 'completed' && '✅ Complete!'}
                    {result.status === 'failed' && '❌ Failed'}
                  </h3>
                  
                  {result.status === 'processing' && (
                    <div>
                      <p className="text-sm opacity-60 mb-2">Job ID: {result.jobId}</p>
                      <p className="text-sm">Estimated time: {result.estimatedTime}</p>
                      <progress className="progress progress-primary w-full mt-2"></progress>
                    </div>
                  )}
                  
                  {result.status === 'completed' && (
                    <div>
                      <video 
                        src={result.videoUrl} 
                        controls 
                        className="w-full rounded-lg"
                      />
                      <div className="flex gap-2 mt-4">
                        <button className="btn btn-primary flex-1">Download</button>
                        <button className="btn btn-outline">Share</button>
                      </div>
                    </div>
                  )}
                  
                  {result.status === 'failed' && (
                    <div>
                      <p className="text-error text-sm">{result.error || 'Generation failed'}</p>
                      <button 
                        onClick={() => setResult(null)}
                        className="btn btn-outline btn-sm mt-2"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Character Bank Sidebar */}
      <div className="w-96 border-l border-base-300 bg-base-100 hidden lg:block">
        <CharacterBank />
      </div>
    </div>
  );
}

