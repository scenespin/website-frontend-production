'use client';

import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
import { useShowcaseStatus } from "@/hooks/useShowcase";

export default function ExamplesPage() {
  const { data: status, isLoading: statusLoading } = useShowcaseStatus();
  
  return (
    <>
      {/* Header */}
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
              <Link href="/how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/examples" className="text-sm text-white font-medium">
                Examples
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/sign-in" className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
            </nav>
            <Link href="/sign-in" className="md:hidden text-sm text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white min-h-screen">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-[#DC143C]/30 text-sm mb-6">
              <span className="font-semibold text-gray-300">✨ Real AI-Generated Content</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Examples Gallery
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              See what Wryda.ai can create. Every character, location, and prop below was generated using our AI tools.
            </p>
            
            {/* Stats */}
            {status && (
              <div className="flex justify-center gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#DC143C]">{status.contentCounts?.characters || 0}</div>
                  <div className="text-sm text-gray-400">Characters</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">{status.contentCounts?.locations || 0}</div>
                  <div className="text-sm text-gray-400">Locations</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">{status.contentCounts?.props || 0}</div>
                  <div className="text-sm text-gray-400">Props</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Characters Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShowcaseGallery 
              contentType="characters"
              columns={4}
              title="AI-Generated Characters"
              showTitle={true}
            />
          </div>
        </section>

        {/* Locations Section */}
        <section className="py-16 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShowcaseGallery 
              contentType="locations"
              columns={3}
              title="Cinematic Locations"
              showTitle={true}
            />
          </div>
        </section>

        {/* Props Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShowcaseGallery 
              contentType="props"
              columns={4}
              title="Production Props"
              showTitle={true}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-[#0A0A0A] to-[#141414]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Create Your Own?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start with 50 free credits. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
            >
              Start Creating Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
