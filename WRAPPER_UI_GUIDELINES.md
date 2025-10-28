# 🛡️ WRYDA.AI WRAPPER STRATEGY - UI/UX GUIDELINES
## **Frontend Implementation Rules**

**Date**: October 28, 2025  
**Status**: MANDATORY - Follow 100%  
**Purpose**: Hide provider complexity, show only quality & credits

---

## 🎯 CORE PRINCIPLE

**"Users choose QUALITY, backend chooses PROVIDER"**

Users NEVER see:
- ❌ Runway, Luma, Veo, Sora (provider names)
- ❌ Provider logos or branding
- ❌ Technical routing details
- ❌ Fallback strategies
- ❌ Cost breakdowns per provider

Users ALWAYS see:
- ✅ Quality tiers (Professional/Premium/Ultra)
- ✅ Credit costs (transparent)
- ✅ Features and capabilities
- ✅ Generation time estimates
- ✅ Resolution options

---

## 🎬 VIDEO GENERATION UI

### **✅ CORRECT - Quality Tier Selector:**

```jsx
<select className="select select-bordered">
  <option value="professional">
    Professional 1080p (50 credits)
  </option>
  <option value="premium">
    Premium 4K (75 credits)
  </option>
  <option value="ultra">
    Ultra Native 4K (150 credits)
  </option>
</select>
```

### **❌ WRONG - Provider Selector:**

```jsx
// NEVER DO THIS!
<select>
  <option value="runway">Runway Gen4 ($0.25)</option>
  <option value="luma">Luma Ray 2 ($0.49)</option>
  <option value="veo">Google Veo ($0.50)</option>
</select>
```

---

## 📐 ASPECT RATIO UI - ALL 5 FORMATS

### **✅ CORRECT - Platform Presets:**

```jsx
<div className="aspect-ratio-selector">
  {/* Standard Formats - Same Price (50cr) */}
  <button className="btn">
    <Youtube className="icon" />
    YouTube (16:9)
  </button>
  <button className="btn">
    <TikTok className="icon" />
    TikTok (9:16) ✨ Vertical
  </button>
  <button className="btn">
    <Instagram className="icon" />
    Instagram (1:1) Square
  </button>
  <button className="btn">
    <Facebook className="icon" />
    Facebook (4:3) Retro
  </button>
  
  {/* Premium Format - +15cr */}
  <button className="btn btn-outline">
    <Film className="icon" />
    Cinema (21:9) Ultra Wide 🎬
    <span className="badge">+15 cr</span>
  </button>
  
  {/* Multi-Format Bundle */}
  <button className="btn btn-primary">
    <Globe className="icon" />
    Social Bundle (All 3)
    <span className="badge badge-success">Save 30 cr!</span>
  </button>
</div>
```

**Show users platforms, not technical specs!**

### **Complete Aspect Ratio Support:**

| Format | Ratio | Platforms | Price | Use Case |
|--------|-------|-----------|-------|----------|
| Landscape | 16:9 | YouTube, Web | 50 cr | Traditional video |
| **Vertical** | **9:16** | **TikTok, Reels** | **50 cr** | **Mobile-first** ✨ |
| Square | 1:1 | Instagram, Twitter | 50 cr | Social feeds |
| Classic | 4:3 | Facebook, Retro | 50 cr | Nostalgic content |
| **Cinema** | **21:9** | **Film Festivals** | **65 cr** | **Ultra-wide** 🎬 |

### **Multi-Format Bundles:**

```jsx
<div className="bundle-options">
  <div className="bundle-card">
    <h3>Social Bundle</h3>
    <p>Get all 3 formats</p>
    <div className="formats">
      <Badge>16:9</Badge>
      <Badge>9:16</Badge>
      <Badge>1:1</Badge>
    </div>
    <p className="price">120 credits</p>
    <p className="savings">Save 30 credits!</p>
  </div>
  
  <div className="bundle-card">
    <h3>Filmmaker Bundle</h3>
    <p>Standard + Cinema</p>
    <div className="formats">
      <Badge>16:9</Badge>
      <Badge>21:9</Badge>
    </div>
    <p className="price">100 credits</p>
    <p className="savings">Save 15 credits!</p>
  </div>
</div>
```

