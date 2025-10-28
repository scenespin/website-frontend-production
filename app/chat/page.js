'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Send, Sparkles, Video, Image, Music, Zap } from 'lucide-react';

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI creative assistant. I can help you generate videos, images, music, and more! What would you like to create today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Analyze the user's intent
      const intent = analyzeIntent(input);

      if (intent.type === 'video') {
        // Generate video based on natural language
        const assistantMessage = {
          role: 'assistant',
          content: `🎬 Generating your ${intent.quality || 'Professional'} video${intent.aspectRatio ? ` for ${intent.platform}` : ''}...`,
          timestamp: new Date(),
          generating: true,
        };
        setMessages(prev => [...prev, assistantMessage]);

        const response = await api.video.generateAsync({
          prompt: intent.prompt,
          qualityTier: intent.quality?.toLowerCase() || 'professional',
          aspectRatio: intent.aspectRatio || '16:9',
          duration: intent.duration || 5,
        });

        // Update with job ID
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 
            ? { 
                ...msg, 
                content: `✅ Video is generating! (Job ID: ${response.data.jobId})\n\nI'll let you know when it's ready. Check your dashboard to see the progress!`,
                generating: false,
                jobId: response.data.jobId,
              }
            : msg
        ));
      } else if (intent.type === 'image') {
        const assistantMessage = {
          role: 'assistant',
          content: `🎨 I can help you generate images! You have 11 AI models to choose from. Would you like me to:\n\n1. Recommend the best model for your prompt\n2. Show you all available models\n3. Go straight to the image generator`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // General chat response
        const assistantMessage = {
          role: 'assistant',
          content: `I can help you with:\n\n🎬 **Video Generation** - "Create a sunset video for TikTok"\n🎨 **Image Generation** - "Generate a cyberpunk cityscape"\n🎵 **Music Generation** - "Create upbeat electronic music"\n📝 **Screenplay Writing** - "Help me write a scene"\n\nWhat would you like to create?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `❌ Sorry, something went wrong. Please try again or rephrase your request.`,
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeIntent = (text) => {
    const lower = text.toLowerCase();
    
    // Video generation
    if (lower.includes('video') || lower.includes('generate') || lower.includes('create a')) {
      const intent = { type: 'video', prompt: text };
      
      // Quality detection
      if (lower.includes('4k') || lower.includes('premium')) {
        intent.quality = 'premium';
      } else if (lower.includes('ultra') || lower.includes('best') || lower.includes('highest')) {
        intent.quality = 'ultra';
      }
      
      // Platform/aspect ratio detection
      if (lower.includes('tiktok') || lower.includes('reels') || lower.includes('vertical')) {
        intent.aspectRatio = '9:16';
        intent.platform = 'TikTok/Reels';
      } else if (lower.includes('youtube') || lower.includes('horizontal')) {
        intent.aspectRatio = '16:9';
        intent.platform = 'YouTube';
      } else if (lower.includes('instagram') || lower.includes('square')) {
        intent.aspectRatio = '1:1';
        intent.platform = 'Instagram';
      } else if (lower.includes('cinema') || lower.includes('widescreen')) {
        intent.aspectRatio = '21:9';
        intent.platform = 'Cinema';
      }
      
      // Duration
      if (lower.includes('10 second') || lower.includes('10s')) {
        intent.duration = 10;
      }
      
      return intent;
    }
    
    // Image generation
    if (lower.includes('image') || lower.includes('picture') || lower.includes('photo')) {
      return { type: 'image', prompt: text };
    }
    
    // Music generation
    if (lower.includes('music') || lower.includes('song') || lower.includes('audio')) {
      return { type: 'music', prompt: text };
    }
    
    return { type: 'general' };
  };

  const quickActions = [
    { icon: Video, label: 'Generate Video', prompt: 'Create a cinematic sunset video for YouTube' },
    { icon: Video, label: 'TikTok Video', prompt: 'Create a vertical video for TikTok' },
    { icon: Image, label: 'Generate Image', prompt: 'Generate a stunning cyberpunk cityscape image' },
    { icon: Music, label: 'Create Music', prompt: 'Create upbeat electronic background music' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-2xl font-bold">AI Creative Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">Chat-to-Create</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}
            >
              <div className="chat-image avatar">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-cinema-blue' 
                    : 'bg-gradient-to-r from-cinema-red to-cinema-gold'
                }`}>
                  {message.role === 'user' 
                    ? user?.firstName?.[0] || 'U'
                    : <Sparkles className="w-5 h-5 text-white" />
                  }
                </div>
              </div>
              <div className={`chat-bubble ${
                message.role === 'user' 
                  ? 'bg-cinema-blue text-white' 
                  : message.error
                  ? 'bg-error text-white'
                  : 'bg-base-200 text-base-content'
              }`}>
                <div className="whitespace-pre-line">{message.content}</div>
                {message.generating && (
                  <div className="mt-2">
                    <span className="loading loading-dots loading-sm"></span>
                  </div>
                )}
              </div>
              <div className="chat-footer opacity-50 text-xs mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-base-300">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-base-content/60 mb-3">Quick start:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(action.prompt)}
                  className="btn btn-sm btn-outline gap-2"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-base-300 p-4 bg-base-200">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me to create something... (e.g., 'Create a sunset video for TikTok')"
            className="input input-bordered flex-1"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="btn bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
          >
            {isGenerating ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-center text-base-content/50 mt-2">
          Powered by provider-agnostic AI • Quality tiers: Professional, Premium, Ultra
        </p>
      </div>
    </div>
  );
}

