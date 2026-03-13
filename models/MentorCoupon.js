// models/MentorCoupon.js
// Discount coupons created by mentors — applicable to all or specific services
// Supports URL-based auto-apply (like Topmate's ?coupon_code=giveaway15)

const mongoose = require('mongoose');

// Stores each individual redemption for audit purposes
const RedemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorService',
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorBooking',
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  finalPrice: {
    type: Number,
    required: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
});

const MentorCouponSchema = new mongoose.Schema(
  {
    // Mentor who created this coupon
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ─── Coupon Code ──────────────────────────────────────────────────────────
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // stored uppercase; validated case-insensitively
      maxlength: 30,
    },

    // ─── Discount Configuration ───────────────────────────────────────────────
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },

    // If percentage: 1–100 (e.g. 15 = 15% off)
    // If flat: amount in INR (e.g. 200 = ₹200 off)
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Maximum discount cap when discountType = 'percentage'
    // e.g. max ₹500 off even if percentage would give more
    maxDiscountCap: {
      type: Number,
      default: null,
    },

    // ─── Scope ────────────────────────────────────────────────────────────────
    appliesTo: {
      type: String,
      enum: ['all_services', 'specific_services'],
      default: 'all_services',
    },

    // Only populated when appliesTo = 'specific_services'
    specificServiceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorService',
      },
    ],

    // ─── Usage Limits ─────────────────────────────────────────────────────────
    maxUses: {
      type: Number,
      default: null, // null = unlimited
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    // Max times a single user can use this coupon
    perUserLimit: {
      type: Number,
      default: 1,
    },

    // ─── Validity ─────────────────────────────────────────────────────────────
    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      default: null, // null = no expiry
    },

    // ─── Status ───────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ─── Audit Trail ──────────────────────────────────────────────────────────
    redemptions: [RedemptionSchema],
  },
  {
    timestamps: true,
  }
);

// ─── Compound unique index: one coupon code per mentor ───────────────────────
MentorCouponSchema.index({ mentorId: 1, code: 1 }, { unique: true });
MentorCouponSchema.index({ code: 1 });
MentorCouponSchema.index({ mentorId: 1, isActive: 1 });

// ─── Instance method: Check if coupon is currently valid ─────────────────────
MentorCouponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (this.validFrom && now < this.validFrom) return { valid: false, reason: 'Coupon not yet active' };
  if (this.validUntil && now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
  if (this.maxUses !== null && this.usedCount >= this.maxUses)
    return { valid: false, reason: 'Coupon usage limit reached' };
  return { valid: true };
};

// ─── Instance method: Check per-user usage count ─────────────────────────────
MentorCouponSchema.methods.getUserUseCount = function (userId) {
  return this.redemptions.filter(r => r.userId.toString() === userId.toString()).length;
};

// ─── Instance method: Calculate discount amount for a given price ─────────────
MentorCouponSchema.methods.calculateDiscount = function (originalPrice) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (originalPrice * this.discountValue) / 100;
    if (this.maxDiscountCap !== null) {
      discountAmount = Math.min(discountAmount, this.maxDiscountCap);
    }
  } else if (this.discountType === 'flat') {
    discountAmount = this.discountValue;
  }

  // Ensure discount doesn't exceed original price
  discountAmount = Math.min(discountAmount, originalPrice);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    originalPrice,
    discountAmount: Math.round(discountAmount),
    finalPrice: Math.round(finalPrice),
    discountType: this.discountType,
    discountValue: this.discountValue,
  };
};

// ─── Instance method: Record a redemption ────────────────────────────────────
MentorCouponSchema.methods.recordRedemption = async function ({
  userId,
  serviceId,
  bookingId,
  originalPrice,
  discountAmount,
  finalPrice,
}) {
  this.redemptions.push({ userId, serviceId, bookingId, originalPrice, discountAmount, finalPrice });
  this.usedCount += 1;
  return this.save();
};

// ─── Static: Find and validate a coupon for a mentor + service ───────────────
MentorCouponSchema.statics.validateCoupon = async function ({
  code,
  mentorId,
  serviceId,
  userId,
  originalPrice,
}) {
  const coupon = await this.findOne({
    mentorId,
    code: code.toUpperCase().trim(),
  });

  if (!coupon) return { valid: false, reason: 'Invalid coupon code' };

  const validity = coupon.isValid();
  if (!validity.valid) return validity;

  // Check per-user limit
  const userUses = coupon.getUserUseCount(userId);
  if (userUses >= coupon.perUserLimit) {
    return { valid: false, reason: `You have already used this coupon ${coupon.perUserLimit} time(s)` };
  }

  // Check service scope
  if (coupon.appliesTo === 'specific_services') {
    const eligible = coupon.specificServiceIds.some(id => id.toString() === serviceId.toString());
    if (!eligible) return { valid: false, reason: 'Coupon does not apply to this service' };
  }

  const discount = coupon.calculateDiscount(originalPrice);
  return {
    valid: true,
    couponId: coupon._id,
    code: coupon.code,
    ...discount,
  };
};

module.exports = mongoose.model('MentorCoupon', MentorCouponSchema);
