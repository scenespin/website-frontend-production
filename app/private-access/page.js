import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";

export default function PrivateAccessPage() {
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
        <section className="py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-3">Private Access</p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
              The live application is currently available through scheduled private demos.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Wryda is presented publicly through curated examples and product context. Access to the full application is handled selectively rather than through open self-serve signup or public login.
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
