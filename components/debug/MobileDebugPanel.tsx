'use client';

/**
 * Mobile Debug Panel - Temporary debugging tool
 * 
 * Shows console logs, API calls, and errors on-screen for mobile testing.
 * 
 * TO REMOVE: Simply delete the import and usage in LayoutClient.js
 * 
 * Features:
 * - Intercepts console.log, console.error, console.warn
 * - Shows API call status
 * - Shows errors
 * - Toggle on/off
 * - Auto-scrolls to latest log
 * - Clear logs button
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Bug, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface LogEntry {
  id: number;
  type: 'log' | 'error' | 'warn' | 'info' | 'api';
  message: string;
  timestamp: Date;
  data?: any;
}

export function MobileDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, isMinimized]);

  // Intercept console methods
  useEffect(() => {
    if (!isOpen) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type: 'log' | 'error' | 'warn' | 'info', ...args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      setLogs(prev => [...prev, {
        id: logIdRef.current++,
        type,
        message: message.substring(0, 500), // Limit length
        timestamp: new Date(),
        data: args.length > 1 ? args : undefined
      }].slice(-100)); // Keep last 100 logs
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      addLog('error', ...args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.info = (...args: any[]) => {
      originalInfo(...args);
      addLog('info', ...args);
    };

    // Intercept fetch API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      const method = args[1]?.method || 'GET';
      
      const apiLog: LogEntry = {
        id: logIdRef.current++,
        type: 'api' as const,
        message: `${method} ${url}`,
        timestamp: new Date()
      };
      setLogs(prev => [...prev, apiLog].slice(-100));

      try {
        const response = await originalFetch(...args);
        
        const responseLog: LogEntry = {
          id: logIdRef.current++,
          type: (response.ok ? 'log' : 'error') as 'log' | 'error',
          message: `${method} ${url} → ${response.status} ${response.statusText}`,
          timestamp: new Date()
        };
        setLogs(prev => [...prev, responseLog].slice(-100));

        return response;
      } catch (error: any) {
        const errorLog: LogEntry = {
          id: logIdRef.current++,
          type: 'error' as const,
          message: `${method} ${url} → ERROR: ${error.message}`,
          timestamp: new Date()
        };
        setLogs(prev => [...prev, errorLog].slice(-100));
        throw error;
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      window.fetch = originalFetch;
    };
  }, [isOpen]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warn': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'api': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'info': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      default: return 'text-gray-300 bg-gray-800/50 border-gray-700';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'api': return '🌐';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-[10000] bg-[#DC143C] text-white p-3 rounded-full shadow-lg hover:bg-[#B01030] transition-colors md:bottom-4"
        title="Open Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0A0A0A] border-t border-[#3F3F46] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141414] border-b border-[#3F3F46]">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#DC143C]" />
          <span className="text-sm font-semibold text-white">Debug Panel</span>
          <span className="text-xs text-gray-400">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="p-1.5 hover:bg-[#1F1F1F] rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-[#1F1F1F] rounded transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-[#1F1F1F] rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      {!isMinimized && (
        <div className="h-[300px] overflow-y-auto bg-[#0A0A0A] p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No logs yet. Interact with the app to see logs here.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`text-xs p-2 rounded border ${getLogColor(log.type)} break-words`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getLogIcon(log.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] uppercase opacity-60">{log.type}</span>
                    </div>
                    <div className="text-xs font-mono whitespace-pre-wrap break-all">
                      {log.message}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}

