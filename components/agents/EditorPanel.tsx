'use client';

import React, { useState } from 'react';
import { useEditorAgent } from '@/hooks/useAgentCall';
import { processAIGeneratedContent } from '@/utils/aiFormatting';

interface EditorPanelProps {
    onInsert?: (text: string) => void;
}

export default function EditorPanel({ onInsert }: EditorPanelProps) {
    const [originalText, setOriginalText] = useState('');
    const [instructions, setInstructions] = useState('');
    const [rewrittenText, setRewrittenText] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-001');
    
    const { rewrite, isLoading, error } = useEditorAgent();
    
    const handleRewrite = async () => {
        if (!originalText.trim() || !instructions.trim()) return;
        
        try {
            const response: any = await rewrite(originalText, instructions, selectedModel);
            
            if (response && response.rewrittenText) {
                // Process and format AI-generated content
                const { formatted, validation } = processAIGeneratedContent(response.rewrittenText);
                
                // Log any validation issues for debugging
                if (!validation.isValid) {
                    console.warn('[EditorPanel] Formatting issues detected:', validation.issues);
                }
                
                setRewrittenText(formatted);
            }
        } catch (err) {
            console.error('Rewrite failed:', err);
        }
    };
    
    const quickInstructions = [
        'Make it more concise',
        'Add more emotion',
        'Increase tension',
        'Add subtext'
    ];
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
            {/* Left: Input */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Text
                    </label>
                    <textarea
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                        placeholder="Paste text to improve..."
                        value={originalText}
                        onChange={(e) => setOriginalText(e.target.value)}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="How should it be rewritten?"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {quickInstructions.map((inst) => (
                            <button
                                key={inst}
                                onClick={() => setInstructions(inst)}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-200"
                            >
                                {inst}
                            </button>
                        ))}
                    </div>
                </div>
                
                <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                >
                    <option value="gemini-2.0-flash-001">Gemini Flash (10 cr)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (15 cr)</option>
                    <option value="claude-3-5-haiku-20241022">Claude Haiku (40 cr)</option>
                </select>
                
                <button
                    onClick={handleRewrite}
                    disabled={isLoading || !originalText.trim() || !instructions.trim()}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium rounded-lg text-sm"
                >
                    {isLoading ? 'Rewriting...' : '✨ Rewrite Text'}
                </button>
                
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}
            </div>
            
            {/* Right: Output */}
            <div className="space-y-3 flex flex-col">
                <label className="block text-sm font-medium text-gray-700">
                    Rewritten Text
                </label>
                
                {!rewrittenText && !isLoading && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Rewritten text will appear here
                    </div>
                )}
                
                {rewrittenText && (
                    <>
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 h-64 overflow-y-auto">
                            {rewrittenText}
                        </pre>
                        {onInsert && (
                            <button
                                onClick={() => onInsert(rewrittenText)}
                                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors text-sm"
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

