'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  recommended?: boolean;
}

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  models: Model[];
  disabled?: boolean;
  className?: string;
}

/**
 * ModelSelect - Replaces Radix UI Select with Headless UI Listbox
 * 
 * This component is more stable and doesn't have the infinite loop issues
 * that Radix UI Select was experiencing. Uses Headless UI which is already
 * in the project for modals.
 * 
 * Styled with DaisyUI classes to match the existing design system.
 */
export function ModelSelect({
  value,
  onChange,
  models,
  disabled = false,
  className = ''
}: ModelSelectProps) {
  const selectedModel = models.find(m => m.id === value) || models[0];

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const providers = Object.keys(groupedModels);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-base-200 py-1.5 pl-3 pr-10 text-left text-xs shadow-sm ring-1 ring-inset ring-base-300 focus:outline-none focus:ring-2 focus:ring-cinema-red disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="block truncate">{selectedModel?.name || 'Select model'}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-4 w-4 text-base-content/60" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-base-200 py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {providers.map((provider) => (
              <div key={provider}>
                <div className="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider border-b border-base-300">
                  {provider === 'Anthropic' ? 'Anthropic (Claude)' : provider === 'OpenAI' ? 'OpenAI (GPT)' : 'Google (Gemini)'}
                </div>
                {groupedModels[provider].map((model) => (
                  <Listbox.Option
                    key={model.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-8 pr-4 ${
                        active ? 'bg-cinema-red/10 text-base-content' : 'text-base-content/90'
                      }`
                    }
                    value={model.id}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {model.name} {model.recommended ? '⭐' : ''}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-cinema-red">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </div>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

