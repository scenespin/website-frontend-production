/**
 * Showcase Gallery Component
 * Feature 0193: Demo Account Showcase System
 * 
 * Displays demo content from the showcase account on marketing/landing pages.
 * Shows reference → generated images with dropdown selections and safe metadata.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  useShowcaseCharacters, 
  useShowcaseLocations, 
  useShowcaseProps,
  type ShowcaseCharacter,
  type ShowcaseLocation,
  type ShowcaseProp,
  type ShowcasePose,
  type ShowcaseAngle,
  type ShowcaseBackground,
  type ShowcasePropAngle,
} from '@/hooks/useShowcase';
import { 
  Loader2, 
  User, 
  MapPin, 
  Box, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Sun,
  Cloud,
  Moon,
  Cpu,
  MessageSquare,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ContentType = 'characters' | 'locations' | 'props' | 'all';

interface ShowcaseGalleryProps {
  /** Which content type to display */
  contentType?: ContentType;
  /** Maximum number of items to show */
  limit?: number;
  /** Show title above gallery */
  showTitle?: boolean;
  /** Custom title override */
  title?: string;
  /** Display mode: grid or carousel */
  displayMode?: 'grid' | 'carousel';
  /** Number of columns in grid mode */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
  /** Show "See More" button */
  showSeeMore?: boolean;
  /** Callback when "See More" is clicked */
  onSeeMore?: () => void;
  /** Show detailed view with prompts/settings (for /examples page) */
  showDetails?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/** Display time of day with icon */
function TimeOfDayBadge({ timeOfDay }: { timeOfDay?: string }) {
  if (!timeOfDay) return null;
  
  const icons: Record<string, React.ReactNode> = {
    morning: <Sun className="w-3 h-3" />,
    afternoon: <Sun className="w-3 h-3" />,
    evening: <Moon className="w-3 h-3" />,
    night: <Moon className="w-3 h-3" />,
  };
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs">
      {icons[timeOfDay] || <Sun className="w-3 h-3" />}
      {timeOfDay}
    </span>
  );
}

/** Display weather with icon */
function WeatherBadge({ weather }: { weather?: string }) {
  if (!weather) return null;
  
  const icons: Record<string, React.ReactNode> = {
    sunny: <Sun className="w-3 h-3" />,
    cloudy: <Cloud className="w-3 h-3" />,
    rainy: <Cloud className="w-3 h-3" />,
    snowy: <Cloud className="w-3 h-3" />,
  };
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
      {icons[weather] || <Cloud className="w-3 h-3" />}
      {weather}
    </span>
  );
}

/** Display model name */
function ModelBadge({ modelName }: { modelName?: string }) {
  if (!modelName) return null;
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
      <Cpu className="w-3 h-3" />
      {modelName}
    </span>
  );
}

/** Display user prompt */
function UserPromptDisplay({ userPrompt }: { userPrompt?: string }) {
  if (!userPrompt) return null;
  
  return (
    <div className="mt-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-300 italic">"{userPrompt}"</p>
      </div>
    </div>
  );
}

// ============================================================================
// DETAILED ITEM COMPONENTS (for /examples page)
// ============================================================================

