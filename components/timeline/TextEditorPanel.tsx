'use client';

import React, { useState, useEffect } from 'react';
import { X, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Zap, MoveRight, MoveLeft, MoveUp, MoveDown, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { TimelineAsset } from '@/hooks/useTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { TextTemplateSelector } from './TextTemplateSelector';
import { TextTemplate } from '@/lib/textTemplates';

interface TextEditorPanelProps {
  asset?: TimelineAsset;  // Existing text asset (for editing) or undefined (for new)
  duration: number;       // Default duration for new text
  onApply: (textConfig: NonNullable<TimelineAsset['textContent']>, duration: number) => void;
  onClose: () => void;
}

const POSITION_PRESETS = [
  { value: 'top-left', label: 'Top Left', x: 10, y: 10 },
  { value: 'top-center', label: 'Top Center', x: 50, y: 10 },
  { value: 'top-right', label: 'Top Right', x: 90, y: 10 },
  { value: 'center-left', label: 'Center Left', x: 10, y: 50 },
  { value: 'center', label: 'Center', x: 50, y: 50 },
  { value: 'center-right', label: 'Center Right', x: 90, y: 50 },
  { value: 'bottom-left', label: 'Bottom Left', x: 10, y: 90 },
  { value: 'bottom-center', label: 'Bottom Center', x: 50, y: 90 },
  { value: 'bottom-right', label: 'Bottom Right', x: 90, y: 90 },
] as const;

const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
];