---

## 🎨 IMAGE GENERATION UI

### **EXCEPTION: Images ARE Transparent**

For images ONLY, show model names:

```jsx
<div className="image-model-selector">
  <div className="model-card">
    <h3>Luma Photon Flash</h3>
    <p>Fast, photorealistic</p>
    <span>3 credits</span>
  </div>
  <div className="model-card">
    <h3>Google Imagen 4</h3>
    <p>Highest quality</p>
    <span>20 credits</span>
  </div>
</div>
```

**Why?** Artistic differences matter for images. Users choose based on style.

---

## 🎤 AUDIO GENERATION UI

### **✅ CORRECT - Feature-Based:**

```jsx
<div className="audio-options">
  <button className="btn">
    AI Voice Acting (10 credits)
  </button>
  <button className="btn">
    AI Music Generation (50 credits)
  </button>
  <button className="btn">
    AI Dialogue (400 credits)
  </button>
</div>
```

### **❌ WRONG - Provider-Based:**

```jsx
// NEVER DO THIS!
<button>ElevenLabs Voice (10 credits)</button>
<button>Suno Music (50 credits)</button>
```

---

## 💬 UNIFIED CHAT PANEL

### **✅ CORRECT - Natural Language:**

```jsx
// User types
"Generate a sunset video for TikTok in 4K"

// Backend interprets as:
{
  prompt: "Cinematic sunset over ocean",
  qualityTier: "premium",  // NOT "luma-ray-2"
  aspectRatio: "9:16",
  duration: 5
}
```

**Chat responses:**
```
✅ "Your Premium 4K video is generating..."
❌ "Routing to Luma Ray Flash 2 provider..."
```

---

## 🎯 VIDEO STATUS UI

### **✅ CORRECT - User-Friendly Status:**

```jsx
<div className="video-status">
  <div className="status-badge">
    {status === 'processing' && 'Generating...'}
    {status === 'completed' && 'Ready!'}
    {status === 'failed' && 'Generation failed'}
  </div>
  <p>Premium 4K (9:16) • 5 seconds</p>
  <p>75 credits</p>
</div>
```

### **❌ WRONG - Technical Status:**

```jsx
// NEVER DO THIS!
<div>
  <p>Provider: Luma Ray Flash 2</p>
  <p>Cost: $0.39 (provider) + $0.10 (upscale)</p>
  <p>Status: Waiting in Runway queue...</p>
</div>
```

---

## 📊 PRICING DISPLAY

### **✅ CORRECT - Credit-Based:**

```jsx
<div className="pricing-card">
  <h3>Professional Video</h3>
  <p className="price">50 credits</p>
  <p className="description">
    High-quality 1080p video, 5 seconds
  </p>
  <ul>
    <li>✅ All platforms (16:9, 9:16, 1:1)</li>
    <li>✅ Fast generation (30-60s)</li>
    <li>✅ Commercial rights</li>
  </ul>
</div>
```

### **❌ WRONG - Provider Costs:**

```jsx
// NEVER DO THIS!
<div>
  <h3>Runway Gen4 Turbo</h3>
  <p>$0.25 per 5sec</p>
  <p>Markup: 100%</p>
  <p>Your cost: $0.50</p>
</div>
```

---

## 🚨 ERROR MESSAGES

### **✅ CORRECT - User-Focused:**

```jsx
"Video generation failed. Please try again."
"Content doesn't meet our guidelines. Try rephrasing."
"Generation taking longer than expected. We'll notify you."
```

### **❌ WRONG - Technical Details:**

```jsx
// NEVER DO THIS!
"Veo rejected content due to safety filters"
"Falling back to Sora 2 Pro (will cost $6 instead of $1)"
"Runway API returned 429 rate limit"
```

---

## 💰 CREDIT DISPLAY

### **✅ CORRECT - Simple & Clear:**

```jsx
<div className="credits-widget">
  <Zap className="icon" />
  <span className="balance">1,250 credits</span>
  <button className="btn-sm">Add Credits</button>
</div>
```

**Show:**
- Current balance
- Estimated cost before generation
- Deduction confirmation after

**Don't show:**
- Provider costs
- Internal markup percentages
- Routing decisions

---

## 🎬 WORKFLOW SELECTION

