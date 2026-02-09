// API Client for Backend
import axios from 'axios';

// IMPORTANT: Use relative URLs so requests go through Next.js API proxy routes
// This ensures proper auth token handling and avoids CORS issues
const API_URL = ''; // Empty string = relative URLs (e.g. /api/workflows/list)

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false - we handle auth via Bearer tokens
});

// This will be set by the component using getToken from useAuth
let getTokenFunction = null;

export const setAuthTokenGetter = (getTokenFn) => {
  getTokenFunction = getTokenFn;
};

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    // Get Clerk session token (client-side only)
    if (typeof window !== 'undefined' && getTokenFunction) {
      try {
        const token = await getTokenFunction();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('[API Interceptor] Error getting auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle 401 errors - no console spam
    return Promise.reject(error);
  }
);

// API Methods (matching actual backend routes)
export const api = {
  // User & Credits
  user: {
    getProfile: () => apiClient.get('/api/user'),
    getCredits: (refresh = false) => apiClient.get(`/api/credits/balance${refresh ? '?refresh=true' : ''}`),
    getUsage: () => apiClient.get('/api/credits/usage'),
    getCreditHistory: () => apiClient.get('/api/credits/history'),
  },

  // Projects (Screenplay Management)
  projects: {
    list: () => apiClient.get('/api/projects/list'),
    get: (projectId) => apiClient.get(`/api/projects/${projectId}`),
    create: (data) => apiClient.post('/api/projects/create', data),
    update: (projectId, data) => apiClient.put(`/api/projects/${projectId}`, data),
    delete: (projectId) => apiClient.delete(`/api/projects/${projectId}`),
    getStorageConfig: (projectId) => apiClient.get(`/api/projects/${projectId}/storage-config`),
    checkAccess: (projectId) => apiClient.get(`/api/projects/${projectId}/access`),
    
    // Collaboration Management (projectId is treated as screenplayId for backward compatibility)
    listCollaborators: (screenplayId) => apiClient.get(`/api/projects/${screenplayId}/collaborators/list`).then(res => res.data),
    addCollaborator: (screenplayId, data) => apiClient.post(`/api/projects/${screenplayId}/collaborators/add`, data).then(res => res.data),
    removeCollaborator: (screenplayId, identifier) => apiClient.delete(`/api/projects/${screenplayId}/collaborators/remove`, { data: { identifier } }).then(res => res.data),
    updateCollaboratorRole: (screenplayId, identifier, role) => apiClient.put(`/api/projects/${screenplayId}/collaborators/update-role`, { identifier, role }).then(res => res.data),
    getCollaboratorRoles: (screenplayId) => apiClient.get(`/api/projects/${screenplayId}/collaborators/roles`).then(res => res.data),
  },

  // Screenplay (projectId is treated as screenplayId for backward compatibility)
  screenplay: {
    get: (screenplayId) => apiClient.get(`/api/screenplay/${screenplayId}`),
    save: (screenplayId, content) => apiClient.put(`/api/screenplay/${screenplayId}`, { content }),
    exportPDF: (screenplayId) => apiClient.post(`/api/screenplay/${screenplayId}/export`, { format: 'pdf' }),
  },

  // Character Bank API (uses screenplayId)
  characterBank: {
    list: (screenplayId) => apiClient.get(`/api/character-bank/list?screenplayId=${screenplayId}`).then(res => res.data),
    create: (data) => apiClient.post('/api/character-bank/create', data).then(res => res.data),
    get: (characterId) => apiClient.get(`/api/character-bank/${characterId}`).then(res => res.data),
    update: (characterId, data) => apiClient.put(`/api/character-bank/${characterId}`, data).then(res => res.data),
    delete: (characterId) => apiClient.delete(`/api/character-bank/${characterId}`).then(res => res.data),
    uploadReference: (formData) => apiClient.post('/api/character-bank/upload-reference', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
    generateVariations: (data) => apiClient.post('/api/character-bank/generate-variations', data).then(res => res.data),
    updatePerformance: (data) => apiClient.post('/api/character-bank/update-performance', data).then(res => res.data),
  },

  // Asset Bank API (uses screenplayId)
  assetBank: {
    // 🔥 NEW: Add context parameter to filter Production Hub images when context=creation
    // context='creation': Only returns Creation images (asset.images), filters out angleReferences
    // context='production-hub' or no context: Returns both Creation and Production Hub images
    list: (screenplayId, context) => {
      const contextParam = context ? `&context=${context}` : '';
      return apiClient.get(`/api/asset-bank?screenplayId=${screenplayId}${contextParam}`).then(res => res.data);
    },
    create: (data) => apiClient.post('/api/asset-bank', data).then(res => res.data),
    get: (assetId, context) => {
      const contextParam = context ? `?context=${context}` : '';
      return apiClient.get(`/api/asset-bank/${assetId}${contextParam}`).then(res => res.data);
    },
    update: (assetId, data, context) => {
      const contextParam = context ? `?context=${context}` : '';
      return apiClient.put(`/api/asset-bank/${assetId}${contextParam}`, data).then(res => res.data);
    },
    delete: (assetId) => apiClient.delete(`/api/asset-bank/${assetId}`)
      .then(res => {
        // DELETE returns 204 No Content, so res.data will be empty
        return res.status === 204 ? { success: true } : res.data;
      })
      .catch(error => {
        // Handle 204 No Content - axios might throw on empty response
        if (error.response && error.response.status === 204) {
          return { success: true };
        }
        throw error;
      }),
    uploadImage: (assetId, formData, context) => {
      const contextParam = context ? `?context=${context}` : '?context=creation'; // Default to creation for uploads
      return apiClient.post(`/api/asset-bank/${assetId}/upload${contextParam}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => res.data);
    },
  },

  // Characters & Locations (Character Bank) - Legacy, use characterBank instead
  entities: {
    getCharacters: (screenplayId) => apiClient.get(`/api/character-bank/list?screenplayId=${screenplayId}`).then(res => res.data),
    getLocations: (screenplayId) => apiClient.get(`/api/character-bank/${screenplayId}/locations`).then(res => res.data),
    updateCharacter: (screenplayId, characterId, data) => 
      apiClient.put(`/api/character-bank/${characterId}`, data).then(res => res.data),
    updateLocation: (screenplayId, locationId, data) =>
      apiClient.put(`/api/character-bank/${screenplayId}/locations/${locationId}`, data).then(res => res.data),
  },

  // Video Generation
  video: {
    generate: (data) => apiClient.post('/api/video/generate', data),
    generateAsync: (data) => apiClient.post('/api/video/generate-async', data),
    getJobs: (params) => apiClient.get('/api/video/jobs', { params: params || {} }),
    getJobStatus: (jobId) => apiClient.get(`/api/video/jobs/${jobId}`),
    cancelJob: (jobId) => apiClient.delete(`/api/video/jobs/${jobId}`),
    uploadImage: (formData) => apiClient.post('/api/video/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getModels: () => apiClient.get('/api/video/models'),
  },

  // Image Generation
  image: {
    generate: (data) => apiClient.post('/api/image/generate', data),
    associate: (data) => apiClient.post('/api/image/associate', data),
    getEntityImages: (entityType, entityId) => 
      apiClient.get(`/api/image/entity/${entityType}/${entityId}`),
    getModels: () => apiClient.get('/api/models/image'),
  },

  // AI Chat
  chat: {
    generate: (data) => apiClient.post('/api/chat/generate', data),
    generateStream: async (data, onChunk, onComplete, onError) => {
      try {
        // Get auth token using the same pattern as apiClient
        let authToken = '';
        if (typeof window !== 'undefined' && getTokenFunction) {
          try {
            authToken = await getTokenFunction();
          } catch (error) {
            console.error('[Streaming] Error getting auth token:', error);
          }
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/chat/generate/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'chunk') {
                    onChunk?.(data.content);
                  } else if (data.type === 'complete') {
                    onComplete?.(data.content, data.tokensUsed);
                  } else if (data.type === 'error') {
                    onError?.(new Error(data.message));
                  }
                } catch (parseError) {
                  console.error('[Streaming] Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        }
      } catch (error) {
        onError?.(error);
      }
    },
  },

  // Audio Generation
  audio: {
    generate: (data) => apiClient.post('/api/audio/generate', data),
    getJobs: () => apiClient.get('/api/audio/jobs'),
    getJobStatus: (jobId) => apiClient.get(`/api/audio/jobs/${jobId}`),
  },

  // Voice Profiles
  voiceProfiles: {
    create: (data) => apiClient.post('/api/voice-profiles', data),
    update: (profileId, data) => apiClient.put(`/api/voice-profiles/${profileId}`, data),
    delete: (profileId) => apiClient.delete(`/api/voice-profiles/${profileId}`),
    generateSample: (profileId, data) => apiClient.post(`/api/voice-profiles/${profileId}/generate`, data),
    saveSampleToCloud: (profileId, data) => apiClient.post(`/api/voice-profiles/${profileId}/save-to-cloud`, data),
  },

  // Composition (FFmpeg)
  composition: {
    compose: (data) => apiClient.post('/api/composition/compose', data),
    listJobs: () => apiClient.get('/api/composition/jobs'),
    getJob: (jobId) => apiClient.get(`/api/composition/jobs/${jobId}`),
    downloadJob: (jobId) => apiClient.post(`/api/composition/jobs/${jobId}/download`),
    getLayouts: () => apiClient.get('/api/composition/layouts'),
    getPacingPatterns: () => apiClient.get('/api/composition/pacing'),
    getAnimations: () => apiClient.get('/api/composition/animations'),
  },

  // Timeline
  timeline: {
    get: (projectId) => apiClient.get(`/api/timeline/${projectId}`),
    save: (projectId, data) => apiClient.put(`/api/timeline/${projectId}`, data),
  },

  // Workflows
  workflows: {
    execute: (data) => apiClient.post('/api/workflows/execute', data),
    getStatus: (executionId) => apiClient.get(`/api/workflows/${executionId}`),
    list: () => apiClient.get('/api/workflows/list'),
  },

  // Virtual Try-On
  tryOn: {
    generate: (data) => apiClient.post('/api/try-on/generate', data),
  },

  // File Upload (S3 with 7-day expiration)
  upload: {
    file: (formData, config) => apiClient.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config
    }),
  },

  // Google Imagen Vision APIs (4 APIs for automation)
  imagenVision: {
    caption: (data) => apiClient.post('/api/imagen-vision/caption', data),
    qa: (data) => apiClient.post('/api/imagen-vision/qa', data),
    recontext: (data) => apiClient.post('/api/imagen-vision/recontext', data),
    upscale: (data) => apiClient.post('/api/imagen-vision/upscale', data),
  },

  // Luma 3D/NeRF API (3D model generation)
  luma3D: {
    exportCharacter: (characterId, data) => apiClient.post(`/api/3d/character/${characterId}`, data),
    exportLocation: (locationId, data) => apiClient.post(`/api/3d/location/${locationId}`, data),
    getJobStatus: (jobId) => apiClient.get(`/api/3d/job/${jobId}`).then(res => res.data),
    saveToCloud: (jobId, data) => apiClient.post(`/api/3d/job/${jobId}/save-to-cloud`, data).then(res => res.data),
    cancelJob: (jobId) => apiClient.delete(`/api/3d/job/${jobId}`).then(res => res.data),
  },

  // Cloud Storage (Dropbox, Google Drive)
  cloudStorage: {
    status: () => apiClient.get('/api/storage/status').then(res => res.data),
    listFiles: (provider) => apiClient.get(`/api/storage/list/${provider}`).then(res => res.data),
    downloadFile: (provider, fileId) => apiClient.get(`/api/storage/download/${provider}/${fileId}`).then(res => res.data),
    uploadFile: (provider, data) => apiClient.post('/api/storage/upload', { provider, ...data }).then(res => res.data),
  },

  // Character Bank API
  characters: {
    list: () => apiClient.get('/api/characters').then(res => res.data),
    create: (data) => apiClient.post('/api/characters', data).then(res => res.data),
    update: (characterId, data) => apiClient.patch(`/api/characters/${characterId}`, data).then(res => res.data),
    delete: (characterId) => apiClient.delete(`/api/characters/${characterId}`).then(res => res.data),
    uploadImage: (formData) => apiClient.post('/api/characters/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
    generateVariation: (data) => apiClient.post('/api/characters/generate-variation', data).then(res => res.data),
  },

  // Google Imagen Vision APIs
  imagen: {
    visualCaption: (data) => apiClient.post('/api/imagen/visual-caption', data).then(res => res.data),
    visualQA: (data) => apiClient.post('/api/imagen/visual-qa', data).then(res => res.data),
    productRecontext: (data) => apiClient.post('/api/imagen/product-recontext', data).then(res => res.data),
    upscale: (data) => apiClient.post('/api/imagen/upscale', data).then(res => res.data),
  },

  // Asset Manifest (GitHub Integration)
  assets: {
    track: (data) => apiClient.post('/api/assets/track', data),
    getManifest: (owner, repo) => apiClient.get(`/api/assets/manifest/${owner}/${repo}`),
    getEntityAssets: (owner, repo, entityType, entityId) => 
      apiClient.get(`/api/assets/manifest/${owner}/${repo}/${entityType}/${entityId}`),
    updateAsset: (assetId, data) => apiClient.put(`/api/assets/${assetId}`, data),
    deleteAsset: (assetId) => apiClient.delete(`/api/assets/${assetId}`),
    validateAssets: (owner, repo) => apiClient.post(`/api/assets/manifest/${owner}/${repo}/validate`),
  },

  // Scene Analyzer API (Feature 0136)
  sceneAnalyzer: {
    analyze: (data) => apiClient.post('/api/scene-analyzer/analyze', data).then(res => res.data),
  },
};

export default apiClient;
export { apiClient };

