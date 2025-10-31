'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
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
  Mic,
  X,
  Upload,
  Image as ImageIcon
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
  
  // Video mode state
  const [videoMode, setVideoMode] = useState('text-only'); // 'text-only', 'image-start', 'image-end', 'interpolation'
  const [startImage, setStartImage] = useState(null);
  const [endImage, setEndImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  
  // Character Bank state
  const [showCharacterBank, setShowCharacterBank] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [export3DModalOpen, setExport3DModalOpen] = useState(false);
  
  // Bundle state
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);
  const [bundleResults, setBundleResults] = useState([]);
  
  // Mobile-specific state
  const [showMobileCharacterBank, setShowMobileCharacterBank] = useState(false);

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

  // Handle image upload for image-to-video
  const handleImageUpload = async (file, type = 'start') => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.video.uploadImage(formData);
      const imageUrl = response.data.imageUrl;
      
      if (type === 'start') {
        setStartImage(imageUrl);
        setUploadedImageUrl(imageUrl);
        setVideoMode('image-start');
      } else {
        setEndImage(imageUrl);
        if (startImage) {
          setVideoMode('interpolation');
        }
      }
      
      toast.success(`${type === 'start' ? 'Start' : 'End'} image uploaded!`);
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    }
  };

  // Handle character selection from Character Bank
  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    if (character.images && character.images.length > 0) {
      setStartImage(character.images[0].url);
      setVideoMode('image-start');
      toast.success(`Using character: ${character.name}`);
    }
  };

  // Handle bundle generation
  const handleBundleGenerate = async (bundle) => {
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }

    setIsGeneratingBundle(true);
    setBundleResults([]);
    setSelectedBundle(bundle);

    try {
      // Generate video for each format in bundle
      const jobs = [];
      for (const format of bundle.formats) {
        const response = await api.video.generateAsync({
          prompt,
          qualityTier: quality,
          aspectRatio: format,
          duration,
          videoMode: videoMode,
          imageUrl: startImage,
          endImageUrl: endImage,
          characterRef: selectedCharacter?.id,
        });
        
        jobs.push({
          jobId: response.data.jobId,
          format,
          status: 'processing',
        });
      }
      
      setBundleResults(jobs);
      toast.success(`Bundle generation started for ${bundle.formats.length} formats!`);
      
      // Poll all jobs
      jobs.forEach(job => pollJobStatus(job.jobId, true));
    } catch (error) {
      console.error('Bundle generation error:', error);
      alert('Failed to start bundle generation');
    } finally {
      setIsGeneratingBundle(false);
    }
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
        videoMode: videoMode,
        imageUrl: startImage,
        endImageUrl: endImage,
        characterRef: selectedCharacter?.id,
      });

      setResult({
        jobId: response.data.jobId,
        status: 'processing',
        estimatedTime: qualityTiers.find(t => t.id === quality).time,
      });

      // Poll for status
      pollJobStatus(response.data.jobId);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to start video generation. Please try again.');
      setIsGenerating(false);
    }
  };

  const pollJobStatus = async (jobId, isBundle = false) => {
    const interval = setInterval(async () => {
      try {
        const status = await api.video.getJobStatus(jobId);
        
        if (status.data.status === 'completed') {
          if (isBundle) {
            // Update bundle results
            setBundleResults(prev => prev.map(job => 
              job.jobId === jobId 
                ? { ...job, status: 'completed', videoUrl: status.data.videoUrl }
                : job
            ));
            
            // Check if all bundle jobs are complete
            const allComplete = bundleResults.every(job => 
              job.jobId === jobId || job.status === 'completed'
            );
            if (allComplete) {
              toast.success('Bundle generation complete!');
            }
          } else {
            setResult({
              jobId,
              status: 'completed',
              videoUrl: status.data.videoUrl,
            });
            setIsGenerating(false);
            toast.success('Video generated successfully!');
          }
          clearInterval(interval);
        } else if (status.data.status === 'failed') {
          if (isBundle) {
            setBundleResults(prev => prev.map(job => 
              job.jobId === jobId 
                ? { ...job, status: 'failed', error: status.data.error }
                : job
            ));
          } else {
            setResult({
              jobId,
              status: 'failed',
              error: status.data.error,
            });
            setIsGenerating(false);
            toast.error('Video generation failed');
          }
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

      <div className="max-w-6xl mx-auto p-6 pb-32 lg:pb-6">
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

            {/* Video Mode Selector */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <Video className="w-5 h-5 text-cinema-blue" />
                  Video Mode
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setVideoMode('text-only')}
                    className={`btn ${videoMode === 'text-only' ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isGenerating}
                  >
                    📝 Text Only
                  </button>
                  <button
                    onClick={() => setVideoMode('image-start')}
                    className={`btn ${videoMode === 'image-start' ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isGenerating}
                  >
                    🖼️ Image Start
                  </button>
                  <button
                    onClick={() => setVideoMode('image-end')}
                    className={`btn ${videoMode === 'image-end' ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isGenerating}
                  >
                    🎬 Image End
                  </button>
                  <button
                    onClick={() => setVideoMode('interpolation')}
                    className={`btn ${videoMode === 'interpolation' ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isGenerating}
                  >
                    🔄 Interpolation
                  </button>
                </div>
                <p className="text-xs opacity-60 mt-2">
                  {videoMode === 'text-only' && '✨ Generate video from text prompt only'}
                  {videoMode === 'image-start' && '🖼️ Start video from your image'}
                  {videoMode === 'image-end' && '🎬 End video at your image'}
                  {videoMode === 'interpolation' && '🔄 Transition between two images'}
                </p>
              </div>
            </div>

            {/* Image Upload (show if not text-only) */}
            {videoMode !== 'text-only' && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">
                    <ImageIcon className="w-5 h-5 text-cinema-gold" />
                    Upload Images
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Image */}
                    {(videoMode === 'image-start' || videoMode === 'interpolation') && (
                      <div>
                        <label className="label">
                          <span className="label-text font-semibold">
                            {videoMode === 'interpolation' ? 'Start Image' : 'Reference Image'}
                          </span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'start')}
                          className="file-input file-input-bordered w-full"
                          disabled={isGenerating}
                        />
                        {startImage && (
                          <div className="mt-2 relative">
                            <img src={startImage} alt="Start" className="w-full h-32 object-cover rounded" />
                            <button
                              onClick={() => { setStartImage(null); setVideoMode('text-only'); }}
                              className="btn btn-xs btn-circle btn-error absolute top-1 right-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* End Image (only for interpolation) */}
                    {videoMode === 'interpolation' && (
                      <div>
                        <label className="label">
                          <span className="label-text font-semibold">End Image</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'end')}
                          className="file-input file-input-bordered w-full"
                          disabled={isGenerating}
                        />
                        {endImage && (
                          <div className="mt-2 relative">
                            <img src={endImage} alt="End" className="w-full h-32 object-cover rounded" />
                            <button
                              onClick={() => setEndImage(null)}
                              className="btn btn-xs btn-circle btn-error absolute top-1 right-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* End Image Upload (for image-end mode) */}
                    {videoMode === 'image-end' && (
                      <div>
                        <label className="label">
                          <span className="label-text font-semibold">Target End Image</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'end')}
                          className="file-input file-input-bordered w-full"
                          disabled={isGenerating}
                        />
                        {endImage && (
                          <div className="mt-2 relative">
                            <img src={endImage} alt="End" className="w-full h-32 object-cover rounded" />
                            <button
                              onClick={() => setEndImage(null)}
                              className="btn btn-xs btn-circle btn-error absolute top-1 right-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedCharacter && (
                    <div className="alert alert-success mt-2">
                      <Check className="w-5 h-5" />
                      <span>Using character: <strong>{selectedCharacter.name}</strong></span>
                      <button
                        onClick={() => { setSelectedCharacter(null); setStartImage(null); }}
                        className="btn btn-xs btn-ghost"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      onClick={() => handleBundleGenerate(bundle)}
                      className={`card bg-base-300 border border-cinema-gold/30 hover:border-cinema-gold cursor-pointer transition-all hover:shadow-lg ${
                        isGeneratingBundle && selectedBundle?.id === bundle.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
                        {isGeneratingBundle && selectedBundle?.id === bundle.id && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="loading loading-spinner loading-sm"></span>
                            Generating...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bundle Results */}
                {bundleResults.length > 0 && (
                  <div className="mt-4 p-4 bg-base-300 rounded-lg">
                    <h3 className="font-bold mb-2">Bundle Progress</h3>
                    <div className="space-y-2">
                      {bundleResults.map((job) => (
                        <div key={job.jobId} className="flex items-center justify-between p-2 bg-base-200 rounded">
                          <span className="font-medium">{job.format}</span>
                          <div className="flex items-center gap-2">
                            {job.status === 'processing' && (
                              <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="text-xs opacity-60">Processing...</span>
                              </>
                            )}
                            {job.status === 'completed' && (
                              <>
                                <Check className="w-5 h-5 text-success" />
                                <a href={job.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-primary">
                                  View
                                </a>
                              </>
                            )}
                            {job.status === 'failed' && (
                              <>
                                <X className="w-5 h-5 text-error" />
                                <span className="text-xs text-error">Failed</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
      
      {/* Character Bank Sidebar - Desktop Only */}
      <div className="w-96 border-l border-base-300 bg-base-100 hidden lg:block">
        <CharacterBank onCharacterSelect={handleCharacterSelect} />
      </div>

      {/* Mobile FAB - Generate Button */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="btn btn-lg w-full bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none shadow-2xl"
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner"></span>
              Generating...
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              Generate • {calculateCost()} cr
            </>
          )}
        </button>
      </div>

      {/* Mobile Character Bank Button */}
      <button
        onClick={() => setShowMobileCharacterBank(true)}
        className="lg:hidden fixed bottom-24 right-6 btn btn-circle btn-lg bg-cinema-gold text-base-100 shadow-2xl z-50 border-none hover:bg-cinema-gold/90"
        title="Character Bank"
      >
        <Users className="w-6 h-6" />
      </button>

      {/* Mobile Character Bank Drawer */}
      {showMobileCharacterBank && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setShowMobileCharacterBank(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl max-h-[80vh] overflow-hidden shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cinema-gold" />
                <h3 className="font-bold text-lg">Character Bank</h3>
              </div>
              <button 
                onClick={() => setShowMobileCharacterBank(false)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(80vh-5rem)] pb-safe">
              <CharacterBank onCharacterSelect={(char) => {
                handleCharacterSelect(char);
                setShowMobileCharacterBank(false);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

