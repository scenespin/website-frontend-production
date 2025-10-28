# 🎬 WRYDA.AI SHIPFAST INTEGRATION PLAN
## Building the Ultimate AI Video Platform

**Date**: October 28, 2025  
**Template**: ShipFast (Next.js 15, Tailwind v4, DaisyUI)  
**Backend**: Existing Node.js + DynamoDB (UNTOUCHED)  
**Strategy**: Provider-Agnostic Wrappers (Luma/Runway/Veo hidden from frontend)

---

## 📊 WHAT WE'RE BUILDING

### **Platform Overview:**
- **89 Features** (71 production-ready)
- **42 AI Workflows** + 2 Dialogue workflows
- **Multi-Provider Video** (Runway, Luma, Veo - hidden from user)
- **11 Image Models** (transparent selection)
- **4 Membership Tiers** (Free, Pro $29, Ultra $99, Studio $399)
- **Credit-Based** (1 credit = $0.01)
- **Vertical Video** (TikTok/Reels support)

---

## 🎯 PHASE 3 PLAN (Current)

### **✅ COMPLETED:**
- ShipFast template installed
- Clerk authentication integrated (Google + GitHub OAuth)
- Cinema theme applied
- Backend API client created (`lib/api.js`)
- Dashboard page built (credits, projects, video jobs)
- Provider-agnostic strategy documented

### **🚀 NEXT: Core Features (Today)**

#### **1. UnifiedChatPanel - AI Agent Interface** ⏱️ 2 hours
**Purpose**: Chat with AI to generate videos/images/audio

**Features**:
- Multi-agent chat (Director, Editor, Producer)
- Provider-agnostic requests
- Real-time streaming
- Mobile-optimized
- Context-aware suggestions

**API Integration**:
```javascript
// User types: "Generate a sunset video for TikTok"
api.video.generateAsync({
  prompt: "Cinematic sunset over ocean",
  qualityTier: "professional",  // NOT "runway" or "luma"
  videoMode: "text-only",
  aspectRatio: "9:16",  // Vertical for TikTok
  duration: 5
})
```

**Files to Create**:
- `app/chat/page.js` - Chat interface
- `components/UnifiedChatPanel.tsx` - Main chat component
- `components/AgentSelector.tsx` - Choose AI agent
- `components/MessageList.tsx` - Chat history
- `components/PromptInput.tsx` - User input

---

#### **2. Screenplay Editor** ⏱️ 1.5 hours
**Purpose**: Write screenplays in Fountain format

**Features**:
- Fountain format support
- Scene navigation
- Character tracking
- Auto-formatting
- GitHub sync (optional)

**API Integration**:
```javascript
api.screenplay.get(projectId)
api.screenplay.save(projectId, content)
api.screenplay.exportPDF(projectId)
```

**Files to Create**:
- `app/editor/page.js` - Editor page
- `components/FountainEditor.tsx` - Editor component
- `components/SceneNavigator.tsx` - Scene list
- `components/CharacterPanel.tsx` - Character tracking

---

#### **3. Production/Video Generation** ⏱️ 2 hours
**Purpose**: Generate videos from prompts or screenplay scenes

**Features**:
- Simple prompt interface
- Quality tier selection (Professional/Premium/Ultra)
- Aspect ratio selector (16:9, 9:16, 1:1)
- Duration picker (5s, 10s)
- Job status tracking
- Video preview

**API Integration**:
```javascript
// User picks quality tier, NOT provider
api.video.generateAsync({
  prompt: "Hero walking through forest",
  qualityTier: userTier,  // "professional" | "premium" | "ultra"
  aspectRatio: "16:9",
  duration: 5,
  enableSound: true
})

// Poll for status
api.video.getJobStatus(jobId)
```

**Files to Create**:
- `app/production/page.js` - Production page
- `components/VideoGenerator.tsx` - Main component
- `components/QualitySelector.tsx` - Tier picker (NOT provider picker)
- `components/AspectRatioSelector.tsx` - Format picker
- `components/VideoPreview.tsx` - Show result