export function TextEditorPanel({ asset, duration: defaultDuration, onApply, onClose }: TextEditorPanelProps) {
  // Template selector state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Initialize state from existing asset or defaults
  const [text, setText] = useState(asset?.textContent?.text || '');
  const [fontFamily, setFontFamily] = useState(asset?.textContent?.fontFamily || 'Arial');
  const [fontSize, setFontSize] = useState(asset?.textContent?.fontSize || 48);
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(asset?.textContent?.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(asset?.textContent?.fontStyle || 'normal');
  const [textColor, setTextColor] = useState(asset?.textContent?.textColor || '#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState(asset?.textContent?.backgroundColor || '');
  const [opacity, setOpacity] = useState(asset?.textContent?.opacity || 1.0);
  
  const [positionPreset, setPositionPreset] = useState<string>(asset?.textContent?.positionPreset || 'bottom-center');
  const [positionX, setPositionX] = useState(asset?.textContent?.positionX || 50);
  const [positionY, setPositionY] = useState(asset?.textContent?.positionY || 90);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(asset?.textContent?.textAlign || 'center');
  
  const [outline, setOutline] = useState(asset?.textContent?.outline || false);
  const [outlineColor, setOutlineColor] = useState(asset?.textContent?.outlineColor || '#000000');
  const [outlineWidth, setOutlineWidth] = useState(asset?.textContent?.outlineWidth || 2);
  
  const [shadow, setShadow] = useState(asset?.textContent?.shadow || false);
  const [shadowColor, setShadowColor] = useState(asset?.textContent?.shadowColor || '#000000');
  const [shadowOffsetX, setShadowOffsetX] = useState(asset?.textContent?.shadowOffsetX || 2);
  const [shadowOffsetY, setShadowOffsetY] = useState(asset?.textContent?.shadowOffsetY || 2);
  
  const [textDuration, setTextDuration] = useState(asset?.duration || defaultDuration);

  // NEW: Animation state (Feature 0104 Phase 1)
  const [fadeInEnabled, setFadeInEnabled] = useState(asset?.textContent?.animations?.fadeIn?.enabled || false);
  const [fadeInDuration, setFadeInDuration] = useState(asset?.textContent?.animations?.fadeIn?.duration || 0.5);
  const [fadeInEasing, setFadeInEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'>(asset?.textContent?.animations?.fadeIn?.easing || 'ease-in');
  
  const [fadeOutEnabled, setFadeOutEnabled] = useState(asset?.textContent?.animations?.fadeOut?.enabled || false);
  const [fadeOutDuration, setFadeOutDuration] = useState(asset?.textContent?.animations?.fadeOut?.duration || 0.5);
  const [fadeOutEasing, setFadeOutEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'>(asset?.textContent?.animations?.fadeOut?.easing || 'ease-out');
  
  const [slideInEnabled, setSlideInEnabled] = useState(asset?.textContent?.animations?.slideIn?.enabled || false);
  const [slideInFrom, setSlideInFrom] = useState<'left' | 'right' | 'top' | 'bottom'>(asset?.textContent?.animations?.slideIn?.from || 'left');
  const [slideInDuration, setSlideInDuration] = useState(asset?.textContent?.animations?.slideIn?.duration || 0.5);
  const [slideInEasing, setSlideInEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'>(asset?.textContent?.animations?.slideIn?.easing || 'ease-out');
  
  const [slideOutEnabled, setSlideOutEnabled] = useState(asset?.textContent?.animations?.slideOut?.enabled || false);
  const [slideOutTo, setSlideOutTo] = useState<'left' | 'right' | 'top' | 'bottom'>(asset?.textContent?.animations?.slideOut?.to || 'right');
  const [slideOutDuration, setSlideOutDuration] = useState(asset?.textContent?.animations?.slideOut?.duration || 0.5);
  const [slideOutEasing, setSlideOutEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'>(asset?.textContent?.animations?.slideOut?.easing || 'ease-in');
  
  const [scaleInEnabled, setScaleInEnabled] = useState(asset?.textContent?.animations?.scaleIn?.enabled || false);
  const [scaleInFrom, setScaleInFrom] = useState(asset?.textContent?.animations?.scaleIn?.from || 0);
  const [scaleInDuration, setScaleInDuration] = useState(asset?.textContent?.animations?.scaleIn?.duration || 0.5);
  const [scaleInEasing, setScaleInEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'>(asset?.textContent?.animations?.scaleIn?.easing || 'ease-out');
  
  const [scaleOutEnabled, setScaleOutEnabled] = useState(asset?.textContent?.animations?.scaleOut?.enabled || false);
  const [scaleOutTo, setScaleOutTo] = useState(asset?.textContent?.animations?.scaleOut?.to || 0);
  const [scaleOutDuration, setScaleOutDuration] = useState(asset?.textContent?.animations?.scaleOut?.duration || 0.5);
  const [scaleOutEasing, setScaleOutEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'>(asset?.textContent?.animations?.scaleOut?.easing || 'ease-in');

  // Update position when preset changes
  useEffect(() => {
    const preset = POSITION_PRESETS.find(p => p.value === positionPreset);
    if (preset) {
      setPositionX(preset.x);
      setPositionY(preset.y);
    }
  }, [positionPreset]);

  // Template application
  const handleTemplateSelect = (template: TextTemplate) => {
    const config = template.config;
    
    // Apply all template settings (keep user's text if they already have some)
    if (!text || text === '') {
      setText(config.text);
    }
    setFontFamily(config.fontFamily || 'Arial');
    setFontSize(config.fontSize || 48);
    setFontWeight(config.fontWeight || 'normal');
    setFontStyle(config.fontStyle || 'normal');
    setTextColor(config.textColor || '#FFFFFF');
    setBackgroundColor(config.backgroundColor || '');
    setOpacity(config.opacity || 1.0);
    
    setPositionPreset(config.positionPreset || 'bottom-center');
    setPositionX(config.positionX || 50);
    setPositionY(config.positionY || 90);
    setTextAlign(config.textAlign || 'center');
    
    setOutline(config.outline || false);
    setOutlineColor(config.outlineColor || '#000000');
    setOutlineWidth(config.outlineWidth || 2);
    
    setShadow(config.shadow || false);
    setShadowColor(config.shadowColor || '#000000');
    setShadowOffsetX(config.shadowOffsetX || 2);
    setShadowOffsetY(config.shadowOffsetY || 2);
    
    // Apply animations if present
    if (config.animations) {
      setFadeInEnabled(config.animations.fadeIn?.enabled || false);
      setFadeInDuration(config.animations.fadeIn?.duration || 0.5);
      setFadeInEasing(config.animations.fadeIn?.easing || 'ease-in');
      
      setFadeOutEnabled(config.animations.fadeOut?.enabled || false);
      setFadeOutDuration(config.animations.fadeOut?.duration || 0.5);
      setFadeOutEasing(config.animations.fadeOut?.easing || 'ease-out');
      
      setSlideInEnabled(config.animations.slideIn?.enabled || false);
      setSlideInFrom(config.animations.slideIn?.from || 'left');
      setSlideInDuration(config.animations.slideIn?.duration || 0.5);
      setSlideInEasing(config.animations.slideIn?.easing || 'ease-out');
      
      setSlideOutEnabled(config.animations.slideOut?.enabled || false);
      setSlideOutTo(config.animations.slideOut?.to || 'right');
      setSlideOutDuration(config.animations.slideOut?.duration || 0.5);
      setSlideOutEasing(config.animations.slideOut?.easing || 'ease-in');
      
      setScaleInEnabled(config.animations.scaleIn?.enabled || false);
      setScaleInFrom(config.animations.scaleIn?.from || 0);
      setScaleInDuration(config.animations.scaleIn?.duration || 0.5);
      setScaleInEasing(config.animations.scaleIn?.easing || 'ease-out');
      
      setScaleOutEnabled(config.animations.scaleOut?.enabled || false);
      setScaleOutTo(config.animations.scaleOut?.to || 0);
      setScaleOutDuration(config.animations.scaleOut?.duration || 0.5);
      setScaleOutEasing(config.animations.scaleOut?.easing || 'ease-in');
    }
    
    setShowTemplateSelector(false);
  };

  const handleApply = () => {
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }

    onApply({
      text: text.trim(),
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textColor,
      backgroundColor: backgroundColor || undefined,
      opacity,
      positionX,
      positionY,
      positionPreset: positionPreset as any,
      textAlign,
      outline,
      outlineColor,
      outlineWidth,
      shadow,
      shadowColor,
      shadowOffsetX,
      shadowOffsetY,
      // NEW: Include animations if any are enabled (Feature 0104 Phase 1)
      animations: (fadeInEnabled || fadeOutEnabled || slideInEnabled || slideOutEnabled || scaleInEnabled || scaleOutEnabled) ? {
        ...(fadeInEnabled ? { fadeIn: { enabled: true, duration: fadeInDuration, easing: fadeInEasing } } : {}),
        ...(fadeOutEnabled ? { fadeOut: { enabled: true, duration: fadeOutDuration, easing: fadeOutEasing } } : {}),
        ...(slideInEnabled ? { slideIn: { enabled: true, from: slideInFrom, duration: slideInDuration, easing: slideInEasing } } : {}),
        ...(slideOutEnabled ? { slideOut: { enabled: true, to: slideOutTo, duration: slideOutDuration, easing: slideOutEasing } } : {}),
        ...(scaleInEnabled ? { scaleIn: { enabled: true, from: scaleInFrom, duration: scaleInDuration, easing: scaleInEasing } } : {}),
        ...(scaleOutEnabled ? { scaleOut: { enabled: true, to: scaleOutTo, duration: scaleOutDuration, easing: scaleOutEasing } } : {}),
      } : undefined,
    }, textDuration);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <Card className="bg-base-200 border border-base-content/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 p-3 md:p-6 border-b border-base-content/20 bg-gradient-to-r from-blue-900/20 to-base-300 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg md:text-2xl font-bold text-base-content flex items-center gap-2">
                <Type className="w-5 h-5 md:w-7 md:h-7 text-blue-400 flex-shrink-0" />
                <span className="truncate">{asset ? 'Edit Text' : 'Add Text/Title'}</span>
              </CardTitle>
              <p className="text-base-content/60 text-xs md:text-sm mt-1 hidden sm:block">
                Add professional titles and captions to your video.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
                className="mt-2 w-full sm:w-auto flex items-center gap-2 border-indigo-500/50 hover:bg-indigo-500/10"
              >
                <Sparkles className="w-4 h-4" />
                Browse Templates
              </Button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 hover:bg-base-300 rounded-lg transition-colors flex-shrink-0 ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-base-content/60" />
            </button>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-grow p-3 md:p-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="animations">
                <Zap className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Animations</span>
                <span className="sm:hidden">Anim</span>
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {/* Text Input */}
              <div>
                <Label htmlFor="text-input" className="text-sm font-medium mb-2 block">
                  Text Content
                </Label>
                <textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your text here..."
                  className="w-full p-3 bg-base-300 border border-base-content/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                  autoFocus
                />
              </div>

              {/* Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Duration</Label>
                  <span className="text-sm text-base-content/80">{textDuration.toFixed(2)}s</span>
                </div>
                <Slider
                  min={0.5}
                  max={30}
                  step={0.1}
                  value={[textDuration]}
                  onValueChange={(val) => setTextDuration(val[0])}
                  className="w-full"
                />
              </div>

              {/* Position Presets */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Position</Label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITION_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={positionPreset === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPositionPreset(preset.value)}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Text Alignment</Label>
                <div className="flex gap-2">
                  <Button
                    variant={textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextAlign('left')}
                    className="flex-1"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextAlign('center')}
                    className="flex-1"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={textAlign === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextAlign('right')}
                    className="flex-1"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4">
              {/* Font Family */}
              <div>
                <Label htmlFor="font-family" className="text-sm font-medium mb-2 block">
                  Font
                </Label>
                <select
                  id="font-family"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-2 bg-base-300 border border-base-content/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Font Size</Label>
                  <span className="text-sm text-base-content/80">{fontSize}px</span>
                </div>
                <Slider
                  min={12}
                  max={200}
                  step={1}
                  value={[fontSize]}
                  onValueChange={(val) => setFontSize(val[0])}
                  className="w-full"
                />
              </div>

              {/* Font Weight & Style */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Weight</Label>
                  <Button
                    variant={fontWeight === 'bold' ? 'default' : 'outline'}
                    onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                    className="w-full"
                  >
                    <Bold className="w-4 h-4 mr-2" />
                    Bold
                  </Button>
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Style</Label>
                  <Button
                    variant={fontStyle === 'italic' ? 'default' : 'outline'}
                    onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                    className="w-full"
                  >
                    <Italic className="w-4 h-4 mr-2" />
                    Italic
                  </Button>
                </div>
              </div>

              {/* Text Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Text Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Background (Optional)</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor || '#000000'}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="None"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Opacity</Label>
                  <span className="text-sm text-base-content/80">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[opacity]}
                  onValueChange={(val) => setOpacity(val[0])}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="space-y-4">
              {/* Outline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Text Outline</Label>
                  <input
                    type="checkbox"
                    checked={outline}
                    onChange={(e) => setOutline(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
                {outline && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-500/30">
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs">Color:</Label>
                      <input
                        type="color"
                        value={outlineColor}
                        onChange={(e) => setOutlineColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={outlineColor}
                        onChange={(e) => setOutlineColor(e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Width</Label>
                        <span className="text-xs text-base-content/80">{outlineWidth}px</span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[outlineWidth]}
                        onValueChange={(val) => setOutlineWidth(val[0])}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Shadow */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Drop Shadow</Label>
                  <input
                    type="checkbox"
                    checked={shadow}
                    onChange={(e) => setShadow(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
                {shadow && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-500/30">
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs">Color:</Label>
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">X Offset</Label>
                          <span className="text-xs text-base-content/80">{shadowOffsetX}px</span>
                        </div>
                        <Slider
                          min={-10}
                          max={10}
                          step={1}
                          value={[shadowOffsetX]}
                          onValueChange={(val) => setShadowOffsetX(val[0])}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Y Offset</Label>
                          <span className="text-xs text-base-content/80">{shadowOffsetY}px</span>
                        </div>
                        <Slider
                          min={-10}
                          max={10}
                          step={1}
                          value={[shadowOffsetY]}
                          onValueChange={(val) => setShadowOffsetY(val[0])}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Animations Tab - NEW (Feature 0104 Phase 1) */}
            <TabsContent value="animations" className="space-y-4">
              {/* Fade In */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-blue-500" />
                    Fade In
                  </Label>
                  <input
                    type="checkbox"
                    checked={fadeInEnabled}
                    onChange={(e) => setFadeInEnabled(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
                {fadeInEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-500/30">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Duration</Label>
                        <span className="text-xs text-base-content/80">{fadeInDuration.toFixed(2)}s</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[fadeInDuration]}
                        onValueChange={(val) => setFadeInDuration(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Easing</Label>
                      <select
                        value={fadeInEasing}
                        onChange={(e) => setFadeInEasing(e.target.value as any)}
                        className="w-full p-2 bg-base-300 border border-base-content/20 rounded text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="ease-in">Ease In</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="ease-in-out">Ease In-Out</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Fade Out */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ZoomOut className="w-4 h-4 text-blue-500" />
                    Fade Out
                  </Label>
                  <input
                    type="checkbox"
                    checked={fadeOutEnabled}
                    onChange={(e) => setFadeOutEnabled(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
                {fadeOutEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-500/30">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Duration</Label>
                        <span className="text-xs text-base-content/80">{fadeOutDuration.toFixed(2)}s</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[fadeOutDuration]}
                        onValueChange={(val) => setFadeOutDuration(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Easing</Label>
                      <select
                        value={fadeOutEasing}
                        onChange={(e) => setFadeOutEasing(e.target.value as any)}
                        className="w-full p-2 bg-base-300 border border-base-content/20 rounded text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="ease-in">Ease In</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="ease-in-out">Ease In-Out</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Slide In */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MoveRight className="w-4 h-4 text-green-500" />
                    Slide In
                  </Label>
                  <input
                    type="checkbox"
                    checked={slideInEnabled}
                    onChange={(e) => setSlideInEnabled(e.target.checked)}
                    className="w-5 h-5 accent-green-600 cursor-pointer"
                  />
                </div>
                {slideInEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-green-500/30">
                    <div>
                      <Label className="text-xs mb-2 block">Direction</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={slideInFrom === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideInFrom('left')}
                          className="flex items-center gap-1"
                        >
                          <MoveLeft className="w-3 h-3" /> Left
                        </Button>
                        <Button
                          type="button"
                          variant={slideInFrom === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideInFrom('right')}
                          className="flex items-center gap-1"
                        >
                          <MoveRight className="w-3 h-3" /> Right
                        </Button>
                        <Button
                          type="button"
                          variant={slideInFrom === 'top' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideInFrom('top')}
                          className="flex items-center gap-1"
                        >
                          <MoveUp className="w-3 h-3" /> Top
                        </Button>
                        <Button
                          type="button"
                          variant={slideInFrom === 'bottom' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideInFrom('bottom')}
                          className="flex items-center gap-1"
                        >
                          <MoveDown className="w-3 h-3" /> Bottom
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Duration</Label>
                        <span className="text-xs text-base-content/80">{slideInDuration.toFixed(2)}s</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[slideInDuration]}
                        onValueChange={(val) => setSlideInDuration(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Easing</Label>
                      <select
                        value={slideInEasing}
                        onChange={(e) => setSlideInEasing(e.target.value as any)}
                        className="w-full p-2 bg-base-300 border border-base-content/20 rounded text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="ease-in">Ease In</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="ease-in-out">Ease In-Out</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Slide Out */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MoveLeft className="w-4 h-4 text-green-500" />
                    Slide Out
                  </Label>
                  <input
                    type="checkbox"
                    checked={slideOutEnabled}
                    onChange={(e) => setSlideOutEnabled(e.target.checked)}
                    className="w-5 h-5 accent-green-600 cursor-pointer"
                  />
                </div>
                {slideOutEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-green-500/30">
                    <div>
                      <Label className="text-xs mb-2 block">Direction</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={slideOutTo === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideOutTo('left')}
                          className="flex items-center gap-1"
                        >
                          <MoveLeft className="w-3 h-3" /> Left
                        </Button>
                        <Button
                          type="button"
                          variant={slideOutTo === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideOutTo('right')}
                          className="flex items-center gap-1"
                        >
                          <MoveRight className="w-3 h-3" /> Right
                        </Button>
                        <Button
                          type="button"
                          variant={slideOutTo === 'top' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideOutTo('top')}
                          className="flex items-center gap-1"
                        >
                          <MoveUp className="w-3 h-3" /> Top
                        </Button>
                        <Button
                          type="button"
                          variant={slideOutTo === 'bottom' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideOutTo('bottom')}
                          className="flex items-center gap-1"
                        >
                          <MoveDown className="w-3 h-3" /> Bottom
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Duration</Label>
                        <span className="text-xs text-base-content/80">{slideOutDuration.toFixed(2)}s</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[slideOutDuration]}
                        onValueChange={(val) => setSlideOutDuration(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Easing</Label>
                      <select
                        value={slideOutEasing}
                        onChange={(e) => setSlideOutEasing(e.target.value as any)}
                        className="w-full p-2 bg-base-300 border border-base-content/20 rounded text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="ease-in">Ease In</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="ease-in-out">Ease In-Out</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Scale In */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-purple-500" />
                    Scale In
                  </Label>
                  <input
                    type="checkbox"
                    checked={scaleInEnabled}
                    onChange={(e) => setScaleInEnabled(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>
                {scaleInEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-purple-500/30">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Start Scale</Label>
                        <span className="text-xs text-base-content/80">{Math.round(scaleInFrom * 100)}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={[scaleInFrom]}
                        onValueChange={(val) => setScaleInFrom(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Duration</Label>
                        <span className="text-xs text-base-content/80">{scaleInDuration.toFixed(2)}s</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[scaleInDuration]}
                        onValueChange={(val) => setScaleInDuration(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Easing</Label>
                      <select
                        value={scaleInEasing}
                        onChange={(e) => setScaleInEasing(e.target.value as any)}
                        className="w-full p-2 bg-base-300 border border-base-content/20 rounded text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="ease-in">Ease In</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="ease-in-out">Ease In-Out</option>
                        <option value="bounce">Bounce</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Scale Out */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ZoomOut className="w-4 h-4 text-purple-500" />
                    Scale Out
                  </Label>
                  <input
                    type="checkbox"
                    checked={scaleOutEnabled}
                    onChange={(e) => setScaleOutEnabled(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>
                {scaleOutEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-purple-500/30">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">End Scale</Label>
                        <span className="text-xs text-base-content/80">{Math.round(scaleOutTo * 100)}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={[scaleOutTo]}
                        onValueChange={(val) => setScaleOutTo(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Duration</Label>
                        <span className="text-xs text-base-content/80">{scaleOutDuration.toFixed(2)}s</span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[scaleOutDuration]}
                        onValueChange={(val) => setScaleOutDuration(val[0])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Easing</Label>
                      <select
                        value={scaleOutEasing}
                        onChange={(e) => setScaleOutEasing(e.target.value as any)}
                        className="w-full p-2 bg-base-300 border border-base-content/20 rounded text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="ease-in">Ease In</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="ease-in-out">Ease In-Out</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Live Preview */}
          <div className="mt-6 p-4 bg-base-300 rounded-lg border border-base-content/20">
            <Label className="text-xs font-medium mb-2 block text-base-content/60">Preview</Label>
            <div className="relative bg-black aspect-video rounded overflow-hidden flex items-center justify-center">
              {text && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${positionX}%`,
                    top: `${positionY}%`,
                    transform: 'translate(-50%, -50%)',
                    fontFamily,
                    fontSize: `${Math.max(fontSize / 4, 12)}px`, // Scale down for preview
                    fontWeight,
                    fontStyle,
                    color: textColor,
                    backgroundColor: backgroundColor || 'transparent',
                    opacity,
                    textAlign,
                    padding: backgroundColor ? '4px 8px' : '0',
                    borderRadius: backgroundColor ? '4px' : '0',
                    textShadow: outline
                      ? `${outlineColor} ${outlineWidth / 2}px 0px 0px, ${outlineColor} 0px ${outlineWidth / 2}px 0px, ${outlineColor} -${outlineWidth / 2}px 0px 0px, ${outlineColor} 0px -${outlineWidth / 2}px 0px`
                      : shadow
                      ? `${shadowColor} ${shadowOffsetX / 2}px ${shadowOffsetY / 2}px 4px`
                      : 'none',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '90%',
                  }}
                >
                  {text}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-3 md:p-6 border-t border-base-content/20 bg-base-300/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!text.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
          >
            {asset ? 'Update Text' : 'Add Text'}
          </Button>
        </div>
      </Card>
      
      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TextTemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}

