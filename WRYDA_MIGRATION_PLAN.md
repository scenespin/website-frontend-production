# WRYDA.AI SHIPFAST MIGRATION PLAN

## Current Status: ✅ ShipFast Running on localhost:3001

---

## PHASE 1: Cinema Theme & Branding (1 hour)

### Step 1: Apply Cinema Colors (15 min)
**Files to modify:**
- `tailwind.config.js` - Add cinema color palette
- `app/globals.css` - Add custom cinema styles
- `config.js` - Update brand colors

**Cinema Colors:**
```
Primary: #DC143C (cinema red)
Secondary: #00D9FF (electric blue)
Accent: #FFD700 (premium gold)
Backgrounds: #0A0A0A → #141414 → #1F1F1F
Text: #FFFFFF → #B3B3B3 → #808080
```

### Step 2: Replace Branding (15 min)
**Files to modify:**
- `config.js` - Change app name, description, domain
- `app/layout.js` - Update metadata
- `public/` - Replace logo/favicon with Wryda.ai branding

**Brand:**
- Name: Wryda.ai
- Tagline: "AI-Powered Screenplay to Video"
- Logo: Film strip icon + "Wryda.ai" text

### Step 3: Clean Demo Content (15 min)
**Files to modify:**
- `app/page.js` - Replace hero section with Wryda.ai content
- `components/` - Remove demo components we don't need
- Keep: Pricing, FAQ, Footer structure

### Step 4: Test & Verify (15 min)
- Verify build works
- Check responsive design
- Test navigation

---

## PHASE 2: Authentication Setup (1 hour)

### Step 1: Install Clerk (15 min)
```bash
npm install @clerk/nextjs
```

### Step 2: Replace NextAuth with Clerk (30 min)
**Files to modify:**
- Remove: `libs/next-auth.js`
- Remove: `app/api/auth/[...nextauth]/route.js`
- Add: `middleware.ts` with Clerk config
- Update: `app/layout.js` with ClerkProvider

### Step 3: Update Protected Routes (15 min)
- Wrap dashboard with Clerk auth
- Add role checking for admin

---

## PHASE 3: Backend API Integration (1 hour)

### Step 1: Configure API Client (20 min)
**Create:**
- `lib/api/client.ts` - Axios instance with your backend URL
- `lib/api/endpoints.ts` - All API endpoints

**Your Backend:**
```
Base URL: http://localhost:3000 (or production URL)
Endpoints: /api/projects, /api/video, /api/credits, etc
```

### Step 2: Replace Demo API Routes (20 min)
**Remove:**
- `app/api/stripe/*` (keep structure, connect to your backend)
- `app/api/lead/*` (if not needed)

**Keep & Modify:**
- Stripe webhooks (point to your backend)

### Step 3: Test API Connection (20 min)
- Test user data fetch
- Test project list
- Verify credits balance

---

## PHASE 4: Core Pages (2-3 hours)

### Dashboard Page (1 hour)
**File:** `app/dashboard/page.js`

**Replace with:**
- User projects list (from your API)
- Credit balance display
- Quick actions (New Project, Production, Timeline)
- Recent activity

### Navigation (30 min)
**Files:** `components/Header.js`, `components/ButtonSignin.js`

**Add links:**
- Dashboard
- Write (Screenplay Editor)
- Production
- Composition
- Timeline
- Settings

### Settings Page (30 min)
**File:** `app/dashboard/settings/page.js` (new)

**Add:**
- User profile
- API key management
- Preferences

---

## PHASE 5: Migrate Your Features (4-6 hours)

### UnifiedChatPanel (1 hour)
**Copy from:** `website-frontend/src/components/agents/`

**Integrate:**
- Create `components/ai/unified-chat-panel.jsx`
- Add mobile drawer wrapper
- Connect to your AI API endpoints

### Screenplay Editor (1.5 hours)
**Copy from:** `website-frontend/src/app/app/write/`

**Create:**
- `app/dashboard/write/page.js`
- Copy editor components
- Connect to your API

### Production Workflows (1.5 hours)
**Copy from:** `website-frontend/src/app/app/production/`

**Create:**
- `app/dashboard/production/page.js`
- Migrate workflow components
- Connect video generation API

### Composition Studio (1 hour)
**Copy from:** `website-frontend/src/components/composition/`

**Create:**
- `app/dashboard/composition/page.js`
- Migrate composition components

### Timeline Editor (1 hour)
**Copy from:** `website-frontend/src/components/timeline/`

**Create:**
- `app/dashboard/timeline/page.js`
- Install vis-timeline
- Migrate timeline component

---

## PHASE 6: Polish & Deploy (1-2 hours)

### Mobile Testing (30 min)
- Test all pages on mobile
- Verify UnifiedChatPanel drawer
- Check responsive navigation

### Admin Panel (30 min)
**Copy from:** `website-frontend/src/app/app/admin/`

**Create:**
- `app/dashboard/admin/` (role-protected)
- User management
- Pricing dashboard

### Final Build & Deploy (30 min)
- Run production build
- Fix any errors
- Deploy to Vercel
- Test live site

---

## TOTAL TIME ESTIMATE: 10-14 hours

**Today's Goal:** Complete Phases 1-3 (Cinema theme, auth, API connection)
**Tomorrow:** Phases 4-6 (Pages, features, deploy)

---

## FILES TO KEEP FROM OLD FRONTEND

**Copy these directories:**
- `src/components/agents/` → UnifiedChatPanel
- `src/components/editor/` → Screenplay editor
- `src/components/production/` → Video workflows
- `src/components/composition/` → Composition studio
- `src/components/timeline/` → Timeline editor
- `src/utils/fountain.ts` → Fountain parser
- `src/hooks/` → Custom hooks

**Backend stays 100% unchanged!**

---

**Next Step:** Let me start Phase 1 - Cinema Theme!