---

## 📐 KEY ARCHITECTURE DECISIONS

### **1. Provider-Agnostic UI**

**❌ NEVER show provider names:**
```javascript
// BAD
<select>
  <option>Runway ML</option>
  <option>Luma Labs</option>
  <option>Google Veo</option>
</select>
```

**✅ ALWAYS show quality tiers:**
```javascript
// GOOD
<select>
  <option value="professional">Professional (50 credits)</option>
  <option value="premium">Premium 4K (75 credits)</option>
  <option value="ultra">Ultra Native 4K (150 credits)</option>
</select>
```

### **2. Credit-Based Everything**

**All pricing in credits:**
- Professional video (5s): 50 credits
- Premium video (5s): 75 credits
- Image generation: 3-50 credits
- Dialogue: 400-750 credits

**User never sees:**
- Provider names
- Provider costs
- Internal routing logic

### **3. Membership Tiers**

**Feature Access:**
- Free: Watermarked 720p
- Pro: 1080p commercial use
- Ultra: 4K + team features
- Studio: 8K + API access

**Volume:**
- Free: 10 credits/mo
- Pro: 3,000 credits/mo
- Ultra: 12,000 credits/mo
- Studio: 50,000 credits/mo

---

## 🎨 DESIGN SYSTEM

### **Cinema Theme:**
```css
--color-cinema-red: #DC143C
--color-electric-blue: #00D9FF
--color-premium-gold: #FFD700
--color-bg-primary: #0A0A0A (dark theme)
```

### **Components:**
- Use DaisyUI components (already in ShipFast)
- Add cinema color classes
- Film strip effects (optional)
- Responsive mobile-first

---

## 📱 MOBILE STRATEGY

**Mobile-First:**
- All features work on mobile
- Touch-optimized UI
- Simplified workflows
- 9:16 vertical video prominent

**Progressive Enhancement:**
- Desktop gets advanced features
- Mobile gets core workflows
- Same API, different UI

---

## 🚢 DEPLOYMENT PLAN

### **Phase 3: Core Features** (Today - 6 hours)
1. UnifiedChatPanel (2h)
2. Screenplay Editor (1.5h)
3. Production Page (2h)
4. Testing (0.5h)

### **Phase 4: Advanced Features** (Tomorrow - 4 hours)
1. Composition Studio (timeline editing)
2. Character Bank (consistency)
3. Workflow Library (42 workflows)
4. Settings & Billing

### **Phase 5: Polish** (Day 3 - 3 hours)
1. Mobile optimization
2. Loading states
3. Error handling
4. Onboarding flow

### **Phase 6: Launch** (Day 4)
1. Production deployment
2. Clerk production keys
3. Backend connection test
4. Go live! 🚀

---

## 📋 IMMEDIATE NEXT STEPS

1. **Run the START script:**
   ```powershell
   cd website-frontend-shipfast
   .\START.ps1
   ```

2. **Create `.env.local`:**
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Build UnifiedChatPanel** (starting now!)

---

## 🎯 SUCCESS METRICS

**By End of Day:**
- ✅ User can sign in (Google/GitHub)
- ✅ User sees dashboard with credits
- ✅ User can chat with AI agent
- ✅ User can write screenplay
- ✅ User can generate video
- ✅ User sees job status

**By End of Week:**
- All 42 workflows accessible
- Mobile fully functional
- Ready for beta users
- Production deployment complete

---

## 💡 GUIDING PRINCIPLES

1. **Backend is perfect** - Don't touch it!
2. **Provider-agnostic** - Hide Luma/Runway/Veo
3. **Credit-based** - Everything in credits
4. **Mobile-first** - Touch optimized
5. **Cinema theme** - Professional look
6. **Fast iteration** - Ship quickly

---

**LET'S BUILD THIS! 🎬**

