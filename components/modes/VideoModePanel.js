'use client';

import { useState, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { Film, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { CloudSavePrompt } from '@/components/CloudSavePrompt';

export function VideoModePanel({ onInsert }) {
  const { state, addMessage } = useChatContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  
  // Video settings
  const [videoMode, setVideoMode] = useState('text-only'); // 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images'
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [qualityTier, setQualityTier] = useState('professional');
  
  // Image uploads
  const [startImage, setStartImage] = useState(null);
  const [endImage, setEndImage] = useState(null);
  const [referenceImages, setReferenceImages] = useState([null, null, null]);
  
  const startImageRef = useRef(null);
  const endImageRef = useRef(null);
  const refImage1Ref = useRef(null);
  const refImage2Ref = useRef(null);
  const refImage3Ref = useRef(null);
  
  // Cloud save prompt state
  const [cloudSavePrompt, setCloudSavePrompt] = useState({
    isOpen: false,
    fileUrl: null,
    fileType: 'video',
    fileName: null,
    metadata: {}
  });
  
  const videoModes = [
    { value: 'text-only', label: 'Text Only', icon: '📝', description: 'Pure text-to-video' },
    { value: 'image-start', label: 'Image Start', icon: '📸', description: 'Animate from image' },
    { value: 'image-interpolation', label: 'First & Last', icon: '🎬', description: 'Between 2 frames' },
    { value: 'reference-images', label: 'Character Ref', icon: '🎭', description: 'Consistency (1-3 imgs)' }
  ];
  
  const aspectRatios = [
    { value: '16:9', label: 'YouTube (16:9)', icon: '🎥' },
    { value: '9:16', label: 'TikTok (9:16)', icon: '📱' },
    { value: '1:1', label: 'Instagram (1:1)', icon: '⬛' },
    { value: '4:3', label: 'Facebook (4:3)', icon: '📺' },
    { value: '21:9', label: 'Cinema (21:9)', icon: '🎬', premium: true }
  ];
  
  const qualityTiers = [
    { value: 'professional', label: 'Professional (1080p)', credits: 50 },
    { value: 'premium', label: 'Premium 4K', credits: 75 },
    { value: 'ultra', label: 'Ultra Native 4K', credits: 100 }
  ];
  
  // Image upload handlers
  const handleImageUpload = (file, type, index = null) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20MB');
      return;
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    file.preview = previewUrl;
    
    if (type === 'start') {
      setStartImage(file);
    } else if (type === 'end') {
      setEndImage(file);
    } else if (type === 'reference' && index !== null) {
      const newRefs = [...referenceImages];
      newRefs[index] = file;
      setReferenceImages(newRefs);
    }
  };
  
  const clearImage = (type, index = null) => {
    if (type === 'start') {
      if (startImage?.preview) URL.revokeObjectURL(startImage.preview);
      setStartImage(null);
    } else if (type === 'end') {
      if (endImage?.preview) URL.revokeObjectURL(endImage.preview);
      setEndImage(null);
    } else if (type === 'reference' && index !== null) {
      const newRefs = [...referenceImages];
      if (newRefs[index]?.preview) URL.revokeObjectURL(newRefs[index].preview);
      newRefs[index] = null;
      setReferenceImages(newRefs);
    }
  };
  
  // Upload image to backend
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.video.uploadImage(formData);
    return {
      s3Key: response.data.s3Key,
      url: response.data.url
    };
  };
  
  const handleGenerate = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;
    
    // Validate images based on mode
    if (videoMode === 'image-start' && !startImage) {
      toast.error('Please upload a start image');
      return;
    }
    if (videoMode === 'image-interpolation' && (!startImage || !endImage)) {
      toast.error('Please upload both start and end images');
      return;
    }
    if (videoMode === 'reference-images' && !referenceImages.some(img => img !== null)) {
      toast.error('Please upload at least 1 reference image');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'video'
      });
      
      // Upload images if needed
      let requestData = {
        prompt: prompt.trim(),
        videoMode,
        aspectRatio,
        qualityTier
      };
      
      if (videoMode === 'image-start' && startImage) {
        toast.loading('Uploading start image...');
        const uploaded = await uploadImage(startImage);
        requestData.startImageS3Key = uploaded.s3Key;
        requestData.startImageUrl = uploaded.url;
        toast.dismiss();
      }
      
      if (videoMode === 'image-interpolation' && startImage && endImage) {
        toast.loading('Uploading images...');
        const [uploadedStart, uploadedEnd] = await Promise.all([
          uploadImage(startImage),
          uploadImage(endImage)
        ]);
        requestData.startImageS3Key = uploadedStart.s3Key;
        requestData.startImageUrl = uploadedStart.url;
        requestData.endImageS3Key = uploadedEnd.s3Key;
        requestData.endImageUrl = uploadedEnd.url;
        toast.dismiss();
      }
      
      if (videoMode === 'reference-images') {
        const validRefs = referenceImages.filter(img => img !== null);
        if (validRefs.length > 0) {
          toast.loading(`Uploading ${validRefs.length} reference image(s)...`);
          const uploaded = await Promise.all(validRefs.map(img => uploadImage(img)));
          requestData.referenceImageS3Keys = uploaded.map(u => u.s3Key);
          requestData.referenceImageUrls = uploaded.map(u => u.url);
          toast.dismiss();
        }
      }
      
      // Call API
      const response = await api.video.generateAsync(requestData);
      
      // Add success message with save reminder
      addMessage({
        role: 'assistant',
        content: `✅ Video generation started! Job ID: ${response.data.jobId}\n\nYour video is being generated. You can check the status in the Jobs tab or continue working - we'll notify you when it's ready!\n\n⚠️ **Remember**: Videos are stored with 7-day expiration. Download or save to cloud storage once complete.`,
        mode: 'video',
        jobId: response.data.jobId
      });
      
      setGeneratedVideo(response.data);
      toast.success('Video generation started!');
      
      // NOTE: Cloud save prompt for videos will trigger when the video completes processing
      // This is handled by the job status polling or webhook notification
      // For now, we remind users in the message above
      
      // Clear images
      clearImage('start');
      clearImage('end');
      setReferenceImages([null, null, null]);
      
      if (onInsert) {
        onInsert({ type: 'video_job', jobId: response.data.jobId });
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error(error.response?.data?.message || 'Failed to generate video');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, video generation failed. Please try again or contact support if the issue persists.',
        mode: 'video'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">Quick Video Generation</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">Generate professional video clips from text prompts</p>
      </div>
      
      {/* Settings */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 space-y-3 max-h-[50vh] overflow-y-auto">
        {/* Video Mode */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">VIDEO MODE</label>
          <div className="grid grid-cols-2 gap-2">
            {videoModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setVideoMode(mode.value)}
                className={`btn btn-sm flex-col h-auto py-2 ${
                  videoMode === mode.value 
                    ? 'btn-primary' 
                    : 'btn-outline'
                }`}
                title={mode.description}
              >
                <span className="text-lg">{mode.icon}</span>
                <span className="text-xs">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Image Upload - Start Image */}
        {(videoMode === 'image-start' || videoMode === 'image-interpolation') && (
          <div>
            <label className="text-xs font-semibold text-base-content/70 mb-2 block">
              {videoMode === 'image-interpolation' ? 'FIRST FRAME' : 'START IMAGE'}
            </label>
            <input
              ref={startImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files[0], 'start')}
            />
            {startImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-cinema-red/30">
                <img src={startImage.preview} alt="Start" className="w-full h-full object-cover" />
                <button
                  onClick={() => clearImage('start')}
                  className="absolute top-2 right-2 btn btn-xs btn-circle btn-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => startImageRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-base-content/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cinema-red/50 hover:bg-base-300 transition-colors"
              >
                <Upload className="w-8 h-8 text-base-content/50" />
                <span className="text-xs text-base-content/60">Click to upload</span>
              </button>
            )}
          </div>
        )}
        
        {/* Image Upload - End Image */}
        {videoMode === 'image-interpolation' && (
          <div>
            <label className="text-xs font-semibold text-base-content/70 mb-2 block">LAST FRAME</label>
            <input
              ref={endImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files[0], 'end')}
            />
            {endImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-cinema-red/30">
                <img src={endImage.preview} alt="End" className="w-full h-full object-cover" />
                <button
                  onClick={() => clearImage('end')}
                  className="absolute top-2 right-2 btn btn-xs btn-circle btn-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => endImageRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-base-content/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cinema-red/50 hover:bg-base-300 transition-colors"
              >
                <Upload className="w-8 h-8 text-base-content/50" />
                <span className="text-xs text-base-content/60">Click to upload</span>
              </button>
            )}
          </div>
        )}
        
        {/* Reference Images */}
        {videoMode === 'reference-images' && (
          <div>
            <label className="text-xs font-semibold text-base-content/70 mb-2 block">
              REFERENCE IMAGES (1-3)
              <span className="ml-2 text-[10px] opacity-60">For character/location consistency</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => {
                const img = referenceImages[index];
                const inputRef = index === 0 ? refImage1Ref : index === 1 ? refImage2Ref : refImage3Ref;
                
                return (
                  <div key={index}>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'reference', index)}
                    />
                    {img ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-cinema-gold/30">
                        <img src={img.preview} alt={`Ref ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => clearImage('reference', index)}
                          className="absolute top-1 right-1 btn btn-xs btn-circle btn-error"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="w-full aspect-square border-2 border-dashed border-base-content/30 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-cinema-gold/50 hover:bg-base-300 transition-colors"
                      >
                        <ImageIcon className="w-6 h-6 text-base-content/40" />
                        <span className="text-[10px] text-base-content/50">{index + 1}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-base-content/50 mt-1">💡 Tip: Use front, side, and 3/4 angles for best results</p>
          </div>
        )}
        
        {/* Aspect Ratio */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">ASPECT RATIO</label>
          <div className="grid grid-cols-2 gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                className={`btn btn-sm ${
                  aspectRatio === ratio.value 
                    ? 'btn-primary' 
                    : 'btn-outline'
                } ${ratio.premium ? 'border-cinema-gold/50' : ''}`}
              >
                <span className="mr-1">{ratio.icon}</span>
                {ratio.label}
                {ratio.premium && <span className="badge badge-xs ml-1">+15cr</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quality Tier */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">QUALITY</label>
          <div className="space-y-1">
            {qualityTiers.map((tier) => (
              <button
                key={tier.value}
                onClick={() => setQualityTier(tier.value)}
                className={`btn btn-sm w-full justify-between ${
                  qualityTier === tier.value 
                    ? 'btn-primary' 
                    : 'btn-ghost'
                }`}
              >
                <span>{tier.label}</span>
                <span className="badge badge-sm">{tier.credits} cr</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'video')
          .map((message, index) => {
            const isUser = message.role === 'user';
            
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  isUser 
                    ? 'bg-cinema-red text-base-content' 
                    : 'bg-base-200 text-base-content'
                }`}>
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Loading state */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-base-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cinema-blue" />
              <span className="text-sm">Generating video...</span>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'video').length === 0 && !isGenerating && (
          <div className="text-center text-base-content/60 py-10">
            <Film className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Generate Quick Videos</p>
            <p className="text-sm mb-6">Describe the video you want to create</p>
            
            {/* Quick actions */}
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs font-semibold text-base-content/60 mb-2">QUICK ACTIONS:</p>
              <button
                onClick={() => handleGenerate('A cinematic sunset over the ocean, golden hour lighting')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Cinematic Sunset
              </button>
              <button
                onClick={() => handleGenerate('A character walking through a busy city street, tracking shot')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Urban Tracking Shot
              </button>
              <button
                onClick={() => handleGenerate('Dramatic establishing shot of a modern office building')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Establishing Shot
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>💡 Tip: Be specific about camera movements, lighting, and mood for best results</p>
      </div>
    </div>
  );
}

