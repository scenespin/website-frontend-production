import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Team Collaboration Guide | ${config.appName}`,
  description: "Learn how GitHub and cloud storage collaboration works on Wryda.ai. Understand roles, permissions, and real-time sync for screenwriting teams.",
  canonicalUrlRelative: "/help/collaboration",
});

export default function CollaborationHelpPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-base-200">
        <div className="max-w-4xl mx-auto p-8">
          <Link href="/help" className="btn btn-ghost btn-sm mb-4">
            ← Back to Help
          </Link>
          <h1 className="text-4xl font-bold mb-4">🤝 Team Collaboration</h1>
          <p className="text-lg opacity-80">
            Work together on screenplays with GitHub version control and cloud storage sharing. No GitHub expertise needed - we streamlined it for writers.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <article className="prose prose-lg max-w-4xl mx-auto p-8">
        <div className="alert alert-success my-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <div className="font-bold">✨ Streamlined for Writers</div>
            <div className="text-sm">We handle all the GitHub complexity behind the scenes. Invite collaborators, assign roles, and start writing together - no terminal commands required.</div>
          </div>
        </div>

        <h2>How It Works (Automatic Setup)</h2>
        <p>When you invite a collaborator to your project:</p>
        <ol>
          <li>They&apos;re automatically invited to your GitHub repository</li>
          <li>They&apos;re granted access to the project&apos;s cloud storage folder (Google Drive or Dropbox)</li>
          <li>Their permissions are set based on their role</li>
          <li>All changes sync in real-time via GitHub</li>
        </ol>

        <div className="alert alert-info my-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <div className="font-bold">Your Data, Your Control</div>
            <div className="text-sm">All screenplay content and assets are stored in YOUR GitHub repository and YOUR cloud storage. No vendor lock-in. You own it forever.</div>
          </div>
        </div>

        <h2>📋 Collaboration Roles & Permissions</h2>
        <p>We offer 4 role-based permission levels to match your team structure:</p>

        {/* Director */}
        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 mb-6">
          <div className="card-body">
            <h3 className="text-2xl font-bold text-purple-400 flex items-center gap-2 mt-0">
              <span>👑</span> Director (Full Control)
            </h3>
            <p className="text-sm opacity-90">
              Project owner or co-director. Can do everything including deleting the project.
            </p>
            
            <h4 className="font-semibold text-base mt-4 mb-2">GitHub Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Admin</strong> access to repository</li>
              <li>✅ Push, pull, merge, create branches</li>
              <li>✅ Manage repository settings</li>
              <li>✅ Add/remove collaborators</li>
              <li>✅ Delete repository</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Cloud Storage Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Owner/Editor</strong> access</li>
              <li>✅ Read, write, delete all files</li>
              <li>✅ Upload/download assets</li>
              <li>✅ Organize folder structure</li>
              <li>✅ Share with others</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Screenplay Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ Full edit access to all scenes</li>
              <li>✅ Create/delete characters, locations, beats</li>
              <li>✅ Manage project settings</li>
              <li>✅ Generate all AI content (video, images, characters, assets)</li>
              <li>✅ Use AI writing agents (Screenwriter, Director, Polish)</li>
            </ul>
          </div>
        </div>

        {/* Script Writer */}
        <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 mb-6">
          <div className="card-body">
            <h3 className="text-2xl font-bold text-blue-400 flex items-center gap-2 mt-0">
              <span>✍️</span> Script Writer (Edit Screenplay)
            </h3>
            <p className="text-sm opacity-90">
              Full access to write and edit the screenplay. Can use AI writing agents but cannot generate production content (video/images/characters). Cannot delete the project or manage team.
            </p>
            
            <h4 className="font-semibold text-base mt-4 mb-2">GitHub Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Write</strong> access to repository</li>
              <li>✅ Push, pull, create branches</li>
              <li>✅ Commit changes</li>
              <li>❌ Cannot manage settings or collaborators</li>
              <li>❌ Cannot delete repository</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Cloud Storage Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Editor</strong> access</li>
              <li>✅ Read and write screenplay files</li>
              <li>✅ Upload script-related assets</li>
              <li>✅ Download reference materials</li>
              <li>❌ Cannot delete project files or share</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Screenplay Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ Edit all scenes, dialogue, action lines</li>
              <li>✅ Create/edit characters, locations, beats</li>
              <li>✅ Use AI writing agents (Screenwriter, Director, Polish)</li>
              <li>❌ Cannot generate production content (video/images/character banks)</li>
              <li>❌ Cannot delete project or manage team</li>
            </ul>
          </div>
        </div>

        {/* Asset Manager - NEW! */}
        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 mb-6">
          <div className="card-body">
            <h3 className="text-2xl font-bold text-purple-400 flex items-center gap-2 mt-0">
              <span>🎬</span> Asset Manager (Generate & Manage Assets)
            </h3>
            <p className="text-sm opacity-90">
              Specialized role for VFX artists, production designers, and asset coordinators. Can generate all AI assets (characters, locations, props, 3D models) but cannot edit screenplay or generate video.
            </p>
            
            <h4 className="font-semibold text-base mt-4 mb-2">GitHub Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Write</strong> access to repository</li>
              <li>✅ Push asset files and references</li>
              <li>✅ Commit asset changes</li>
              <li>✅ View screenplay (read-only)</li>
              <li>❌ Cannot modify screenplay text</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Cloud Storage Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Editor</strong> access to asset folders</li>
              <li>✅ Upload/download all asset types</li>
              <li>✅ Organize asset library structure</li>
              <li>✅ Manage character banks, locations, props</li>
              <li>❌ Cannot modify screenplay files</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Screenplay Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ Generate character banks & pose packages</li>
              <li>✅ Generate location references</li>
              <li>✅ Generate props with Asset Bank</li>
              <li>✅ Export 3D models (characters, locations, props)</li>
              <li>✅ Access Production page & tools</li>
              <li>✅ View screenplay (read-only for context)</li>
              <li>❌ Cannot edit screenplay or timeline</li>
              <li>❌ Cannot generate video content</li>
              <li>❌ Cannot delete project or manage team</li>
            </ul>
          </div>
        </div>

        {/* Asset Contributor */}
        <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 mb-6">
          <div className="card-body">
            <h3 className="text-2xl font-bold text-green-400 flex items-center gap-2 mt-0">
              <span>🎨</span> Asset Contributor (Upload Assets)
            </h3>
            <p className="text-sm opacity-90">
              Can upload images, videos, audio, and reference materials. Cannot edit the screenplay text.
            </p>
            
            <h4 className="font-semibold text-base mt-4 mb-2">GitHub Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Read</strong> access to repository</li>
              <li>✅ Clone and pull changes</li>
              <li>✅ View screenplay (read-only)</li>
              <li>❌ Cannot push commits</li>
              <li>❌ Cannot modify screenplay</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Cloud Storage Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Contributor</strong> access</li>
              <li>✅ Upload images, videos, audio</li>
              <li>✅ Add reference materials</li>
              <li>✅ Download existing assets</li>
              <li>❌ Cannot delete or modify screenplay files</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Screenplay Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ View screenplay (read-only)</li>
              <li>✅ Upload character reference images</li>
              <li>✅ Upload location photos</li>
              <li>❌ Cannot edit screenplay text</li>
              <li>❌ Cannot generate AI content</li>
            </ul>
          </div>
        </div>

        {/* Viewer */}
        <div className="card bg-gradient-to-br from-base-content/50/10 to-base-content/40/10 border-2 border-base-content/50/30 mb-6">
          <div className="card-body">
            <h3 className="text-2xl font-bold text-base-content/60 flex items-center gap-2 mt-0">
              <span>👁️</span> Viewer (Read-Only)
            </h3>
            <p className="text-sm opacity-90">
              Read-only access for stakeholders, producers, or investors. Can view everything but cannot make changes.
            </p>
            
            <h4 className="font-semibold text-base mt-4 mb-2">GitHub Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Read</strong> access to repository</li>
              <li>✅ Clone and pull to view locally</li>
              <li>✅ View all commits and history</li>
              <li>❌ Cannot push or modify</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Cloud Storage Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ <strong>Viewer</strong> access</li>
              <li>✅ View and download all files</li>
              <li>✅ Download screenplay PDF exports</li>
              <li>❌ Cannot upload or modify anything</li>
            </ul>

            <h4 className="font-semibold text-base mt-4 mb-2">Screenplay Permissions:</h4>
            <ul className="text-sm space-y-1 mb-0">
              <li>✅ View screenplay (read-only)</li>
              <li>✅ Export to PDF</li>
              <li>✅ View production assets</li>
              <li>❌ No editing access whatsoever</li>
            </ul>
          </div>
        </div>

        <h2>🔄 How Real-Time Sync Works</h2>
        <ol>
          <li><strong>Someone saves changes</strong> - Edits to the screenplay are auto-saved locally</li>
          <li><strong>Auto-commit to GitHub</strong> - Changes are committed to your GitHub repo (configurable interval)</li>
          <li><strong>Team gets notified</strong> - Collaborators see the update indicator</li>
          <li><strong>They pull changes</strong> - One click to sync the latest version</li>
          <li><strong>Conflict resolution</strong> - If two people edit the same scene, GitHub merge tools handle it</li>
        </ol>

        <div className="alert alert-warning my-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <div className="font-bold">⚠️ Best Practice: Pull Before You Edit</div>
            <div className="text-sm">Always pull the latest changes before starting a new writing session. This prevents merge conflicts and ensures you&apos;re working with the most recent version.</div>
          </div>
        </div>

        <h2>💡 Common Collaboration Workflows</h2>

        <h3>Workflow 1: Writing Team (2-3 Writers)</h3>
        <ul>
          <li><strong>Owner:</strong> Director role (manages team)</li>
          <li><strong>Co-writers:</strong> Script Writer role (edit screenplay)</li>
          <li><strong>Process:</strong> Assign scenes, write independently, sync via GitHub</li>
        </ul>

        <h3>Workflow 2: Full Production Team</h3>
        <ul>
          <li><strong>Director:</strong> Director role (full control)</li>
          <li><strong>Writer:</strong> Script Writer role (screenplay edits)</li>
          <li><strong>Production Designer:</strong> Asset Contributor role (upload locations, set designs)</li>
          <li><strong>Producer/Investor:</strong> Viewer role (review progress)</li>
        </ul>

        <h3>Workflow 3: Writer + Virtual Assistant</h3>
        <ul>
          <li><strong>Writer:</strong> Director role (you)</li>
          <li><strong>VA:</strong> Asset Contributor role (uploads research, reference images)</li>
          <li><strong>Process:</strong> VA uploads materials, you write with full context</li>
        </ul>

        <h2>🔒 Security & Privacy</h2>
        <ul>
          <li>✅ All data stored in YOUR GitHub repo (private by default)</li>
          <li>✅ Cloud storage uses your own Drive/Dropbox account</li>
          <li>✅ We NEVER have access to your screenplay content</li>
          <li>✅ Remove collaborators anytime - their access is immediately revoked</li>
          <li>✅ Full version history via GitHub - never lose work</li>
        </ul>

        <h2>🚀 Getting Started</h2>
        <ol>
          <li>Create a project and connect GitHub + Cloud Storage</li>
          <li>Go to the <strong>Team page</strong> from your project settings</li>
          <li>Click "Add Collaborator"</li>
          <li>Enter their email and select a role</li>
          <li>They&apos;ll receive an invitation email with instructions</li>
        </ol>

        <div className="alert alert-success my-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <div className="font-bold">✅ Already have a project?</div>
            <div className="text-sm">
              <Link href="/team" className="link font-semibold">Go to Team Management →</Link> (requires active project)
            </div>
          </div>
        </div>

        <div className="alert my-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <div className="font-bold">Need Help?</div>
            <div className="text-sm">
              <Link href="/help/github-setup" className="link">GitHub Setup Guide</Link> · 
              <Link href="/help/cloud-storage" className="link"> Cloud Storage Setup</Link> · 
              <Link href="/help" className="link"> All Help Articles</Link>
            </div>
          </div>
        </div>

        <div className="text-center my-12">
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start Collaborating Free →
          </Link>
        </div>
      </article>
    </>
  );
}

