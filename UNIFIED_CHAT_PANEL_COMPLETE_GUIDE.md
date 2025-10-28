# 🎬 UNIFIED CHAT PANEL - COMPLETE IMPLEMENTATION GUIDE
**ShipFast Integration for Wryda.ai**

**Date**: October 28, 2025  
**Status**: 📚 RESEARCH COMPLETE - READY TO IMPLEMENT

---

## 🎯 **WHAT IS THE UNIFIED CHAT PANEL?**

It's a **context-aware AI assistant** that slides out as a drawer (bottom on mobile, right on desktop) and provides intelligent help based on:
- **What page you're on** (Write, Production, Timeline, Composition)
- **Where your cursor is** in the screenplay
- **What text you've selected**
- **What you're trying to do**

---

## 🧠 **6 INTELLIGENT MODES**

### **1. Chat Mode** 💬
- General AI assistance
- **AI Interview Workflows**:
  - **Character Creation**: 8-question interview → generates character profile
  - **Location Creation**: 8-question interview → generates location details
  - **Scene Creation**: 10-question interview → generates full scene breakdown
- Content detection (screenplay vs. advice)
- "Insert into script" button for screenplay content

### **2. Director Mode** 🎬
- Cinematic direction and shot planning
- Camera angles, blocking, visual composition
- Shot-by-shot breakdowns

### **3. Image Mode** 🖼️
- Generate character images
- Generate location images
- Entity association (link image to character/location)
- Camera upload & edit

### **4. Video Mode** 🎥
- Quick video generation
- Text-to-video
- Image-to-video
- Multiple providers (abstracted)
- Aspect ratio selection (16:9, 9:16, 1:1, 4:3, 21:9)

### **5. Scene Visualizer Mode** 🎨
- Analyze screenplay scenes
- Generate shot lists
- Storyboard creation
- Multi-segment video generation

### **6. Dialogue Mode** 🎙️
- Dialogue generation
- Audio/music creation
- Voice acting suggestions

---

## 🔑 **KEY FEATURES**

### **Context Awareness**
The panel knows:
- `editorContent`: Full screenplay text
- `cursorPosition`: Where user is typing
- `selectedTextContext`: What text is highlighted
- `sceneContext`: Current scene details (heading, characters, beats)

### **AI Interview Workflows** (The Magic! ✨)

**Example: Character Creation**

1. User clicks "Create Character" → Opens chat drawer
2. AI asks: *"What's your character's name and rough age?"*
   - User: *"Sarah, mid-30s"*
3. AI asks: *"What role do they play in the story?"*
   - User: *"Protagonist - detective solving a case"*
4. AI asks 6 more questions about appearance, personality, goals, flaws, background, relationships
5. After all answers, AI generates:
   ```
   ✅ Character profile complete!
   
   **SARAH (mid-30s)** moves with the precision of a surgeon and the 
   wariness of a survivor. A faded scar traces her left cheek. She 
   speaks as if every word costs money.
   
   **Background**: Former FBI agent. Left after a case went wrong.
   
   **Goals**: Find her missing sister and bring her home.
   
   **Flaw**: Trusts no one. Pushes people away.
   
   **Relationships**: Protective of her partner. Distant with family.
   ```
6. **[Insert & Create]** button appears
7. User clicks → Character profile auto-fills form → New character entity created!

**Same workflow for Locations (8 questions) and Scenes (10 questions)!**

---

## 📱💻 **RESPONSIVE BEHAVIOR**

### **Mobile (< 768px)**
- Slides UP from BOTTOM (tray style)
- Takes 50-80% of screen height
- Resizable with drag handle
- Swipe down to close
- Backdrop overlay (dims page)

### **Desktop (≥ 768px)**
- Slides IN from RIGHT (side panel)
- Fixed width (~480px)
- Full height
- Collapsible with button
- No backdrop (shows page content)

---

## 🏗️ **ARCHITECTURE**

### **Context Providers**
```
<DrawerProvider>  ← Global drawer open/close state
  <ChatProvider>  ← Chat messages, modes, workflows
    <UnifiedChatPanel />
  </ChatProvider>
</DrawerProvider>
```

### **State Management** (ChatContext)
```javascript
{
  // Messages
  messages: Message[],
  isStreaming: boolean,
  streamingText: string,
  
  // Mode
  activeMode: 'chat' | 'director' | 'image' | 'video' | 'scene-visualizer' | 'dialogue',
  
  // Context
  selectedTextContext: string | null,
  sceneContext: SceneContext | null,
  editorContent: string,
  cursorPosition: number,
  
  // Workflows
  activeWorkflow: {
    type: 'character' | 'location' | 'scene',
    questionIndex: number
  } | null,
  workflowCompletionData: {
    type: string,
    parsedData: any,
    aiResponse: string
  } | null,
  
  // Entity context (for character/location image generation)
  entityContextBanner: {
    type: 'character' | 'location',
    id: string,
    name: string,
    workflow: 'interview' | 'image'
  } | null
}
```

### **Custom Hooks**
- `useChatMode()`: Manages AI interview workflows
- `useImageGeneration()`: Handles image generation
- `useVideoGeneration()`: Handles video generation
- `useDirectorMode()`: Handles director mode
- `useDialogueMode()`: Handles dialogue mode

### **Mode Panels** (Separate Components)
- `ChatModePanel.tsx`
- `DirectorModePanel.tsx`
- `ImageModePanel.tsx`
- `VideoModePanel.tsx`
- `SceneVisualizerModePanel.tsx`
- `DialogueModePanel.tsx`

---

## 🔌 **INTEGRATION WITH PAGES**

