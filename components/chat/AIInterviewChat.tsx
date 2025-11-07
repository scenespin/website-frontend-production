'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Upload, Send, Loader2, X, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  type?: 'text' | 'choice' | 'file-upload' | 'credit-confirmation' | 'progress';
  options?: Array<{ id: string; label: string; primary?: boolean }>;
  creditBreakdown?: Array<{
    item: string;
    credits: number;
    description: string;
  }>;
  totalCredits?: number;
  estimatedTime?: string;
  oneTimeCost?: boolean;
  worthIt?: string;
  generationDetails?: any;
  timestamp: Date;
}

interface ConversationSession {
  sessionId: string;
  context: 'chat' | 'production-hub';
  messages: Message[];
}

interface AIInterviewChatProps {
  context?: 'chat' | 'production-hub';
  initialPrompt?: string;
  onSceneGenerated?: (sceneData: any) => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIInterviewChat({
  context = 'chat',
  initialPrompt,
  onSceneGenerated,
  className = '',
}: AIInterviewChatProps) {
  const { getToken } = useAuth();
  
  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; type: 'image' | 'video'; name: string }>>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial prompt if provided
  useEffect(() => {
    if (initialPrompt && !sessionId) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const sendMessage = async (text: string, choice?: string, files?: string[]) => {
    if (!text.trim() && !choice && !files) return;

    setIsLoading(true);

    try {
      // Add user message to UI
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: text || (choice ? `Selected: ${choice}` : 'Uploaded files'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Get auth token
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Call API
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          context,
          message: text,
          choice,
          files: files || uploadedFiles.map(f => f.url),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Save session ID
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.text,
        type: data.type,
        options: data.options,
        creditBreakdown: data.creditBreakdown,
        totalCredits: data.totalCredits,
        estimatedTime: data.estimatedTime,
        oneTimeCost: data.oneTimeCost,
        worthIt: data.worthIt,
        generationDetails: data.generationDetails,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Clear input and uploaded files
      setInputText('');
      setUploadedFiles([]);
      setShowFileUpload(false);

      // Notify parent if scene was generated
      if (data.type === 'progress' && data.generationDetails && onSceneGenerated) {
        onSceneGenerated(data.generationDetails);
      }

    } catch (error) {
      console.error('[AIInterviewChat] Error:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: `❌ Sorry, something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      for (const file of Array.from(files)) {
        // Check file size (10MB limit for images)
        if (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
          alert(`Image "${file.name}" is too large (max 10MB). Please upload to Google Drive or Dropbox first.`);
          continue;
        }

        // For videos, we don't upload directly - user must select from storage
        if (file.type.startsWith('video/')) {
          alert('For video files, please select from your cloud storage (Google Drive, Dropbox, or Wryda Temporary Storage).');
          continue;
        }

        // Upload image
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/media/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();

        setUploadedFiles(prev => [...prev, {
          url: data.url,
          type: 'image',
          name: file.name,
        }]);
      }
    } catch (error) {
      console.error('[AIInterviewChat] Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (inputText.trim() || uploadedFiles.length > 0) {
      sendMessage(inputText, undefined, uploadedFiles.map(f => f.url));
    }
  };

  const handleChoice = (choiceId: string, choiceLabel: string) => {
    sendMessage(choiceLabel, choiceId);
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-4 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          }`}
        >
          {/* Text */}
          <div className="whitespace-pre-wrap">{message.text}</div>

          {/* Options (Multiple Choice) */}
          {message.type === 'choice' && message.options && (
            <div className="mt-3 space-y-2">
              {message.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleChoice(option.id, option.label)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    option.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Credit Confirmation */}
          {message.type === 'credit-confirmation' && message.creditBreakdown && (
            <div className="mt-3 space-y-3">
              <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                {message.creditBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{item.item}</div>
                      <div className="text-sm opacity-75">{item.description}</div>
                    </div>
                    <div className="font-bold ml-4">{item.credits} credits</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>{message.totalCredits} credits</span>
              </div>

              {message.estimatedTime && (
                <div className="text-sm opacity-75">
                  ⏱️ Estimated time: {message.estimatedTime}
                </div>
              )}

              {message.worthIt && message.oneTimeCost && (
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-sm">
                  💡 {message.worthIt}
                </div>
              )}

              {message.options && (
                <div className="flex gap-2 mt-4">
                  {message.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleChoice(option.id, option.label)}
                      disabled={isLoading}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        option.primary
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {message.type === 'progress' && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </div>
          )}

          {/* File Upload Request */}
          {message.type === 'file-upload' && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setShowFileUpload(true);
                  fileInputRef.current?.click();
                }}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-lg font-medium mb-2">👋 Hi! I'm your AI assistant.</p>
            <p className="text-sm">Tell me what you'd like to create, or ask me anything!</p>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm"
              >
                {file.type === 'image' ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <FileVideo className="w-4 h-4" />
                )}
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeUploadedFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload images"
          >
            <Upload className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && uploadedFiles.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

