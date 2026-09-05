/**
 * Input sanitization and validation utilities
 * Provides robust validation, XSS escaping, type coercion, and boundary clamping.
 */

// Simple regex for valid MongoDB ObjectID (24 hex characters)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Standard email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates whether a string is a 24-character hexadecimal MongoDB ObjectId
 */
function isValidObjectId(id) {
  if (!id) return false;
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}

/**
 * Strips script tags, HTML tags, and trims whitespace
 */
function sanitizeString(val, maxLength = 1000) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  
  // Strip control characters & potential script injections
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<[^>]*>?/gm, ''); // strip generic HTML tags
  
  if (maxLength && str.length > maxLength) {
    str = str.slice(0, maxLength).trim();
  }
  return str;
}

/**
 * Validates and normalizes email string
 */
function sanitizeEmail(val) {
  if (!val) return '';
  const email = String(val).trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) return '';
  return email.slice(0, 254);
}

/**
 * Validates and parses Date
 */
function sanitizeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Clamps and parses numbers
 */
function sanitizeNumber(val, min = 0, max = Number.MAX_SAFE_INTEGER, defaultVal = 0) {
  if (val === null || val === undefined || val === '') return defaultVal;
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
}

/**
 * Sanitizes an array of items (e.g. photos, tags)
 */
function sanitizeArray(arr, maxItems = 20, itemSanitizer = sanitizeString) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((item) => (typeof itemSanitizer === 'function' ? itemSanitizer(item) : item))
    .filter((item) => item !== '' && item !== null && item !== undefined);
}

module.exports = {
  isValidObjectId,
  sanitizeString,
  sanitizeEmail,
  sanitizeDate,
  sanitizeNumber,
  sanitizeArray,
};
