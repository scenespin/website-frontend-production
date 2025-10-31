// Interactive Tutorial Components for Audio Studio Website Integration
// These components can be embedded in the Audio Studio landing page

import React, { useState } from 'react';
import { Play, Volume2, Mic, Music, Sparkles } from 'lucide-react';

/**
 * Interactive Audio Feature Showcase
 * Shows all 6 audio tools with interactive examples
 */
export function AudioFeatureShowcase() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const features = [
    {
      id: 'tts',
      icon: <Mic className="w-8 h-8" />,
      title: 'Text-to-Speech',
      description: '100+ premium voices in 29 languages',
      example: 'Convert any text into natural speech',
      demo: {
        input: '"Welcome to Wryda AI!"',
        output: 'Natural voice in 2 seconds',
        cost: '2-10 credits',
      }
    },
    {
      id: 'clone',
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Voice Cloning',
      description: 'Clone any voice from audio samples',
      example: 'Upload 5 minutes of speech → Get unlimited generations',
      demo: {
        input: '5-10 min audio samples',
        output: 'Your custom voice',
        cost: '100 credits (one-time)',
      }
    },
    {
      id: 'sfx',
      icon: <Volume2 className="w-8 h-8" />,
      title: 'Sound Effects',
      description: 'Generate any sound from text',
      example: '"Thunder clap with rain" → Realistic SFX',
      demo: {
        input: '"Futuristic laser blast"',
        output: 'Custom sound effect',
        cost: '3 credits',
      }
    },
    {
      id: 'music',
      icon: <Music className="w-8 h-8" />,
      title: 'Music Generator',
      description: 'Full songs with custom lyrics',
      example: 'Create 4-8 minute original songs',
      demo: {
        input: '"Upbeat pop music, energetic"',
        output: '4-minute full song',
        cost: '100 credits',
      }
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {features.map((feature) => (
        <div
          key={feature.id}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => setActiveDemo(feature.id)}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              {feature.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{feature.example}</p>

          {activeDemo === feature.id && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Input:</span>
                <span className="text-sm text-gray-600">{feature.demo.input}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Output:</span>
                <span className="text-sm text-gray-600">{feature.demo.output}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cost:</span>
                <span className="text-sm font-bold text-blue-600">{feature.demo.cost}</span>
              </div>
              <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Try {feature.title}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Quick Start Wizard
 * Guides users through their first audio generation
 */
export function AudioQuickStartWizard() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    type: '',
    provider: '',
    voice: '',
  });

  const steps = [
    {
      number: 1,
      title: 'What do you want to create?',
      options: [
        { id: 'dialogue', label: 'Dialogue/Voice', icon: '🎤' },
        { id: 'sfx', label: 'Sound Effects', icon: '🔊' },
        { id: 'music', label: 'Background Music', icon: '🎵' },
      ]
    },
    {
      number: 2,
      title: 'Choose your quality level',
      options: [
        { id: 'budget', label: 'Budget (5 credits)', icon: '💰', description: 'Fast & affordable' },
        { id: 'premium', label: 'Premium (7-10 credits)', icon: '⭐', description: 'Best quality' },
      ]
    },
    {
      number: 3,
      title: 'All set! Let\'s create',
      options: []
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Quick Start Guide</h2>
        <p className="text-gray-600">Create your first audio in 3 simple steps</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s.number
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {s.number}
            </div>
            {s.number < steps.length && (
              <div
                className={`w-20 h-1 ${
                  step > s.number ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">{steps[step - 1].title}</h3>
        <div className="grid grid-cols-1 gap-4">
          {steps[step - 1].options.map((option) => (
            <button
              key={option.id}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              onClick={() => {
                setSelections({ ...selections, [step === 1 ? 'type' : 'provider']: option.id });
                if (step < 3) setStep(step + 1);
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{option.icon}</span>
                <div>
                  <div className="font-semibold">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600">{option.description}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {step === 3 && (
          <div className="mt-6 p-6 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Your Configuration:</h4>
            <ul className="space-y-1 text-sm mb-4">
              <li>Type: {selections.type}</li>
              <li>Quality: {selections.provider}</li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Open Audio Studio
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step > 1 && step < 3 && (
        <button
          className="text-gray-600 hover:text-gray-800"
          onClick={() => setStep(step - 1)}
        >
          ← Back
        </button>
      )}
    </div>
  );
}

/**
 * Audio Use Case Gallery
 * Shows real-world examples of audio in videos
 */
export function AudioUseCaseGallery() {
  const useCases = [
    {
      title: 'YouTube Video Production',
      thumbnail: '/examples/youtube-tutorial.jpg',
      audio: ['Narration (ElevenLabs)', 'Background Music (Suno)', 'Click SFX (Runway)'],
      credits: 113,
      duration: '10 minutes',
      description: 'Professional tutorial with 3-track audio mix'
    },
    {
      title: 'Product Advertisement',
      thumbnail: '/examples/product-ad.jpg',
      audio: ['Voiceover (Voice Clone)', 'Brand Music (Suno v4.5)', 'Product SFX (Runway)'],
      credits: 163,
      duration: '30 seconds',
      description: 'High-quality commercial with custom voice'
    },
    {
      title: 'Podcast Episode',
      thumbnail: '/examples/podcast.jpg',
      audio: ['Host Voice (ElevenLabs)', 'Guest Voice (ElevenLabs)', 'Intro Music (Suno)'],
      credits: 114,
      duration: '45 minutes',
      description: 'Multi-speaker podcast with professional audio'
    },
    {
      title: 'Film Scene',
      thumbnail: '/examples/film-scene.jpg',
      audio: ['Dialogue (ElevenLabs)', 'Thunder SFX (Runway)', 'Dramatic Music (Suno v4.5-plus)'],
      credits: 160,
      duration: '2 minutes',
      description: 'Cinematic scene with layered audio'
    }
  ];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">See What's Possible</h2>
        <p className="text-gray-600">Real examples of audio in professional videos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {useCases.map((useCase, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-16 h-16 text-white opacity-80" />
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                {useCase.duration}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
              <p className="text-gray-600 mb-4">{useCase.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="text-sm font-semibold text-gray-700">Audio Tracks:</div>
                {useCase.audio.map((track, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1 h-4 bg-blue-500 rounded"></div>
                    <span>{track}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">Total Cost:</span>
                <span className="font-bold text-blue-600">{useCase.credits} credits</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Interactive Cost Calculator
 * Helps users estimate audio production costs
 */
export function AudioCostCalculator() {
  const [config, setConfig] = useState({
    narration: { enabled: false, duration: 0, provider: 'runway' },
    music: { enabled: false, model: 'v4.5' },
    sfx: { enabled: false, count: 0 },
    voiceClone: { enabled: false },
  });

  const costs = {
    narration: {
      runway: 5,
      elevenlabs_flash: 2,
      elevenlabs_turbo: 7,
      elevenlabs_multi: 10,
    },
    music: {
      v3_5: 50,
      v4: 75,
      v4_5: 100,
      v4_5_plus: 150,
      v5: 200,
    },
    sfx: 3,
    voiceClone: 100,
  };

  const calculateTotal = () => {
    let total = 0;
    if (config.narration.enabled) {
      total += costs.narration[config.narration.provider as keyof typeof costs.narration];
    }
    if (config.music.enabled) {
      total += costs.music[config.music.model as keyof typeof costs.music];
    }
    if (config.sfx.enabled) {
      total += costs.sfx * config.sfx.count;
    }
    if (config.voiceClone.enabled) {
      total += costs.voiceClone;
    }
    return total;
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Audio Cost Calculator</h2>
      <p className="text-gray-600 mb-8">Estimate your project's audio production cost</p>

      <div className="space-y-6">
        {/* Narration */}
        <div className="border rounded-lg p-4">
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={config.narration.enabled}
              onChange={(e) => setConfig({ ...config, narration: { ...config.narration, enabled: e.target.checked } })}
              className="w-5 h-5"
            />
            <span className="font-semibold">Narration / Dialogue</span>
          </label>
          {config.narration.enabled && (
            <div className="ml-8 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Provider:</label>
                <select
                  value={config.narration.provider}
                  onChange={(e) => setConfig({ ...config, narration: { ...config.narration, provider: e.target.value } })}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="runway">Runway TTS (5 credits)</option>
                  <option value="elevenlabs_flash">ElevenLabs Flash (2 credits)</option>
                  <option value="elevenlabs_turbo">ElevenLabs Turbo (7 credits)</option>
                  <option value="elevenlabs_multi">ElevenLabs Multilingual (10 credits)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Music */}
        <div className="border rounded-lg p-4">
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={config.music.enabled}
              onChange={(e) => setConfig({ ...config, music: { ...config.music, enabled: e.target.checked } })}
              className="w-5 h-5"
            />
            <span className="font-semibold">Background Music</span>
          </label>
          {config.music.enabled && (
            <div className="ml-8">
              <label className="text-sm text-gray-600">Model:</label>
              <select
                value={config.music.model}
                onChange={(e) => setConfig({ ...config, music: { ...config.music, model: e.target.value } })}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="v3_5">Suno v3.5 (50 credits, 4 min)</option>
                <option value="v4">Suno v4 (75 credits, 4 min)</option>
                <option value="v4_5">Suno v4.5 (100 credits, 8 min) ⭐</option>
                <option value="v4_5_plus">Suno v4.5-plus (150 credits, 8 min)</option>
                <option value="v5">Suno v5 (200 credits, 8 min)</option>
              </select>
            </div>
          )}
        </div>

        {/* Sound Effects */}
        <div className="border rounded-lg p-4">
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={config.sfx.enabled}
              onChange={(e) => setConfig({ ...config, sfx: { ...config.sfx, enabled: e.target.checked } })}
              className="w-5 h-5"
            />
            <span className="font-semibold">Sound Effects</span>
          </label>
          {config.sfx.enabled && (
            <div className="ml-8">
              <label className="text-sm text-gray-600">Number of SFX:</label>
              <input
                type="number"
                value={config.sfx.count}
                onChange={(e) => setConfig({ ...config, sfx: { ...config.sfx, count: parseInt(e.target.value) || 0 } })}
                min="0"
                max="20"
                className="w-full mt-1 p-2 border rounded"
              />
              <div className="text-sm text-gray-500 mt-1">3 credits each</div>
            </div>
          )}
        </div>

        {/* Voice Clone */}
        <div className="border rounded-lg p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.voiceClone.enabled}
              onChange={(e) => setConfig({ ...config, voiceClone: { enabled: e.target.checked } })}
              className="w-5 h-5"
            />
            <span className="font-semibold">Voice Cloning (one-time)</span>
            <span className="text-sm text-gray-600 ml-auto">100 credits</span>
          </label>
        </div>
      </div>

      {/* Total */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">Estimated Total Cost:</span>
          <span className="text-3xl font-bold text-blue-600">{calculateTotal()} credits</span>
        </div>
        <div className="text-sm text-gray-600">
          ≈ ${(calculateTotal() * 0.01).toFixed(2)} USD
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Audio Tutorial Carousel
 * Step-by-step tutorials with code examples
 */
export function AudioTutorialCarousel() {
  const [currentTutorial, setCurrentTutorial] = useState(0);

  const tutorials = [
    {
      title: 'Create Your First Voice-over',
      steps: [
        {
          title: 'Step 1: Open Audio Studio',
          description: 'Navigate to Dashboard → Audio Studio',
          image: '/tutorials/step1.jpg'
        },
        {
          title: 'Step 2: Enter Your Script',
          description: 'Type or paste your narration text (up to 5000 characters)',
          code: 'Welcome to our product demo. Today we\'ll show you...'
        },
        {
          title: 'Step 3: Choose a Voice',
          description: 'Select from 100+ voices or use your cloned voice',
          tip: 'Preview voices before generating'
        },
        {
          title: 'Step 4: Generate',
          description: 'Click Generate Speech and wait 2-10 seconds',
          result: 'Download your audio or add directly to timeline'
        }
      ]
    },
    {
      title: 'Add Background Music to Video',
      steps: [
        {
          title: 'Step 1: Generate Music',
          description: 'Go to Music Generator tab',
          code: 'Prompt: "Upbeat corporate music, inspiring and modern"'
        },
        {
          title: 'Step 2: Configure Settings',
          description: 'Choose model (v4.5), select Instrumental, set duration',
          tip: 'Generate 4 minutes, you can trim to any length later'
        },
        {
          title: 'Step 3: Add to Timeline',
          description: 'Drag generated music to audio track in your video',
          code: 'Track 3, Start: 0 sec, Volume: 25%'
        },
        {
          title: 'Step 4: Adjust Volume',
          description: 'Set music to 20-30% so it doesn\'t overpower dialogue',
          result: 'Perfect background music that enhances your video'
        }
      ]
    }
  ];

  const tutorial = tutorials[currentTutorial];
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold">{tutorial.title}</h2>
          <p className="text-blue-100 mt-1">Step {currentStep + 1} of {tutorial.steps.length}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">{tutorial.steps[currentStep].title}</h3>
            <p className="text-gray-600">{tutorial.steps[currentStep].description}</p>
          </div>

          {tutorial.steps[currentStep].code && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-6">
              {tutorial.steps[currentStep].code}
            </div>
          )}

          {tutorial.steps[currentStep].tip && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600 font-semibold">💡 Tip:</span>
                <span>{tutorial.steps[currentStep].tip}</span>
              </div>
            </div>
          )}

          {tutorial.steps[currentStep].result && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">✅ Result:</span>
                <span>{tutorial.steps[currentStep].result}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
            >
              ← Previous
            </button>

            <div className="flex gap-2">
              {tutorial.steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < tutorial.steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setCurrentTutorial((currentTutorial + 1) % tutorials.length);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Next Tutorial →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tutorial Selector */}
      <div className="mt-6 flex gap-4 justify-center">
        {tutorials.map((t, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentTutorial(index);
              setCurrentStep(0);
            }}
            className={`px-4 py-2 rounded-lg text-sm ${
              index === currentTutorial
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default {
  AudioFeatureShowcase,
  AudioQuickStartWizard,
  AudioUseCaseGallery,
  AudioCostCalculator,
  AudioTutorialCarousel,
};

