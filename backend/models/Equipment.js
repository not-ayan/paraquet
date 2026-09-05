const { Schema, model } = require('mongoose');

/**
 * approvalStatus vs availability are deliberately separate fields:
 * approvalStatus is the admin "is this a legit catalogue entry" gate
 * (POST /api/equipment creates one as 'pending'; admin approve/reject flips it),
 * availability is the live booking state, which your booking-conflict logic
 * updates as requests move through their lifecycle. Don't conflate them.
 */
const equipmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, index: true },
    tags: [{ type: String, index: true }],
    images: [{ type: String }], // storage URLs
    quantity: { type: Number, default: 1, min: 0 },
    location: { type: String },

    condition: {
      status: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'under_repair'],
        default: 'good',
      },
      notes: { type: String },
    },

    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },
    availability: {
      type: String,
      enum: ['available', 'booked', 'maintenance', 'retired'],
      default: 'available',
      index: true,
    },

    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    maxBorrowDays: { type: Number, default: 3, min: 1, max: 30 },

    /**
     * WEB-C08: Change History for Equipment Availability/Maintenance status.
     * Stores previous value, new value, timestamp, reason, and author.
     */
    statusHistory: [
      {
        previousValue: { type: String, required: true },
        newValue: { type: String, required: true },
        reason: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String, default: 'Community Steward' },
      },
    ],
  },
  { timestamps: true }
);

// GET /api/equipment (catalogue + search) filters on these together constantly
equipmentSchema.index({ approvalStatus: 1, availability: 1, category: 1 });
// text search backing the search page
equipmentSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = model('Equipment', equipmentSchema);
