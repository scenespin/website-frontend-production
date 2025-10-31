import { useState, useEffect, useRef, useCallback } from 'react';

// Browser compatibility check
const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Get the SpeechRecognition constructor
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += text + ' ';
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
        setInterimTranscript('');
        onResult?.(finalText.trim(), true);
      } else if (interimText) {
        setInterimTranscript(interimText);
        onResult?.(interimText, false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[SpeechRecognition] Error:', event.error);
      let errorMessage = 'Speech recognition error';
      let shouldRetry = false;
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          shouldRetry = false;
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your microphone connection.';
          shouldRetry = false;
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
          shouldRetry = false;
          break;
        case 'network':
          // Network errors are common - the browser's speech service needs internet
          errorMessage = 'Voice recognition requires an internet connection. Please check your connection and try again.';
          shouldRetry = false;
          break;
        case 'aborted':
          // User manually stopped - don't show error
          return;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is not available. Please try again later.';
          shouldRetry = false;
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
          shouldRetry = false;
      }

      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[SpeechRecognition] Ended');
      setIsListening(false);
      onEnd?.();
    };

    recognition.onstart = () => {
      console.log('[SpeechRecognition] Started');
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, continuous, interimResults, lang, onResult, onError, onEnd]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current || isListening) return;

    // Pre-flight check: Verify we're in a secure context
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      onError?.('Speech recognition requires HTTPS or localhost. Your current connection is not secure.');
      return;
    }

    try {
      setTranscript('');
      setInterimTranscript('');
      
      console.log('[SpeechRecognition] Starting with config:', {
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        lang: recognitionRef.current.lang,
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
      });
      
      // Check if already started (prevents InvalidStateError)
      try {
        recognitionRef.current.start();
        console.log('[SpeechRecognition] Start requested');
      } catch (startError: any) {
        if (startError.message && startError.message.includes('already started')) {
          console.log('[SpeechRecognition] Already started, ignoring');
          return;
        }
        throw startError;
      }
    } catch (error: any) {
      console.error('[SpeechRecognition] Failed to start:', error);
      const errorMsg = error?.message || 'Failed to start speech recognition. Please ensure you have a stable internet connection.';
      onError?.(errorMsg);
    }
  }, [isSupported, isListening, onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('[SpeechRecognition] Failed to stop:', error);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

