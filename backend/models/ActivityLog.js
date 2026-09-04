const { Schema, model } = require('mongoose');

/**
 * Backs GET /api/activity/me (filter by user) and doubles as an audit log.
 * Write one of these every time a booking or equipment record changes state.
 */
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
        'pickup_recorded',
        'return_recorded',
        'condition_flagged',
        'equipment_added',
        'equipment_approved',
        'equipment_rejected',
      ],
      required: true,
    },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', index: true },
    message: { type: String }, // short human-readable line for the activity feed
    conditionReport: {
      type: { type: String, enum: ['pickup', 'return', 'inspection'] },
      condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'under_repair'],
        default: 'good',
      },
      photos: [{ type: String }],
      notes: { type: String },
      aiSimilarityScore: { type: Number },
      aiFlagged: { type: Boolean, default: false },
      recordedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ equipment: 1, createdAt: -1 });

module.exports = model('ActivityLog', activityLogSchema);
