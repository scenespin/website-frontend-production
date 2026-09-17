import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";

export default function AboutPage() {
  return (
    <>
      <header className="bg-[#0A0A0A] border-b border-[#3F3F46] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                width={40}
                height={40}
                className="w-10 h-10"
                priority={true}
              />
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Product
              </Link>
              <Link href="/examples" className="text-sm text-gray-300 hover:text-white transition-colors">
                Examples
              </Link>
              <Link href="/models" className="text-sm text-gray-300 hover:text-white transition-colors">
                Technology
              </Link>
              <Link href="/about" className="text-sm text-white font-medium">
                About
              </Link>
              <Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
            <Link href="/contact" className="md:hidden text-sm text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white">
        <section className="py-16 md:py-20 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-3">About Wryda</p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
              A screenplay-first workflow spanning writing, visual planning, and execution.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl">
              Wryda was built around a simple product idea: keep story context intact as a project moves from screenplay pages into production assets and shot-linked execution.
            </p>
          </div>
        </section>

        <section className="py-16 border-y border-[#1E1E1E]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-2">
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">What the platform demonstrates</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Screenplay-native writing with context-aware AI assistance</li>
                <li>Structured Create, Produce, and Direct workflow continuity</li>
                <li>Story-linked asset generation, organization, and downstream use</li>
                <li>Product thinking across UX, orchestration, and technical architecture</li>
              </ul>
            </div>
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Current presentation mode</h2>
              <p className="text-sm text-gray-300 mb-3">
                Wryda is currently presented through curated examples and private demos rather than open self-serve access.
              </p>
              <p className="text-sm text-gray-400">
                This keeps the public site focused on product context, examples, and investor or portfolio review while preserving the ability to bring the full application back online selectively.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Want to see the product in context?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Review the public examples or request a private walkthrough of the workflow and architecture.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
              >
                Request Demo
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
              >
                View Examples
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
