import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";
import ContactFormSection from "@/components/help/ContactFormSection";

export const metadata = getSEOTags({
  title: `Contact | ${config.appName}`,
  description: "Contact Wryda.ai – Get in touch for partnerships, press, sales, or product support. We respond within 1–2 business days.",
  canonicalUrlRelative: "/help/contact",
});

export default function ContactPage() {
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
        <div className="flex items-center gap-4">
          <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">
            Help Center
          </Link>
          <Link href="/" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#FFFFFF] mb-4">
            Contact us
          </h1>
          <p className="text-lg text-[#B3B3B3] max-w-2xl mx-auto">
            Choose the form that fits: <strong className="text-[#FFFFFF]">Get in touch</strong> for partnerships, press, and sales, or <strong className="text-[#FFFFFF]">Product support</strong> for help with the app.
          </p>
        </section>

        <ContactFormSection />

        <p className="mt-8 text-center text-sm text-[#6B6B6B]">
          You can also email us at{" "}
          <a href="mailto:support@wryda.ai" className="link text-[#DC143C]">
            support@wryda.ai
          </a>
          . We respond within 1–2 business days (Mon–Fri, 9am–5pm ET).
        </p>
      </main>
    </div>
  );
}