### **Write Page** (Screenplay Editor)
```javascript
<WritePageContent>
  <FountainEditor
    content={content}
    cursorPosition={cursorPosition}
    onContentChange={handleChange}
    onCursorChange={setCursorPosition}
  />
  
  <AgentDrawer
    isOpen={isDrawerOpen}
    onClose={closeDrawer}
    onInsertText={insertText}
  >
    <UnifiedChatPanel
      editorContent={content}
      cursorPosition={cursorPosition}
      selectedTextContext={selectedText}
      onInsert={insertText}
      onWorkflowComplete={handleWorkflowComplete}
    />
  </AgentDrawer>
  
  {/* Floating AI button */}
  <button onClick={openDrawer}>AI Assistant</button>
</WritePageContent>
```

### **Production Page** (Video Generation)
```javascript
<ProductionPage>
  <ProductionPageLayout />
  
  <AgentDrawer>
    <UnifiedChatPanel
      initialMode="video"
      onInsert={handleVideoInsert}
    />
  </AgentDrawer>
  
  <button onClick={() => openDrawer('video')}>Generate Clip</button>
</ProductionPage>
```

### **Timeline Page** (Video Editing)
```javascript
<TimelinePage>
  <TimelineEditor />
  
  <AgentDrawer halfHeight={true}>
    <UnifiedChatPanel
      initialMode="video"
      onInsert={handleTimelineInsert}
    />
  </AgentDrawer>
</TimelinePage>
```

### **Composition Page** (Clip Composition)
```javascript
<CompositionPage>
  <CompositionStudio />
  
  <AgentDrawer>
    <UnifiedChatPanel
      initialMode="director"
      onInsert={handleCompositionInsert}
    />
  </AgentDrawer>
</CompositionPage>
```

---

## 🎨 **UI/UX FLOW EXAMPLES**

### **Example 1: Creating a Character**
1. User is on Write page, typing screenplay
2. User clicks floating "AI" button → Drawer opens
3. User clicks "Create Character" quick action
4. AI starts interview workflow
5. AI asks 8 questions, user answers each
6. AI generates complete character profile
7. "Insert & Create" button appears
8. User clicks → Character sidebar opens, form auto-filled
9. User saves → New character entity created
10. Drawer closes automatically

### **Example 2: Quick Video from Text**
1. User is on Production page
2. User clicks "Generate Clip" → Drawer opens (Video Mode)
3. User types: "A sunset over the ocean, cinematic"
4. User clicks Send
5. AI processes → Shows "Video generation started! Job ID: 12345"
6. Video generates in background
7. User can close drawer and continue working
8. Toast notification when video is ready

### **Example 3: Rewriting Selected Text**
1. User is on Write page
2. User selects dialogue text
3. User right-clicks → "Rewrite with AI"
4. Drawer opens (Chat Mode) with selected text context
5. AI suggests improved dialogue
6. "Insert into script" button appears
7. User clicks → Original text replaced with new text
8. Drawer closes

---

## 🛠️ **IMPLEMENTATION STEPS FOR SHIPFAST**

### **Phase 1: Core Infrastructure** ✅
1. ✅ DrawerContext (global state)
2. ✅ AgentDrawer component (responsive drawer)
3. ⏳ ChatContext (chat state management)
4. ⏳ UnifiedChatPanel shell

### **Phase 2: Mode Panels** ⏳
1. ChatModePanel (with AI interviews)
2. VideoModePanel (quick video generation)
3. ImageModePanel (image generation)
4. DirectorModePanel (shot planning)
5. SceneVisualizerModePanel (scene analysis)
6. DialogueModePanel (dialogue/audio)

### **Phase 3: AI Interview Workflows** ⏳
1. `aiWorkflows.ts` (question definitions)
2. `useChatMode.ts` (workflow logic)
3. `aiResponseParser.ts` (parse AI responses)
4. API integration for streaming chat

### **Phase 4: Context Extraction** ⏳
1. `editorContext.ts` (extract scene, characters, beats from cursor position)
2. Selection handling
3. Auto-context detection

### **Phase 5: Page Integration** ⏳
1. Update Write page
2. Update Production page
3. Update Timeline page
4. Update Composition page
5. Add floating AI buttons

---

## 📋 **FILES TO CREATE**

### **Contexts**
- ✅ `contexts/DrawerContext.js`
- ⏳ `contexts/ChatContext.js`

### **Components**
- ✅ `components/AgentDrawer.js`
- ⏳ `components/UnifiedChatPanel.js`
- ⏳ `components/modes/ChatModePanel.js`
- ⏳ `components/modes/VideoModePanel.js`
- ⏳ `components/modes/ImageModePanel.js`
- ⏳ `components/modes/DirectorModePanel.js`
- ⏳ `components/modes/SceneVisualizerModePanel.js`
- ⏳ `components/modes/DialogueModePanel.js`

### **Hooks**
- ⏳ `hooks/useChatMode.js`
- ⏳ `hooks/useImageGeneration.js`
- ⏳ `hooks/useVideoGeneration.js`
- ⏳ `hooks/useDirectorMode.js`
- ⏳ `hooks/useDialogueMode.js`

### **Utils**
- ⏳ `utils/aiWorkflows.js`
- ⏳ `utils/aiResponseParser.js`
- ⏳ `utils/editorContext.js`
- ⏳ `utils/streamText.js`

### **Types**
- ⏳ `types/agents.js`

---

## 🚀 **NEXT STEPS**

1. **Continue implementation** of ChatContext
2. **Port AI Workflows** from TypeScript to JavaScript
3. **Create mode panels** one by one
4. **Test on Write page first** (most complex integration)
5. **Add to other pages** once working

---

**This is a SOPHISTICATED system!** The AI interview workflows are the secret sauce that make character/location/scene creation feel magical! 🎩✨

