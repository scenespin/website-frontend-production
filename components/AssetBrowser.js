/**
 * AssetBrowser.js
 * 
 * Complete asset browser for viewing all screenplay assets
 * Features:
 * - View all assets by type (images, audio, video, 3D models)
 * - Filter by entity (character, location, scene)
 * - Search assets
 * - Download/view assets
 * - Asset metadata display
 * - GitHub manifest integration
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Box,
  Search,
  Filter,
  Download,
  Eye,
  Folder,
  Calendar,
  HardDrive,
  Github,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AssetBrowser() {
  const { currentProject, getGitHubRepo } = useScreenplay();
  
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all | image | video | audio | document
  const [selectedEntity, setSelectedEntity] = useState('all'); // all | character | location | scene
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Load assets from GitHub manifest
  useEffect(() => {
    if (currentProject) {
      loadAssets();
    }
  }, [currentProject]);

  // Filter assets when filters change
  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, selectedType, selectedEntity]);

  const loadAssets = async () => {
    const githubRepo = getGitHubRepo();
    
    if (!githubRepo) {
      setAssets([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.assets.getManifest(githubRepo.owner, githubRepo.repo);
      setAssets(response.data.assets || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets from manifest');
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(asset => 
        asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(asset => asset.asset_type === selectedType);
    }

    // Filter by entity
    if (selectedEntity !== 'all') {
      filtered = filtered.filter(asset => asset.entity_type === selectedEntity);
    }

    setFilteredAssets(filtered);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStorageIcon = (location) => {
    switch (location) {
      case 'google-drive':
        return <HardDrive className="w-4 h-4 text-blue-500" />;
      case 'dropbox':
        return <HardDrive className="w-4 h-4 text-blue-600" />;
      case 's3':
        return <HardDrive className="w-4 h-4 text-orange-500" />;
      default:
        return <HardDrive className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-green-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'document':
        return <Box className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleViewAsset = (asset) => {
    setSelectedAsset(asset);
  };

  const handleDownloadAsset = async (asset) => {
    if (asset.storage_metadata?.webview_link) {
      window.open(asset.storage_metadata.webview_link, '_blank');
    } else {
      toast.error('No download link available');
    }
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Folder className="w-16 h-16 text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
        <p className="text-sm text-base-content/60">
          Select a screenplay project to view its assets
        </p>
      </div>
    );
  }

  const githubRepo = getGitHubRepo();

  if (!githubRepo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Github className="w-16 h-16 text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No GitHub Integration</h3>
        <p className="text-sm text-base-content/60 mb-4">
          This project doesn&apos;t have a GitHub repository connected.<br />
          Assets are not being tracked in a manifest.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-base-300 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Asset Browser</h2>
            <p className="text-sm text-base-content/60 mt-1">
              {currentProject.project_name} • {filteredAssets.length} assets
            </p>
          </div>
          <button
            onClick={loadAssets}
            disabled={isLoading}
            className="btn btn-sm btn-ghost gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="input input-bordered flex items-center gap-2">
              <Search className="w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="select select-bordered"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
            <option value="video">Videos</option>
            <option value="document">3D Models</option>
          </select>

          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="select select-bordered"
          >
            <option value="all">All Entities</option>
            <option value="character">Characters</option>
            <option value="location">Locations</option>
            <option value="scene">Scenes</option>
          </select>

          {/* View Mode Toggle */}
          <div className="join">
            <button
              className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-16 h-16 text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
            <p className="text-sm text-base-content/60">
              {searchQuery || selectedType !== 'all' || selectedEntity !== 'all'
                ? 'Try adjusting your filters'
                : 'Start generating assets for your screenplay'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.asset_id}
                className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleViewAsset(asset)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between mb-3">
                    {getTypeIcon(asset.asset_type)}
                    {getStorageIcon(asset.storage_location)}
                  </div>
                  
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {asset.entity_name || asset.filename}
                  </h3>
                  
                  <p className="text-xs text-base-content/60 line-clamp-1">
                    {asset.filename}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-base-content/50">
                    <span>{formatFileSize(asset.file_size)}</span>
                    <span>{formatDate(asset.created_at)}</span>
                  </div>
                  
                  {asset.entity_type && (
                    <div className="badge badge-sm badge-outline mt-2">
                      {asset.entity_type}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.asset_id}
                className="flex items-center gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer transition-colors"
                onClick={() => handleViewAsset(asset)}
              >
                {getTypeIcon(asset.asset_type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {asset.entity_name || asset.filename}
                    </h3>
                    {asset.entity_type && (
                      <span className="badge badge-xs badge-outline">
                        {asset.entity_type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60 truncate mt-1">
                    {asset.filename}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 text-xs text-base-content/60">
                  <span>{formatFileSize(asset.file_size)}</span>
                  <span>{formatDate(asset.created_at)}</span>
                  {getStorageIcon(asset.storage_location)}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAsset(asset);
                  }}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedAsset.entity_name || 'Asset Details'}</h2>
                  <p className="text-sm text-base-content/60 mt-1">{selectedAsset.filename}</p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-base-content/60">Type</label>
                    <p className="text-sm font-medium capitalize">{selectedAsset.asset_type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/60">Entity</label>
                    <p className="text-sm font-medium capitalize">{selectedAsset.entity_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/60">File Size</label>
                    <p className="text-sm font-medium">{formatFileSize(selectedAsset.file_size)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/60">Storage</label>
                    <p className="text-sm font-medium capitalize">{selectedAsset.storage_location.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/60">Created</label>
                    <p className="text-sm font-medium">{formatDate(selectedAsset.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-base-content/60">MIME Type</label>
                    <p className="text-sm font-medium">{selectedAsset.mime_type}</p>
                  </div>
                </div>

                {selectedAsset.generation_metadata && (
                  <div>
                    <label className="text-xs text-base-content/60">Generation Info</label>
                    <div className="bg-base-200 rounded-lg p-3 mt-1">
                      {selectedAsset.generation_metadata.model && (
                        <p className="text-sm">Model: <span className="font-medium">{selectedAsset.generation_metadata.model}</span></p>
                      )}
                      {selectedAsset.generation_metadata.prompt && (
                        <p className="text-sm mt-2">Prompt: <span className="font-medium">{selectedAsset.generation_metadata.prompt}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {selectedAsset.notes && (
                  <div>
                    <label className="text-xs text-base-content/60">Notes</label>
                    <p className="text-sm mt-1">{selectedAsset.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadAsset(selectedAsset)}
                    className="btn btn-primary flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in {selectedAsset.storage_location === 'google-drive' ? 'Google Drive' : 'Dropbox'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

