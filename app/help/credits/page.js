import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Credits Guide | ${config.appName} Help`,
  description: "Understand what is free, what uses credits, and how to scale usage in Wryda.",
  canonicalUrlRelative: "/help/credits",
});

export default function CreditsHelp() {
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
        <h1 className="text-4xl font-extrabold mb-4 text-[#FFFFFF]">💳 Credits Guide</h1>
        <p className="text-xl opacity-80 mb-10 text-[#B3B3B3]">
          Start free, then scale credits only when you run generation workflows.
        </p>

        <div className="card bg-[#141414] border border-white/10 mb-8">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-3 text-[#DC143C]">What is Free</h2>
            <ul className="space-y-2 text-[#B3B3B3]">
              <li>• Professional screenplay editor (Fountain format)</li>
              <li>• AI writing workflow access (run passes when available in your plan)</li>
              <li>• GitHub-backed screenplay saving and version history</li>
              <li>• Character, location, and prop banks</li>
            </ul>
          </div>
        </div>

        <div className="card bg-[#141414] border border-white/10 mb-8">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-3 text-[#DC143C]">What Uses Credits</h2>
            <ul className="space-y-2 text-[#B3B3B3]">
              <li>• Image and video generation workflows</li>
              <li>• High-cost media generation variants and exports</li>
              <li>• Production-stage generation actions where usage is explicitly shown</li>
            </ul>
            <p className="text-sm text-[#B3B3B3] mt-4">
              You only pay for generation volume, not baseline access to the platform.
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/production" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">
            ← Production
          </Link>
          <Link href="/pricing" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">
            See Pricing →
          </Link>
        </div>
      </main>
    </div>
  );
}
