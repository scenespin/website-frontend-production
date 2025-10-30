// API Client for Backend
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    // Get Clerk session token (client-side only)
    if (typeof window !== 'undefined') {
      try {
        // Use window.__clerk to get the session token
        const clerk = window.Clerk;
        if (clerk) {
          const token = await clerk.session?.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
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
    if (error.response?.status === 401) {
      // Redirect to sign in if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

// API Methods (matching actual backend routes)
export const api = {
  // User & Credits
  user: {
    getProfile: () => apiClient.get('/api/user'),
    getCredits: () => apiClient.get('/api/credits/balance'),
    getUsage: () => apiClient.get('/api/credits/usage'),
    getCreditHistory: () => apiClient.get('/api/credits/history'),
  },

  // Projects
  projects: {
    list: () => apiClient.get('/api/projects/list'),
    get: (projectId) => apiClient.get(`/api/projects/${projectId}`),
    create: (data) => apiClient.post('/api/projects/create', data),
    update: (projectId, data) => apiClient.put(`/api/projects/${projectId}`, data),
    delete: (projectId) => apiClient.delete(`/api/projects/${projectId}`),
  },

  // Screenplay
  screenplay: {
    get: (projectId) => apiClient.get(`/api/screenplay/${projectId}`),
    save: (projectId, content) => apiClient.put(`/api/screenplay/${projectId}`, { content }),
    exportPDF: (projectId) => apiClient.post(`/api/screenplay/${projectId}/export`, { format: 'pdf' }),
  },

  // Characters & Locations (Character Bank)
  entities: {
    getCharacters: (projectId) => apiClient.get(`/api/character-bank/${projectId}/characters`),
    getLocations: (projectId) => apiClient.get(`/api/character-bank/${projectId}/locations`),
    updateCharacter: (projectId, characterId, data) => 
      apiClient.put(`/api/character-bank/${projectId}/characters/${characterId}`, data),
    updateLocation: (projectId, locationId, data) =>
      apiClient.put(`/api/character-bank/${projectId}/locations/${locationId}`, data),
  },

  // Video Generation
  video: {
    generate: (data) => apiClient.post('/api/video/generate', data),
    generateAsync: (data) => apiClient.post('/api/video/generate-async', data),
    getJobs: () => apiClient.get('/api/video/jobs'),
    getJobStatus: (jobId) => apiClient.get(`/api/video/jobs/${jobId}`),
    cancelJob: (jobId) => apiClient.delete(`/api/video/jobs/${jobId}`),
  },

  // Image Generation
  image: {
    generate: (data) => apiClient.post('/api/image/generate', data),
    associate: (data) => apiClient.post('/api/image/associate', data),
    getEntityImages: (entityType, entityId) => 
      apiClient.get(`/api/image/entity/${entityType}/${entityId}`),
  },

  // AI Chat
  chat: {
    generate: (messages) => apiClient.post('/api/chat/generate', { messages }),
  },

  // Composition
  composition: {
    create: (data) => apiClient.post('/api/composition/create', data),
    get: (compositionId) => apiClient.get(`/api/composition/${compositionId}`),
    render: (compositionId) => apiClient.post(`/api/composition/${compositionId}/render`),
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
};

export default apiClient;

