# 🏗️ ARCHITECTURE ALIGNMENT PLAN
**ShipFast → Wryda.ai Complete Migration**

**Date**: October 28, 2025  
**Status**: 🔄 IN PROGRESS  
**Goal**: Align ShipFast template with original Wryda.ai architecture

---

## 🎯 THE PROBLEM

We've built core features (Chat, Production, Editor) as **STANDALONE PAGES** in ShipFast, but the original Wryda.ai has a **COMPLETELY DIFFERENT ARCHITECTURE**:

### ❌ WHAT WE BUILT (WRONG):
```
/dashboard - Main dashboard
/chat - Full page chat
/production - Full page production
/editor - Full page editor
```

### ✅ WHAT WE SHOULD HAVE (CORRECT):
```
/app/write - Screenplay editor with DRAWER-BASED UnifiedChatPanel
/app/production - Production page with DRAWER-BASED UnifiedChatPanel
/app/composition - Composition page with DRAWER-BASED UnifiedChatPanel
/app/timeline - Timeline page with DRAWER-BASED UnifiedChatPanel
/app/dashboard - Dashboard (no drawer)
```

---

## 🔑 **KEY ARCHITECTURAL DIFFERENCES**

### **1. UnifiedChatPanel is a DRAWER, not a page!**

**Original Design:**
- **AgentDrawer** component wraps **UnifiedChatPanel**
- Slides up from the bottom of the screen
- **Overlays** the current page (editor, production, etc.)
- **Resizable** (drag handle)
- **Swipe to close**
- **Contextual** (knows what page you're on)
- Has **6 modes**: Chat, Director, Image, Video, Scene Visualizer, Dialogue

**Implementation:**
```typescript
// Original: website-frontend/src/components/agents/AgentDrawer.tsx
<AgentDrawer 
  isOpen={isDrawerOpen}
  onClose={closeDrawer}
  onInsertText={handleInsert}
  launchTrigger={launchMode}
/>

// Inside AgentDrawer:
<UnifiedChatPanel 
  onInsert={onInsertText}
  initialMode={launchTrigger?.mode}
  selectedTextContext={launchTrigger?.selectedText}
/>
```

**Where it's used:**
- ✅ `/app/write` (Screenplay editor)
- ✅ `/app/production` (Production page)
- ✅ `/app/composition` (Composition page)
- ✅ `/app/timeline` (Timeline page)
- ❌ `/app/dashboard` (NO drawer here)

---

### **2. The Main App Layout**

**Original Design:**
```typescript
// website-frontend/src/app/app/layout.tsx

<DrawerProvider>  ← Global drawer state
  <ScreenplayProvider>  ← Global screenplay state
    <ResponsiveHeader />  ← Top navigation
    <main>{children}</main>  ← Page content
    <ResponsiveFooter />
  </ScreenplayProvider>
</DrawerProvider>
```

**Key Features:**
- **DrawerContext** manages drawer state globally
- **ScreenplayContext** shares screenplay data across pages
- **ResponsiveHeader** has a hamburger menu with all app links
- **No bottom nav** in app (only on marketing pages)

---

### **3. The Real App Pages**

#### **A. Write Page (`/app/write`)**
- **Purpose**: Screenplay editor (Fountain format)
- **Features**:
  - Full-screen editor with toolbar
  - Character bank sidebar
  - Entity autocomplete
  - Scene visualizer right-click menu
  - **UnifiedChatPanel drawer** (for AI assistance)
- **File**: `website-frontend/src/app/app/write/page.tsx`

#### **B. Production Page (`/app/production`)**
- **Purpose**: Generate video clips from screenplay
- **Features**:
  - 3-panel layout: Scene beats (left), Clip generation (center), Character bank (right)
  - AI suggestion system
  - Clip assignment workflow
  - **UnifiedChatPanel drawer** (for generating clips)
- **File**: `website-frontend/src/app/app/production/page.tsx`

#### **C. Composition Page (`/app/composition`)**
- **Purpose**: Compose clips into sequences
- **Features**:
  - Clapboard-style UI
  - Scene composition
  - Character consistency
  - **UnifiedChatPanel drawer** (for AI composition)
- **File**: `website-frontend/src/app/app/composition/page.tsx`

#### **D. Timeline Page (`/app/timeline`)**
- **Purpose**: Multi-track video editing
- **Features**:
  - Timeline editor
  - Keyframe animation
  - Transitions
  - **UnifiedChatPanel drawer** (for editing)
- **File**: `website-frontend/src/app/app/timeline/page.tsx`

#### **E. Dashboard Page (`/app/dashboard`)**
- **Purpose**: Overview of projects and credits
- **Features**:
  - Credit balance
  - Recent projects
  - Quick actions
  - **NO UnifiedChatPanel drawer**
- **File**: `website-frontend/src/app/app/dashboard/page.tsx`

---

## 📋 **MIGRATION STEPS**

### ✅ **PHASE 1: FOUNDATION (COMPLETE)**
1. ✅ ShipFast setup
2. ✅ Clerk authentication
3. ✅ Cinema theme
4. ✅ API client (`lib/api.js`)

### 🚀 **PHASE 2: ARCHITECTURE ALIGNMENT (IN PROGRESS)**

#### **Step 1: Create DrawerContext**
**File**: `website-frontend-shipfast/contexts/DrawerContext.js`

```javascript
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

  return (
    <DrawerContext.Provider value={{
      isDrawerOpen,
      drawerMode,
      launchTrigger,
      openDrawer,
      closeDrawer,
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
```

#### **Step 2: Create AgentDrawer Component**
**File**: `website-frontend-shipfast/components/AgentDrawer.js`

```javascript
'use client';

import { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { useDrawer } from '@/contexts/DrawerContext';

export default function AgentDrawer({ children }) {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const [height, setHeight] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Calculate current height (70px when closed, variable when open)
  const currentHeight = isDrawerOpen ? height : 70;

  // Handle drag gestures
  const handleDragStart = (clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = height;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientY) => {
      const deltaY = dragStartY.current - clientY;
      const newHeight = Math.max(300, Math.min(800, dragStartHeight.current + deltaY));

      // If swiping down significantly, close the drawer
      if (deltaY < -100 && clientY > dragStartY.current) {
        closeDrawer();
        setIsDragging(false);
        return;
      }

      setHeight(newHeight);
    };

    const handleMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, closeDrawer]);

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-base-200 shadow-xl z-50 transition-all duration-300 ease-out"
        style={{ height: `${currentHeight}px` }}
      >
        {/* Resize Handle */}
        <div
          className="w-full h-16 flex items-center justify-center cursor-grab active:cursor-grabbing bg-base-300 border-b border-cinema-red/20"
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        >
          <GripHorizontal className="w-8 h-8 text-base-content/40" />
          <button
            onClick={closeDrawer}
            className="absolute right-4 btn btn-sm btn-ghost"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isDrawerOpen && (
          <div className="h-[calc(100%-64px)] overflow-auto">
            {children}
          </div>
        )}
      </div>
    </>
  );
}
```

#### **Step 3: Create UnifiedChatPanel Component**
**File**: `website-frontend-shipfast/components/UnifiedChatPanel.js`

```javascript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Film, Image as ImageIcon, Music, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useDrawer } from '@/contexts/DrawerContext';

export default function UnifiedChatPanel() {
  const { drawerMode } = useDrawer();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Mode-specific icons
  const modeIcons = {
    chat: Sparkles,
    director: Film,
    image: ImageIcon,
    video: Film,
    sceneVisualizer: Wand2,
    dialogue: Music,
  };

  const Icon = modeIcons[drawerMode] || Sparkles;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat.generate([...messages, userMessage]);
      const aiMessage = { role: 'assistant', content: response.data.message };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Mode Header */}
      <div className="p-4 bg-gradient-to-r from-cinema-red to-cinema-blue text-white">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="font-bold capitalize">{drawerMode} Mode</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-base-content/60 py-10">
            <Icon className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold">Start a conversation</p>
            <p className="text-sm">Ask me anything about your project!</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-cinema-red text-white'
                  : 'bg-base-200 text-base-content'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="loading loading-dots loading-sm"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-base-200 border-t border-base-300">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="input input-bordered flex-1"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### **Step 4: Update App Layout**
**File**: `website-frontend-shipfast/app/dashboard/layout.js`

```javascript
import { DrawerProvider } from '@/contexts/DrawerContext';

export default function DashboardLayout({ children }) {
  return (
    <DrawerProvider>
      {children}
    </DrawerProvider>
  );
}
```

#### **Step 5: Restructure Pages**

**Move pages to correct routes:**
```
❌ /app/chat/page.js → ✅ DELETE (drawer replaces this)
❌ /app/production/page.js → ✅ /app/production/page.js (keep, but add drawer)
❌ /app/editor/page.js → ✅ /app/write/page.js (rename + add drawer)
```

#### **Step 6: Add Drawer to Production/Write/Composition/Timeline**

**Example for Production Page:**
```javascript
'use client';

import { useDrawer } from '@/contexts/DrawerContext';
import AgentDrawer from '@/components/AgentDrawer';
import UnifiedChatPanel from '@/components/UnifiedChatPanel';

export default function ProductionPage() {
  const { openDrawer } = useDrawer();

  return (
    <>
      <div className="min-h-screen bg-base-100 p-6">
        {/* Production page content */}
        <button 
          onClick={() => openDrawer('video')}
          className="btn btn-primary"
        >
          Open AI Assistant
        </button>
      </div>

      {/* Drawer (rendered globally, controlled by context) */}
      <AgentDrawer>
        <UnifiedChatPanel />
      </AgentDrawer>
    </>
  );
}
```

---

## 🎯 **NEXT ACTIONS**

1. **Create DrawerContext** (Step 1)
2. **Create AgentDrawer** (Step 2)
3. **Create UnifiedChatPanel** (Step 3)
4. **Update App Layout** (Step 4)
5. **Restructure Pages** (Step 5)
6. **Add Drawer to Pages** (Step 6)

---

## 📚 **REFERENCE FILES**

### **Original Wryda.ai:**
- `website-frontend/src/components/agents/AgentDrawer.tsx`
- `website-frontend/src/components/agents/UnifiedChatPanel.tsx`
- `website-frontend/src/contexts/DrawerContext.tsx`
- `website-frontend/src/app/app/layout.tsx`
- `website-frontend/src/app/app/write/page.tsx`
- `website-frontend/src/app/app/production/page.tsx`

### **Master Docs:**
- `masterDocs/COMPLETE_FEATURE_CATALOG.md`
- `masterDocs/NAVIGATION_IMPLEMENTATION.md`
- `masterDocs/IMPLEMENTATION_COMPLETE.md`

---

**Ready to implement!**

