const { Schema, model } = require('mongoose');

/**
 * Pickup/return condition are embedded, not a separate collection.
 * Reason: they're 1:1 with a booking, always read together with it, and
 * never queried on their own. Embedding avoids a join on every booking read.
 */
const conditionRecordSchema = new Schema(
  {
    photos: [{ type: String }], // storage URLs, 1+ required when recorded
    notes: { type: String },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'under_repair'],
      default: 'good',
    },
    // Filled in by the AI similarity check once both pickup and return
    // photos exist — compares the two, not a single photo.
    aiSimilarityScore: { type: Number, min: 0, max: 1 },
    aiFlagged: { type: Boolean, default: false },
    adminReviewed: { type: Boolean, default: false },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String },

    // pending: awaiting admin approval
    // approved: accepted, not yet picked up
    // active: picked up, currently out
    // returned: drop-off recorded, cycle complete
    // overdue: derived by a scheduled check against endDate while active
    // rejected / cancelled: terminal, non-fulfilling states
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'returned', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },

    pickupCondition: { type: conditionRecordSchema, default: null },
    returnCondition: { type: conditionRecordSchema, default: null },

    charges: {
      overdueFee: { type: Number, default: 0 },
      damageFee: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['none', 'pending', 'paid', 'waived'],
        default: 'none',
      },
    },

    cancelReason: { type: String },
  },
  { timestamps: true }
);

// The one index that matters most: backs the availability/conflict-check
// query — find any non-terminal booking on this equipment whose range
// overlaps the requested range:
//   Booking.find({
//     equipment: equipmentId,
//     status: { $in: ['pending', 'approved', 'active'] },
//     startDate: { $lt: requestedEnd },
//     endDate:   { $gt: requestedStart },
//   })
// Any hit = conflict.
bookingSchema.index({ equipment: 1, status: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ user: 1, createdAt: -1 }); // GET /api/bookings/me

module.exports = model('Booking', bookingSchema);
