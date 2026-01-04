import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Writing & Fountain Editor | ${config.appName} Help`,
  description: "Master the professional Fountain format screenplay editor with comprehensive features, keyboard shortcuts, collaboration, and 5 AI writing agents.",
  canonicalUrlRelative: "/help/writing",
});

export default function WritingHelp() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto bg-[#0A0A0A] border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-[#FFFFFF]">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF]">← Back to Help</Link>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-[#FFFFFF]">✍️ Writing & Fountain Editor</h1>
        <p className="text-xl opacity-80 mb-12 text-[#B3B3B3]">
          Master the professional Fountain format screenplay editor with comprehensive features, keyboard shortcuts, collaboration, and 5 AI writing agents.
        </p>

        {/* Table of Contents */}
        <section className="mb-12">
          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <h2 className="text-2xl font-bold mb-4 text-[#DC143C]">Quick Navigation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <a href="#fountain-format" className="text-[#00D9FF] hover:text-[#DC143C]">Fountain Format</a>
                <a href="#keyboard-shortcuts" className="text-[#00D9FF] hover:text-[#DC143C]">Keyboard Shortcuts</a>
                <a href="#auto-formatting" className="text-[#00D9FF] hover:text-[#DC143C]">Auto-Formatting</a>
                <a href="#navigation" className="text-[#00D9FF] hover:text-[#DC143C]">Navigation & Search</a>
                <a href="#collaboration" className="text-[#00D9FF] hover:text-[#DC143C]">Collaboration</a>
                <a href="#saving" className="text-[#00D9FF] hover:text-[#DC143C]">Saving & Version Control</a>
                <a href="#export" className="text-[#00D9FF] hover:text-[#DC143C]">Export Options</a>
                <a href="#ai-agents" className="text-[#00D9FF] hover:text-[#DC143C]">5 AI Writing Agents</a>
              </div>
            </div>
          </div>
        </section>

        {/* Fountain Format */}
        <section id="fountain-format" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Fountain Format</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Wryda.ai uses the industry-standard <strong className="text-[#FFFFFF]">Fountain format</strong>, the same format used by Final Draft, Celtx, and Fade In. 
            Your screenplays are compatible with all major screenwriting software.
          </p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Industry-Standard Format</h3>
              <p className="text-[#B3B3B3] mb-4">
                Fountain is the open, plain-text format for screenwriting. It's used by professional screenwriters worldwide 
                and is compatible with all major screenwriting software including Final Draft, Celtx, Fade In, and Highland.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Why Fountain Matters</h4>
                  <p className="text-sm text-[#B3B3B3]">
                    Fountain format ensures your screenplays are future-proof and portable. Unlike proprietary formats that lock you 
                    into specific software, Fountain files can be opened, edited, and converted by any tool that supports the standard. 
                    This means your work is never trapped in a single application.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Wryda.ai's Fountain Advantage</h4>
                  <p className="text-sm text-[#B3B3B3]">
                    Wryda.ai doesn't just support Fountain—we enhance it. Our editor provides real-time formatting, automatic 
                    character and location tracking, and seamless integration with our Scene Builder technology. Write in the format 
                    you know, then watch as Wryda.ai transforms your screenplay into a complete production with automatic consistency 
                    across characters, locations, and props.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Professional Workflow</h4>
                  <p className="text-sm text-[#B3B3B3]">
                    Write your screenplay in Fountain format, export to PDF or Final Draft (.fdx) for industry submissions, or use 
                    our unique Scene Builder to generate complete video scenes directly from your script. Fountain format ensures 
                    compatibility throughout your entire production pipeline—from writing to pre-visualization to final export.
                  </p>
                </div>

                <div className="p-4 rounded bg-[#0A0A0A] border border-[#DC143C]/30">
                  <p className="text-sm text-[#B3B3B3]">
                    <strong className="text-[#DC143C]">Learn More:</strong> Fountain format is maintained by the screenwriting community 
                    and documented at <a href="https://fountain.io" target="_blank" rel="noopener noreferrer" className="text-[#00D9FF] hover:text-[#DC143C]">fountain.io</a>. 
                    Wryda.ai fully implements the Fountain specification, ensuring your screenplays work everywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section id="keyboard-shortcuts" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Keyboard Shortcuts</h2>
          <p className="mb-6 text-[#B3B3B3]">Master the editor with these powerful keyboard shortcuts.</p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr className="border-white/10">
                      <th className="text-[#DC143C]">Action</th>
                      <th className="text-[#DC143C]">Windows</th>
                      <th className="text-[#DC143C]">Mac</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#B3B3B3]">
                    <tr className="border-white/10">
                      <td>Save</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">S</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">S</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Undo</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Z</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Z</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Redo</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Y</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Shift</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Z</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Find/Replace</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">F</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">F</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Italic (toggle)</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">I</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">I</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Force Character Name</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Tab</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Tab</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Force Scene Heading</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Shift</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Tab</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Shift</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Tab</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Insert Scene Heading Prefix</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Enter</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Enter</kbd></td>
                    </tr>
                    <tr className="border-white/10 text-xs text-[#808080]">
                      <td colSpan="3" className="italic">Inserts new line with "INT. " prefix for quick scene heading creation</td>
                    </tr>
                    <tr className="border-white/10">
                      <td>New Scene (Enter twice)</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Enter</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Enter</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Return</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Return</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Toggle Scene Navigator</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">E</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">E</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Focus Mode</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">F11</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">F11</kbd></td>
                    </tr>
                    <tr className="border-white/10">
                      <td>Export PDF</td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">P</kbd></td>
                      <td><kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘</kbd> + <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">P</kbd></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Auto-Formatting */}
        <section id="auto-formatting" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Auto-Formatting</h2>
          <p className="mb-6 text-[#B3B3B3]">The editor intelligently formats your screenplay as you type.</p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Automatic Element Detection</h3>
              <ul className="space-y-2 text-[#B3B3B3]">
                <li>• <strong className="text-[#FFFFFF]">Scene Headings</strong> - Lines starting with INT., EXT., INT./EXT.</li>
                <li>• <strong className="text-[#FFFFFF]">Character Names</strong> - ALL CAPS lines followed by dialogue</li>
                <li>• <strong className="text-[#FFFFFF]">Transitions</strong> - Lines ending with "TO:"</li>
                <li>• <strong className="text-[#FFFFFF]">Centered Text</strong> - Lines surrounded by `&gt; &lt;`</li>
                <li>• <strong className="text-[#FFFFFF]">Parentheticals</strong> - Lines in parentheses after character names</li>
              </ul>

              <h3 className="font-bold mb-4 mt-6 text-[#DC143C]">Smart Suggestions</h3>
              <ul className="space-y-2 text-[#B3B3B3]">
                <li>• <strong className="text-[#FFFFFF]">Character name completion</strong> - Type first few letters, get suggestions</li>
                <li>• <strong className="text-[#FFFFFF]">Location suggestions</strong> - Based on previously used locations</li>
                <li>• <strong className="text-[#FFFFFF]">Time of day</strong> - Common options: DAY, NIGHT, MORNING, etc.</li>
                <li>• <strong className="text-[#FFFFFF]">@Mention autocomplete</strong> - Reference characters, locations, scenes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section id="navigation" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Navigation & Search</h2>
          
          <div className="space-y-6">
            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Scene Navigator</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  The left sidebar shows all your scenes with character appearances and page counts.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Click any scene</strong> to jump there instantly</li>
                  <li>• <strong className="text-[#FFFFFF]">Drag scenes</strong> to reorder them</li>
                  <li>• <strong className="text-[#FFFFFF]">See character appearances</strong> per scene</li>
                  <li>• <strong className="text-[#FFFFFF]">View page count</strong> per scene</li>
                  <li>• <strong className="text-[#FFFFFF]">Toggle with</strong> <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl+E</kbd> / <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘+E</kbd></li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">@Mentions System</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Quickly reference and navigate using @mentions in your screenplay or AI chat.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">@character</strong> - Jump to character scenes (e.g., @sarah, @john)</li>
                  <li>• <strong className="text-[#FFFFFF]">@location</strong> - Jump to location (e.g., @coffeeshop, @apartment)</li>
                  <li>• <strong className="text-[#FFFFFF]">@scene</strong> - Jump to specific scene (e.g., @scene1, @scene12)</li>
                  <li>• <strong className="text-[#FFFFFF]">Use with AI:</strong> "Analyze @sarah's character arc" or "Generate dialogue for @scene5"</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Search & Find</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Powerful search capabilities throughout your screenplay.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Global Search</strong> (<kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl+F</kbd> / <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘+F</kbd>) - Search entire screenplay</li>
                  <li>• <strong className="text-[#FFFFFF]">Find and Replace</strong> - Replace text throughout</li>
                  <li>• <strong className="text-[#FFFFFF]">Case-sensitive option</strong> - Toggle case matching</li>
                  <li>• <strong className="text-[#FFFFFF]">Regular expressions</strong> - Advanced pattern matching</li>
                  <li>• <strong className="text-[#FFFFFF]">Search by character</strong> - Find all dialogue by specific character</li>
                  <li>• <strong className="text-[#FFFFFF]">Search by location</strong> - Find all scenes in a location</li>
                  <li>• <strong className="text-[#FFFFFF]">Search within scene range</strong> - Limit search to specific scenes</li>
                  <li>• <strong className="text-[#FFFFFF]">Search action vs. dialogue only</strong> - Filter by element type</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Collaboration */}
        <section id="collaboration" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Real-Time Collaboration</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Work together with your team in real-time. See what others are working on, avoid conflicts, and collaborate seamlessly.
          </p>
          
          <div className="space-y-6">
            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Cursor Visibility</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  See where other collaborators are editing in real-time. Each user has a unique colored cursor.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Real-time cursor positions</strong> - See where others are typing</li>
                  <li>• <strong className="text-[#FFFFFF]">User-specific colors</strong> - Each collaborator has a unique color</li>
                  <li>• <strong className="text-[#FFFFFF]">User name badges</strong> - Hover to see who's editing</li>
                  <li>• <strong className="text-[#FFFFFF]">Selection highlighting</strong> - See what text others have selected</li>
                  <li>• <strong className="text-[#FFFFFF]">Automatic conflict avoidance</strong> - Natural workflow prevents editing conflicts</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Sharing & Permissions</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Control who can view, comment, or edit your screenplay.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Read-Only Link</strong> - Share for viewing only</li>
                  <li>• <strong className="text-[#FFFFFF]">Comment Access</strong> - Can add comments but not edit</li>
                  <li>• <strong className="text-[#FFFFFF]">Edit Access</strong> - Full editing rights</li>
                  <li>• <strong className="text-[#FFFFFF]">Invite by Email</strong> - Send invitations directly</li>
                  <li>• <strong className="text-[#FFFFFF]">Role-based permissions</strong> - Director, Script Writer, Asset Contributor, Viewer</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Comments & Notes</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Add comments without changing the script. Collaborate on feedback and suggestions.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF">Select text</strong> and right-click → "Add Comment"</li>
                  <li>• <strong className="text-[#FFFFFF]">@ mention collaborators</strong> in comments</li>
                  <li>• <strong className="text-[#FFFFFF]">Comment types:</strong> General note, Question, Suggestion, Issue, Resolved</li>
                  <li>• <strong className="text-[#FFFFFF]">Notifications</strong> - Collaborators see comments in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Saving & Version Control */}
        <section id="saving" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Saving & Version Control</h2>
          
          <div className="space-y-6">
            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Auto-Save</h3>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Auto-saves every 2 seconds</strong> - Never lose your work</li>
                  <li>• <strong className="text-[#FFFFFF]">Debounced saving</strong> - Efficient, prevents excessive saves</li>
                  <li>• <strong className="text-[#FFFFFF]">Manual save</strong> - <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">Ctrl+S</kbd> / <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">⌘+S</kbd> for immediate save</li>
                  <li>• <strong className="text-[#FFFFFF]">Save status indicator</strong> - See when your work is saved</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Version History</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Every save creates a version snapshot. Access your complete editing history.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Access Version History</strong> - Click "History" in top toolbar</li>
                  <li>• <strong className="text-[#FFFFFF]">Timeline of all saves</strong> - See every version you've created</li>
                  <li>• <strong className="text-[#FFFFFF]">Compare Versions</strong> - Select two versions to see differences</li>
                  <li>• <strong className="text-[#FFFFFF]">Visual diff</strong> - See additions (green) and deletions (red)</li>
                  <li>• <strong className="text-[#FFFFFF]">Restore any previous version</strong> - Revert to any point in time</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">GitHub Integration</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Professional version control with GitHub integration (Pro/Ultra tiers).
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Connect to GitHub</strong> - Link your repository</li>
                  <li>• <strong className="text-[#FFFFFF]">Automatic commits on save</strong> - Every save becomes a commit</li>
                  <li>• <strong className="text-[#FFFFFF]">Branch management</strong> - Create and switch branches</li>
                  <li>• <strong className="text-[#FFFFFF]">Pull requests</strong> - Collaborate via GitHub workflows</li>
                  <li>• <strong className="text-[#FFFFFF]">Full Git history</strong> - Complete version control</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Cloud Backup</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Automatic backups to cloud storage services.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Google Drive</strong> - Automatic backups</li>
                  <li>• <strong className="text-[#FFFFFF]">Dropbox</strong> - Automatic backups</li>
                  <li>• <strong className="text-[#FFFFFF]">Never lose your work</strong> - Multiple backup locations</li>
                  <li>• <strong className="text-[#FFFFFF]">Sync across devices</strong> - Access from anywhere</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Export Options */}
        <section id="export" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Export Options</h2>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3 text-[#DC143C]">PDF Export</h3>
                  <ul className="space-y-2 text-sm text-[#B3B3B3]">
                    <li>• Industry-standard formatting</li>
                    <li>• Courier font, 12pt</li>
                    <li>• Proper margins (1.5" left, 1" others)</li>
                    <li>• Page numbers (top right)</li>
                    <li>• Title page option</li>
                    <li>• Scene numbers option</li>
                    <li>• Watermark option</li>
                    <li>• Draft number/date</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-[#DC143C]">Final Draft (.fdx)</h3>
                  <ul className="space-y-2 text-sm text-[#B3B3B3]">
                    <li>• Preserves all formatting</li>
                    <li>• Scene numbers</li>
                    <li>• Revision colors</li>
                    <li>• Notes and comments</li>
                    <li>• Compatible with Final Draft</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-[#DC143C]">Fountain (.fountain)</h3>
                  <ul className="space-y-2 text-sm text-[#B3B3B3]">
                    <li>• Plain text format</li>
                    <li>• Compatible with other Fountain apps</li>
                    <li>• Easy version control</li>
                    <li>• GitHub-friendly</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-[#DC143C]">Other Formats</h3>
                  <ul className="space-y-2 text-sm text-[#B3B3B3]">
                    <li>• <strong className="text-[#FFFFFF]">HTML</strong> - Web-friendly format</li>
                    <li>• <strong className="text-[#FFFFFF]">Microsoft Word (.docx)</strong> - For editing in Word</li>
                    <li>• <strong className="text-[#FFFFFF]">Plain Text (.txt)</strong> - No formatting</li>
                    <li>• <strong className="text-[#FFFFFF]">JSON</strong> - For custom integrations</li>
                    <li>• <strong className="text-[#FFFFFF]">Print</strong> - Direct printing from browser</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Advanced Features</h2>
          
          <div className="space-y-6">
            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Focus Mode</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Distraction-free writing environment.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• Press <kbd className="kbd kbd-sm bg-[#1F1F1F] text-[#FFFFFF] border-white/10">F11</kbd> or click Focus Mode icon</li>
                  <li>• Hide all sidebars</li>
                  <li>• Typewriter mode (text stays centered)</li>
                  <li>• Word count goals</li>
                  <li>• Timed writing sessions</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Page Goals & Tracking</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Set daily writing goals and track your progress.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Pages per day</strong> - Track page count</li>
                  <li>• <strong className="text-[#FFFFFF]">Scenes per day</strong> - Track scene completion</li>
                  <li>• <strong className="text-[#FFFFFF]">Words per day</strong> - Track word count</li>
                  <li>• <strong className="text-[#FFFFFF]">Time-based</strong> - Write for X minutes</li>
                  <li>• <strong className="text-[#FFFFFF]">View progress in Dashboard</strong> - Weekly summaries</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Templates & Snippets</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  Create reusable snippets for common screenplay elements.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• <strong className="text-[#FFFFFF]">Save a Snippet</strong> - Select text → Right-click → "Save as Snippet"</li>
                  <li>• <strong className="text-[#FFFFFF]">Use a Snippet</strong> - Type `/` to open snippet menu</li>
                  <li>• <strong className="text-[#FFFFFF]">Common Snippets:</strong> /montage, /flashback, /phone, /dream</li>
                </ul>
              </div>
            </div>

            <div className="card bg-[#141414] border border-white/10">
              <div className="card-body">
                <h3 className="font-bold mb-3 text-[#DC143C]">Split Screen</h3>
                <p className="text-sm text-[#B3B3B3] mb-4">
                  View two parts of your script simultaneously.
                </p>
                <ul className="space-y-2 text-sm text-[#B3B3B3]">
                  <li>• Click "Split View" icon</li>
                  <li>• Drag divider to adjust size</li>
                  <li>• Independent scrolling</li>
                  <li>• Copy/paste between views</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* AI Writing Agents */}
        <section id="ai-agents" className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">5 AI Writing Agents</h2>
          <p className="mb-6 text-[#B3B3B3]">
            All agents understand your screenplay context and work together to help you write better scripts.
          </p>

          <div className="space-y-6">
            <AgentCard
              name="Story Advisor"
              icon="🌟"
              unique={true}
              description="Reads your entire screenplay and provides comprehensive analysis"
              features={[
                "Analyzes structure across all acts",
                "Tracks character arcs throughout",
                "Identifies plot holes and inconsistencies",
                "Provides story-level feedback"
              ]}
            />

            <AgentCard
              name="Screenwriter"
              icon="✍️"
              description="Continue scenes, expand dialogue, develop characters"
              features={[
                "Continue scenes from where you left off",
                "Expand dialogue naturally",
                "Develop character backstories",
                "Understands your screenplay context"
              ]}
            />

            <AgentCard
              name="Director"
              icon="🎬"
              description="Generate full scenes with action, dialogue, and direction"
              features={[
                "Generate complete scenes from descriptions",
                "Production-ready formatting",
                "Visual direction and blocking",
                "Character interactions"
              ]}
            />

            <AgentCard
              name="Dialogue"
              icon="💬"
              description="Polish dialogue, match character voice, improve conversations"
              features={[
                "Polish dialogue for naturalness",
                "Match character voice and tone",
                "Improve conversation flow",
                "Character-aware rewriting"
              ]}
            />

            <AgentCard
              name="Rewrite"
              icon="✨"
              description="Polish and refine. Fix pacing, improve clarity, enhance style"
              features={[
                "Fix pacing issues",
                "Improve clarity and readability",
                "Enhance writing style",
                "Professional editing"
              ]}
            />
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Getting Started</h2>
          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <ol className="space-y-4 list-decimal list-inside text-[#B3B3B3]">
                <li>
                  <strong className="text-[#FFFFFF]">Start Writing</strong> - Navigate to the Write section and begin your screenplay
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Use Fountain Format</strong> - Type scene headings, character names, and dialogue naturally
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Ask AI for Help</strong> - Click the AI icon in the toolbar to access any of the 5 writing agents
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Track Characters</strong> - Characters are automatically detected and tracked
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Save & Export</strong> - Your work auto-saves every 2 seconds. Export to PDF or Final Draft format when ready
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Back to Help Center</Link>
          <Link href="/help/production" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">Next: Production →</Link>
        </div>
      </main>
    </>
  );
}

function AgentCard({ name, icon, unique, description, features }) {
  return (
    <div className="card bg-[#141414] border border-[#DC143C]/30">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="card-title text-xl text-[#FFFFFF]">
              {name}
              {unique && <span className="badge bg-[#DC143C] text-[#FFFFFF] border-none badge-sm ml-2">UNIQUE</span>}
            </h3>
            <p className="text-sm text-[#B3B3B3]">{description}</p>
          </div>
        </div>
        <ul className="space-y-1">
          {features.map((feature, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2 text-[#B3B3B3]">
              <span className="text-[#DC143C]">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
