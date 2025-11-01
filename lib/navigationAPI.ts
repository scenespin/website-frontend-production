/**
 * API Client for Story Beats, Characters, and Locations
 * 
 * Provides type-safe API calls for contextual navigation features
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ============================================================================
// STORY BEATS API
// ============================================================================

export interface StoryBeat {
  beat_id: string;
  project_id: string;
  user_id: string;
  name: string;
  act: 1 | 2 | 3;
  description: string;
  order: number;
  scenes: string[];
  created_at: string;
  updated_at: string;
}

export const storyBeatsAPI = {
  /**
   * Get all story beats for a project
   */
  async getBeats(projectId: string, token: string): Promise<StoryBeat[]> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/beats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch story beats: ${res.statusText}`);
    }

    const data = await res.json();
    return data.beats || [];
  },

  /**
   * Create a new story beat
   */
  async createBeat(
    projectId: string,
    token: string,
    beat: Omit<StoryBeat, 'beat_id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<StoryBeat> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/beats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(beat)
    });

    if (!res.ok) {
      throw new Error(`Failed to create story beat: ${res.statusText}`);
    }

    const data = await res.json();
    return data.beat;
  },

  /**
   * Update a story beat
   */
  async updateBeat(
    projectId: string,
    beatId: string,
    token: string,
    updates: Partial<Omit<StoryBeat, 'beat_id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/beats/${beatId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      throw new Error(`Failed to update story beat: ${res.statusText}`);
    }
  },

  /**
   * Delete a story beat
   */
  async deleteBeat(projectId: string, beatId: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/beats/${beatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete story beat: ${res.statusText}`);
    }
  }
};

// ============================================================================
// CHARACTERS API
// ============================================================================

export interface Character {
  character_id: string;
  project_id: string;
  user_id: string;
  name: string; // Stored in uppercase
  full_name: string;
  age: string;
  description: string;
  scenes: string[];
  reference_images: string[];
  created_at: string;
  updated_at: string;
}

export const charactersAPI = {
  /**
   * Get all characters for a project
   */
  async getCharacters(projectId: string, token: string): Promise<Character[]> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch characters: ${res.statusText}`);
    }

    const data = await res.json();
    return data.characters || [];
  },

  /**
   * Create a new character
   */
  async createCharacter(
    projectId: string,
    token: string,
    character: Omit<Character, 'character_id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Character> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(character)
    });

    if (!res.ok) {
      throw new Error(`Failed to create character: ${res.statusText}`);
    }

    const data = await res.json();
    return data.character;
  },

  /**
   * Update a character
   */
  async updateCharacter(
    projectId: string,
    characterId: string,
    token: string,
    updates: Partial<Omit<Character, 'character_id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/characters/${characterId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      throw new Error(`Failed to update character: ${res.statusText}`);
    }
  },

  /**
   * Delete a character
   */
  async deleteCharacter(projectId: string, characterId: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/characters/${characterId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete character: ${res.statusText}`);
    }
  }
};

// ============================================================================
// LOCATIONS API
// ============================================================================

export interface Location {
  location_id: string;
  project_id: string;
  user_id: string;
  name: string; // Stored in uppercase
  full_name: string;
  type: 'INT.' | 'EXT.' | 'INT./EXT.';
  description: string;
  scenes: string[];
  reference_images: string[];
  created_at: string;
  updated_at: string;
}

export const locationsAPI = {
  /**
   * Get all locations for a project
   */
  async getLocations(projectId: string, token: string): Promise<Location[]> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/locations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch locations: ${res.statusText}`);
    }

    const data = await res.json();
    return data.locations || [];
  },

  /**
   * Create a new location
   */
  async createLocation(
    projectId: string,
    token: string,
    location: Omit<Location, 'location_id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Location> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(location)
    });

    if (!res.ok) {
      throw new Error(`Failed to create location: ${res.statusText}`);
    }

    const data = await res.json();
    return data.location;
  },

  /**
   * Update a location
   */
  async updateLocation(
    projectId: string,
    locationId: string,
    token: string,
    updates: Partial<Omit<Location, 'location_id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/locations/${locationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      throw new Error(`Failed to update location: ${res.statusText}`);
    }
  },

  /**
   * Delete a location
   */
  async deleteLocation(projectId: string, locationId: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete location: ${res.statusText}`);
    }
  }
};

