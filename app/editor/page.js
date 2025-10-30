'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useDrawer } from '@/contexts/DrawerContext';
import { 
  Save,
  FileText,
  Download,
  Sparkles,
  Users,
  MapPin,
  Clock,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Keyboard
} from 'lucide-react';

function EditorContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { openDrawer } = useDrawer();

  const [content, setContent] = useState('');
  const [projectName, setProjectName] = useState('Untitled Screenplay');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Mobile/Desktop state
  const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar bottom sheet
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+E or Cmd+E = Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportPDF();
      }
      // Ctrl+/ or Cmd+/ = Open AI Assistant
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openDrawer();
      }
      // Ctrl+B or Cmd+B = Toggle sidebar (desktop)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
      // Ctrl+? = Show keyboard help
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowKeyboardHelp(!showKeyboardHelp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, showKeyboardHelp, openDrawer]);

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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ========================================================================
          DESKTOP HEADER
      ======================================================================== */}
      <div className="hidden lg:block bg-gradient-to-r from-cinema-red to-cinema-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2 flex-1 min-w-0"
              placeholder="Screenplay Title"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastSaved && (
              <span className="text-xs opacity-70 hidden xl:flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-sm bg-white/20 hover:bg-white/30 border-white/30 text-white"
              title="Save (Ctrl+S)"
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
              title="Export PDF (Ctrl+E)"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="btn btn-sm btn-circle bg-white/20 hover:bg-white/30 border-white/30 text-white"
              title="Keyboard Shortcuts (Ctrl+?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================
          MOBILE HEADER
      ======================================================================== */}
      <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-cinema-red to-cinema-blue text-white shadow-lg">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowSidebar(true)}
            className="btn btn-sm btn-circle bg-white/20 hover:bg-white/30 border-white/30 text-white"
            title="Info & Guide"
          >
            <Menu className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent border-none text-base font-bold focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2 flex-1 min-w-0 text-center"
            placeholder="Title"
          />
          <button
            onClick={openDrawer}
            className="btn btn-sm btn-circle bg-cinema-gold hover:bg-cinema-gold/90 border-none text-base-100"
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
        {lastSaved && (
          <div className="px-3 pb-1 text-center">
            <span className="text-[10px] opacity-70">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================
          MAIN CONTENT AREA
      ======================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <div className={`hidden lg:block bg-base-100 border-r border-base-300 transition-all duration-300 overflow-y-auto ${
          sidebarCollapsed ? 'w-0' : 'w-64'
        }`}>
          {!sidebarCollapsed && (
            <div className="p-4 space-y-4">
              {/* Collapse Button */}
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="btn btn-xs btn-ghost w-full justify-start"
                title="Collapse Sidebar (Ctrl+B)"
              >
                <ChevronLeft className="w-4 h-4" />
                Collapse
              </button>

            {/* Characters */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-cinema-red" />
                  Characters ({characters.length})
                </h3>
                <div className="space-y-1">
                    {characters.slice(0, 8).map((char, idx) => (
                      <div key={idx} className="text-xs py-1 px-2 bg-base-300 rounded truncate">
                      {char}
                    </div>
                  ))}
                  {characters.length === 0 && (
                    <p className="text-xs opacity-50">
                        Will appear as you write
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Locations */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cinema-blue" />
                  Locations ({locations.length})
                </h3>
                <div className="space-y-1">
                    {locations.slice(0, 8).map((loc, idx) => (
                      <div key={idx} className="text-xs py-1 px-2 bg-base-300 rounded truncate">
                      {loc}
                    </div>
                  ))}
                  {locations.length === 0 && (
                    <p className="text-xs opacity-50">
                        Will appear as you write
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Assistant */}
              <div className="card bg-gradient-to-br from-cinema-gold/20 to-cinema-red/20 border border-cinema-gold/30 shadow-sm">
                <div className="card-body p-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cinema-gold" />
                  AI Assistant
                </h3>
                <p className="text-xs opacity-70 mb-2">
                    7 AI modes available
                  </p>
                  <button 
                    onClick={openDrawer}
                    className="btn btn-xs btn-outline gap-1"
                    title="Open AI Assistant (Ctrl+/)"
                  >
                    <Sparkles className="w-3 h-3" />
                  Open Chat
                </button>
              </div>
            </div>

            {/* Fountain Format Guide */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-3">
                  <h3 className="font-bold text-xs">Fountain Format</h3>
                  <div className="text-[10px] space-y-2 opacity-70">
                  <div>
                      <strong>Scene:</strong>
                      <pre className="text-[9px] bg-base-300 p-1 rounded mt-1">INT. LOCATION - DAY</pre>
                  </div>
                  <div>
                    <strong>Character:</strong>
                      <pre className="text-[9px] bg-base-300 p-1 rounded mt-1">CHARACTER NAME</pre>
                  </div>
                  <div>
                    <strong>Dialogue:</strong>
                      <pre className="text-[9px] bg-base-300 p-1 rounded mt-1">Their words</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Expand Sidebar Button (when collapsed) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 btn btn-sm btn-primary rounded-r-lg rounded-l-none shadow-lg z-20"
            style={{ writingMode: 'vertical-rl' }}
            title="Expand Sidebar (Ctrl+B)"
          >
            <ChevronRight className="w-4 h-4" />
            Info
          </button>
        )}

        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
          <div className="flex-1 overflow-hidden p-3 lg:p-6">
            <div className="h-full card bg-base-200 shadow-xl">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                className="h-full w-full textarea textarea-ghost font-mono text-sm p-4 lg:p-6 focus:outline-none resize-none"
                placeholder="Start writing your screenplay in Fountain format...

INT. YOUR LOCATION - DAY

Action description here.

CHARACTER NAME
Dialogue goes here.
"
                  style={{
                    fontFamily: '"Courier Prime", "Courier New", monospace',
                    lineHeight: '1.8',
                  }}
                />
              </div>
            </div>

          {/* Mobile: Tips Bar */}
          <div className="lg:hidden px-3 pb-2">
            <p className="text-[10px] text-center opacity-50">
              Auto-saves every 30s • Tap ≡ for guide • Tap ✨ for AI help
            </p>
          </div>

          {/* Desktop: Tips Bar */}
          <div className="hidden lg:block px-6 pb-4">
            <p className="text-xs opacity-70 text-center">
              <strong>💡 Quick Tips:</strong> 
              <kbd className="kbd kbd-xs mx-1">Ctrl+S</kbd> Save • 
              <kbd className="kbd kbd-xs mx-1">Ctrl+E</kbd> Export • 
              <kbd className="kbd kbd-xs mx-1">Ctrl+/</kbd> AI Assistant • 
              <kbd className="kbd kbd-xs mx-1">Ctrl+B</kbd> Toggle Sidebar
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================
          MOBILE FAB - SAVE & EXPORT
      ======================================================================== */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50 flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-lg flex-1 bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none shadow-2xl"
        >
          {isSaving ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <><Save className="w-5 h-5" /> Save</>
          )}
        </button>
        <button
          onClick={handleExportPDF}
          className="btn btn-lg bg-base-300 hover:bg-base-content hover:text-base-100 border-none shadow-2xl"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* ========================================================================
          MOBILE SIDEBAR BOTTOM SHEET
      ======================================================================== */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-black/50" 
          onClick={() => setShowSidebar(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl shadow-2xl animate-slide-up max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-lg">Screenplay Info</h3>
              <button 
                onClick={() => setShowSidebar(false)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(80vh-5rem)] px-6 py-4 space-y-4">
              {/* Characters */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-cinema-red" />
                    Characters ({characters.length})
                  </h3>
                  <div className="space-y-1 mt-2">
                    {characters.map((char, idx) => (
                      <div key={idx} className="text-sm py-2 px-3 bg-base-300 rounded">
                        {char}
                      </div>
                    ))}
                    {characters.length === 0 && (
                      <p className="text-sm opacity-50">
                        Characters will appear as you write
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cinema-blue" />
                    Locations ({locations.length})
                  </h3>
                  <div className="space-y-1 mt-2">
                    {locations.map((loc, idx) => (
                      <div key={idx} className="text-sm py-2 px-3 bg-base-300 rounded">
                        {loc}
                      </div>
                    ))}
                    {locations.length === 0 && (
                      <p className="text-sm opacity-50">
                        Locations will appear as you write
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fountain Format Guide */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="font-bold">Fountain Format Quick Guide</h3>
                  <div className="text-sm space-y-3 opacity-70 mt-2">
                    <div>
                      <strong>Scene Heading:</strong>
                      <pre className="text-xs bg-base-300 p-2 rounded mt-1">INT. LOCATION - DAY</pre>
                    </div>
                    <div>
                      <strong>Character Name:</strong>
                      <pre className="text-xs bg-base-300 p-2 rounded mt-1">CHARACTER NAME</pre>
                    </div>
                    <div>
                      <strong>Dialogue:</strong>
                      <pre className="text-xs bg-base-300 p-2 rounded mt-1">Character&apos;s words here</pre>
                    </div>
                    <div>
                      <strong>Action/Description:</strong>
                      <pre className="text-xs bg-base-300 p-2 rounded mt-1">Regular text for action</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Safe area padding */}
            <div className="h-safe pb-6"></div>
          </div>
        </div>
      )}

      {/* ========================================================================
          KEYBOARD SHORTCUTS HELP MODAL
      ======================================================================== */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" 
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                <h3 className="font-bold text-lg">Keyboard Shortcuts</h3>
              </div>
              <button 
                onClick={() => setShowKeyboardHelp(false)}
                className="btn btn-circle btn-ghost btn-sm text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(80vh-5rem)]">
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <span>Save screenplay</span>
                <kbd className="kbd kbd-sm">Ctrl+S</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <span>Export to PDF</span>
                <kbd className="kbd kbd-sm">Ctrl+E</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <span>Open AI Assistant</span>
                <kbd className="kbd kbd-sm">Ctrl+/</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <span>Toggle sidebar</span>
                <kbd className="kbd kbd-sm">Ctrl+B</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <span>Show this help</span>
                <kbd className="kbd kbd-sm">Ctrl+?</kbd>
              </div>

              <div className="divider"></div>

              <div className="alert alert-info">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h4 className="font-bold">Pro Tip!</h4>
                  <p className="text-sm">Your screenplay auto-saves every 30 seconds while you write.</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