/** Detailed pose card showing before/after and metadata */
function PoseDetailCard({ pose, referenceImageUrl }: { pose: ShowcasePose; referenceImageUrl: string | null }) {
  const [refError, setRefError] = useState(false);
  const [poseError, setPoseError] = useState(false);
  
  return (
    <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      {/* Before → After */}
      <div className="flex items-center gap-4 mb-3">
        {/* Reference (Before) */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
          {referenceImageUrl && !refError ? (
            <Image
              src={referenceImageUrl}
              alt="Reference"
              width={80}
              height={80}
              className="object-cover w-full h-full"
              onError={() => setRefError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-8 h-8 text-slate-600" />
            </div>
          )}
        </div>
        
        <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        
        {/* Generated (After) */}
        <div className="w-28 h-28 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
          {pose.imageUrl && !poseError ? (
            <Image
              src={pose.imageUrl}
              alt={pose.label}
              width={112}
              height={112}
              className="object-cover w-full h-full"
              onError={() => setPoseError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-slate-600" />
            </div>
          )}
        </div>
      </div>
      
      {/* Metadata */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white">{pose.label}</p>
        {pose.category && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs">
            {pose.category}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <ModelBadge modelName={pose.modelName} />
        </div>
        <UserPromptDisplay userPrompt={pose.userPrompt} />
      </div>
    </div>
  );
}

/** Detailed angle card showing before/after with dropdown selections */
function AngleDetailCard({ angle, referenceImageUrl }: { angle: ShowcaseAngle; referenceImageUrl: string | null }) {
  const [refError, setRefError] = useState(false);
  const [angleError, setAngleError] = useState(false);
  
  return (
    <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      {/* Before → After */}
      <div className="flex items-center gap-4 mb-3">
        {/* Reference (Before) */}
        <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
          {referenceImageUrl && !refError ? (
            <Image
              src={referenceImageUrl}
              alt="Reference"
              width={96}
              height={64}
              className="object-cover w-full h-full"
              onError={() => setRefError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>
        
        <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        
        {/* Generated (After) */}
        <div className="w-32 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
          {angle.imageUrl && !angleError ? (
            <Image
              src={angle.imageUrl}
              alt={angle.angle}
              width={128}
              height={80}
              className="object-cover w-full h-full"
              onError={() => setAngleError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-600" />
            </div>
          )}
        </div>
      </div>
      
      {/* Settings & Metadata */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white capitalize">{angle.angle} View</p>
        <div className="flex flex-wrap gap-2">
          <TimeOfDayBadge timeOfDay={angle.timeOfDay} />
          <WeatherBadge weather={angle.weather} />
          <ModelBadge modelName={angle.modelName} />
        </div>
        <UserPromptDisplay userPrompt={angle.userPrompt} />
      </div>
    </div>
  );
}

/** Detailed background card showing before/after with dropdown selections */
function BackgroundDetailCard({ background, referenceImageUrl }: { background: ShowcaseBackground; referenceImageUrl: string | null }) {
  const [refError, setRefError] = useState(false);
  const [bgError, setBgError] = useState(false);
  
  return (
    <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      {/* Before → After */}
      <div className="flex items-center gap-4 mb-3">
        {/* Reference (Before) */}
        <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
          {referenceImageUrl && !refError ? (
            <Image
              src={referenceImageUrl}
              alt="Reference"
              width={96}
              height={64}
              className="object-cover w-full h-full"
              onError={() => setRefError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>
        
        <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        
        {/* Generated (After) */}
        <div className="w-32 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
          {background.imageUrl && !bgError ? (
            <Image
              src={background.imageUrl}
              alt={background.backgroundType}
              width={128}
              height={80}
              className="object-cover w-full h-full"
              onError={() => setBgError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-600" />
            </div>
          )}
        </div>
      </div>
      
      {/* Settings & Metadata */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white capitalize">{background.backgroundType}</p>
        {background.description && (
          <p className="text-xs text-slate-400">{background.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <TimeOfDayBadge timeOfDay={background.timeOfDay} />
          <WeatherBadge weather={background.weather} />
          <ModelBadge modelName={background.modelName} />
        </div>
        <UserPromptDisplay userPrompt={background.userPrompt} />
      </div>
    </div>
  );
}

// ============================================================================
// CARD COMPONENTS
// ============================================================================

function CharacterCard({ character, showDetails = false }: { character: ShowcaseCharacter; showDetails?: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  // Use referenceImageUrl (new) or fall back to thumbnailUrl pattern
  const thumbnailUrl = character.referenceImageUrl || (character.referenceImages?.[0] || null);
  
  if (showDetails) {
    return (
      <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50">
        {/* Header with main image */}
        <div className="aspect-video relative overflow-hidden">
          {thumbnailUrl && !imageError ? (
            <Image
              src={thumbnailUrl}
              alt={character.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-slate-800 flex items-center justify-center">
              <User className="w-16 h-16 text-slate-600" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{character.name}</h3>
            {character.type && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/80 text-white text-xs">
                {character.type}
              </span>
            )}
          </div>
          {character.description && (
            <p className="text-sm text-slate-400 mb-4">{character.description}</p>
          )}
          
          {/* Poses grid */}
          {character.poses && character.poses.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Generated Poses</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {character.poses.map((pose, idx) => (
                  <PoseDetailCard 
                    key={idx} 
                    pose={pose} 
                    referenceImageUrl={thumbnailUrl}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Simple card view
  return (
    <div className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
      <div className="aspect-[3/4] relative overflow-hidden">
        {thumbnailUrl && !imageError ? (
          <Image
            src={thumbnailUrl}
            alt={character.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-slate-800 flex items-center justify-center">
            <User className="w-16 h-16 text-slate-600" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {character.type && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-purple-500/80 text-white text-xs font-medium backdrop-blur-sm">
            {character.type}
          </div>
        )}
        
        {character.poses && character.poses.length > 0 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium backdrop-blur-sm">
            {character.poses.length} poses
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{character.name}</h3>
        {character.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{character.description}</p>
        )}
      </div>
    </div>
  );
}

function LocationCard({ location, showDetails = false }: { location: ShowcaseLocation; showDetails?: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  // Use referenceImageUrl (new) or fall back
  const thumbnailUrl = location.referenceImageUrl || (location.referenceImages?.[0] || null);
  
  if (showDetails) {
    return (
      <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50">
        {/* Header with main image */}
        <div className="aspect-video relative overflow-hidden">
          {thumbnailUrl && !imageError ? (
            <Image
              src={thumbnailUrl}
              alt={location.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-900/30 to-slate-800 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-slate-600" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{location.name}</h3>
            {location.type && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/80 text-white text-xs">
                {location.type}
              </span>
            )}
          </div>
          {location.description && (
            <p className="text-sm text-slate-400 mb-4">{location.description}</p>
          )}
          
          {/* Angles section */}
          {location.angles && location.angles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Generated Angles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {location.angles.map((angle, idx) => (
                  <AngleDetailCard 
                    key={idx} 
                    angle={angle} 
                    referenceImageUrl={thumbnailUrl}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Backgrounds section */}
          {location.backgrounds && location.backgrounds.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Generated Backgrounds</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {location.backgrounds.map((bg, idx) => (
                  <BackgroundDetailCard 
                    key={idx} 
                    background={bg} 
                    referenceImageUrl={thumbnailUrl}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Simple card view
  return (
    <div className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
      <div className="aspect-video relative overflow-hidden">
        {thumbnailUrl && !imageError ? (
          <Image
            src={thumbnailUrl}
            alt={location.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900/30 to-slate-800 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-slate-600" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 right-3 flex gap-2">
          {location.angles && location.angles.length > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium backdrop-blur-sm">
              {location.angles.length} angles
            </div>
          )}
          {location.backgrounds && location.backgrounds.length > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-cyan-500/80 text-white text-xs font-medium backdrop-blur-sm">
              {location.backgrounds.length} BGs
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{location.name}</h3>
        {location.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{location.description}</p>
        )}
      </div>
    </div>
  );
}

function PropCard({ prop, showDetails = false }: { prop: ShowcaseProp; showDetails?: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  // Use referenceImageUrl (new) or fall back
  const thumbnailUrl = prop.referenceImageUrl || (prop.referenceImages?.[0] || null);
  
  if (showDetails) {
    return (
      <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50">
        {/* Header with main image */}
        <div className="aspect-square relative overflow-hidden">
          {thumbnailUrl && !imageError ? (
            <Image
              src={thumbnailUrl}
              alt={prop.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-slate-800 flex items-center justify-center">
              <Box className="w-16 h-16 text-slate-600" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white">{prop.name}</h3>
          {prop.description && (
            <p className="text-sm text-slate-400 mb-4">{prop.description}</p>
          )}
          
          {/* Angles grid */}
          {prop.angles && prop.angles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Generated Angles</h4>
              <div className="grid grid-cols-2 gap-3">
                {prop.angles.map((angle, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-2">
                    <div className="aspect-square relative rounded overflow-hidden mb-2">
                      {angle.imageUrl ? (
                        <Image
                          src={angle.imageUrl}
                          alt={angle.angle}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <Box className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 capitalize">{angle.angle}</p>
                    {angle.modelName && (
                      <p className="text-xs text-purple-400">{angle.modelName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Simple card view
  return (
    <div className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      <div className="aspect-square relative overflow-hidden">
        {thumbnailUrl && !imageError ? (
          <Image
            src={thumbnailUrl}
            alt={prop.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-slate-800 flex items-center justify-center">
            <Box className="w-16 h-16 text-slate-600" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {prop.angles && prop.angles.length > 0 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-xs font-medium backdrop-blur-sm">
            {prop.angles.length} angles
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{prop.name}</h3>
        {prop.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{prop.description}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING / EMPTY STATES
// ============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );
}

function EmptyState({ contentType }: { contentType: ContentType }) {
  const messages = {
    characters: 'No character examples available yet',
    locations: 'No location examples available yet',
    props: 'No prop examples available yet',
    all: 'No examples available yet'
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
      <p className="text-slate-400">{messages[contentType]}</p>
      <p className="text-sm text-slate-500 mt-2">Examples will appear here once added to the demo account</p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShowcaseGallery({
  contentType = 'all',
  limit,
  showTitle = true,
  title,
  displayMode = 'grid',
  columns = 3,
  className,
  showSeeMore = false,
  onSeeMore,
  showDetails = false,
}: ShowcaseGalleryProps) {
  
  // Fetch based on content type
  const { data: charactersData, isLoading: charactersLoading } = useShowcaseCharacters(contentType === 'characters' || contentType === 'all');
  const { data: locationsData, isLoading: locationsLoading } = useShowcaseLocations(contentType === 'locations' || contentType === 'all');
  const { data: propsData, isLoading: propsLoading } = useShowcaseProps(contentType === 'props' || contentType === 'all');
  
  const isLoading = charactersLoading || locationsLoading || propsLoading;
  
  // Apply limits
  const characters = (charactersData?.characters || []).slice(0, limit);
  const locations = (locationsData?.locations || []).slice(0, limit);
  const props = (propsData?.props || []).slice(0, limit);
  
  // Check if we have any content
  const hasContent = characters.length > 0 || locations.length > 0 || props.length > 0;
  
  // Title text
  const titles = {
    characters: 'AI-Generated Characters',
    locations: 'Cinematic Locations',
    props: 'Production Props',
    all: 'See What Wryda Can Create'
  };
  
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };
  
  // Use single column for detailed view
  const detailGridClass = showDetails ? 'grid-cols-1 lg:grid-cols-2' : gridClasses[columns];
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!hasContent) {
    return <EmptyState contentType={contentType} />;
  }
  
  return (
    <div className={className}>
      {/* Title */}
      {showTitle && (
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {title || titles[contentType]}
          </h2>
          {showSeeMore && onSeeMore && (
            <button 
              onClick={onSeeMore}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              See all examples →
            </button>
          )}
        </div>
      )}
      
      {/* Content based on type */}
      {contentType === 'characters' && (
        <div className={`grid ${detailGridClass} gap-6`}>
          {characters.map((character, index) => (
            <CharacterCard key={index} character={character} showDetails={showDetails} />
          ))}
        </div>
      )}
      
      {contentType === 'locations' && (
        <div className={`grid ${detailGridClass} gap-6`}>
          {locations.map((location, index) => (
            <LocationCard key={index} location={location} showDetails={showDetails} />
          ))}
        </div>
      )}
      
      {contentType === 'props' && (
        <div className={`grid ${detailGridClass} gap-6`}>
          {props.map((prop, index) => (
            <PropCard key={index} prop={prop} showDetails={showDetails} />
          ))}
        </div>
      )}
      
      {contentType === 'all' && (
        <div className="space-y-12">
          {/* Characters Section */}
          {characters.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Characters
              </h3>
              <div className={`grid ${detailGridClass} gap-6`}>
                {characters.map((character, index) => (
                  <CharacterCard key={index} character={character} showDetails={showDetails} />
                ))}
              </div>
            </div>
          )}
          
          {/* Locations Section */}
          {locations.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Locations
              </h3>
              <div className={`grid ${detailGridClass} gap-6`}>
                {locations.map((location, index) => (
                  <LocationCard key={index} location={location} showDetails={showDetails} />
                ))}
              </div>
            </div>
          )}
          
          {/* Props Section */}
          {props.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-400" />
                Props
              </h3>
              <div className={`grid ${detailGridClass} gap-6`}>
                {props.map((prop, index) => (
                  <PropCard key={index} prop={prop} showDetails={showDetails} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ShowcaseGallery;

// Re-export card components for custom layouts
export { CharacterCard, LocationCard, PropCard };
