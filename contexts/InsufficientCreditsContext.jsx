'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import InsufficientCreditsModal from '@/components/billing/InsufficientCreditsModal';

const InsufficientCreditsContext = createContext(null);

export function InsufficientCreditsProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    requiredCredits: null,
    availableCredits: null,
    operation: null
  });

  const showInsufficientCredits = useCallback((requiredCredits, availableCredits, operation) => {
    setModalState({
      isOpen: true,
      requiredCredits,
      availableCredits,
      operation
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      requiredCredits: null,
      availableCredits: null,
      operation: null
    });
  }, []);

  return (
    <InsufficientCreditsContext.Provider value={{ showInsufficientCredits }}>
      {children}
      <InsufficientCreditsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        requiredCredits={modalState.requiredCredits}
        availableCredits={modalState.availableCredits}
        operation={modalState.operation}
      />
    </InsufficientCreditsContext.Provider>
  );
}

export function useInsufficientCredits() {
  const context = useContext(InsufficientCreditsContext);
  if (!context) {
    throw new Error('useInsufficientCredits must be used within InsufficientCreditsProvider');
  }
  return context;
}

