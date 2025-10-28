# Clerk Environment Variables Setup for Wryda.ai

## Required Clerk Keys (from your .env.local)

Add these to `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# Clerk URLs (use port 3001)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## OAuth Providers Configuration

### In your Clerk Dashboard (https://dashboard.clerk.com):

### 1. **Google OAuth** ✅
- Go to: Configure → Social Connections
- Enable: Google
- Your Google OAuth credentials are already set up

### 2. **GitHub OAuth** ✅
- Go to: Configure → Social Connections
- Enable: GitHub
- Your GitHub OAuth credentials are already set up

### 3. **Dropbox Integration** (API Integration)
- This is NOT an OAuth login provider
- This is for file storage/import functionality
- Keep your existing Dropbox API integration in your backend
- No Clerk configuration needed

**Dropbox Environment Variables** (keep in your backend .env):
```bash
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_secret
DROPBOX_REDIRECT_URI=your_callback_url
```

### 4. **Google Drive Integration** (API Integration)
- This is NOT an OAuth login provider
- This is for file storage/import functionality
- Keep your existing Google Drive API integration in your backend
- No Clerk configuration needed

**Google Drive Environment Variables** (keep in your backend .env):
```bash
GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_drive_secret
GOOGLE_DRIVE_REDIRECT_URI=your_callback_url
```

---

## Summary

### **For User Login (Clerk handles these):**
✅ **Google Sign-In** - User logs in with Google account  
✅ **GitHub Sign-In** - User logs in with GitHub account

### **For File Import/Storage (Your backend handles these):**
✅ **Dropbox** - Import screenplays from Dropbox  
✅ **Google Drive** - Import screenplays from Google Drive

**No conflicts!** Clerk handles authentication, your backend handles file operations.

---

## How It Works Together:

1. **User logs in** via Clerk (Google or GitHub)
2. **After login**, user is on your dashboard
3. **When importing files**, your backend uses Dropbox/Drive APIs
4. **User connects Dropbox/Drive** via your settings page (separate OAuth flow)

---

## Next Steps:

1. Copy your Clerk keys from old frontend `.env.local`
2. Paste into new ShipFast `.env.local`
3. Restart dev server: `npm run dev -- --port 3001`
4. Test login!

