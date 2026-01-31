import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Unsubscribe | ${config.appName}`,
  description: "Manage your Wryda.ai newsletter and onboarding email preferences.",
  canonicalUrlRelative: "/unsubscribe",
});

export default async function UnsubscribePage({ searchParams }) {
  const params = typeof searchParams?.then === "function" ? await searchParams : searchParams || {};
  const done = params.done === "1";
  const error = params.error;

  let title = "Newsletter preferences";
  let message =
    "Use the unsubscribe link at the bottom of any email from us to stop receiving messages. If you already unsubscribed, you're all set.";

  if (done) {
    title = "You're unsubscribed";
    message =
      "You've been removed from our newsletter and onboarding emails. You won't receive any more messages from us. If you change your mind, you can sign up again from our site.";
  } else if (error === "missing") {
    title = "Link incomplete";
    message = "The unsubscribe link is missing your email or token. Please use the full link from the email.";
  } else if (error === "invalid") {
    title = "Invalid or expired link";
    message = "This unsubscribe link is invalid or has expired. Please use the most recent link from one of our emails.";
  } else if (error === "notfound") {
    title = "Not found";
    message = "We couldn't find a subscription for that email. You may already be unsubscribed.";
  } else if (error === "server") {
    title = "Something went wrong";
    message = "We couldn't process your request. Please try again later or contact support@wryda.ai.";
  }

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
            {config.appName}
            <span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/help"
            className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10"
          >
            Help Center
          </Link>
          <Link
            href="/"
            className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <section className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFFFFF] mb-4">
            {title}
          </h1>
          <p className="text-lg text-[#B3B3B3] leading-relaxed">{message}</p>
          <p className="mt-8">
            <Link
              href="/"
              className="btn btn-primary bg-[#DC143C] hover:bg-[#B8112F] text-white border-0"
            >
              Back to Home
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
