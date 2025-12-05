"use client"

/**
 * Scene Asset Linker Component
 * Feature 0136: Asset-Scene Association
 * 
 * Modal component for linking assets (props) to scenes.
 * Allows users to select assets from Asset Bank to associate with a scene.
 */

import { useState, useEffect } from "react"
import { X, Package, Search, Check } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import type { Asset, AssetCategory } from '@/types/asset'
import { useScreenplay } from '@/contexts/ScreenplayContext'

interface SceneAssetLinkerProps {
  isOpen: boolean
  onClose: () => void
  sceneId: string
  linkedAssetIds: string[] // Currently linked asset IDs
  onLink: (assetId: string) => void
  onUnlink: (assetId: string) => void
}

export default function SceneAssetLinker({
  isOpen,
  onClose,
  sceneId,
  linkedAssetIds,
  onLink,
  onUnlink
}: SceneAssetLinkerProps) {
  const { assets } = useScreenplay()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all')
  
  // Filter assets by search query and category
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  // Get unique categories from assets
  const categories = Array.from(new Set(assets.map(a => a.category)))
  
  const getCategoryIcon = (category: AssetCategory) => {
    return Package // All use Package icon for now
  }
  
  const getCategoryColor = (category: AssetCategory) => {
    const colors: Record<AssetCategory, string> = {
      prop: 'bg-[#1F1F1F] text-[#808080] border border-[#3F3F46]',
      vehicle: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      furniture: 'bg-green-500/20 text-green-400 border-green-500/30',
      other: 'bg-base-content/20 text-base-content/60 border-base-content/30',
    }
    return colors[category] || colors.other
  }
  
  const isLinked = (assetId: string) => linkedAssetIds.includes(assetId)
  
  const handleToggle = (assetId: string) => {
    if (isLinked(assetId)) {
      onUnlink(assetId)
    } else {
      onLink(assetId)
    }
  }
  
  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedCategory('all')
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl"
          style={{ backgroundColor: '#1e2229', border: '1px solid #2C2C2E' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#2C2C2E' }}>
            <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>
              Link Assets to Scene
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-base-content/20 transition-colors"
              style={{ color: '#9CA3AF' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="p-4 border-b space-y-3" style={{ borderColor: '#2C2C2E' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#6B7280' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-teal-500 text-white'
                    : 'bg-[#2C2C2E] text-[#9CA3AF] hover:bg-[#3F3F46]'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-teal-500 text-white'
                      : 'bg-[#2C2C2E] text-[#9CA3AF] hover:bg-[#3F3F46]'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-3" style={{ color: '#4B5563' }} />
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {searchQuery ? 'No assets found matching your search' : 'No assets available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredAssets.map(asset => {
                  const linked = isLinked(asset.id)
                  const mainImage = asset.images?.[0]?.imageUrl
                  
                  return (
                    <button
                      key={asset.id}
                      onClick={() => handleToggle(asset.id)}
                      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                        linked
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-[#2C2C2E] bg-[#2C2C2E] hover:border-[#3F3F46]'
                      }`}
                    >
                      {/* Checkmark indicator */}
                      {linked && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      {/* Asset Image */}
                      {mainImage ? (
                        <div className="w-full h-24 mb-2 rounded overflow-hidden bg-[#0A0A0B]">
                          <img
                            src={mainImage}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 mb-2 rounded bg-[#0A0A0B] flex items-center justify-center">
                          <Package className="h-8 w-8" style={{ color: '#4B5563' }} />
                        </div>
                      )}
                      
                      {/* Asset Info */}
                      <div>
                        <h3 className="text-sm font-medium mb-1" style={{ color: linked ? '#E5E7EB' : '#9CA3AF' }}>
                          {asset.name}
                        </h3>
                        {asset.description && (
                          <p className="text-xs line-clamp-2" style={{ color: '#6B7280' }}>
                            {asset.description}
                          </p>
                        )}
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${getCategoryColor(asset.category)}`}>
                          {asset.category}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: '#2C2C2E' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {linkedAssetIds.length} asset{linkedAssetIds.length !== 1 ? 's' : ''} linked
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#14B8A6', color: 'white' }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

