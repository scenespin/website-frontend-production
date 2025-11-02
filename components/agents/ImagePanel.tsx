'use client';

import React, { useState } from 'react';
import { useImageGenerator } from '@/hooks/useAgentCall';

export default function ImagePanel() {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('nano-banana');
    const [generatedImage, setGeneratedImage] = useState('');
    
    const { generateImage, isLoading, error } = useImageGenerator();
    
    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        try {
            const response: any = await generateImage(prompt, selectedModel);
            
            if (response && response.imageUrl) {
                setGeneratedImage(response.imageUrl);
            }
        } catch (err) {
            console.error('Image generation failed:', err);
        }
    };
    
    const quickPrompts = [
        'Cozy coffee shop, warm lighting',
        'Dark alley, rain, neon signs',
        'Futuristic city skyline at sunset',
        'Abandoned warehouse, dramatic shadows'
    ];
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
            {/* Left: Input */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-1">
                        Scene Description
                    </label>
                    <textarea
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-base-content/20 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="Describe the image you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {quickPrompts.map((p) => (
                            <button
                                key={p}
                                onClick={() => setPrompt(p)}
                                className="px-2 py-1 text-xs text-left bg-base-100 hover:bg-base-200 rounded border border-base-content/20 truncate"
                                title={p}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                
                <select
                    className="w-full px-3 py-2 text-sm border border-base-content/20 rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                >
                    <option value="nano-banana">Imagen 3 (1 credit)</option>
                    <option value="stable-diffusion-3.5-large">SD 3.5 Large (50 credits)</option>
                    <option value="gpt-image-1">DALL-E 3 (100 credits)</option>
                </select>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-base-content/20 text-base-content font-medium rounded-lg text-sm"
                >
                    {isLoading ? 'Generating...' : '🎨 Generate Image'}
                </button>
                
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}
            </div>
            
            {/* Right: Output */}
            <div className="flex flex-col">
                {!generatedImage && !isLoading && (
                    <div className="flex items-center justify-center h-full text-base-content/60 text-sm">
                        Generated image will appear here
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-base-content/40">Generating...</p>
                        </div>
                    </div>
                )}
                
                {generatedImage && (
                    <div className="space-y-2">
                        <img
                            src={generatedImage}
                            alt="Generated scene"
                            className="w-full rounded-lg border border-base-content/20"
                        />
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = generatedImage;
                                link.download = `scene-${Date.now()}.png`;
                                link.click();
                            }}
                            className="w-full py-2 text-sm bg-base-100 hover:bg-base-200 rounded-lg border border-base-content/20"
                        >
                            Download
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

