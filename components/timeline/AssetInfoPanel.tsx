/**
 * AssetInfoPanel Component
 * 
 * Displays comprehensive metadata for timeline assets
 * Shows generation details, costs, and allows regeneration
 * Feature 0064: Universal Asset Metadata Tracking
 */

import React from 'react';
import { X, RefreshCw, Sparkles, Upload, Film, Image as ImageIcon, Music, FileText } from 'lucide-react';
import { TimelineAsset, AssetMetadata } from '@/hooks/useTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AssetInfoPanelProps {
  asset: TimelineAsset;
  onClose: () => void;
  onRegenerate?: (metadata: AssetMetadata) => void;
}

export function AssetInfoPanel({ asset, onClose, onRegenerate }: AssetInfoPanelProps) {
  const metadata = asset.assetMetadata;
  const compositionMeta = asset.compositionMetadata;
  
  // Get asset icon based on type
  const getAssetIcon = () => {
    if (asset.isComposition) return <Film className="w-5 h-5" />;
    if (metadata?.sourceType === 'ai-video') return <Sparkles className="w-5 h-5 text-purple-500" />;
    if (metadata?.sourceType === 'ai-image') return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (metadata?.sourceType === 'ai-audio' || metadata?.sourceType === 'ai-music') return <Music className="w-5 h-5 text-green-500" />;
    if (metadata?.sourceType === 'uploaded') return <Upload className="w-5 h-5 text-base-content/50" />;
    if (metadata?.sourceType === 'subtitle') return <FileText className="w-5 h-5 text-yellow-500" />;
    return <Film className="w-5 h-5" />;
  };
  
  // Get source badge color
  const getSourceBadgeColor = () => {
    if (asset.isComposition) return 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20';
    if (metadata?.sourceType === 'ai-video') return 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20';
    if (metadata?.sourceType === 'ai-image') return 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20';
    if (metadata?.sourceType === 'ai-audio' || metadata?.sourceType === 'ai-music') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (metadata?.sourceType === 'uploaded') return 'bg-base-content/50/10 text-base-content/50 border-base-content/50/20';
    return 'bg-base-content/50/10 text-base-content/50 border-base-content/50/20';
  };
  
  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  
  // Format timestamp
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    return date.toLocaleString();
  };
  
  // Render AI Video metadata
  const renderAIVideoMetadata = (meta: any) => (
    <div className="space-y-3">
      <InfoRow label="Provider" value={meta.provider.toUpperCase()} />
      <InfoRow label="Model" value={meta.model || 'Default'} />
      <InfoRow label="Prompt" value={meta.prompt} multiline />
      <InfoRow label="Resolution" value={meta.resolution} />
      <InfoRow label="Aspect Ratio" value={meta.aspectRatio} />
      <InfoRow label="Duration" value={meta.duration} />
      <InfoRow label="Video Mode" value={meta.videoMode?.replace('-', ' ').toUpperCase()} />
      {meta.qualityTier && <InfoRow label="Quality Tier" value={meta.qualityTier.toUpperCase()} />}
      {meta.enableSound && <InfoRow label="Audio" value="Enabled ✅" />}
      {meta.enableLoop && <InfoRow label="Loop" value="Enabled ✅" />}
      {meta.cameraMotion && <InfoRow label="Camera Motion" value={meta.cameraMotion} />}
      {meta.startImage && <InfoRow label="Start Image" value="Used 🖼️" />}
      {meta.endImage && <InfoRow label="End Image" value="Used 🖼️" />}
      {meta.referenceImages && meta.referenceImages.length > 0 && (
        <InfoRow label="Reference Images" value={`${meta.referenceImages.length} images`} />
      )}
      <InfoRow label="Credits Used" value={`${meta.creditsUsed} credits`} highlight />
      {meta.generationTime && <InfoRow label="Generation Time" value={`${(meta.generationTime / 1000).toFixed(1)}s`} />}
      <InfoRow label="Generated At" value={formatTimestamp(meta.generatedAt)} />
      {meta.jobId && <InfoRow label="Job ID" value={meta.jobId} mono />}
    </div>
  );
  
  // Render AI Image metadata
  const renderAIImageMetadata = (meta: any) => (
    <div className="space-y-3">
      <InfoRow label="Provider" value={meta.provider.toUpperCase()} />
      <InfoRow label="Prompt" value={meta.prompt} multiline />
      <InfoRow label="Resolution" value={meta.resolution} />
      {meta.style && <InfoRow label="Style" value={meta.style} />}
      {meta.negativePrompt && <InfoRow label="Negative Prompt" value={meta.negativePrompt} multiline />}
      {meta.seed && <InfoRow label="Seed" value={meta.seed.toString()} mono />}
      {meta.steps && <InfoRow label="Steps" value={meta.steps.toString()} />}
      {meta.guidanceScale && <InfoRow label="Guidance Scale" value={meta.guidanceScale.toString()} />}
      {meta.characterReference && <InfoRow label="Character Reference" value="Used 👤" />}
      {meta.styleReference && <InfoRow label="Style Reference" value="Used 🎨" />}
      <InfoRow label="Credits Used" value={`${meta.creditsUsed} credits`} highlight />
      <InfoRow label="Generated At" value={formatTimestamp(meta.generatedAt)} />
    </div>
  );
  
  // Render AI Audio metadata
  const renderAIAudioMetadata = (meta: any) => (
    <div className="space-y-3">
      <InfoRow label="Provider" value={meta.provider.toUpperCase()} />
      <InfoRow label="Type" value={meta.sourceType.replace('ai-', '').toUpperCase()} />
      {meta.prompt && <InfoRow label="Prompt" value={meta.prompt} multiline />}
      {meta.text && <InfoRow label="Text" value={meta.text} multiline />}
      {meta.voice && <InfoRow label="Voice" value={meta.voice} />}
      {meta.language && <InfoRow label="Language" value={meta.language} />}
      {meta.musicGenre && <InfoRow label="Genre" value={meta.musicGenre} />}
      {meta.mood && <InfoRow label="Mood" value={meta.mood} />}
      <InfoRow label="Duration" value={meta.duration} />
      {meta.format && <InfoRow label="Format" value={meta.format.toUpperCase()} />}
      {meta.sampleRate && <InfoRow label="Sample Rate" value={`${meta.sampleRate} Hz`} />}
      <InfoRow label="Credits Used" value={`${meta.creditsUsed} credits`} highlight />
      <InfoRow label="Generated At" value={formatTimestamp(meta.generatedAt)} />
    </div>
  );
  
  // Render Upload metadata
  const renderUploadMetadata = (meta: any) => (
    <div className="space-y-3">
      <InfoRow label="Source" value="User Upload" />
      <InfoRow label="Filename" value={meta.originalFilename} />
      <InfoRow label="File Size" value={formatFileSize(meta.fileSize)} />
      <InfoRow label="MIME Type" value={meta.mimeType} />
      {meta.fileExtension && <InfoRow label="Extension" value={meta.fileExtension.toUpperCase()} />}
      {meta.codec && <InfoRow label="Codec" value={meta.codec} />}
      {meta.uploadSource && <InfoRow label="Upload Source" value={meta.uploadSource} />}
      {meta.needsProxy && (
        <InfoRow 
          label="Proxy" 
          value={meta.proxyGenerated ? "Generated ✅" : "Generating..."} 
        />
      )}
      {meta.originalResolution && <InfoRow label="Original Resolution" value={meta.originalResolution} />}
      {meta.proxyResolution && <InfoRow label="Proxy Resolution" value={meta.proxyResolution} />}
      <InfoRow label="Credits Used" value="FREE ✅" highlight />
      <InfoRow label="Uploaded At" value={formatTimestamp(meta.uploadedAt)} />
    </div>
  );
  
  // Render Composition metadata
  const renderCompositionMetadata = (meta: any) => (
    <div className="space-y-3">
      <InfoRow label="Type" value={meta.compositionType.replace('-', ' ').toUpperCase()} />
      {meta.layoutId && <InfoRow label="Layout" value={meta.layoutId} />}
      {meta.animationId && <InfoRow label="Animation" value={meta.animationId} />}
      {meta.pacingId && <InfoRow label="Pacing" value={meta.pacingId} />}
      <InfoRow label="Source Clips" value={`${meta.sourceClips.length} clips`} />
      {meta.audioMixType && <InfoRow label="Audio Mix" value={meta.audioMixType.replace('-', ' ')} />}
      {meta.audioEffects && (
        <>
          {meta.audioEffects.normalization && <InfoRow label="Normalization" value="Enabled ✅" />}
          {meta.audioEffects.compression && <InfoRow label="Compression" value="Enabled ✅" />}
          {meta.audioEffects.eq && <InfoRow label="EQ" value={meta.audioEffects.eq} />}
          {meta.audioEffects.reverb && <InfoRow label="Reverb" value={`${meta.audioEffects.reverb}%`} />}
        </>
      )}
      <InfoRow label="Credits Used" value={`${meta.creditsUsed} credits`} highlight />
      <InfoRow label="Version" value={`v${meta.version}`} />
      <InfoRow label="Created At" value={formatTimestamp(meta.createdAt)} />
      {meta.lastModified && <InfoRow label="Last Modified" value={formatTimestamp(meta.lastModified)} />}
    </div>
  );
  
  // Render Subtitle metadata
  const renderSubtitleMetadata = (meta: any) => (
    <div className="space-y-3">
      <InfoRow label="Type" value={meta.sourceType.toUpperCase()} />
      <InfoRow label="Format" value={meta.format.toUpperCase()} />
      {meta.language && <InfoRow label="Language" value={meta.language} />}
      {meta.originalFilename && <InfoRow label="Filename" value={meta.originalFilename} />}
      {meta.generatedBy && <InfoRow label="Generated By" value={meta.generatedBy.toUpperCase()} />}
      {meta.transcriptionProvider && <InfoRow label="Transcription" value={meta.transcriptionProvider} />}
      <InfoRow label="Credits Used" value={`${meta.creditsUsed || 0} credits`} highlight />
      <InfoRow label="Created At" value={formatTimestamp(meta.generatedAt)} />
    </div>
  );
  
  // Determine what to render
  const renderMetadata = () => {
    if (compositionMeta) {
      return renderCompositionMetadata(compositionMeta);
    }
    
    if (!metadata) {
      return (
        <div className="text-base-content/50 text-center py-8">
          No metadata available for this asset.
        </div>
      );
    }
    
    switch (metadata.sourceType) {
      case 'ai-video':
        return renderAIVideoMetadata(metadata);
      case 'ai-image':
        return renderAIImageMetadata(metadata);
      case 'ai-audio':
      case 'ai-music':
      case 'ai-voice':
        return renderAIAudioMetadata(metadata);
      case 'uploaded':
        return renderUploadMetadata(metadata);
      case 'subtitle':
      case 'caption':
        return renderSubtitleMetadata(metadata);
      default:
        return (
          <div className="text-base-content/50 text-center py-8">
            Unknown asset type
          </div>
        );
    }
  };
  
  // Check if regeneration is possible
  const canRegenerate = metadata && (
    metadata.sourceType === 'ai-video' ||
    metadata.sourceType === 'ai-image' ||
    metadata.sourceType === 'ai-audio' ||
    metadata.sourceType === 'ai-music'
  );
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-200 border border-base-content/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-content/20">
          <div className="flex items-center gap-3">
            {getAssetIcon()}
            <div>
              <h2 className="text-xl font-bold text-base-content">{asset.name}</h2>
              <Badge className={`mt-1 ${getSourceBadgeColor()}`}>
                {asset.isComposition ? 'Composition' : 
                 metadata?.sourceType.replace('ai-', 'AI ').replace('-', ' ').toUpperCase() || 
                 'Asset'}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-base-content/60" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderMetadata()}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-base-content/20 flex gap-3">
          {canRegenerate && onRegenerate && (
            <Button
              onClick={() => metadata && onRegenerate(metadata)}
              className="flex-1 bg-[#DC143C] hover:bg-[#B91238]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate with Same Settings
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ 
  label, 
  value, 
  multiline = false, 
  mono = false, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  multiline?: boolean; 
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex ${multiline ? 'flex-col' : 'justify-between items-center'} gap-2`}>
      <span className="text-base-content/60 text-sm font-medium">{label}:</span>
      <span className={`text-base-content ${multiline ? 'text-sm' : 'text-sm'} ${mono ? 'font-mono text-xs' : ''} ${highlight ? 'font-bold text-[#DC143C]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

