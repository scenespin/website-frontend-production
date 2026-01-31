import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

/**
 * NewsletterSubscriber – single source of truth for newsletter and onboarding drip.
 * Used by: POST /api/newsletter/subscribe, cron onboarding-drip, GET /api/unsubscribe.
 * Plan: docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md §2.1
 *
 * Additive only: new collection. Does not modify Lead or User.
 */
const newsletterSubscriberSchema = mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    user_id: {
      type: String,
      default: null,
      comment: "Clerk user ID when they have an account; null = newsletter-only",
    },
    source: {
      type: String,
      enum: ["lead_form", "signup", "contact", "manual"],
      required: true,
    },
    onboarding_enrolled_at: {
      type: Date,
      default: null,
      comment: "null = not in onboarding course",
    },
    onboarding_step: {
      type: Number,
      default: 0,
      min: 0,
      max: 6,
      comment: "0 = not started, 1–6 = last sent step, 6 = completed",
    },
    onboarding_next_send_at: {
      type: Date,
      default: null,
      comment: "When to send next drip email",
    },
    unsubscribed_at: {
      type: Date,
      default: null,
      comment: "null = subscribed",
    },
    bounced_at: {
      type: Date,
      default: null,
      comment: "Set via Resend webhook; exclude from all sends",
    },
    complaint_at: {
      type: Date,
      default: null,
      comment: "Set via Resend webhook; exclude from all sends",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

newsletterSubscriberSchema.index({ email: 1 }, { unique: true });
newsletterSubscriberSchema.index({ user_id: 1 });
newsletterSubscriberSchema.index({ onboarding_next_send_at: 1, onboarding_step: 1 });

newsletterSubscriberSchema.plugin(toJSON);

export default mongoose.models.NewsletterSubscriber ||
  mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
