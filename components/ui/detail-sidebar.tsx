'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailSidebar({
  isOpen,
  onClose,
  title,
  children,
  footer
}: DetailSidebarProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 w-[480px] flex flex-col shadow-2xl border-l-2 border-border z-[9999]"
      style={{ 
        backgroundColor: '#1e2229',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' 
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#2C2C2E' }}>
        <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
          style={{ color: '#9CA3AF' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {children}
      </div>

      {/* Footer (if provided) */}
      {footer && (
        <div className="flex gap-2 p-4 border-t" style={{ borderColor: '#2C2C2E' }}>
          {footer}
        </div>
      )}
    </motion.div>
  );
}

