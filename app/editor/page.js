'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Save,
  FileText,
  Download,
  Sparkles,
  Users,
  MapPin,
  Clock
} from 'lucide-react';

export default function EditorPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const [content, setContent] = useState('');
  const [projectName, setProjectName] = useState('Untitled Screenplay');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [locations, setLocations] = useState([]);

  // Load project
  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      // Show fountain format template
      setContent(`Title: My Screenplay
Credit: Written by
Author: ${user?.fullName || 'Your Name'}
Source: Created with App

FADE IN:

INT. COFFEE SHOP - DAY

A cozy neighborhood cafe. Sunlight streams through large windows.

SARAH (30s, creative, confident) sits alone at a corner table, typing on her laptop.

SARAH
(to herself)
Just one more scene...

The BARISTA (20s, friendly) approaches with a fresh coffee.

BARISTA
Another cappuccino?

SARAH
You're a lifesaver.

She takes a sip and smiles, then returns to typing.

FADE OUT.`);
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await api.screenplay.get(projectId);
      setContent(response.data.content || '');
      setProjectName(response.data.title || 'Untitled Screenplay');
      
      // Load characters and locations
      const [charsRes, locsRes] = await Promise.all([
        api.entities.getCharacters(projectId),
        api.entities.getLocations(projectId),
      ]);
      setCharacters(charsRes.data || []);
      setLocations(locsRes.data || []);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (projectId) {
        await api.screenplay.save(projectId, content);
      } else {
        // Create new project
        const response = await api.projects.create({
          project_name: projectName,
          screenplay_content: content,
        });
        window.history.pushState({}, '', `/editor?project=${response.data.project.project_id}`);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save screenplay');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!projectId) {
      alert('Please save your screenplay first');
      return;
    }
    
    try {
      const response = await api.screenplay.exportPDF(projectId);
      // Trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.pdf`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF');
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (content && projectId) {
        handleSave();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [content, projectId]);

  // Parse characters and locations from content
  useEffect(() => {
    // Simple parsing - in production, use proper Fountain parser
    const lines = content.split('\n');
    const foundChars = new Set();
    const foundLocs = new Set();
    
    lines.forEach(line => {
      // Character names (ALL CAPS followed by dialogue)
      if (/^[A-Z][A-Z\s]+$/.test(line.trim()) && line.trim().length < 30) {
        foundChars.add(line.trim());
      }
      // Scene headings
      if (line.match(/^(INT\.|EXT\.)/)) {
        const match = line.match(/^(INT\.|EXT\.)\s+(.+?)\s+-/);
        if (match) {
          foundLocs.add(match[2].trim());
        }
      }
    });
    
    setCharacters(Array.from(foundChars).slice(0, 10));
    setLocations(Array.from(foundLocs).slice(0, 10));
  }, [content]);

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2"
              placeholder="Screenplay Title"
            />
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm opacity-70">
                <Clock className="w-4 h-4 inline mr-1" />
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-sm bg-white/20 hover:bg-white/30 border-white/30 text-white"
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <><Save className="w-4 h-4" /> Save</>
              )}
            </button>
            <button
              onClick={handleExportPDF}
              className="btn btn-sm bg-white/20 hover:bg-white/30 border-white/30 text-white"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Characters */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-cinema-red" />
                  Characters ({characters.length})
                </h3>
                <div className="space-y-1">
                  {characters.map((char, idx) => (
                    <div key={idx} className="text-sm py-1 px-2 bg-base-300 rounded">
                      {char}
                    </div>
                  ))}
                  {characters.length === 0 && (
                    <p className="text-xs opacity-50">
                      Characters will appear as you write
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h3 className="font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cinema-blue" />
                  Locations ({locations.length})
                </h3>
                <div className="space-y-1">
                  {locations.map((loc, idx) => (
                    <div key={idx} className="text-sm py-1 px-2 bg-base-300 rounded">
                      {loc}
                    </div>
                  ))}
                  {locations.length === 0 && (
                    <p className="text-xs opacity-50">
                      Locations will appear as you write
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="card bg-gradient-to-br from-cinema-gold/20 to-cinema-red/20 border border-cinema-gold/30 shadow-xl">
              <div className="card-body p-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cinema-gold" />
                  AI Assistant
                </h3>
                <p className="text-xs opacity-70 mb-2">
                  Get help with your screenplay
                </p>
                <button className="btn btn-sm btn-outline gap-2">
                  <Sparkles className="w-4 h-4" />
                  Open Chat
                </button>
              </div>
            </div>

            {/* Fountain Format Guide */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">Fountain Format</h3>
                <div className="text-xs space-y-2 opacity-70">
                  <div>
                    <strong>Scene Heading:</strong>
                    <pre className="text-[10px] bg-base-300 p-1 rounded mt-1">INT. LOCATION - DAY</pre>
                  </div>
                  <div>
                    <strong>Character:</strong>
                    <pre className="text-[10px] bg-base-300 p-1 rounded mt-1">CHARACTER NAME</pre>
                  </div>
                  <div>
                    <strong>Dialogue:</strong>
                    <pre className="text-[10px] bg-base-300 p-1 rounded mt-1">Their words here</pre>
                  </div>
                  <div>
                    <strong>Action:</strong>
                    <pre className="text-[10px] bg-base-300 p-1 rounded mt-1">Regular text</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="textarea textarea-ghost w-full min-h-[calc(100vh-250px)] font-mono text-sm p-6 focus:outline-none"
                  placeholder="Start writing your screenplay in Fountain format..."
                  style={{
                    fontFamily: '"Courier Prime", "Courier New", monospace',
                    lineHeight: '1.8',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 p-4 bg-base-200/50 rounded-lg">
              <p className="text-sm opacity-70">
                <strong>💡 Tip:</strong> Press <kbd className="kbd kbd-sm">Ctrl+S</kbd> to save manually. 
                Your work is auto-saved every 30 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

