import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

/**
 * Voice Consent Schema
 * 
 * Stores user consent for voice cloning (biometric data).
 * CRITICAL for BIPA compliance (Illinois Biometric Information Privacy Act).
 * 
 * Key Requirements:
 * - Written consent before collecting voice data
 * - Purpose and duration disclosed
 * - 3-year retention limit
 * - User can revoke anytime
 * - Complete audit trail
 */

const voiceConsentSchema = mongoose.Schema(
  {
    // Link to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Voice Owner Information
    voiceOwnerName: {
      type: String,
      required: true,
      trim: true,
    },
    voiceOwnerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    
    // Consent Agreement
    consentText: {
      type: String,
      required: true,
      // Store full text for legal protection
    },
    consentVersion: {
      type: String,
      required: true,
      default: "v1.0",
      // Track version for policy updates
    },
    
    // Consent Metadata
    agreedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      // Legal requirement: record where consent was given
    },
    userAgent: {
      type: String,
      required: true,
      // Additional legal protection
    },
    digitalSignature: {
      type: String,
      // Future: actual signature image or hash
      default: null,
    },
    
    // Voice Ownership
    isSelf: {
      type: Boolean,
      required: true,
      default: true,
      // true = user's own voice, false = third-party voice
    },
    thirdPartyConsentFileUrl: {
      type: String,
      default: null,
      // S3 URL if cloning someone else's voice
    },
    
    // Consent Status
    revokedAt: {
      type: Date,
      default: null,
      index: true,
      // null = active, date = revoked
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
      // null = exists, date = deleted (soft delete)
    },
    
    // BIPA Requirement: 3-Year Retention Limit
    retentionDeadline: {
      type: Date,
      required: true,
      index: true,
      // Auto-calculated: agreedAt + 3 years
      // Cron job will delete data when this passes
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
  }
);

// Indexes for efficient queries
voiceConsentSchema.index({ userId: 1, revokedAt: 1, deletedAt: 1 });
voiceConsentSchema.index({ retentionDeadline: 1, deletedAt: 1 }); // For cron job
voiceConsentSchema.index({ agreedAt: -1 }); // For recent consents

// Virtual: Is this consent currently active?
voiceConsentSchema.virtual("isActive").get(function () {
  return !this.revokedAt && !this.deletedAt && new Date() < this.retentionDeadline;
});

// Virtual: Days until retention deadline
voiceConsentSchema.virtual("daysUntilExpiration").get(function () {
  const now = new Date();
  const deadline = this.retentionDeadline;
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Pre-save hook: Calculate retention deadline
voiceConsentSchema.pre("save", function (next) {
  // Only set retention deadline on creation
  if (this.isNew && !this.retentionDeadline) {
    const threeYearsInMs = 3 * 365.25 * 24 * 60 * 60 * 1000; // Account for leap years
    this.retentionDeadline = new Date(this.agreedAt.getTime() + threeYearsInMs);
  }
  next();
});

// Static method: Find active consent for user
voiceConsentSchema.statics.findActiveConsent = function (userId) {
  return this.findOne({
    userId,
    revokedAt: null,
    deletedAt: null,
    retentionDeadline: { $gt: new Date() },
  }).sort({ agreedAt: -1 });
};

// Static method: Find expiring consents (for warnings)
voiceConsentSchema.statics.findExpiringConsents = function (daysThreshold) {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
  
  return this.find({
    revokedAt: null,
    deletedAt: null,
    retentionDeadline: {
      $gt: now,
      $lte: thresholdDate,
    },
  }).populate("userId", "email name");
};

// Static method: Find expired consents (for cron deletion)
voiceConsentSchema.statics.findExpiredConsents = function () {
  return this.find({
    deletedAt: null,
    retentionDeadline: { $lte: new Date() },
  });
};

// Instance method: Revoke consent
voiceConsentSchema.methods.revoke = async function () {
  this.revokedAt = new Date();
  return this.save();
};

// Instance method: Mark as deleted
voiceConsentSchema.methods.markDeleted = async function () {
  this.deletedAt = new Date();
  return this.save();
};

// Add toJSON plugin
voiceConsentSchema.plugin(toJSON);

export default mongoose.models.VoiceConsent || 
  mongoose.model("VoiceConsent", voiceConsentSchema);

