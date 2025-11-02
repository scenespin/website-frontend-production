'use client';

/**
 * LayoutBuilder Component
 * Visual drag-and-drop canvas for designing video compositions
 * Hides FFmpeg complexity behind an intuitive UI
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Plus, 
  Trash2, 
  Move, 
  RotateCw, 
  Eye, 
  EyeOff,
  Layers,
  Settings,
  Loader2,
} from 'lucide-react';

interface LayoutLayer {
  id: string;
  name: string;
  type: 'video' | 'image';
  zIndex: number;
  visible: boolean;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    sourceWidth: number;
    sourceHeight: number;
  };
  effects: {
    opacity: number;
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    blendMode?: string;
    chromaKey?: {
      color: string;
      threshold: number;
      blend: number;
    };
  };
}

interface CompositionLayout {
  id: string;
  name: string;
  description: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  layers: LayoutLayer[];
  durationSeconds: number;
}

interface LayoutBuilderProps {
  initialLayout?: CompositionLayout;
  onSave: (layout: CompositionLayout) => void;
  onTest: (layout: CompositionLayout) => void;
}

export default function LayoutBuilder({ initialLayout, onSave, onTest }: LayoutBuilderProps) {
  const [layout, setLayout] = useState<CompositionLayout>(
    initialLayout || {
      id: '',
      name: 'New Composition',
      description: '',
      canvas: { width: 1920, height: 1080, backgroundColor: '#000000' },
      layers: [],
      durationSeconds: 10,
    }
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedLayer = layout.layers.find(l => l.id === selectedLayerId);

  // Add new layer
  const addLayer = (type: 'video' | 'image') => {
    const newLayer: LayoutLayer = {
      id: `layer_${Date.now()}`,
      name: `${type === 'video' ? 'Video' : 'Image'} ${layout.layers.length + 1}`,
      type,
      zIndex: layout.layers.length,
      visible: true,
      transform: {
        x: 100,
        y: 100,
        width: 640,
        height: 360,
        rotation: 0,
        sourceWidth: 1920,
        sourceHeight: 1080,
      },
      effects: {
        opacity: 1.0,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        blur: 0,
      },
    };
    
    setLayout(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
    }));
    setSelectedLayerId(newLayer.id);
  };

  // Delete layer
  const deleteLayer = (layerId: string) => {
    setLayout(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== layerId),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  // Update layer property
  const updateLayer = (layerId: string, updates: Partial<LayoutLayer>) => {
    setLayout(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId ? { ...l, ...updates } : l
      ),
    }));
  };

  // Update layer transform
  const updateTransform = (layerId: string, updates: Partial<LayoutLayer['transform']>) => {
    setLayout(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId
          ? { ...l, transform: { ...l.transform, ...updates } }
          : l
      ),
    }));
  };

  // Update layer effects
  const updateEffects = (layerId: string, updates: Partial<LayoutLayer['effects']>) => {
    setLayout(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId
          ? { ...l, effects: { ...l.effects, ...updates } }
          : l
      ),
    }));
  };

  // Move layer up/down in z-order
  const moveLayerZ = (layerId: string, direction: 'up' | 'down') => {
    const index = layout.layers.findIndex(l => l.id === layerId);
    if (
      (direction === 'up' && index === layout.layers.length - 1) ||
      (direction === 'down' && index === 0)
    ) {
      return;
    }

    const newLayers = [...layout.layers];
    const swapIndex = direction === 'up' ? index + 1 : index - 1;
    [newLayers[index], newLayers[swapIndex]] = [newLayers[swapIndex], newLayers[index]];
    
    // Update zIndex
    newLayers.forEach((layer, i) => {
      layer.zIndex = i;
    });

    setLayout(prev => ({ ...prev, layers: newLayers }));
  };

  // Test composition
  const handleTest = async () => {
    setIsTesting(true);
    await onTest(layout);
    setIsTesting(false);
  };

  // Canvas scale factor (fit to screen)
  const canvasScale = 0.4; // 40% of actual size

  return (
    <div className="grid grid-cols-[300px_1fr_350px] gap-6 h-[calc(100vh-200px)]">
      {/* LEFT: Layers Panel */}
      <Card className="bg-base-200 border-base-300 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base-content font-semibold flex items-center gap-2">
            <Layers size={18} />
            Layers
          </h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addLayer('video')} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={14} className="mr-1" />
              Video
            </Button>
            <Button size="sm" onClick={() => addLayer('image')} className="bg-purple-600 hover:bg-purple-700">
              <Plus size={14} className="mr-1" />
              Image
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {[...layout.layers].reverse().map((layer, reverseIndex) => (
            <div
              key={layer.id}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                selectedLayerId === layer.id
                  ? 'bg-orange-500/20 border-orange-500'
                  : 'bg-base-300 border-base-content/20 hover:border-base-content/40'
              }`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base-content font-medium text-sm">{layer.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className="h-6 w-6 p-0"
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayerZ(layer.id, 'up');
                  }}
                  disabled={reverseIndex === 0}
                  className="h-6 text-xs flex-1"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayerZ(layer.id, 'down');
                  }}
                  disabled={reverseIndex === layout.layers.length - 1}
                  className="h-6 text-xs flex-1"
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>

        {layout.layers.length === 0 && (
          <div className="text-center text-base-content/50 py-8">
            <p className="text-sm">No layers yet</p>
            <p className="text-xs mt-2">Add a video or image layer to start</p>
          </div>
        )}
      </Card>

      {/* CENTER: Canvas */}
      <Card className="bg-base-100 border-base-300 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base-content font-semibold">Canvas</h3>
            <p className="text-base-content/60 text-sm">
              {layout.canvas.width} × {layout.canvas.height}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              disabled={isTesting || layout.layers.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Test
                </>
              )}
            </Button>
            <Button onClick={() => onSave(layout)} className="bg-orange-500 hover:bg-orange-600">
              Save
            </Button>
          </div>
        </div>

        {/* Canvas viewport */}
        <div className="flex-1 flex items-center justify-center">
          <div
            ref={canvasRef}
            className="relative border-2 border-base-content/20"
            style={{
              width: layout.canvas.width * canvasScale,
              height: layout.canvas.height * canvasScale,
              backgroundColor: layout.canvas.backgroundColor,
            }}
          >
            {/* Render layers */}
            {layout.layers
              .filter(l => l.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((layer) => (
                <div
                  key={layer.id}
                  className={`absolute border-2 ${
                    selectedLayerId === layer.id
                      ? 'border-orange-500'
                      : 'border-transparent'
                  }`}
                  style={{
                    left: layer.transform.x * canvasScale,
                    top: layer.transform.y * canvasScale,
                    width: layer.transform.width * canvasScale,
                    height: layer.transform.height * canvasScale,
                    transform: `rotate(${layer.transform.rotation}deg)`,
                    opacity: layer.effects.opacity,
                    filter: `brightness(${layer.effects.brightness}) contrast(${layer.effects.contrast}) saturate(${layer.effects.saturation}) blur(${layer.effects.blur}px)`,
                    backgroundColor: layer.type === 'video' ? '#4B5563' : '#9333EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  {layer.name}
                </div>
              ))}
          </div>
        </div>
      </Card>

      {/* RIGHT: Properties Panel */}
      <Card className="bg-base-200 border-base-300 p-4 overflow-y-auto">
        <h3 className="text-base-content font-semibold flex items-center gap-2 mb-4">
          <Settings size={18} />
          Properties
        </h3>

        {selectedLayer ? (
          <Tabs defaultValue="transform" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transform">Transform</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>

            <TabsContent value="transform" className="space-y-4 mt-4">
              {/* Layer name */}
              <div>
                <Label className="text-base-content text-sm">Name</Label>
                <Input
                  value={selectedLayer.name}
                  onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
                  className="bg-base-100 text-base-content border-base-300 mt-1"
                />
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-base-content text-sm">X</Label>
                  <Input
                    type="number"
                    value={selectedLayer.transform.x}
                    onChange={(e) =>
                      updateTransform(selectedLayer.id, { x: parseInt(e.target.value) || 0 })
                    }
                    className="bg-base-100 text-base-content border-base-300 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-base-content text-sm">Y</Label>
                  <Input
                    type="number"
                    value={selectedLayer.transform.y}
                    onChange={(e) =>
                      updateTransform(selectedLayer.id, { y: parseInt(e.target.value) || 0 })
                    }
                    className="bg-base-100 text-base-content border-base-300 mt-1"
                  />
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-base-content text-sm">Width</Label>
                  <Input
                    type="number"
                    value={selectedLayer.transform.width}
                    onChange={(e) =>
                      updateTransform(selectedLayer.id, { width: parseInt(e.target.value) || 0 })
                    }
                    className="bg-base-100 text-base-content border-base-300 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-base-content text-sm">Height</Label>
                  <Input
                    type="number"
                    value={selectedLayer.transform.height}
                    onChange={(e) =>
                      updateTransform(selectedLayer.id, { height: parseInt(e.target.value) || 0 })
                    }
                    className="bg-base-100 text-base-content border-base-300 mt-1"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div>
                <Label className="text-base-content text-sm flex items-center gap-2">
                  <RotateCw size={14} />
                  Rotation: {selectedLayer.transform.rotation}°
                </Label>
                <Slider
                  value={[selectedLayer.transform.rotation]}
                  onValueChange={([val]: number[]) => updateTransform(selectedLayer.id, { rotation: val })}
                  min={-180}
                  max={180}
                  step={1}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4 mt-4">
              {/* Opacity */}
              <div>
                <Label className="text-base-content text-sm">
                  Opacity: {(selectedLayer.effects.opacity * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[selectedLayer.effects.opacity * 100]}
                  onValueChange={([val]: number[]) => updateEffects(selectedLayer.id, { opacity: val / 100 })}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Brightness */}
              <div>
                <Label className="text-base-content text-sm">
                  Brightness: {(selectedLayer.effects.brightness * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[selectedLayer.effects.brightness * 100]}
                  onValueChange={([val]: number[]) =>
                    updateEffects(selectedLayer.id, { brightness: val / 100 })
                  }
                  min={0}
                  max={200}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Contrast */}
              <div>
                <Label className="text-base-content text-sm">
                  Contrast: {(selectedLayer.effects.contrast * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[selectedLayer.effects.contrast * 100]}
                  onValueChange={([val]: number[]) => updateEffects(selectedLayer.id, { contrast: val / 100 })}
                  min={0}
                  max={200}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Saturation */}
              <div>
                <Label className="text-base-content text-sm">
                  Saturation: {(selectedLayer.effects.saturation * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[selectedLayer.effects.saturation * 100]}
                  onValueChange={([val]: number[]) =>
                    updateEffects(selectedLayer.id, { saturation: val / 100 })
                  }
                  min={0}
                  max={200}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Blur */}
              <div>
                <Label className="text-base-content text-sm">
                  Blur: {selectedLayer.effects.blur}px
                </Label>
                <Slider
                  value={[selectedLayer.effects.blur]}
                  onValueChange={([val]: number[]) => updateEffects(selectedLayer.id, { blur: val })}
                  min={0}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Blend Mode */}
              <div>
                <Label className="text-base-content text-sm">Blend Mode</Label>
                <Select
                  value={selectedLayer.effects.blendMode || 'normal'}
                  onValueChange={(val) => updateEffects(selectedLayer.id, { blendMode: val })}
                >
                  <SelectTrigger className="bg-base-200 text-base-content border-base-content/20 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="addition">Addition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center text-base-content/50 py-8">
            <p className="text-sm">Select a layer to edit properties</p>
          </div>
        )}
      </Card>
    </div>
  );
}

