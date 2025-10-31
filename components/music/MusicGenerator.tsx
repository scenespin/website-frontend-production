/**
 * MusicGenerator Component
 * 
 * UI for generating AI music with Suno API
 * Features: prompt input, model selection, tags, instrumental toggle
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Crown,
  Star
} from 'lucide-react';
import { 
  useMusicGeneration, 
  useSunoModels,
  SunoModel,
  formatDuration,
  getModelBadgeColor 
} from '@/hooks/useMusicGeneration';
import { MusicStorageModal } from './MusicStorageModal';

interface MusicGeneratorProps {
  onMusicGenerated?: (audioUrl: string, metadata: any) => void;
  showLibraryButton?: boolean;
}

// Preset genre tags
const GENRE_PRESETS = [
  'pop',
  'rock',
  'electronic',
  'hip-hop',
  'jazz',
  'classical',
  'country',
  'cinematic',
  'orchestral',
  'ambient',
  'lo-fi',
  'acoustic',
];

// Preset mood tags
const MOOD_PRESETS = [
  'upbeat',
  'calm',
  'energetic',
  'melancholic',
  'dramatic',
  'romantic',
  'tense',
  'relaxing',
  'powerful',
  'mysterious',
];

// Example prompts
const EXAMPLE_PROMPTS = [
  'Epic cinematic orchestral music with rising tension',
  'Upbeat electronic pop with catchy synth melodies',
  'Calm acoustic guitar ballad, gentle and peaceful',
  'Intense rock anthem with powerful drums and guitar',
  'Ambient lo-fi beats for studying, relaxed atmosphere',
  'Dramatic piano piece with emotional crescendos',
];

export function MusicGenerator({ onMusicGenerated, showLibraryButton = true }: MusicGeneratorProps) {
  const { generateMusic, isGenerating, progress, error, result, reset } = useMusicGeneration();
  const { models, loadModels } = useSunoModels();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<SunoModel>('v4.5');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [title, setTitle] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Get selected model info
  const selectedModelInfo = models.find(m => m.model === model);
  const creditCost = selectedModelInfo?.creditsPerGeneration || 100;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    await generateMusic({
      prompt: prompt.trim(),
      model,
      tags: tags.join(', '),
      title: title.trim() || undefined,
      instrumental,
    });
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleReset = () => {
    reset();
    setPrompt('');
    setTags([]);
    setTitle('');
  };

  // Notify parent when music is generated
  useEffect(() => {
    if (result && result.status === 'completed') {
      // Show storage modal
      setShowStorageModal(true);
      
      // Notify parent
      if (onMusicGenerated) {
        onMusicGenerated(result.audioUrl, {
          taskId: result.taskId,
          title: result.title,
          tags: result.tags,
          duration: result.duration_seconds,
          model: result.model,
          creditsUsed: result.creditsUsed,
        });
      }
    }
  }, [result, onMusicGenerated]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              AI Music Generator
            </CardTitle>
            <CardDescription>
              Create original music with Suno AI
            </CardDescription>
          </div>
          {result && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Generate New
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!result ? (
          <>
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Music Description *</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the music you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={isGenerating}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about genre, instruments, mood, and style
              </p>
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Examples</Label>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    disabled={isGenerating}
                    className="text-xs h-auto py-1"
                  >
                    {example.substring(0, 40)}...
                  </Button>
                ))}
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={model} onValueChange={(v) => setModel(v as SunoModel)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((modelInfo) => (
                    <SelectItem key={modelInfo.model} value={modelInfo.model}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{modelInfo.label}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={modelInfo.model === 'v4.5' ? 'default' : 'secondary'} className="text-xs">
                            {modelInfo.creditsPerGeneration} credits
                          </Badge>
                          {modelInfo.model === 'v4.5' && (
                            <Badge variant="default" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModelInfo && (
                <p className="text-sm text-muted-foreground">
                  {selectedModelInfo.description} • Up to {formatDuration(selectedModelInfo.maxDurationSeconds)}
                </p>
              )}
            </div>

            {/* Genre Tags */}
            <div className="space-y-2">
              <Label>Genre Tags (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {GENRE_PRESETS.map((genre) => (
                  <Badge
                    key={genre}
                    variant={tags.includes(genre) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => !isGenerating && handleTagToggle(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mood Tags */}
            <div className="space-y-2">
              <Label>Mood Tags (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_PRESETS.map((mood) => (
                  <Badge
                    key={mood}
                    variant={tags.includes(mood) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => !isGenerating && handleTagToggle(mood)}
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Tags */}
            <div className="space-y-2">
              <Label htmlFor="customTag">Add Custom Tag</Label>
              <div className="flex gap-2">
                <Input
                  id="customTag"
                  placeholder="e.g., piano, guitar, 80s"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  disabled={isGenerating}
                />
                <Button
                  variant="outline"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || isGenerating}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Label className="text-xs text-muted-foreground w-full">Selected Tags:</Label>
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleTagToggle(tag)}>
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title">Song Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Give your song a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Instrumental Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="instrumental"
                checked={instrumental}
                onCheckedChange={(checked) => setInstrumental(checked as boolean)}
                disabled={isGenerating}
              />
              <Label
                htmlFor="instrumental"
                className="text-sm font-normal cursor-pointer"
              >
                Instrumental only (no vocals)
              </Label>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Music ({creditCost} credits)
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  {progress < 10 
                    ? 'Starting generation...'
                    : progress < 50
                    ? 'Creating your music...'
                    : progress < 90
                    ? 'Adding finishing touches...'
                    : 'Almost ready...'}
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  This may take 1-5 minutes
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
          </>
        ) : (
          /* Success State */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800 font-medium">
                Music generated successfully!
              </div>
            </div>

            {/* Music Info */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {result.title || 'Generated Music'}
                  </h3>
                  {result.tags && (
                    <p className="text-sm text-muted-foreground">{result.tags}</p>
                  )}
                </div>
                <Badge variant="secondary">
                  {result.model}
                </Badge>
              </div>

              {/* Audio Player */}
              <audio
                controls
                src={result.audioUrl}
                className="w-full"
                controlsList="nodownload"
              />

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(result.duration_seconds)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{result.has_vocals ? 'With Vocals' : 'Instrumental'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits</p>
                  <p className="font-medium">{result.creditsUsed}</p>
                </div>
              </div>

              {/* Lyrics (if available) */}
              {result.lyrics && (
                <div className="pt-3 border-t">
                  <Label className="text-sm font-medium">Lyrics</Label>
                  <pre className="mt-2 text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                    {result.lyrics}
                  </pre>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => window.open(result.audioUrl, '_blank')}
              >
                Download
              </Button>
              {showLibraryButton && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Add to library
                    alert('Music will be saved to your library');
                  }}
                >
                  Save to Library
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Model Info Cards */}
        <div className="pt-4 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">Model Comparison</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">V3.5</div>
              <div className="text-muted-foreground">50 credits • 4 min</div>
            </div>
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">V4</div>
              <div className="text-muted-foreground">75 credits • 4 min</div>
            </div>
            <div className="p-2 border border-primary rounded text-xs bg-primary/5">
              <div className="font-medium flex items-center gap-1">
                V4.5 <Star className="w-3 h-3" />
              </div>
              <div className="text-muted-foreground">100 credits • 8 min</div>
            </div>
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">V4.5 Plus</div>
              <div className="text-muted-foreground">150 credits • 8 min</div>
            </div>
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">V5</div>
              <div className="text-muted-foreground">200 credits • 8 min</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Storage Modal */}
      {result && result.status === 'completed' && (
        <MusicStorageModal
          isOpen={showStorageModal}
          onClose={() => setShowStorageModal(false)}
          musicData={{
            audioUrl: result.audioUrl,
            s3Key: result.s3Key,
            title: result.title,
            tags: result.tags,
            model: result.model,
            duration: result.duration_seconds,
            has_vocals: result.has_vocals,
          }}
        />
      )}
    </Card>
  );
}