### **✅ CORRECT - Use Case Based:**

```jsx
<div className="workflow-grid">
  <div className="workflow-card">
    <h3>Hollywood Standard</h3>
    <p>Premium quality cinematic video</p>
    <span>~140 credits</span>
  </div>
  <div className="workflow-card">
    <h3>Social Media Loop</h3>
    <p>Perfect looping clips for TikTok</p>
    <span>~85 credits</span>
  </div>
</div>
```

**Focus on:**
- What user wants to create
- Use case / scenario
- Approximate cost
- Expected quality

**Never mention:**
- Which providers are used
- Internal routing logic
- Fallback strategies

---

## 📱 MOBILE CONSIDERATIONS

**Simplified UI for mobile:**
- Default to "Professional" tier
- Show "TikTok" option prominently
- One-tap generation
- Clear credit cost before confirm

**Desktop gets:**
- All quality options
- Advanced settings
- Multiple aspect ratios at once

---

## 🎨 BRANDING & MESSAGING

### **Marketing Copy:**

**✅ DO SAY:**
- "AI-powered video generation"
- "Professional quality"
- "Cinema-grade output"
- "Broadcast ready"
- "Hollywood-style"

**❌ DON'T SAY:**
- "Powered by Runway/Luma/Veo"
- "Using OpenAI technology"
- "Leveraging Google's Imagen"
- Provider names in ANY context

### **Feature Descriptions:**

**✅ GOOD:**
```
Generate stunning 4K videos with our advanced AI technology.
Professional quality in seconds.
```

**❌ BAD:**
```
We use Runway Gen4 and Luma Ray 2 to generate videos,
with fallback to Google Veo when needed.
```

---

## 🛡️ WRAPPER EXCEPTIONS

**ONLY Image Models are transparent:**

```jsx
// This is OK for images ONLY
<ImageModelCard
  name="Luma Photon Flash"
  provider="Luma"  // OK to show for images
  credits={3}
/>
```

**Everything else (video/audio) stays wrapped!**

---

## ✅ CHECKLIST FOR EVERY NEW FEATURE

Before shipping any UI:

- [ ] No provider names mentioned?
- [ ] Credits clearly displayed?
- [ ] Quality tiers, not provider names?
- [ ] Error messages user-friendly?
- [ ] Status updates non-technical?
- [ ] Pricing in credits only?
- [ ] No backend complexity exposed?
- [ ] Mobile-friendly?

---

## 📋 COMMON PATTERNS

### **Video Generation Form:**
```jsx
<Form>
  <Input label="What do you want to create?" />
  <Select label="Quality" options={['Professional', 'Premium', 'Ultra']} />
  <AspectRatioSelector platforms={['YouTube', 'TikTok', 'Instagram']} />
  <DurationPicker options={[5, 10]} />
  <CostEstimate credits={50} />
  <Button>Generate (50 credits)</Button>
</Form>
```

### **Generation Status:**
```jsx
<StatusCard>
  <Spinner />
  <p>Generating your Premium 4K video...</p>
  <p>Estimated time: 60-90 seconds</p>
  <ProgressBar value={45} />
</StatusCard>
```

### **Result Display:**
```jsx
<VideoResult>
  <VideoPlayer src={videoUrl} />
  <MetaData>
    <p>Premium 4K (9:16)</p>
    <p>5 seconds</p>
    <p>75 credits used</p>
  </MetaData>
  <Actions>
    <Button>Download</Button>
    <Button>Share</Button>
    <Button>Regenerate</Button>
  </Actions>
</VideoResult>
```

---

## 🎯 SUMMARY

**Golden Rule:**
> "If the user can see it, it must be wrapper-safe"

**Key Principles:**
1. **Quality, not providers** - Users pick tiers
2. **Credits, not costs** - Transparent pricing
3. **Features, not tech** - Benefits, not implementation
4. **Simple, not technical** - Clean UX
5. **Platform-focused** - "YouTube" not "16:9"

**Result:**
- Users think: "Wryda makes amazing videos!"
- Users DON'T think: "They're just reselling Runway/Luma"

---

**This is your north star for ALL UI decisions!** 🌟

Follow these rules 100% and the wrapper strategy stays protected.

