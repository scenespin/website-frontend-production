'use client';

import { createContext, useContext, useState } from 'react';

const DrawerContext = createContext();

export function DrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('chat');
  const [launchTrigger, setLaunchTrigger] = useState(null);

  const openDrawer = (mode = 'chat', trigger = null) => {
    setDrawerMode(mode);
    setLaunchTrigger(trigger);
    setIsDrawerOpen(true);
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

