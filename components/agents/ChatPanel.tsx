'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatAgent } from '@/hooks/useAgentCall';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPanel() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-001');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { sendMessage, isLoading } = useChatAgent();
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        
        try {
            const chatHistory = messages.map(msg => ({ role: msg.role, content: msg.content }));
            const response: any = await sendMessage(input, chatHistory, selectedModel);
            
            if (response && response.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
            }
        } catch (err) {
            console.error('Chat failed:', err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, there was an error processing your request. Please try again.' 
            }]);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-base-100">
            {/* Header with Model selector */}
            <div className="px-4 pt-4 pb-3 border-b border-base-content/20 bg-gradient-to-b from-base-100 to-base-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-base-content">💬 Chat Assistant</h3>
                    <span className="text-xs text-base-content/50">Screenwriting Help</span>
                </div>
                <select
                    className="w-full px-3 py-2 text-sm border border-base-content/20 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-base-100"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                >
                    <option value="gemini-2.0-flash-001">✨ Gemini 2.0 Flash</option>
                    <option value="gpt-4o-mini">🤖 GPT-4o Mini</option>
                    <option value="claude-3-5-haiku-20241022">🧠 Claude 3.5 Haiku</option>
                </select>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-100">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h4 className="text-base font-semibold text-base-content mb-2">Start a Conversation</h4>
                        <p className="text-sm text-base-content/50 max-w-xs">
                            Ask me about screenwriting, character development, plot structure, or anything related to your script!
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <button
                                onClick={() => {
                                    setInput("How do I write compelling dialogue?");
                                    document.querySelector('input')?.focus();
                                }}
                                className="text-xs px-3 py-1.5 bg-base-100 hover:bg-base-200 text-base-content/70 rounded-full transition-colors"
                            >
                                💬 Dialogue tips
                            </button>
                            <button
                                onClick={() => {
                                    setInput("What makes a good character arc?");
                                    document.querySelector('input')?.focus();
                                }}
                                className="text-xs px-3 py-1.5 bg-base-100 hover:bg-base-200 text-base-content/70 rounded-full transition-colors"
                            >
                                🎭 Character arcs
                            </button>
                            <button
                                onClick={() => {
                                    setInput("How should I structure Act 2?");
                                    document.querySelector('input')?.focus();
                                }}
                                className="text-xs px-3 py-1.5 bg-base-100 hover:bg-base-200 text-base-content/70 rounded-full transition-colors"
                            >
                                📖 Story structure
                            </button>
                        </div>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-br from-teal-600 to-teal-500 text-base-content'
                                    : 'bg-base-100 text-base-content border border-base-content/20'
                            }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-base-100 border border-base-content/20 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="px-4 py-3 border-t border-base-content/20 bg-base-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2.5 text-sm border border-base-content/20 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-base-100 placeholder-base-content/40"
                        placeholder="Ask about your screenplay..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:from-base-content/20 disabled:to-base-content/20 text-base-content rounded-xl text-sm font-medium shadow-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <span>Send</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

