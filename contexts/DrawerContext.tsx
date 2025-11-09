'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DrawerContextType {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  openDrawer: (mode?: string) => void;  // Add this
  closeDrawer: () => void;              // Add this
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  const openDrawer = (mode?: string) => {
    // Mode parameter for future extensibility (e.g., 'chat', 'image', etc.)
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <DrawerContext.Provider value={{ isDrawerOpen, setIsDrawerOpen, toggleDrawer, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      isDrawerOpen: false,
      setIsDrawerOpen: () => {},
      toggleDrawer: () => {},
      openDrawer: () => {},
      closeDrawer: () => {}
    };
  }
  return context;
}

