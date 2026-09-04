/**
 * Placeholder for the AI condition-check track. Swap the body of
 * compareConditionPhotos with the real similarity model — the caller
 * (routes/bookings.js, the return-condition handler) never needs to
 * change, it just awaits whatever this resolves to.
 *
 * Suggested real implementation for a 48-hour build: perceptual hash or
 * embedding distance between the pickup and return photo sets, thresholded
 * to a boolean flag. Don't attempt damage classification from scratch —
 * no labeled dataset, no time.
 */
async function compareConditionPhotos(pickupPhotos, returnPhotos) {
  if (!pickupPhotos?.length || !returnPhotos?.length) {
    return { similarityScore: null, flagged: false };
  }

  // TODO: replace with the real similarity check.
  return { similarityScore: null, flagged: false };
}

module.exports = { compareConditionPhotos };
