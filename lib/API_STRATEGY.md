# 🎬 Wryda.ai API Strategy

## **Provider-Agnostic Architecture**

### **Core Principle: Frontend Never Knows Providers**

The frontend **NEVER** specifies providers (Luma, Runway, Veo, ElevenLabs, etc.). Instead, it uses **quality tiers** and **video modes**, and the backend intelligently routes to the best provider.

---

## **Video Generation API**

### **What Frontend Sends:**
```javascript
{
  prompt: "Cinematic shot of a sunset",
  qualityTier: "professional" | "premium",
  videoMode: "text-only" | "image-start" | "image-interpolation" | "reference-images",
  aspectRatio: "16:9" | "9:16" | "1:1",
  duration: 5 | 10,
  
  // Optional enhancements
  cameraMotion: "pan left" | "zoom in" | "static",
  enableSound: true,
  enableLoop: true,
  
  // Image inputs (based on videoMode)
  startImageUrl?: "https://...",
  endImageUrl?: "https://...",
  referenceImageUrls?: ["https://...", "https://..."],
}
```

### **What Backend Does:**
1. Analyzes the request (prompt, quality, mode)
2. Checks content safety
3. Selects best provider (Veo 3.1, Luma Dream Machine, Runway Gen-3)
4. Routes to selected provider
5. Returns unified response

### **What Frontend Gets Back:**
```javascript
{
  success: true,
  videos: [
    {
      url: "https://wryda-videos.s3.amazonaws.com/...",
      s3Key: "videos/user123/...",
      resolution: "1080p",
      duration: 5,
    }
  ],
  creditsDeducted: 850,
  // NO provider name exposed!
}
```

---

## **Audio Generation API**

### **What Frontend Sends:**
```javascript
{
  text: "Hello, this is a voiceover",
  voiceProfile: "cinematic-narrator" | "character-male" | "character-female",
  emotionalTone: "neutral" | "excited" | "dramatic",
  speed: 1.0,
}
```

### **What Backend Does:**
1. Selects best provider (ElevenLabs, AWS Polly, Azure, Google)
2. Generates audio
3. Uploads to S3
4. Returns unified response

---

## **Music Generation API**

### **What Frontend Sends:**
```javascript
{
  prompt: "Epic orchestral battle music",
  duration: 30,
  genre: "orchestral" | "electronic" | "ambient",
}
```

### **What Backend Does:**
1. Routes to Suno or other music AI
2. Generates music
3. Returns unified response

---

## **Benefits of This Strategy**

✅ **Frontend stays simple** - No provider logic  
✅ **Easy to add new providers** - Just update backend routing  
✅ **Automatic failover** - If Luma is down, use Runway  
✅ **Cost optimization** - Backend can choose cheapest provider  
✅ **No vendor lock-in** - Switch providers without frontend changes  

---

## **Routes Using Provider-Agnostic Strategy**

- `/api/video/generate` - Video generation (sync)
- `/api/video/generate-async` - Video generation (async)
- `/api/image/generate` - Image generation
- `/api/music/generate` - Music generation
- `/api/elevenlabs/tts` - Text-to-speech (wrapper around ElevenLabs)

---

## **IMPORTANT: No Legacy Routes in New Frontend**

❌ **DON'T USE:**
- `/api/video/luma/generate` (provider-specific, deprecated)
- `/api/video/runway/generate` (provider-specific, deprecated)
- `/api/image/luma/generate` (provider-specific, deprecated)

✅ **USE:**
- `/api/video/generate-async` (provider-agnostic)
- `/api/image/generate` (provider-agnostic)
- `/api/music/generate` (provider-agnostic)

---

## **Example: Video Generation Flow**

### **1. User clicks "Generate Video"**

Frontend sends:
```javascript
api.video.generateAsync({
  prompt: "A hero walking through a forest",
  qualityTier: "professional",
  videoMode: "text-only",
  aspectRatio: "16:9",
  duration: 5,
  cameraMotion: "pan right",
  enableSound: true,
})
```

### **2. Backend routes to best provider**

Backend logic:
- Checks prompt complexity
- Checks user's credit balance
- Checks provider availability
- **Decides**: Veo 3.1 for high quality cinematic
- Deducts credits
- Submits to Veo

### **3. Frontend polls for status**

```javascript
const status = await api.video.getJobStatus(jobId);
// { status: "processing", progress: 45 }
```

### **4. Video completes**

```javascript
const result = await api.video.getJobStatus(jobId);
// { status: "completed", videoUrl: "https://...", creditsUsed: 850 }
```

**User never knows it was Veo!** 🎉

---

## **This Strategy Powers:**

- 🎬 **Production Page** - Generate videos from screenplay
- 🎨 **Composition Studio** - Multi-clip workflows
- 🎞️ **Timeline Editor** - Scene-by-scene generation
- 🤖 **Unified Chat Panel** - Natural language video requests

All use the same provider-agnostic API! 🚀

