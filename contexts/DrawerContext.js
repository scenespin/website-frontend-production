'use client';

import { createContext, useContext, useState } from 'react';
import { useChatContext } from './ChatContext';

const DrawerContext = createContext();

export function DrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('chat');
  const [launchTrigger, setLaunchTrigger] = useState(null);

  // Open drawer with optional agent mode parameter
  // agentMode: 'chat', 'director', 'audio', 'workflows', 'image', etc.
  const openDrawer = (agentMode = null, trigger = null) => {
    setDrawerMode('chat'); // Legacy drawerMode (always 'chat' now)
    setLaunchTrigger(trigger);
    setIsDrawerOpen(true);
    
    // Store agent mode in localStorage to be picked up by UnifiedChatPanel
    if (agentMode) {
      localStorage.setItem('pending-agent-mode', agentMode);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setLaunchTrigger(null);
  };

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  return (
    <DrawerContext.Provider value={{
      isDrawerOpen,
      drawerMode,
      launchTrigger,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }}>
      {children}
    </DrawerContext.Provider>
  );
}

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
};

