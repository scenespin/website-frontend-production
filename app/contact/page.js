import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";

export default function ContactPage() {
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
              <Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm text-white font-medium">
                Contact
              </Link>
            </nav>
            <Link href="/examples" className="md:hidden text-sm text-gray-300 hover:text-white transition-colors">
              Examples
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white">
        <section className="py-16 md:py-20 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-3">Contact</p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
              Request a private demo or start a conversation.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Wryda is currently available through curated examples and scheduled private demos. Reach out if you want a walkthrough, investor conversation, or technical overview.
            </p>
          </div>
        </section>

        <section className="py-16 border-y border-[#1E1E1E]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-2">
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Best ways to reach us</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>Email for demos, investor conversations, and general inquiries.</li>
                <li>Share any context about your interest so we can tailor the response.</li>
                <li>Include availability if you want to schedule a walkthrough.</li>
              </ul>
              <a
                href="mailto:support@wryda.ai?subject=Wryda%20Private%20Demo%20Inquiry"
                className="inline-flex items-center justify-center mt-6 px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
              >
                Email support@wryda.ai
              </a>
            </div>
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">What to expect</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>Curated examples are available immediately on the public site.</li>
                <li>Live application access is arranged selectively rather than self-serve.</li>
                <li>Demo availability depends on the scope of the requested walkthrough.</li>
              </ul>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/examples"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#0A0A0A] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors"
                >
                  View Examples
                </Link>
                <Link
                  href="/private-access"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#0A0A0A] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors"
                >
                  Learn About Access
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
