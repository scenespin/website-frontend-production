/**
 * ImageResultActions.js
 * 
 * Reusable component for download/save actions on generated images
 * Provides consistent UI for:
 * - Local download
 * - Save to Dropbox
 * - Save to Google Drive
 * - Expiration countdown badge
 * 
 * SCREENPLAY-CENTRIC STORAGE:
 * - Automatically uses current screenplay's folder structure
 * - Supports entity-based folders (characters, locations, scenes, etc.)
 * - Tracks assets in GitHub manifest if configured
 */

'use client';

import { useState } from 'react';
import { Download, Cloud, Clock, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { nanoid } from 'nanoid';

export default function ImageResultActions({ 
  imageUrl, 
  filename = 'wryda-image', 
  expiresAt,
  showExpirationWarning = true,
  size = 'default', // 'small' | 'default' | 'large'
  layout = 'horizontal', // 'horizontal' | 'vertical'
  // Entity context for folder organization
  entityType = null, // 'character' | 'location' | 'scene' | null
  entityName = null, // Name of the entity
  entityId = null, // ID of the entity (for asset tracking)
  subfolder = null, // Optional subfolder (e.g., 'references', '3d_models')
  // Legacy support (will be overridden by screenplay context)
  folder = null,
  projectName = null
}) {
  const [isSaving, setIsSaving] = useState(false);
  const { getFolderPath, trackAsset, currentProject, getStorageProvider } = useScreenplay();
  
  // Build folder path using screenplay context if available
  const getTargetFolderPath = () => {
    // If we have entity context, use screenplay's folder structure
    if (entityType && entityName) {
      return getFolderPath(entityType, entityName, subfolder);
    }
    
    // Use custom folder if provided
    if (folder) {
      if (projectName || currentProject?.project_name) {
        return `${folder}/${projectName || currentProject.project_name}`;
      }
      return folder;
    }
    
    // Default fallback (uses screenplay context if available)
    return getFolderPath('image');
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (timestamp) => {
    if (!timestamp) return null;
    const days = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const daysLeft = expiresAt ? getDaysUntilExpiration(expiresAt) : null;

  // Download image locally
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download');
    }
  };

  // Save to cloud storage
  const handleSaveToCloud = async (provider) => {
    if (isSaving) return;
    
    setIsSaving(true);
    const providerName = provider === 'dropbox' ? 'Dropbox' : 'Google Drive';
    
    try {
      toast.loading(`Saving to ${providerName}...`);
      
      const targetFolder = getTargetFolderPath();
      const targetFilename = `${filename}-${Date.now()}.png`;
      
      // Upload to cloud storage
      const response = await api.cloudStorage.uploadFile(provider, {
        sourceUrl: imageUrl,
        filename: targetFilename,
        folder: targetFolder
      });
      
      toast.dismiss();
      toast.success(`Saved to ${providerName}! Path: ${targetFolder}`);
      
      // Track asset in GitHub manifest if project has GitHub integration
      if (currentProject && entityType && entityId) {
        try {
          await trackAsset({
            asset_id: `asset-${nanoid(12)}`,
            asset_type: 'image',
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName || 'Unknown',
            filename: targetFilename,
            file_size: response.fileSize || 0,
            mime_type: 'image/png',
            storage_location: provider,
            storage_metadata: {
              cloud_file_id: response.fileId,
              cloud_folder_id: response.folderId,
              webview_link: response.webViewLink,
            },
            generation_metadata: {
              generated_at: Date.now(),
            },
            created_at: Date.now(),
            updated_at: Date.now(),
          });
          console.log('[ImageResultActions] Asset tracked in manifest');
        } catch (error) {
          console.warn('[ImageResultActions] Failed to track asset:', error);
          // Non-critical - don't show error to user
        }
      }
      
    } catch (error) {
      console.error('Cloud save error:', error);
      toast.dismiss();
      toast.error(`Failed to save to ${providerName}`);
    } finally {
      setIsSaving(false);
    }
  };

  const buttonSizeClass = size === 'small' ? 'btn-xs' : size === 'large' ? 'btn-md' : 'btn-sm';
  const iconSizeClass = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4';

  // Show folder path in UI for transparency
  const targetFolder = getTargetFolderPath();
  const storageProvider = getStorageProvider();

  return (
    <div className="space-y-2">
      {/* Expiration Warning Banner */}
      {showExpirationWarning && daysLeft !== null && (
        <div className={`alert ${daysLeft <= 2 ? 'alert-error' : 'alert-warning'} py-2`}>
          <Clock className="w-4 h-4" />
          <span className="text-xs">
            {daysLeft === 0 
              ? '⚠️ Expires today! Download or save now.' 
              : `⚠️ ${daysLeft} day${daysLeft > 1 ? 's' : ''} until auto-deletion`}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} gap-2`}>
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`btn ${buttonSizeClass} btn-primary flex-1`}
          disabled={isSaving}
        >
          <Download className={`${iconSizeClass} mr-1`} />
          Download
        </button>

        {/* Dropbox Button */}
        <button
          onClick={() => handleSaveToCloud('dropbox')}
          className={`btn ${buttonSizeClass} btn-outline flex-1`}
          disabled={isSaving}
        >
          <Droplet className={`${iconSizeClass} mr-1`} />
          Dropbox
        </button>

        {/* Google Drive Button */}
        <button
          onClick={() => handleSaveToCloud('google-drive')}
          className={`btn ${buttonSizeClass} btn-outline flex-1`}
          disabled={isSaving}
        >
          <Cloud className={`${iconSizeClass} mr-1`} />
          Drive
        </button>
      </div>

      {/* Folder Path Info */}
      {currentProject && (
        <div className="text-xs text-base-content/50 text-center">
          📁 <span className="font-mono">{targetFolder}</span>
        </div>
      )}

      {/* Info Text */}
      {showExpirationWarning && (
        <p className="text-xs text-base-content/60 text-center">
          💡 Save to cloud storage for permanent access
        </p>
      )}
    </div>
  );
}

