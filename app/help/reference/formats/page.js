import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Export Formats Reference | ${config.appName}`,
  description: "Complete guide to all export formats and specifications available in Wryda.ai.",
  canonicalUrlRelative: "/help/reference/formats",
});

export default function FormatsPage() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/help" className="btn btn-ghost btn-sm">← Help Center</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li>Reference</li>
            <li className="font-semibold">Export Formats</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Export Formats Reference 📦</h1>

          <h2>Video Formats</h2>

          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">MP4 (H.264) - Most Common</h3>
              <p className="text-sm mb-4"><strong>Best For:</strong> YouTube, social media, web, general use</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Codec:</strong> H.264</div>
                <div><strong>Container:</strong> MP4</div>
                <div><strong>Max Resolution:</strong> 4K (3840×2160)</div>
                <div><strong>File Size:</strong> Small-Medium</div>
                <div><strong>Quality:</strong> Excellent</div>
                <div><strong>Compatibility:</strong> Universal</div>
              </div>
              <div className="badge badge-success mt-4">Recommended for most uses</div>
            </div>
          </div>

          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">MOV (ProRes) - Professional</h3>
              <p className="text-sm mb-4"><strong>Best For:</strong> Professional editing, client deliverables, archival</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Codec:</strong> Apple ProRes 422 HQ</div>
                <div><strong>Container:</strong> MOV</div>
                <div><strong>Max Resolution:</strong> 4K (3840×2160)</div>
                <div><strong>File Size:</strong> Very Large</div>
                <div><strong>Quality:</strong> Lossless</div>
                <div><strong>Compatibility:</strong> Professional tools</div>
              </div>
              <div className="badge badge-primary mt-4">Studio/Ultra plans only</div>
            </div>
          </div>

          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">WebM - Web Optimized</h3>
              <p className="text-sm mb-4"><strong>Best For:</strong> Web embedding, fast loading</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Codec:</strong> VP9</div>
                <div><strong>Container:</strong> WebM</div>
                <div><strong>Max Resolution:</strong> 4K (3840×2160)</div>
                <div><strong>File Size:</strong> Small</div>
                <div><strong>Quality:</strong> Good</div>
                <div><strong>Compatibility:</strong> Modern browsers</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">GIF - Animated</h3>
              <p className="text-sm mb-4"><strong>Best For:</strong> Short clips, social sharing, memes</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Max Resolution:</strong> 720p</div>
                <div><strong>Max Duration:</strong> 15 seconds</div>
                <div><strong>File Size:</strong> Medium-Large</div>
                <div><strong>Quality:</strong> Limited colors</div>
              </div>
            </div>
          </div>

          <h2>Screenplay Formats</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">PDF</h3>
                <p className="text-sm">Industry-standard format for sharing</p>
                <ul className="text-xs list-disc list-inside mt-2 space-y-1">
                  <li>Locked formatting</li>
                  <li>Universal compatibility</li>
                  <li>Perfect for submissions</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Final Draft (FDX)</h3>
                <p className="text-sm">Import into Final Draft software</p>
                <ul className="text-xs list-disc list-inside mt-2 space-y-1">
                  <li>Professional format</li>
                  <li>All formatting preserved</li>
                  <li>Industry standard</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Microsoft Word (DOC)</h3>
                <p className="text-sm">Editable document format</p>
                <ul className="text-xs list-disc list-inside mt-2 space-y-1">
                  <li>Edit in Word</li>
                  <li>Share with non-screenwriters</li>
                  <li>Flexible layout</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Fountain (TXT)</h3>
                <p className="text-sm">Plain-text screenplay format</p>
                <ul className="text-xs list-disc list-inside mt-2 space-y-1">
                  <li>Version control friendly</li>
                  <li>Universal compatibility</li>
                  <li>Import anywhere</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Quality Presets</h2>

          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>Resolution</th>
                  <th>Bitrate</th>
                  <th>Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Web</strong></td>
                  <td>1080p</td>
                  <td>8 Mbps</td>
                  <td>YouTube, Vimeo, web</td>
                </tr>
                <tr>
                  <td><strong>Social Media</strong></td>
                  <td>1080p</td>
                  <td>10 Mbps</td>
                  <td>Instagram, TikTok, Facebook</td>
                </tr>
                <tr>
                  <td><strong>High Quality</strong></td>
                  <td>4K</td>
                  <td>25 Mbps</td>
                  <td>Client work, archival</td>
                </tr>
                <tr>
                  <td><strong>ProRes 422 HQ</strong></td>
                  <td>4K</td>
                  <td>~220 Mbps</td>
                  <td>Professional editing</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Platform-Specific Recommendations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">YouTube</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li><strong>Format:</strong> MP4 (H.264)</li>
                  <li><strong>Resolution:</strong> 1080p or 4K</li>
                  <li><strong>Aspect Ratio:</strong> 16:9</li>
                  <li><strong>Preset:</strong> Web or High Quality</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">TikTok / Reels</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li><strong>Format:</strong> MP4 (H.264)</li>
                  <li><strong>Resolution:</strong> 1080×1920</li>
                  <li><strong>Aspect Ratio:</strong> 9:16</li>
                  <li><strong>Preset:</strong> Social Media</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Instagram Feed</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li><strong>Format:</strong> MP4 (H.264)</li>
                  <li><strong>Resolution:</strong> 1080×1080</li>
                  <li><strong>Aspect Ratio:</strong> 1:1</li>
                  <li><strong>Preset:</strong> Social Media</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Professional Editing</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li><strong>Format:</strong> MOV (ProRes)</li>
                  <li><strong>Resolution:</strong> 4K</li>
                  <li><strong>Aspect Ratio:</strong> Original</li>
                  <li><strong>Preset:</strong> ProRes 422 HQ</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Match Platform Requirements</h3>
                <p className="text-sm">Always check platform specs before exporting to avoid re-encoding.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Use ProRes for Editing</h3>
                <p className="text-sm">If you need to edit further, export ProRes to avoid quality loss.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Test Exports</h3>
                <p className="text-sm">Export a short test clip before exporting your full project.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Keep Master Copy</h3>
                <p className="text-sm">Always keep a high-quality master for future re-exports.</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/advanced/timeline-mastery" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Timeline Mastery</h3>
                <p className="text-sm">Learn to edit before exporting</p>
              </div>
            </Link>
            <Link href="/help/reference/troubleshooting" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Troubleshooting</h3>
                <p className="text-sm">Fix export issues</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

