'use client';

import React, { useState } from 'react';
import { useDirectorAgent } from '@/hooks/useAgentCall';
import { processAIGeneratedContent } from '@/utils/aiFormatting';

interface DirectorPanelProps {
    onInsert?: (text: string) => void;
}

export default function DirectorPanel({ onInsert }: DirectorPanelProps) {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-001');
    const [generatedContent, setGeneratedContent] = useState('');
    
    const { generateScene, isLoading, error } = useDirectorAgent();
    
    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        try {
            const response: any = await generateScene(prompt, selectedModel);
            
            if (response && response.content) {
                // Process and format AI-generated content
                const { formatted, validation } = processAIGeneratedContent(response.content);
                
                // Log any validation issues for debugging
                if (!validation.isValid) {
                    console.warn('[DirectorPanel] Formatting issues detected:', validation.issues);
                }
                
                setGeneratedContent(formatted);
            }
        } catch (err) {
            console.error('Generation failed:', err);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
            {/* Left: Input */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-1">
                        Scene Description
                    </label>
                    <textarea
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-base-content/20 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Describe the scene you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-1">
                        AI Model
                    </label>
                    <select
                        className="w-full px-3 py-2 text-sm border border-base-content/20 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        <option value="gemini-2.0-flash-001">Gemini 2.0 Flash (10 credits)</option>
                        <option value="gemini-1.5-pro-002">Gemini 1.5 Pro (50 credits)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (15 credits)</option>
                        <option value="claude-3-5-haiku-20241022">Claude Haiku (40 credits)</option>
                    </select>
                </div>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-base-content/20 disabled:cursor-not-allowed text-base-content font-medium rounded-lg transition-colors text-sm"
                >
                    {isLoading ? 'Generating...' : '⚡ Generate Scene'}
                </button>
                
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}
            </div>
            
            {/* Right: Output */}
            <div className="space-y-3 flex flex-col">
                <label className="block text-sm font-medium text-base-content/70">
                    Generated Content
                </label>
                
                {!generatedContent && !isLoading && (
                    <div className="flex items-center justify-center h-full text-base-content/60 text-sm">
                        Generated scene will appear here
                    </div>
                )}
                
                {generatedContent && (
                    <>
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-base-100 p-4 rounded-lg border border-base-content/20 h-64 overflow-y-auto">
                            {generatedContent}
                        </pre>
                        {onInsert && (
                            <button
                                onClick={() => onInsert(generatedContent)}
                                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-base-content font-medium rounded-lg transition-colors text-sm"
                            >
                                📝 Insert into Script
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

