'use client';

import { useState } from 'react';
import { X, Film, Video, Scissors, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import config from '@/config';

/**
 * WelcomeModal - First-time user onboarding modal
 * Shows a 3-slide tour after signup to activate users
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function to call when user completes/skips
 * - userCredits: number (default 100)
 */
export default function WelcomeModal({ isOpen, onClose, userCredits = 100 }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: `Welcome to ${config.appName}! 🎬`,
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-xl font-semibold">
            Your <strong className="text-[#DC143C]">{userCredits} credits</strong> are ready to use!
          </p>
          <p className="text-lg opacity-80">
            That&apos;s approximately <strong>2 professional videos</strong> for free.
          </p>
          <div className="bg-base-200 rounded-box p-4 mt-6">
            <p className="text-sm opacity-70">
              💡 <strong>Everything is unlocked.</strong> No feature gates, no watermarks, no vendor lock-in.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Your Workspace Has 4 Main Areas',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-base-200 rounded-box hover:bg-base-300 transition-colors">
            <Film className="w-8 h-8 text-[#DC143C] shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-lg">📝 Editor</h4>
              <p className="text-sm opacity-80">
                Write professional screenplays with industry-standard formatting. Scene-by-scene structure.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-base-200 rounded-box hover:bg-base-300 transition-colors">
            <Video className="w-8 h-8 text-[#DC143C] shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-lg">🎥 Production</h4>
              <p className="text-sm opacity-80">
                Generate AI videos from text, upload your footage, access 42 workflows. Build your scene library.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-base-200 rounded-box hover:bg-base-300 transition-colors">
            <Scissors className="w-8 h-8 text-[#DC143C] shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-lg">✂️ Timeline</h4>
              <p className="text-sm opacity-80">
                Multi-track editor with 65 compositions and 30 transitions. Combine AI shots with your footage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-base-200 rounded-box hover:bg-base-300 transition-colors">
            <MessageSquare className="w-8 h-8 text-[#DC143C] shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-lg">💬 Chat</h4>
              <p className="text-sm opacity-80">
                AI assistant for brainstorming, script feedback, and creative suggestions. Always available.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Let's Create Your First Video!",
      content: (
        <div className="text-center space-y-6">
          <div className="text-5xl mb-4">🚀</div>
          <p className="text-lg opacity-90">
            Choose your starting point:
          </p>

          <div className="space-y-3">
            <Link
              href="/production"
              onClick={onClose}
              className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              Generate a Quick Video
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/editor"
              onClick={onClose}
              className="btn btn-outline btn-lg w-full flex items-center justify-center gap-2"
            >
              <Film className="w-5 h-5" />
              Start with a Script
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/features"
              onClick={onClose}
              className="btn btn-ghost btn-lg w-full flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Explore 42 Workflows
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm mt-6"
          >
            Skip - I&apos;ll explore myself
          </button>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    setCurrentSlide(slides.length - 1); // Jump to last slide
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div 
          className="bg-base-100 rounded-box shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{slides[currentSlide].title}</h2>
              
              {/* Progress Dots */}
              <div className="flex gap-2 mt-3">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-[#DC143C] w-8'
                        : index < currentSlide
                        ? 'bg-success w-2'
                        : 'bg-base-300 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {slides[currentSlide].content}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-base-300">
            <div>
              {currentSlide > 0 && currentSlide < slides.length - 1 && (
                <button
                  onClick={handlePrev}
                  className="btn btn-ghost"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {currentSlide < slides.length - 1 && (
                <>
                  <button
                    onClick={handleSkip}
                    className="btn btn-ghost"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={handleNext}
                    className="btn btn-primary"
                  >
                    Next →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

