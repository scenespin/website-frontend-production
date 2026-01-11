/**
 * Showcase Gallery Component
 * Feature 0193: Demo Account Showcase System
 * 
 * Displays demo content from the showcase account on marketing/landing pages.
 * Supports different content types (characters, locations, props, videos).
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  useShowcaseCharacters, 
  useShowcaseLocations, 
  useShowcaseProps,
  useShowcaseAll,
  type ShowcaseCharacter,
  type ShowcaseLocation,
  type ShowcaseProp
} from '@/hooks/useShowcase';
import { Loader2, User, MapPin, Box, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';

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
}

// ============================================================================
// CARD COMPONENTS
// ============================================================================

function CharacterCard({ character }: { character: ShowcaseCharacter }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
      {/* Image */}
      <div className="aspect-[3/4] relative overflow-hidden">
        {character.thumbnailUrl && !imageError ? (
          <Image
            src={character.thumbnailUrl}
            alt={character.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized // Presigned URLs can't be optimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-slate-800 flex items-center justify-center">
            <User className="w-16 h-16 text-slate-600" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Type badge */}
        {character.type && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-purple-500/80 text-white text-xs font-medium backdrop-blur-sm">
            {character.type}
          </div>
        )}
        
        {/* Poses count */}
        {character.poses && character.poses.length > 0 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium backdrop-blur-sm">
            {character.poses.length} poses
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{character.name}</h3>
        {character.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{character.description}</p>
        )}
      </div>
    </div>
  );
}

function LocationCard({ location }: { location: ShowcaseLocation }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
      {/* Image */}
      <div className="aspect-video relative overflow-hidden">
        {location.thumbnailUrl && !imageError ? (
          <Image
            src={location.thumbnailUrl}
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
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Stats badges */}
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
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{location.name}</h3>
        {location.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{location.description}</p>
        )}
      </div>
    </div>
  );
}

function PropCard({ prop }: { prop: ShowcaseProp }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        {prop.thumbnailUrl && !imageError ? (
          <Image
            src={prop.thumbnailUrl}
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
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Images count */}
        {prop.images && prop.images.length > 1 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-xs font-medium backdrop-blur-sm">
            {prop.images.length} images
          </div>
        )}
      </div>
      
      {/* Content */}
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
// CAROUSEL COMPONENT
// ============================================================================

function Carousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  return (
    <div className={`relative group ${className || ''}`}>
      {/* Scroll container */}
      <div 
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {children}
      </div>
      
      {/* Navigation arrows - hidden on mobile */}
      <button 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-slate-700"
        onClick={() => {/* scroll left */}}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-slate-700"
        onClick={() => {/* scroll right */}}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
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
  onSeeMore
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
        <div className={`grid ${gridClasses[columns]} gap-6`}>
          {characters.map((character, index) => (
            <CharacterCard key={index} character={character} />
          ))}
        </div>
      )}
      
      {contentType === 'locations' && (
        <div className={`grid ${gridClasses[columns]} gap-6`}>
          {locations.map((location, index) => (
            <LocationCard key={index} location={location} />
          ))}
        </div>
      )}
      
      {contentType === 'props' && (
        <div className={`grid ${gridClasses[columns]} gap-6`}>
          {props.map((prop, index) => (
            <PropCard key={index} prop={prop} />
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
              <div className={`grid ${gridClasses[columns]} gap-6`}>
                {characters.map((character, index) => (
                  <CharacterCard key={index} character={character} />
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
              <div className={`grid ${gridClasses[columns]} gap-6`}>
                {locations.map((location, index) => (
                  <LocationCard key={index} location={location} />
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
              <div className={`grid ${gridClasses[columns]} gap-6`}>
                {props.map((prop, index) => (
                  <PropCard key={index} prop={prop} />
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
