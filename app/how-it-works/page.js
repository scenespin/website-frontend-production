import Link from 'next/link';
import { getSEOTags } from '@/libs/seo';
import config from '@/config';

export const metadata = getSEOTags({
  title: `How It Works | ${config.appName}`,
  description: "Learn how to create, produce, and direct your content with Wryda.ai. From script import to final video production.",
  canonicalUrlRelative: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <>
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#3F3F46] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
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
              <Link href="/compare" className="text-sm text-gray-300 hover:text-white transition-colors">
                Compare
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/help" className="text-sm text-gray-300 hover:text-white transition-colors">
                Help
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
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 px-4">
              How It Works
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-6 md:mb-8 px-4">
              From idea to screen in three simple steps. Whether you're a seasoned professional or just getting started, Wryda.ai makes video production accessible to everyone.
            </p>
          </div>
        </section>

        {/* Three-Step Process */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 md:gap-16">
              {/* Step 1: CREATE */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      Create
                    </h2>
                    <span className="text-sm font-semibold text-gray-400 bg-[#141414] px-3 py-1 rounded-full">
                      Step 1
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Start with your vision. In the Create section, you build the foundation of your project—your script, characters, locations, and props. Upload reference images to establish your visual style, then write your script directly or let our AI agents help you get started.
                  </p>
                  
                  {/* Import & Smart Detection Section */}
                  <div className="mt-6 p-6 bg-[#141414] border border-[#3F3F46] rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-[#DC143C]">Import & Smart Detection</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Import Your Existing Script</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          When you import a Fountain script, the system automatically extracts all characters from dialogue and character cues, identifies all locations from scene headings (INT./EXT.), and creates character and location cards ready to use—saving you hours of manual entry.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Rescan After Changes</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          After editing your script, click "Re-scan Script" in the editor toolbar. The system detects new characters and locations you've added, automatically adds them to your project, and updates existing scenes with their new positions. Perfect for when you add a new character in Act 2 or introduce a new location mid-story.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Create Characters & Locations Outside the Script</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          You can create characters and locations before they appear in your script. They'll appear with a "Not in Script" label, perfect for planning or reference. When you're ready, write them into your screenplay and rescan—the system automatically links your manually created character or location to the script, removes the "Not in Script" label, and makes them active and linked to scenes.
                        </p>
                        <p className="text-sm text-gray-400 mt-2 italic">
                          Works for both characters and locations—create "DETECTIVE JONES" or "ABANDONED WAREHOUSE" as reference cards, then add them to your script later and rescan to activate them.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Upload reference images</p>
                        <p className="text-sm text-gray-400">Add images for characters, locations, and props to establish your visual foundation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Write your script</p>
                        <p className="text-sm text-gray-400">Use our screenplay editor to write directly, or start with just an idea</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Get AI assistance</p>
                        <p className="text-sm text-gray-400">Don't have a script? Use Story Advisor to generate your first scene from an idea, then refine it with our other AI agents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="hidden md:flex justify-center -my-8">
                <div className="w-px h-12 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
              </div>

              {/* Step 2: PRODUCE */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      Produce
                    </h2>
                    <span className="text-sm font-semibold text-gray-400 bg-[#141414] px-3 py-1 rounded-full">
                      Step 2
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Transform your creation assets into production-ready elements. The Production Hub takes your uploaded images and generates AI assets in multiple variations, angles, and styles—giving you everything you need for your scenes.
                  </p>
                  
                  {/* Transform Your Creation Assets Section */}
                  <div className="mt-6 p-6 bg-[#141414] border border-[#3F3F46] rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-[#DC143C]">Transform Your Creation Assets</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Your Uploaded Images Become AI References</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          The images you upload in the Create section—characters, locations, and props—become the foundation for all AI generation in Production. Open any character, location, or prop in the Production Hub to generate variations, angles, and styles based on your original references.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Character Generation & Custom Wardrobe</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          In the Character Bank, generate your characters in different positions, expressions, and poses. Want complete control? Upload your own outfit images—real photos, costumes, or wardrobe pieces. You can literally put yourself or real actors into your scenes with custom clothing, giving you complete control over wardrobe without relying on AI-generated outfits. Perfect for maintaining brand consistency or using specific costumes.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Location Angle Packages & Backgrounds</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          For locations, generate multiple angle packages from your uploaded reference images. Create wide shots, close-ups, different camera positions, and various backgrounds—all based on your original location photos. Each angle package includes background variations for different times of day, weather conditions, or lighting scenarios, giving you a complete location library for any scene.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Props from Multiple Angles</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Transform your initial creation images into props viewed from different angles. Generate front, side, top, and detail views—ready to use in any scene from any camera position.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Character variations</p>
                        <p className="text-sm text-gray-400">Generate characters in different positions, outfits, or morph them into subhuman, supernatural, or any style you imagine</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Location angle packages</p>
                        <p className="text-sm text-gray-400">Create different angle packages and backgrounds from your uploaded location images for use within your scenes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Props from multiple angles</p>
                        <p className="text-sm text-gray-400">Transform your initial creation images into props viewed from different angles, ready to use in any scene</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Export anywhere</p>
                        <p className="text-sm text-gray-400">All assets are downloadable and work in any platform—use them in Scene Builder or export to your preferred tools</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="hidden md:flex justify-center -my-8">
                <div className="w-px h-12 bg-gradient-to-b from-purple-500 to-pink-600"></div>
              </div>

              {/* Step 3: DIRECT */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      Direct
                    </h2>
                    <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30">
                      Beta
                    </span>
                    <span className="text-sm font-semibold text-gray-400 bg-[#141414] px-3 py-1 rounded-full">
                      Step 3
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Assemble your scenes with our algorithmic Motion Picture technology. Scene Builder uses your Production Hub assets to automatically compose shots based on your scenes, bringing everything together into a cohesive video.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Scene Builder</p>
                        <p className="text-sm text-gray-400">Use our motion picture technology to automatically assemble shots based on your scenes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Algorithmic composition</p>
                        <p className="text-sm text-gray-400">Our technology intelligently arranges your Production Hub assets into professional scenes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Your assets, your choice</p>
                        <p className="text-sm text-gray-400">Even if you don't use Scene Builder, all your Production Hub assets are valuable and work in any solution you prefer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Join creators who are already bringing their ideas to life with Wryda.ai
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
              >
                Get Started
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
