# 🎬 WRYDA.AI - STARTUP GUIDE
## Get Your AI Video Platform Running in 5 Minutes!

**Date**: October 28, 2025  
**Status**: Ready to Launch! 🚀

---

## 📋 WHAT WE BUILT

✅ **Dashboard** - Credits, projects, recent videos  
✅ **AI Chat** - Natural language video generation  
✅ **Video Generator** - Professional UI with ALL 5 aspect ratios  
✅ **Screenplay Editor** - Fountain format with auto-save  
✅ **Navigation** - Beautiful responsive menu  
✅ **Authentication** - Clerk (Google + GitHub OAuth)  
✅ **API Client** - Provider-agnostic backend connection  
✅ **Cinema Theme** - Professional dark theme with cinema colors  

---

## 🚀 QUICK START

### **Step 1: Install Dependencies** (2 minutes)

```powershell
cd website-frontend-shipfast
npm install
```

This installs:
- lucide-react (icons)
- axios (API calls)
- All ShipFast dependencies

---

### **Step 2: Configure Environment** (3 minutes)

Create `.env.local` in `website-frontend-shipfast/`:

```env
# Clerk Authentication (Development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Clerk Production Keys (for deployment)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
# CLERK_SECRET_KEY=sk_live_...
```

**Get Clerk Keys:**
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to API Keys
4. Copy "Publishable key" and "Secret key"

---

### **Step 3: Start Backend** (Must be running on port 3000)

In a separate terminal:
```powershell
cd website-backend-api
npm run dev
```

**Backend should be on:** `http://localhost:3000`

---

### **Step 4: Start Frontend** (Use our script!)

```powershell
cd website-frontend-shipfast
.\START.ps1
```

**Frontend will be on:** `http://localhost:3001`

---

## 🎯 TEST THE FEATURES

### **1. Sign In** ✅
- Go to http://localhost:3001
- Click "Sign In"
- Use Google or GitHub
- You'll be redirected to Dashboard

### **2. Dashboard** ✅
- See your credits (starts at 50 for free users)
- View projects (empty at first)
- Quick actions to all features

### **3. AI Chat** 💬
- Click "AI Chat" in navigation
- Try: "Create a sunset video for TikTok"
- Try: "Generate a 4K video for YouTube"
- Watch it parse your intent!

### **4. Video Generator** 🎬
- Click "Generate Video"
- Enter a prompt
- Select quality tier (Professional/Premium/Ultra)
- Choose aspect ratio (YouTube, TikTok, Instagram, Facebook, Cinema)
- See cost estimate update in real-time
- Click "Generate Video"
- Watch job status polling!

### **5. Screenplay Editor** 📝
- Click "Screenplay"
- Start typing in Fountain format
- Watch characters and locations auto-populate
- See auto-save every 30 seconds
- Try exporting to PDF

---

## 🎨 FEATURES OVERVIEW

### **Quality Tiers** (Wrapper-Safe!)
```
Professional 1080p → 50 credits
Premium 4K → 75 credits
Ultra Native 4K → 150 credits
```
*No provider names shown - users pick quality, backend picks provider!*

### **Aspect Ratios** (All 5!)
```
📺 YouTube (16:9) → 50 cr
📱 TikTok (9:16) → 50 cr
⬛ Instagram (1:1) → 50 cr
📷 Facebook (4:3) → 50 cr
🎬 Cinema (21:9) → 65 cr (premium)
```

### **Multi-Format Bundles**
```
Social Bundle (3 formats) → 120 cr (save 30!)
Filmmaker Bundle (2 formats) → 100 cr (save 15!)
```

---

## 🛡️ WRAPPER STRATEGY COMPLIANCE

✅ **Video & Audio**: NO provider names  
✅ **Images**: Transparent (11 models shown)  
✅ **Quality Tiers**: Professional/Premium/Ultra  
✅ **Platform-Focused**: YouTube/TikTok not 16:9/9:16  
✅ **Credits Only**: No internal cost breakdowns  

