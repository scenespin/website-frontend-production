/**
 * FolderTreeVisualization.js
 * 
 * Interactive folder tree visualization for screenplay storage structure
 * Shows the complete hierarchy of folders and assets
 */

'use client';

import { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  File,
  Image as ImageIcon,
  Music,
  Video,
  Box,
  Mic
} from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';

export default function FolderTreeVisualization() {
  const { currentProject } = useScreenplay();
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Folder className="w-16 h-16 text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
        <p className="text-sm text-base-content/60">
          Select a screenplay project to view its folder structure
        </p>
      </div>
    );
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const isExpanded = (folderId) => expandedFolders.has(folderId);

  // Define the folder structure
  const folderStructure = {
    id: 'root',
    name: currentProject.project_name,
    type: 'folder',
    children: [
      {
        id: 'characters',
        name: 'Characters',
        type: 'folder',
        children: [
          {
            id: 'character-example',
            name: '{Character Name}',
            type: 'folder',
            isPlaceholder: true,
            children: [
              { id: 'char-references', name: 'references', type: 'folder', description: 'Character reference images' },
              { id: 'char-3d', name: '3d_models', type: 'folder', description: 'Exported 3D character models' },
              { id: 'char-voices', name: 'voices', type: 'folder', description: 'Voice profile samples' }
            ]
          }
        ]
      },
      {
        id: 'locations',
        name: 'Locations',
        type: 'folder',
        children: [
          {
            id: 'location-example',
            name: '{Location Name}',
            type: 'folder',
            isPlaceholder: true,
            children: [
              { id: 'loc-references', name: 'references', type: 'folder', description: 'Location reference images' },
              { id: 'loc-3d', name: '3d_models', type: 'folder', description: 'Exported 3D location models' }
            ]
          }
        ]
      },
      {
        id: 'scenes',
        name: 'Scenes',
        type: 'folder',
        children: [
          {
            id: 'scene-example',
            name: 'Scene_{number}',
            type: 'folder',
            isPlaceholder: true,
            children: [
              { id: 'scene-storyboards', name: 'storyboards', type: 'folder', description: 'Scene storyboard images' },
              { id: 'scene-videos', name: 'videos', type: 'folder', description: 'Scene video generations' },
              { id: 'scene-audio', name: 'audio', type: 'folder', description: 'Scene audio files' }
            ]
          }
        ]
      },
      {
        id: 'audio',
        name: 'Audio',
        type: 'folder',
        children: [
          { id: 'audio-music', name: 'music', type: 'folder', description: 'Background music tracks' },
          { id: 'audio-sfx', name: 'sfx', type: 'folder', description: 'Sound effects' },
          { id: 'audio-dialogue', name: 'dialogue', type: 'folder', description: 'Dialogue recordings' },
          { id: 'audio-voiceovers', name: 'voiceovers', type: 'folder', description: 'Voiceover narrations' }
        ]
      },
      {
        id: 'compositions',
        name: 'Compositions',
        type: 'folder',
        children: [
          { id: 'comp-video', name: 'video', type: 'folder', description: 'Final video compositions' },
          { id: 'comp-audio', name: 'audio', type: 'folder', description: 'Final audio mixes' }
        ]
      },
      {
        id: '3d-models',
        name: '3D Models',
        type: 'folder',
        children: [
          {
            id: '3d-example',
            name: '{Entity Name}',
            type: 'folder',
            isPlaceholder: true,
            description: 'All 3D model exports'
          }
        ]
      },
      {
        id: 'voice-profiles',
        name: 'Voice Profiles',
        type: 'folder',
        children: [
          {
            id: 'voice-example',
            name: '{Character Name}',
            type: 'folder',
            isPlaceholder: true,
            description: 'Voice profile samples and settings'
          }
        ]
      }
    ]
  };

  const getIcon = (item) => {
    if (item.type === 'folder') {
      return isExpanded(item.id) ? <FolderOpen className="w-4 h-4 text-cinema-gold" /> : <Folder className="w-4 h-4 text-cinema-gold" />;
    }
    return <File className="w-4 h-4 text-base-content/60" />;
  };

  const renderTree = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = isExpanded(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-base-200 cursor-pointer transition-colors ${
            level === 0 ? 'font-semibold' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => hasChildren && toggleFolder(node.id)}
        >
          {hasChildren && (
            expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
          {!hasChildren && <div className="w-4" />}
          
          {getIcon(node)}
          
          <span className={`flex-1 ${node.isPlaceholder ? 'text-cinema-blue italic' : ''}`}>
            {node.name}
          </span>
          
          {node.description && (
            <span className="text-xs text-base-content/50 hidden lg:block">
              {node.description}
            </span>
          )}
        </div>

        {hasChildren && expanded && (
          <div>
            {node.children.map(child => renderTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-base-300 p-4">
        <h2 className="text-2xl font-bold">Folder Structure</h2>
        <p className="text-sm text-base-content/60 mt-1">
          Complete hierarchy for {currentProject.project_name}
        </p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-base-200 rounded-lg p-4">
          {/* Storage Provider Badge */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-base-300">
            <div className="badge badge-lg">
              {currentProject.storage_provider === 'google-drive' ? '📁 Google Drive' : 
               currentProject.storage_provider === 'dropbox' ? '📁 Dropbox' : 
               '💾 Local Storage'}
            </div>
            <div className="text-xs text-base-content/60">
              /Wryda Screenplays/
            </div>
          </div>

          {/* Tree Structure */}
          {renderTree(folderStructure)}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-base-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Legend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-cinema-gold" />
              <span>Static folder (always created)</span>
            </div>
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-cinema-blue" />
              <span className="text-cinema-blue italic">{'{Dynamic}'}</span>
              <span className="text-base-content/60">Dynamic folder (created per entity)</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div className="text-sm">
            <p className="font-semibold">Automatic Organization</p>
            <p className="text-xs mt-1">
              Folders are created automatically when you generate or upload assets. 
              Each entity (character, location, scene) gets its own organized folder structure.
            </p>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mt-4 bg-base-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Quick Reference</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-cinema-blue">Character Assets</p>
              <p className="text-xs text-base-content/60 mt-1">
                Reference images, 3D models, and voice profiles are automatically saved in character-specific folders
              </p>
            </div>
            <div>
              <p className="font-medium text-cinema-blue">Scene Assets</p>
              <p className="text-xs text-base-content/60 mt-1">
                Storyboards, video generations, and audio are organized by scene number
              </p>
            </div>
            <div>
              <p className="font-medium text-cinema-blue">Audio by Type</p>
              <p className="text-xs text-base-content/60 mt-1">
                Music, SFX, dialogue, and voiceovers are separated into dedicated folders
              </p>
            </div>
            <div>
              <p className="font-medium text-cinema-blue">Final Compositions</p>
              <p className="text-xs text-base-content/60 mt-1">
                Completed video and audio compositions are kept in their own folders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

