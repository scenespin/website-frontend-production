import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Run Your First Agent Pass | ${config.appName} Help`,
  description: "Learn how to run your first Dialogue, Rewrite, or Screenwriter pass inside the screenplay editor.",
  canonicalUrlRelative: "/help/advanced/dialogue-generation",
});

export default function DialogueGenerationHelp() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto bg-[#0A0A0A] border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            width={40}
            height={40}
            className="w-10 h-10"
            priority={true}
          />
          <span className="text-2xl font-extrabold text-[#FFFFFF]">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">
          ← Back to Help
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        <h1 className="text-4xl font-extrabold mb-4 text-[#FFFFFF]">⚡ Run Your First Agent Pass</h1>
        <p className="text-xl opacity-80 mb-10 text-[#B3B3B3]">
          Use Dialogue, Rewrite, or Screenwriter additively so your screenplay improves without losing your voice.
        </p>

        <div className="card bg-[#141414] border border-white/10 mb-8">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-3 text-[#DC143C]">Quick Start (2-5 minutes)</h2>
            <ol className="space-y-3 list-decimal list-inside text-[#B3B3B3]">
              <li>Open your screenplay in the editor and highlight a target passage.</li>
              <li>Choose one agent: <strong className="text-[#FFFFFF]">Dialogue</strong>, <strong className="text-[#FFFFFF]">Rewrite</strong>, or <strong className="text-[#FFFFFF]">Screenwriter</strong>.</li>
              <li>Run a focused pass (tone, brevity, clarity, or continuation).</li>
              <li>Review the output and accept only what strengthens your intent.</li>
            </ol>
          </div>
        </div>

        <div className="card bg-[#141414] border border-white/10 mb-8">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-3 text-[#DC143C]">Best Practices</h2>
            <ul className="space-y-2 text-[#B3B3B3]">
              <li>• Work in short sections first, then scale up.</li>
              <li>• Keep one clear instruction per pass (avoid mixed goals).</li>
              <li>• Use additive rewrites to preserve momentum and voice.</li>
              <li>• Compare changes in Version History before locking major revisions.</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/writing" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">
            ← Writing Guide
          </Link>
          <Link href="/help/production" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">
            Next: Production →
          </Link>
        </div>
      </main>
    </div>
  );
}
