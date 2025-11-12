'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

// Type definitions
interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerShort: string;
  description: string;
  cost: 'Lowest' | 'Low' | 'Medium' | 'High';
  recommended?: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
}

interface GroupedModels {
  [provider: string]: AIModel[];
}

// Available models for screenwriting agents
const AI_MODELS: AIModel[] = [
  // Claude (Anthropic) - Best for creative writing
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    providerShort: 'Claude',
    description: 'Best for creative writing',
    cost: 'Low',
    recommended: true,
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    providerShort: 'Claude',
    description: 'Most powerful, deep analysis',
    cost: 'High',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    providerShort: 'Claude',
    description: 'Fast, economical',
    cost: 'Lowest',
  },
  
  // GPT (OpenAI)
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    providerShort: 'GPT',
    description: 'Most advanced GPT',
    cost: 'High',
  },
  {
    id: 'gpt-4.5-turbo',
    name: 'GPT-4.5 Turbo',
    provider: 'OpenAI',
    providerShort: 'GPT',
    description: 'Fast and capable',
    cost: 'Medium',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerShort: 'GPT',
    description: 'Optimized GPT-4',
    cost: 'Low',
  },
  
  // Gemini (Google)
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerShort: 'Gemini',
    description: 'Advanced reasoning',
    cost: 'Medium',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerShort: 'Gemini',
    description: 'Fast and efficient',
    cost: 'Low',
  },
  {
    id: 'gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerShort: 'Gemini',
    description: 'Fastest option',
    cost: 'Lowest',
  },
];

export function ModelSelector({ selectedModel, onModelChange, compact = false }: ModelSelectorProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  const currentModel: AIModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  
  // Group models by provider
  const groupedModels: GroupedModels = AI_MODELS.reduce<GroupedModels>((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});
  
  const handleSelect = (modelId: string): void => {
    onModelChange(modelId);
    setIsOpen(false);
  };
  
  if (compact) {
    return (
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn btn-xs btn-ghost gap-1" onClick={() => setIsOpen(!isOpen)}>
          <Sparkles className="w-3 h-3" />
          <span className="text-[10px]">{currentModel.providerShort}</span>
          <ChevronDown className="w-3 h-3" />
        </label>
        {isOpen && (
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-64 mt-1 border border-base-300 max-h-96 overflow-y-auto">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <li key={provider} className="menu-title">
                <span className="text-xs font-bold">{provider}</span>
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={`flex flex-col items-start gap-0.5 py-2 ${
                      selectedModel === model.id ? 'active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-xs">{model.name}</span>
                      {model.recommended && (
                        <span className="badge badge-xs badge-primary">Recommended</span>
                      )}
                      <span className="badge badge-xs ml-auto">{model.cost}</span>
                    </div>
                    <span className="text-[10px] opacity-60">{model.description}</span>
                  </button>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <label className="text-xs font-semibold text-base-content/70 mb-2 block">AI MODEL</label>
      <div className="dropdown dropdown-end w-full">
        <label tabIndex={0} className="btn btn-sm btn-outline w-full justify-between" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-xs">{currentModel.name}</span>
              <span className="text-[10px] opacity-60">{currentModel.provider}</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4" />
        </label>
        {isOpen && (
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-full mt-1 border border-base-300 max-h-96 overflow-y-auto">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <li key={provider}>
                <div className="menu-title">
                  <span className="text-xs font-bold text-base-content/70">{provider}</span>
                </div>
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={`flex flex-col items-start gap-1 py-2 ${
                      selectedModel === model.id ? 'active bg-cinema-red/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-xs">{model.name}</span>
                      {model.recommended && (
                        <span className="badge badge-xs badge-primary">✨</span>
                      )}
                      <span className="badge badge-xs ml-auto">{model.cost}</span>
                    </div>
                    <span className="text-[10px] opacity-60 text-left">{model.description}</span>
                  </button>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[10px] text-base-content/50 mt-1">
        💡 We don&apos;t mark up models - you pay the same cost as direct API usage
      </p>
    </div>
  );
}