**Users think:** "Wryda makes amazing videos!"  
**Users DON'T think:** "They're reselling Runway/Luma"

---

## 📂 FILE STRUCTURE

```
website-frontend-shipfast/
├── app/
│   ├── dashboard/
│   │   ├── layout.js          ✅ Protected layout
│   │   └── page.js            ✅ Dashboard with credits
│   ├── chat/
│   │   ├── layout.js          ✅ Protected layout
│   │   └── page.js            ✅ AI chat interface
│   ├── production/
│   │   ├── layout.js          ✅ Protected layout
│   │   └── page.js            ✅ Video generator
│   ├── editor/
│   │   ├── layout.js          ✅ Protected layout
│   │   └── page.js            ✅ Screenplay editor
│   ├── sign-in/
│   │   └── [[...sign-in]]/    ✅ Clerk sign-in
│   └── sign-up/
│       └── [[...sign-up]]/    ✅ Clerk sign-up
├── components/
│   └── Navigation.js          ✅ Main navigation menu
├── lib/
│   ├── api.js                 ✅ Backend API client
│   └── API_STRATEGY.md        📝 Provider-agnostic docs
├── .env.local                 🔑 Your environment variables
├── START.ps1                  🚀 Startup script
├── BUILD_PLAN.md              📋 Development plan
└── WRAPPER_UI_GUIDELINES.md   📖 UI/UX rules
```

---

## 🐛 TROUBLESHOOTING

### **Port 3001 Already in Use?**
```powershell
# Kill the process
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Then restart
.\START.ps1
```

### **Backend Not Running?**
```powershell
# Check if backend is on port 3000
curl http://localhost:3000/api/status
```

### **Clerk Auth Errors?**
- Verify `.env.local` has correct keys
- Check Clerk Dashboard for your app
- Make sure you're using **development** keys (pk_test_...)

### **CSS Not Loading?**
```powershell
# Clear Next.js cache
rm -rf .next
npm run dev -- --port 3001
```

---

## 📱 MOBILE TESTING

The app is **mobile-first**! Test on:
- Chrome DevTools (F12 → Toggle Device Toolbar)
- Real phone at `http://YOUR_IP:3001`
- Vertical video (9:16) should be prominent

---

## 🚀 NEXT STEPS

### **Today** (You can do right now!):
1. ✅ Test all features locally
2. ✅ Try generating a video (if backend is connected)
3. ✅ Explore the UI on mobile
4. ✅ Customize colors in `globals.css`

### **This Week**:
1. Add more workflows (42 available in backend)
2. Add composition studio (timeline editing)
3. Add character bank (consistency)
4. Add settings & billing pages

### **When Ready to Deploy**:
1. Get Clerk **production** keys
2. Update `.env.local` with production API URL
3. Deploy to Vercel: `vercel --prod`
4. Update Clerk redirect URLs
5. Go live! 🎉

---

## 💡 PRO TIPS

### **Development Workflow**:
```powershell
# Terminal 1: Backend
cd website-backend-api
npm run dev

# Terminal 2: Frontend
cd website-frontend-shipfast
.\START.ps1
```

### **Hot Reload**:
- Frontend: Auto-reloads on file save
- Backend: Nodemon auto-restarts
- Just save and refresh!

### **API Testing**:
```javascript
// Test API in browser console
const response = await fetch('http://localhost:3000/api/user', {
  headers: {
    'Authorization': 'Bearer YOUR_CLERK_TOKEN'
  }
});
console.log(await response.json());
```

---

## 🎬 YOU'RE READY!

**Everything is built and ready to test!**

Run this ONE command:
```powershell
cd website-frontend-shipfast && .\START.ps1
```

Then open: **http://localhost:3001**

---

## 📞 NEED HELP?

Check these files:
- `BUILD_PLAN.md` - Overall architecture
- `WRAPPER_UI_GUIDELINES.md` - UI/UX rules
- `lib/API_STRATEGY.md` - Backend integration
- `masterDocs/` - Complete platform documentation

---

**LET'S GO! 🚀🎬**

