const { Schema, model } = require('mongoose');

/**
 * Backs GET /api/activity/me (filter by user) and doubles as an audit log.
 * Write one of these every time a booking or equipment record changes state.
 */
const conditionReportSchema = new Schema(
  {
    type: { type: String, enum: ['pickup', 'return', 'inspection'] },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'under_repair'],
    },
    photos: [{ type: String }],
    notes: { type: String },
    aiSimilarityScore: { type: Number },
    aiFlagged: { type: Boolean, default: false },
    aiAnalysis: {
      detailedSummary: { type: String },
      conditionRating: { type: String },
      cosmeticFlaws: [{ type: String }],
      actualDamage: [{ type: String }],
      damageType: { type: String },
      damageDetected: { type: Boolean, default: false },
      detailedDiscrepancyReport: { type: String },
      recommendedAction: { type: String },
    },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activityLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_approved',
        'booking_rejected',
        'booking_cancelled',
        'booking_overdue',
        'pickup_recorded',
        'return_recorded',
        'condition_flagged',
        'equipment_added',
        'equipment_approved',
        'equipment_rejected',
        'equipment_status_changed',
      ],
      required: true,
    },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', index: true },
    message: { type: String }, // short human-readable line for the activity feed
    conditionReport: { type: conditionReportSchema, default: undefined },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ equipment: 1, createdAt: -1 });

module.exports = model('ActivityLog', activityLogSchema);
