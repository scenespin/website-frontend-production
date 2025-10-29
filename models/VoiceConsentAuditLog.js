import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

/**
 * Voice Consent Audit Log Schema
 * 
 * Immutable audit trail for all consent-related actions.
 * CRITICAL for legal compliance and dispute resolution.
 * 
 * NEVER delete entries from this collection.
 * This is your legal protection in case of BIPA lawsuits.
 */

const voiceConsentAuditLogSchema = mongoose.Schema(
  {
    // Link to Consent Record
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoiceConsent",
      required: true,
      index: true,
    },
    
    // Action Performed
    action: {
      type: String,
      required: true,
      enum: [
        "created",                    // Consent initially given
        "viewed",                     // Consent agreement viewed
        "downloaded",                 // Consent PDF downloaded
        "revoked",                    // User manually revoked
        "expired_warning_30d",        // 30-day expiration warning sent
        "expired_warning_7d",         // 7-day expiration warning sent
        "auto_deleted_retention",     // Automatically deleted after 3 years
        "admin_revoked",              // Admin manually revoked
        "admin_viewed",               // Admin viewed consent
        "voice_profile_created",      // Voice profile linked to consent
        "voice_profile_deleted",      // Voice profile deleted
      ],
    },
    
    // Who Performed Action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // null for automated actions (cron jobs)
    },
    performedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    
    // Where Action Occurred
    ipAddress: {
      type: String,
      default: null,
      // null for server-side/automated actions
    },
    
    // Additional Context (flexible JSON)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Examples:
      // { reason: "user_requested" }
      // { profilesDeleted: 3 }
      // { warningEmailSent: true }
    },
  },
  {
    timestamps: false, // We use performedAt instead
    toJSON: { virtuals: true },
  }
);

// Indexes for efficient queries
voiceConsentAuditLogSchema.index({ consentId: 1, performedAt: -1 });
voiceConsentAuditLogSchema.index({ action: 1, performedAt: -1 });
voiceConsentAuditLogSchema.index({ performedBy: 1, performedAt: -1 });

// Virtual: Action display name (user-friendly)
voiceConsentAuditLogSchema.virtual("actionDisplay").get(function () {
  const displays = {
    created: "Consent Created",
    viewed: "Consent Viewed",
    downloaded: "Consent Downloaded",
    revoked: "Consent Revoked",
    expired_warning_30d: "30-Day Warning Sent",
    expired_warning_7d: "7-Day Warning Sent",
    auto_deleted_retention: "Auto-Deleted (3-Year Limit)",
    admin_revoked: "Admin Revoked",
    admin_viewed: "Admin Viewed",
    voice_profile_created: "Voice Profile Created",
    voice_profile_deleted: "Voice Profile Deleted",
  };
  return displays[this.action] || this.action;
});

// Static method: Log an action
voiceConsentAuditLogSchema.statics.logAction = async function (data) {
  return this.create({
    consentId: data.consentId,
    action: data.action,
    performedBy: data.performedBy || null,
    performedAt: data.performedAt || new Date(),
    ipAddress: data.ipAddress || null,
    details: data.details || {},
  });
};

// Static method: Get audit trail for consent
voiceConsentAuditLogSchema.statics.getTrailForConsent = function (consentId) {
  return this.find({ consentId })
    .populate("performedBy", "name email")
    .sort({ performedAt: -1 });
};

// Static method: Get recent actions (admin dashboard)
voiceConsentAuditLogSchema.statics.getRecentActions = function (limit = 100) {
  return this.find()
    .populate("consentId", "voiceOwnerName voiceOwnerEmail")
    .populate("performedBy", "name email")
    .sort({ performedAt: -1 })
    .limit(limit);
};

// Prevent modification after creation (immutable)
voiceConsentAuditLogSchema.pre("save", function (next) {
  if (!this.isNew) {
    const error = new Error("Audit log entries are immutable and cannot be modified");
    error.name = "ImmutableAuditLogError";
    return next(error);
  }
  next();
});

// Prevent deletion (override default)
voiceConsentAuditLogSchema.pre("remove", function (next) {
  const error = new Error("Audit log entries cannot be deleted");
  error.name = "UndeletableAuditLogError";
  next(error);
});

// Add toJSON plugin
voiceConsentAuditLogSchema.plugin(toJSON);

export default mongoose.models.VoiceConsentAuditLog || 
  mongoose.model("VoiceConsentAuditLog", voiceConsentAuditLogSchema);

