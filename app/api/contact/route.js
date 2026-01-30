import { NextResponse } from "next/server";
import { sendContactToSupport, sendContactAutoReply } from "@/libs/emailService";

/**
 * POST /api/contact
 * Accepts either inquiry (public/PR/sales) or support (product support) form submissions.
 * Sends one email to support@wryda.ai and one auto-reply to the submitter (industry standard).
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const type = body.type === "support" ? "support" : "inquiry";

    if (type === "inquiry") {
      const { name, email, company, inquiryType, message } = body;
      if (!email || !message) {
        return NextResponse.json(
          { error: "Email and message are required." },
          { status: 400 }
        );
      }
      const payload = {
        type: "inquiry",
        name: (name || "").trim(),
        email: (email || "").trim().toLowerCase(),
        company: (company || "").trim(),
        inquiryType: inquiryType || "General",
        message: (message || "").trim(),
      };
      const sent = await sendContactToSupport(payload);
      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send your message. Please try again or email support@wryda.ai." },
          { status: 500 }
        );
      }
      await sendContactAutoReply({
        type: "inquiry",
        email: payload.email,
        name: payload.name || undefined,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "support") {
      const { email, subject, category, message } = body;
      if (!email || !message) {
        return NextResponse.json(
          { error: "Email and message are required." },
          { status: 400 }
        );
      }
      const payload = {
        type: "support",
        email: (email || "").trim().toLowerCase(),
        subject: (subject || "").trim(),
        category: category || "General",
        message: (message || "").trim(),
      };
      const sent = await sendContactToSupport(payload);
      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send your message. Please try again or email support@wryda.ai." },
          { status: 500 }
        );
      }
      await sendContactAutoReply({
        type: "support",
        email: payload.email,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  } catch (e) {
    console.error("[Contact API]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email support@wryda.ai." },
      { status: 500 }
    );
  }
}
