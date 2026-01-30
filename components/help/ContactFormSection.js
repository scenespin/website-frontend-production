"use client";

import { useState } from "react";
import Link from "next/link";

const INQUIRY_TYPES = [
  { value: "General", label: "General inquiry" },
  { value: "Sales", label: "Sales" },
  { value: "Press", label: "Press / Media" },
  { value: "Partnerships", label: "Partnerships" },
  { value: "Other", label: "Other" },
];

const SUPPORT_CATEGORIES = [
  { value: "Technical", label: "Technical issue" },
  { value: "Account", label: "Account" },
  { value: "Billing", label: "Billing" },
  { value: "How-to", label: "How-to / Question" },
  { value: "Other", label: "Other" },
];

function useSubmit(type) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (payload) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong.");
        return;
      }
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setErrorMessage("Network error. Please try again or email support@wryda.ai.");
    }
  };

  return { status, errorMessage, submit };
}

export function InquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [inquiryType, setInquiryType] = useState("General");
  const [message, setMessage] = useState("");
  const { status, errorMessage, submit } = useSubmit("inquiry");

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ name, email, company, inquiryType, message });
  };

  if (status === "success") {
    return (
      <div className="rounded-xl bg-[#141414] border border-[#DC143C]/30 p-8 text-center">
        <p className="text-xl font-semibold text-[#FFFFFF] mb-2">Thanks for reaching out.</p>
        <p className="text-[#B3B3B3]">
          We&apos;ve received your message and will get back to you within 1–2 business days.
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-[#141414] border border-[#DC143C]/30 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-[#FFFFFF]">Get in touch</h2>
        <p className="text-[#B3B3B3] mt-1">
          Partnerships, press, sales, or general inquiries. We&apos;ll respond within 1–2 business days.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Company (optional)</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="input input-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
            placeholder="Company or organization"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Inquiry type</label>
          <select
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value)}
            className="select select-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
          >
            {INQUIRY_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="textarea textarea-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF] min-h-[120px]"
            placeholder="How can we help?"
            required
          />
        </div>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn bg-[#DC143C] hover:bg-[#8B0000] text-white border-none"
        >
          {status === "loading" ? "Sending…" : "Send message"}
        </button>
      </form>
    </section>
  );
}

export function SupportForm() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("How-to");
  const [message, setMessage] = useState("");
  const { status, errorMessage, submit } = useSubmit("support");

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ email, subject, category, message });
  };

  if (status === "success") {
    return (
      <div className="rounded-xl bg-[#141414] border border-[#00D9FF]/30 p-8 text-center">
        <p className="text-xl font-semibold text-[#FFFFFF] mb-2">We got your request.</p>
        <p className="text-[#B3B3B3]">
          You&apos;ll receive a confirmation email shortly. We&apos;ll respond within 1–2 business days.
          Check the <Link href="/help/faq" className="link text-[#00D9FF]">FAQ</Link> in the meantime.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-[#141414] border border-[#00D9FF]/30 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-[#FFFFFF]">Product support</h2>
        <p className="text-[#B3B3B3] mt-1">
          Need help with the app? Describe your issue and we&apos;ll get back to you. Many answers are in our{" "}
          <Link href="/help/faq" className="link text-[#00D9FF]">FAQ</Link> or <Link href="/help" className="link text-[#00D9FF]">Help Center</Link>.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input input-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
            placeholder="Brief summary of your issue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select select-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF]"
          >
            {SUPPORT_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#B3B3B3] mb-1">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="textarea textarea-bordered w-full bg-[#0A0A0A] border-white/20 text-[#FFFFFF] min-h-[120px]"
            placeholder="Describe your question or issue..."
            required
          />
        </div>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn bg-[#00D9FF] hover:bg-[#00B8E6] text-[#0A0A0A] border-none"
        >
          {status === "loading" ? "Sending…" : "Submit support request"}
        </button>
      </form>
    </section>
  );
}

export default function ContactFormSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <InquiryForm />
      <SupportForm />
    </div>
  );
}
