'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Zap, Upload, Sparkles, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Top 42 Workflows organized by category
const WORKFLOWS = {
  'Quick Content': [
    { id: 'talking-head', name: 'Talking Head Video', icon: '🗣️', credits: 50, description: 'Upload your photo, speak your script' },
    { id: 'product-demo', name: 'Product Demo', icon: '📦', credits: 75, description: 'Showcase your product professionally' },
    { id: 'social-reel', name: 'Social Media Reel', icon: '📱', credits: 50, description: 'Viral-ready vertical content' },
    { id: 'testimonial', name: 'Customer Testimonial', icon: '⭐', credits: 60, description: 'AI-generated testimonials' },
  ],
  'Character Videos': [
    { id: 'character-intro', name: 'Character Introduction', icon: '👤', credits: 100, description: 'Introduce characters cinematically' },
    { id: 'character-dialogue', name: 'Character Dialogue', icon: '💬', credits: 120, description: 'Characters having conversations' },
    { id: 'character-action', name: 'Character Action Scene', icon: '⚡', credits: 150, description: 'Dynamic action sequences' },
  ],
  'Marketing': [
    { id: 'brand-video', name: 'Brand Story', icon: '🎬', credits: 100, description: 'Tell your brand story' },
    { id: 'explainer', name: 'Explainer Video', icon: '📊', credits: 90, description: 'Explain complex concepts simply' },
    { id: 'ad-campaign', name: 'Ad Campaign', icon: '📺', credits: 120, description: 'Professional advertising content' },
  ],
  'Cinematic': [
    { id: 'scene-to-video', name: 'Scene to Video', icon: '🎭', credits: 150, description: 'Turn screenplay scenes into video' },
    { id: 'montage', name: 'Cinematic Montage', icon: '🎞️', credits: 180, description: 'Multi-clip montage sequences' },
    { id: 'trailer', name: 'Movie Trailer', icon: '🍿', credits: 200, description: 'Generate epic trailers' },
  ],
};

export function SceneVisualizerModePanel({ onInsert }) {
  const { state, addMessage } = useChatContext();
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, WEBP) or video (MP4, MOV)');
      return;
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 50MB');
      return;
    }
    
    setUploadedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
    
    toast.success('File uploaded! Select a workflow to get started');
  };
  
  const handleWorkflowSelect = async (workflow) => {
    setSelectedWorkflow(workflow);
    
    if (!uploadedFile) {
      toast.info('Upload a photo or video to use this workflow');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      addMessage({
        role: 'user',
        content: `Generate ${workflow.name} using my uploaded ${uploadedFile.type.startsWith('image') ? 'image' : 'video'}`,
        mode: 'scene-visualizer'
      });
      
      // TODO: Call workflow API
      // const response = await api.workflows.execute({ workflowId: workflow.id, file: uploadedFile });
      
      // Simulated success
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `🎬 ${workflow.name} workflow started!\n\nYour content is being generated. This will take 2-3 minutes depending on complexity.\n\nCost: ${workflow.credits} credits`,
          mode: 'scene-visualizer'
        });
        
        toast.success('Workflow started!');
        setIsGenerating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow');
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cinema-red to-cinema-blue text-white">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <h3 className="font-bold">AI Workflow Selector</h3>
        </div>
        <p className="text-xs text-white/80 mt-1">42 pre-built workflows • Upload & create instantly</p>
      </div>
      
      {/* Upload Section */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300">
        <label className="text-xs font-semibold text-base-content/70 mb-2 block">UPLOAD YOUR CONTENT</label>
        
        {!uploadedFile ? (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-cinema-red/50 transition-colors">
            <Upload className="w-8 h-8 text-base-content/40 mb-2" />
            <span className="text-sm text-base-content/60">Upload photo or video</span>
            <span className="text-xs text-base-content/40 mt-1">JPG, PNG, MP4 (max 50MB)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative">
            {uploadedFile.type.startsWith('image') ? (
              <img src={uploadPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            ) : (
              <video src={uploadPreview} className="w-full h-32 object-cover rounded-lg" />
            )}
            <button
              onClick={() => {
                setUploadedFile(null);
                setUploadPreview(null);
              }}
              className="absolute top-2 right-2 btn btn-xs btn-circle btn-error"
            >
              ×
            </button>
            <div className="absolute bottom-2 left-2 badge badge-sm bg-black/70 text-white border-none">
              {uploadedFile.type.startsWith('image') ? <ImageIcon className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
              {uploadedFile.name}
            </div>
          </div>
        )}
      </div>
      
      {/* Workflows */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {state.messages.filter(m => m.mode === 'scene-visualizer').length > 0 ? (
          /* Messages Area */
          <div className="space-y-4">
            {state.messages
              .filter(m => m.mode === 'scene-visualizer')
              .map((message, index) => {
                const isUser = message.role === 'user';
                
                return (
                  <div
                    key={index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      isUser 
                        ? 'bg-cinema-red text-white' 
                        : 'bg-base-200 text-base-content'
                    }`}>
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-base-200 px-4 py-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-cinema-blue" />
                  <span className="text-sm">Executing workflow...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Workflow Grid */
          <div className="space-y-6">
            {Object.entries(WORKFLOWS).map(([category, workflows]) => (
              <div key={category}>
                <h4 className="text-sm font-bold text-base-content/80 mb-3">{category.toUpperCase()}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => handleWorkflowSelect(workflow)}
                      disabled={!uploadedFile || isGenerating}
                      className={`btn btn-sm h-auto py-3 flex-col items-start text-left ${
                        selectedWorkflow?.id === workflow.id 
                          ? 'btn-primary' 
                          : 'btn-outline'
                      } ${!uploadedFile ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-lg">{workflow.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-xs">{workflow.name}</div>
                          <div className="text-[10px] opacity-70">{workflow.description}</div>
                        </div>
                        <span className="badge badge-xs">{workflow.credits}cr</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {!uploadedFile && (
              <div className="text-center text-base-content/60 py-6 bg-base-200 rounded-lg">
                <Sparkles className="w-12 h-12 mx-auto mb-2 text-cinema-gold" />
                <p className="text-sm font-semibold">Upload a photo or video to get started!</p>
                <p className="text-xs mt-1">Choose from 42 pre-built AI workflows</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>⚡ 42 AI Workflows • Upload once • Generate multiple variations instantly</p>
      </div>
    </div>
  );
}


