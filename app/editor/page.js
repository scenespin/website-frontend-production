'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useDrawer } from '@/contexts/DrawerContext';
import { useContextUpdater, useEditorContext } from '@/lib/contextStore';
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
  Keyboard,
  BookOpen,
  Github,
  Cloud,
  Settings,
  List
} from 'lucide-react';

function EditorContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { openDrawer } = useDrawer();
  
  // Context tracking for cross-page navigation
  const { setProject, setCurrentScene, setActiveCharacter, setCursorPosition } = useContextUpdater();
  const context = useEditorContext();
  const editorRef = useRef(null);

  const [content, setContent] = useState('');
  const [projectName, setProjectName] = useState('Untitled Screenplay');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [locations, setLocations] = useState([]);
  const [scenes, setScenes] = useState([]);
  
  // Mobile/Desktop state
  const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar bottom sheet
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showAIAssistantCard, setShowAIAssistantCard] = useState(true); // Show AI Assistant card initially
  const [showGitHubSetup, setShowGitHubSetup] = useState(false);
  const [showCloudSetup, setShowCloudSetup] = useState(false);
  const [showCollabRoles, setShowCollabRoles] = useState(false);
  
  // Mobile text selection state
  const [selectedText, setSelectedText] = useState('');
  const [showRewriteFAB, setShowRewriteFAB] = useState(false);

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

  // Check if user has dismissed AI Assistant card (localStorage)
  useEffect(() => {
    const dismissed = localStorage.getItem('aiAssistantCardDismissed');
    const openCount = parseInt(localStorage.getItem('editorOpenCount') || '0', 10);
    
    if (dismissed === 'true') {
      setShowAIAssistantCard(false);
    } else if (openCount >= 2) {
      // Auto-hide after 2 visits
      setShowAIAssistantCard(false);
      localStorage.setItem('aiAssistantCardDismissed', 'true');
    } else {
      // Increment open count
      localStorage.setItem('editorOpenCount', String(openCount + 1));
    }
  }, []);

  const loadProject = async () => {
    try {
      const response = await api.screenplay.get(projectId);
      const loadedContent = response.data.content || '';
      const loadedTitle = response.data.title || 'Untitled Screenplay';
      
      setContent(loadedContent);
      setProjectName(loadedTitle);
      
      // Update global context when project loads
      if (projectId && loadedTitle) {
        setProject(projectId, loadedTitle);
      }
      
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

  //  Update context based on cursor position
  const updateCursorContext = (textContent, cursorPos) => {
    if (!textContent || !projectId) return;
    
    // Parse current scene (simple parsing - just find scene headings)
    const lines = textContent.split('\n');
    let currentScene = null;
    let currentSceneId = null;
    let sceneStartPos = 0;
    let currentPos = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLength = line.length + 1;
      
      // Check if this is a scene heading (starts with INT. or EXT.)
      if (/^(INT|EXT|INT\.|EXT\.|INT\.\/EXT|INT\/EXT|I\/E)[\.\s]/i.test(line.trim())) {
        currentScene = line.trim();
        currentSceneId = `scene-${i}`;
        sceneStartPos = i;
      }
      
      // Check if cursor is past this line
      if (currentPos <= cursorPos && cursorPos < currentPos + lineLength) {
        break;
      }
      
      currentPos += lineLength;
    }
    
    // Update context store
    if (currentScene && currentSceneId) {
      setCurrentScene(currentSceneId, currentScene);
    }
    
    // Find characters in current scene (all-caps lines)
    if (sceneStartPos > 0 && characters.length > 0) {
      const sceneLines = lines.slice(sceneStartPos);
      const firstChar = characters.find(char => 
        sceneLines.some(line => line.trim().toUpperCase().startsWith(char.name?.toUpperCase()))
      );
      if (firstChar) {
        setActiveCharacter(firstChar.id || firstChar.name, firstChar.name);
      }
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

  const handleDismissAICard = () => {
    setShowAIAssistantCard(false);
    localStorage.setItem('aiAssistantCardDismissed', 'true');
  };

  // Auto-save every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (content && projectId) {
        handleSave();
      }
    }, 2000);
    
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

  // Parse characters, locations, and scenes from content
  useEffect(() => {
    // Simple parsing - in production, use proper Fountain parser
    const lines = content.split('\n');
    const foundChars = new Set();
    const foundLocs = new Set();
    const foundScenes = [];
    
    lines.forEach((line, index) => {
      // Character names (ALL CAPS followed by dialogue)
      if (/^[A-Z][A-Z\s]+$/.test(line.trim()) && line.trim().length < 30) {
        foundChars.add(line.trim());
      }
      // Scene headings
      if (line.match(/^(INT\.|EXT\.|INT\/EXT|I\/E)/i)) {
        const match = line.match(/^(INT\.|EXT\.|INT\/EXT|I\/E)[\.\s]+(.+?)(\s+-\s+(.+))?$/i);
        if (match) {
          foundLocs.add(match[2].trim());
          foundScenes.push({
            id: `scene-${index}`,
            line: index,
            heading: line.trim(),
            location: match[2].trim(),
            timeOfDay: match[4] || 'DAY',
          });
        }
      }
    });
    
    setCharacters(Array.from(foundChars).slice(0, 10));
    setLocations(Array.from(foundLocs).slice(0, 10));
    setScenes(foundScenes);
  }, [content]);

  // Handle text selection (mobile only)
  useEffect(() => {
    const handleSelectionChange = () => {
      // Only on mobile
      if (window.innerWidth >= 1024) return;
      
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 0) {
        setSelectedText(text);
        setShowRewriteFAB(true);
      } else {
        setShowRewriteFAB(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleRewriteClick = () => {
    // Open drawer in 'precision-editor' mode with selected text
    openDrawer('precision-editor', { selectedText });
    setShowRewriteFAB(false);
  };

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
        
        {/* Secondary Navigation - Quick Links */}
        <div className="bg-base-200/80 backdrop-blur border-t border-base-300">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <a
                href={`/app/beats?projectId=${projectId || ''}`}
                className="btn btn-xs btn-ghost gap-1 text-base-content"
                title="Story Beats - Structure your narrative"
              >
                <BookOpen className="w-4 h-4" />
                Story Beats
              </a>
              <a
                href={`/app/characters?projectId=${projectId || ''}`}
                className="btn btn-xs btn-ghost gap-1 text-base-content"
                title="Characters - Manage cast"
              >
                <Users className="w-4 h-4" />
                Characters
              </a>
              <a
                href={`/app/locations?projectId=${projectId || ''}`}
                className="btn btn-xs btn-ghost gap-1 text-base-content"
                title="Locations - Scene settings"
              >
                <MapPin className="w-4 h-4" />
                Locations
              </a>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowGitHubSetup(true)}
                className="btn btn-xs btn-ghost gap-1 text-base-content"
                title="GitHub Integration"
              >
                <Github className="w-4 h-4" />
                <span className="hidden xl:inline">GitHub</span>
              </button>
              <button
                onClick={() => setShowCloudSetup(true)}
                className="btn btn-xs btn-ghost gap-1 text-base-content"
                title="Cloud Storage"
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden xl:inline">Cloud</span>
              </button>
              <button
                onClick={() => setShowCollabRoles(true)}
                className="btn btn-xs btn-ghost gap-1 text-base-content"
                title="Collaboration & Roles"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden xl:inline">Roles</span>
              </button>
            </div>
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

              {/* Scene Navigator */}
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <List className="w-4 h-4 text-cinema-gold" />
                    Scenes ({scenes.length})
                  </h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {scenes.map((scene, idx) => (
                      <button
                        key={scene.id}
                        onClick={() => {
                          // Jump to scene in editor
                          if (editorRef.current) {
                            const lines = content.split('\n');
                            let position = 0;
                            for (let i = 0; i < scene.line; i++) {
                              position += lines[i].length + 1;
                            }
                            editorRef.current.focus();
                            editorRef.current.setSelectionRange(position, position);
                            editorRef.current.scrollTop = (scene.line / lines.length) * editorRef.current.scrollHeight;
                          }
                          // Update context
                          setCurrentScene(scene.id, scene.heading);
                        }}
                        className={`text-left text-xs py-1.5 px-2 rounded truncate w-full transition-colors ${
                          context.currentSceneId === scene.id
                            ? 'bg-cinema-gold/20 text-cinema-gold font-semibold'
                            : 'bg-base-300 hover:bg-base-100'
                        }`}
                        title={scene.heading}
                      >
                        <div className="font-mono text-[10px] opacity-60">#{idx + 1}</div>
                        <div className="truncate">{scene.heading}</div>
                      </button>
                    ))}
                    {scenes.length === 0 && (
                      <p className="text-xs opacity-50">
                        Start with a scene heading:<br/>
                        <code className="text-[10px]">INT. LOCATION - DAY</code>
                      </p>
                    )}
                  </div>
                </div>
              </div>

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

            {/* AI Assistant - Dismissible onboarding card */}
            {showAIAssistantCard && (
              <div className="card bg-gradient-to-br from-cinema-gold/20 to-cinema-red/20 border border-cinema-gold/30 shadow-sm relative">
                <button 
                  onClick={handleDismissAICard}
                  className="absolute top-2 right-2 btn btn-xs btn-ghost btn-circle"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="card-body p-3 pr-8">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cinema-gold" />
                  AI Writing Agents
                </h3>
                <p className="text-xs opacity-70 mb-2">
                    3 specialized agents to help you write
                  </p>
                  <div className="text-[10px] space-y-1 mb-2 opacity-80">
                    <div>🎬 <strong>Screenwriter:</strong> Brainstorming & story</div>
                    <div>🎭 <strong>Director:</strong> Generate scenes & dialogue</div>
                    <div>✨ <strong>Polish:</strong> Rewrite & improve text</div>
                  </div>
                  <button 
                    onClick={openDrawer}
                    className="btn btn-xs btn-outline gap-1"
                    title="Open AI Assistant (Ctrl+/)"
                  >
                    <Sparkles className="w-3 h-3" />
                  Open AI Chat
                </button>
              </div>
            </div>
            )}

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
                  ref={editorRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    // Update cursor context when content changes
                    if (editorRef.current) {
                      const position = editorRef.current.selectionStart;
                      updateCursorContext(e.target.value, position);
                    }
                  }}
                  onSelect={(e) => {
                    // Track cursor position for context
                    if (editorRef.current) {
                      const position = editorRef.current.selectionStart;
                      updateCursorContext(content, position);
                    }
                  }}
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
              Auto-saves every 2s • Tap ≡ for guide • Tap ✨ for AI help
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
          MOBILE FAB - REWRITE (appears on text selection)
      ======================================================================== */}
      {showRewriteFAB && (
        <div className="lg:hidden fixed bottom-28 right-6 z-50 animate-bounce-in">
          <button
            onClick={handleRewriteClick}
            className="btn btn-lg btn-circle bg-gradient-to-br from-purple-500 to-purple-700 text-white border-none shadow-2xl hover:from-purple-600 hover:to-purple-800"
            title="Rewrite selected text"
          >
            <Sparkles className="w-6 h-6" />
          </button>
        </div>
      )}

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
                  <p className="text-sm">Your screenplay auto-saves every 2 seconds while you write.</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
      
      {/* ========================================================================
          SETUP MODALS - GitHub, Cloud Storage, Collaboration Roles
      ======================================================================== */}
      
      {/* GitHub Integration Modal */}
      {showGitHubSetup && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button 
              onClick={() => setShowGitHubSetup(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              <Github className="w-6 h-6" />
              GitHub Integration
            </h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <div>
                  <h4 className="font-bold">Automatic Version Control</h4>
                  <p className="text-sm">Connect your GitHub account to automatically save screenplay versions and enable collaboration.</p>
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">GitHub Repository</span>
                </label>
                <input 
                  type="text" 
                  placeholder="username/repo-name" 
                  className="input input-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Branch (optional)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="main" 
                  defaultValue="main"
                  className="input input-bordered"
                />
              </div>
              
              <div className="divider">Status</div>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Connection Status:</span>
                  <span className="badge badge-warning">Not Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Sync:</span>
                  <span className="text-xs opacity-60">Never</span>
                </div>
              </div>
              
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowGitHubSetup(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary gap-2">
                  <Github className="w-4 h-4" />
                  Connect GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cloud Storage Modal */}
      {showCloudSetup && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button 
              onClick={() => setShowCloudSetup(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              <Cloud className="w-6 h-6" />
              Cloud Storage
            </h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <div>
                  <h4 className="font-bold">Connect Your Cloud Storage</h4>
                  <p className="text-sm">Store all your generated media (videos, images, audio) in your own Google Drive or Dropbox.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200 shadow">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                        <Cloud className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-bold">Google Drive</h4>
                    </div>
                    <p className="text-xs opacity-70 mb-4">
                      Unlimited storage for generated assets
                    </p>
                    <button className="btn btn-sm btn-primary w-full">
                      Connect Google Drive
                    </button>
                    <div className="badge badge-sm badge-ghost mt-2">Not Connected</div>
                  </div>
                </div>
                
                <div className="card bg-base-200 shadow">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                        <Cloud className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold">Dropbox</h4>
                    </div>
                    <p className="text-xs opacity-70 mb-4">
                      Organize media in structured folders
                    </p>
                    <button className="btn btn-sm btn-outline w-full">
                      Connect Dropbox
                    </button>
                    <div className="badge badge-sm badge-ghost mt-2">Not Connected</div>
                  </div>
                </div>
              </div>
              
              <div className="divider">Folder Structure</div>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="text-xs font-mono space-y-1 opacity-70">
                  <div>📁 Wryda/</div>
                  <div className="ml-4">📁 {projectName || 'My Screenplay'}/</div>
                  <div className="ml-8">📁 videos/</div>
                  <div className="ml-8">📁 images/</div>
                  <div className="ml-8">📁 audio/</div>
                  <div className="ml-8">📄 screenplay.fountain</div>
                </div>
              </div>
              
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowCloudSetup(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Collaboration Roles Modal */}
      {showCollabRoles && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <button 
              onClick={() => setShowCollabRoles(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Collaboration & Roles
            </h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <div>
                  <h4 className="font-bold">Manage Team Access</h4>
                  <p className="text-sm">Control who can view, edit, or manage your screenplay project. Wryda automatically handles GitHub and cloud storage permissions.</p>
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Invite Collaborator</span>
                </label>
                <div className="join w-full">
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    className="input input-bordered join-item flex-1"
                  />
                  <select className="select select-bordered join-item">
                    <option value="director">🎬 Director</option>
                    <option value="writer">✍️ Script Writer</option>
                    <option value="contributor">🎨 Asset Contributor</option>
                    <option value="viewer">👁️ Viewer</option>
                  </select>
                  <button className="btn btn-primary join-item">
                    Invite
                  </button>
                </div>
              </div>
              
              <div className="divider">Role Types</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      🎬 Director
                      <span className="badge badge-xs badge-primary">Full Access</span>
                    </h4>
                    <p className="text-xs opacity-70 mb-2">Project leads, producers, directors</p>
                    <ul className="text-xs space-y-1 opacity-80">
                      <li>✅ GitHub access (admin)</li>
                      <li>✅ Cloud storage (editor)</li>
                      <li>✅ Edit screenplay</li>
                      <li>✅ Manage all assets</li>
                      <li>✅ Use all creative tools</li>
                      <li>✅ Invite/remove team</li>
                    </ul>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      ✍️ Script Writer
                    </h4>
                    <p className="text-xs opacity-70 mb-2">Co-writers, script doctors, story editors</p>
                    <ul className="text-xs space-y-1 opacity-80">
                      <li>✅ GitHub access (write)</li>
                      <li>✅ Cloud storage (editor)</li>
                      <li>✅ Edit screenplay</li>
                      <li>✅ View & use all assets</li>
                      <li>✅ Use all creative tools</li>
                      <li>❌ Cannot manage collaborators</li>
                    </ul>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      🎨 Asset Contributor
                    </h4>
                    <p className="text-xs opacity-70 mb-2">VFX artists, music composers, asset creators</p>
                    <ul className="text-xs space-y-1 opacity-80">
                      <li>❌ No GitHub access</li>
                      <li>✅ Cloud storage (editor)</li>
                      <li>❌ Cannot edit screenplay</li>
                      <li>✅ Manage all assets</li>
                      <li>✅ Use all creative tools</li>
                      <li>❌ Cannot manage collaborators</li>
                    </ul>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      👁️ Viewer
                      <span className="badge badge-xs">Read Only</span>
                    </h4>
                    <p className="text-xs opacity-70 mb-2">Investors, executives, reviewers, clients</p>
                    <ul className="text-xs space-y-1 opacity-80">
                      <li>✅ GitHub access (read)</li>
                      <li>❌ No cloud storage access</li>
                      <li>✅ View screenplay only</li>
                      <li>❌ Cannot edit anything</li>
                      <li>❌ Cannot use tools</li>
                      <li>❌ Cannot manage collaborators</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="divider">Current Team</div>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-10">
                        <span className="text-sm">{user?.firstName?.[0] || 'Y'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{user?.fullName || 'You'}</div>
                      <div className="text-xs opacity-60">{user?.primaryEmailAddress?.emailAddress}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="badge badge-primary gap-1">
                      🎬 Director
                    </div>
                    <div className="text-[10px] opacity-60">Project Owner</div>
                  </div>
                </div>
                
                <div className="text-xs opacity-50 text-center py-4 border-t border-base-300 mt-3">
                  No collaborators yet. Invite team members above.
                </div>
              </div>
              
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowCollabRoles(false)}>
                  Close
                </button>
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
