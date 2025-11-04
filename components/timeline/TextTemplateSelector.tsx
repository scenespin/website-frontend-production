'use client';

import React, { useState } from 'react';
import { X, Sparkles, Zap, Briefcase, Film, GraduationCap, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BUILT_IN_TEMPLATES, TextTemplate, getAllCategories } from '@/lib/textTemplates';

interface TextTemplateSelectorProps {
  onSelect: (template: TextTemplate) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<TextTemplate['category'], any> = {
  social: Zap,
  corporate: Briefcase,
  cinematic: Film,
  education: GraduationCap,
};

const CATEGORY_COLORS: Record<TextTemplate['category'], string> = {
  social: 'bg-[#DC143C]',
  corporate: 'bg-purple-500',
  cinematic: 'bg-red-500',
  education: 'bg-green-500',
};

export function TextTemplateSelector({ onSelect, onClose }: TextTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<TextTemplate['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = BUILT_IN_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = getAllCategories();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <Card className="bg-base-200 border border-base-content/20 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 p-3 md:p-6 border-b border-base-content/20 bg-gradient-to-r from-[#DC143C]/20 to-base-300 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg md:text-2xl font-bold text-base-content flex items-center gap-2">
                <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-[#DC143C] flex-shrink-0" />
                <span className="truncate">Text Templates</span>
              </CardTitle>
              <p className="text-base-content/60 text-xs md:text-sm mt-1 hidden sm:block">
                Choose from {BUILT_IN_TEMPLATES.length} professional templates. Customize text after applying.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 hover:bg-base-300 rounded-lg transition-colors flex-shrink-0 ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-base-content/60" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-base-300 border-base-content/20"
            />
          </div>
        </CardHeader>

        {/* Category Filters */}
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-base-content/20 bg-base-300/50 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-[#DC143C] hover:bg-[#B91238]' : ''}
            >
              All Templates ({BUILT_IN_TEMPLATES.length})
            </Button>
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              const count = BUILT_IN_TEMPLATES.filter(t => t.category === category).length;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1 ${
                    selectedCategory === category ? CATEGORY_COLORS[category] : ''
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="capitalize">{category}</span>
                  <span className="text-xs opacity-70">({count})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <CardContent className="flex-grow p-3 md:p-6 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-base-content/60">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredTemplates.map((template) => {
                const Icon = CATEGORY_ICONS[template.category];
                const isHovered = hoveredTemplate === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`relative group rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                      isHovered 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-102' 
                        : 'border-base-content/20 hover:border-base-content/40'
                    }`}
                    onClick={() => onSelect(template)}
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                  >
                    {/* Preview Area */}
                    <div className="relative bg-gradient-to-br from-base-300 to-base-100 aspect-video p-4 flex items-center justify-center">
                      {/* Simulated text preview */}
                      <div 
                        className="text-center px-2 py-1 rounded"
                        style={{
                          fontFamily: template.config.fontFamily,
                          fontSize: '14px',
                          fontWeight: template.config.fontWeight,
                          fontStyle: template.config.fontStyle,
                          color: template.config.textColor,
                          backgroundColor: template.config.backgroundColor || 'transparent',
                          textShadow: template.config.shadow 
                            ? `${template.config.shadowOffsetX || 2}px ${template.config.shadowOffsetY || 2}px 4px ${template.config.shadowColor || '#000000'}`
                            : template.config.outline
                            ? `0 0 ${template.config.outlineWidth || 2}px ${template.config.outlineColor || '#000000'}`
                            : 'none',
                          maxWidth: '90%',
                          wordBreak: 'break-word',
                        }}
                      >
                        {template.config.text}
                      </div>
                      
                      {/* Category Badge */}
                      <Badge 
                        className={`absolute top-2 left-2 ${CATEGORY_COLORS[template.category]} text-white text-xs`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {template.category}
                      </Badge>
                      
                      {/* Animation Indicator */}
                      {template.config.animations && (
                        <Badge className="absolute top-2 right-2 bg-purple-600 text-white text-xs">
                          <Zap className="w-3 h-3" />
                        </Badge>
                      )}
                      
                      {/* Hover Overlay */}
                      {isHovered && (
                        <div className="absolute inset-0 bg-[#DC143C]/10 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Select
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Template Info */}
                    <div className="p-3 bg-base-200">
                      <h3 className="font-bold text-sm text-base-content mb-1 line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-base-content/60 line-clamp-2">
                        {template.description}
                      </p>
                      
                      {/* Feature Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.config.animations?.fadeIn && (
                          <Badge variant="outline" className="text-xs">Fade In</Badge>
                        )}
                        {template.config.animations?.slideIn && (
                          <Badge variant="outline" className="text-xs">Slide</Badge>
                        )}
                        {template.config.animations?.scaleIn && (
                          <Badge variant="outline" className="text-xs">Scale</Badge>
                        )}
                        {template.config.outline && (
                          <Badge variant="outline" className="text-xs">Outline</Badge>
                        )}
                        {template.config.shadow && (
                          <Badge variant="outline" className="text-xs">Shadow</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 md:p-6 border-t border-base-content/20 bg-base-300/50 flex items-center justify-between">
          <div className="text-xs text-base-content/60">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

