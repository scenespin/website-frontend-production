'use client';

import { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetBrowser from '@/components/AssetBrowser';
import FolderTreeVisualization from '@/components/FolderTreeVisualization';
import { Folder, Grid, Info, HardDrive, Cloud } from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { LibrarySubNav } from '@/components/library/LibrarySubNav';
import { ResponsiveHeader } from '@/components/layout/ResponsiveHeader';

function AssetsContent() {
  const [activeTab, setActiveTab] = useState('browser');
  const { currentProject, getStorageProvider } = useScreenplay();
  
  const storageProvider = getStorageProvider();

  return (
    <>
      <ResponsiveHeader />
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 pt-16">
        {/* Library Sub-Navigation */}
        <LibrarySubNav activeTab="assets" />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-base-content mb-2">
              My Assets
            </h1>
            <p className="text-base-content/60">
              Browse and manage all your generated assets and files
            </p>
          </div>
          
          {/* Storage Info Badge */}
          {storageProvider && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-base-300/50">
              <Cloud className="w-4 h-4 text-cinema-gold" />
              <span className="text-sm text-base-content/80">
                {storageProvider === 'google-drive' ? 'Google Drive' : 
                 storageProvider === 'dropbox' ? 'Dropbox' : 'Local'}
              </span>
            </div>
          )}
        </div>

        {/* Current Project Info */}
        {currentProject && (
          <div className="bg-white dark:bg-base-300 rounded-xl p-4 border border-base-300/50">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-cinema-red" />
              <div>
                <p className="text-sm text-base-content/60">Current Project</p>
                <p className="font-semibold text-base-content">{currentProject.project_name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-cinema-blue/10 border border-cinema-blue/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-cinema-blue flex-shrink-0 mt-0.5" />
            <div className="text-sm text-base-content/80">
              <p className="font-medium text-base-content mb-1">About Your Storage</p>
              <p>
                All your generated assets are automatically organized in your cloud storage 
                with a clear folder structure: Characters, Locations, Scenes, Audio, and Compositions. 
                You own all your data!
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for Browser vs Folder Tree */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white dark:bg-base-300 rounded-xl p-1">
            <TabsTrigger 
              value="browser" 
              className="data-[state=active]:bg-cinema-red data-[state=active]:text-base-content rounded-lg transition-all"
            >
              <Grid className="w-4 h-4 mr-2" />
              Asset Browser
            </TabsTrigger>
            <TabsTrigger 
              value="tree"
              className="data-[state=active]:bg-cinema-red data-[state=active]:text-base-content rounded-lg transition-all"
            >
              <Folder className="w-4 h-4 mr-2" />
              Folder Structure
            </TabsTrigger>
          </TabsList>

          {/* Asset Browser Tab */}
          <TabsContent value="browser" className="mt-6">
            <div className="bg-white dark:bg-base-300 rounded-xl border border-base-300/50 overflow-hidden">
              <AssetBrowser />
            </div>
          </TabsContent>

          {/* Folder Tree Tab */}
          <TabsContent value="tree" className="mt-6">
            <div className="bg-white dark:bg-base-300 rounded-xl p-6 border border-base-300/50">
              <FolderTreeVisualization />
            </div>
          </TabsContent>
        </Tabs>

        {/* No Project Warning */}
        {!currentProject && (
          <div className="bg-base-200 border border-base-300 rounded-xl p-8 text-center">
            <HardDrive className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
            <p className="text-base-content/60 mb-4">
              Select or create a screenplay project to view your assets
            </p>
            <a 
              href="/app/write" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-cinema-red hover:bg-cinema-red/90 text-base-content rounded-lg font-medium transition-all"
            >
              Create Project
            </a>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default function MyAssetsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
          <p className="text-base-content/60">Loading assets...</p>
        </div>
      </div>
    }>
      <AssetsContent />
    </Suspense>
  );
}
