// src/utils/sanitize.js
// Centralised input sanitisation helpers.
// Use sanitizeText() for all user-supplied text before storing in DB.

const sanitizeHtml = require('sanitize-html');

/**
 * Strip ALL HTML tags and dangerous characters from a string.
 * Use for short fields: username, body_part, etc.
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return sanitizeHtml(str, {
    allowedTags: [],        // no HTML allowed
    allowedAttributes: {},  // no attributes allowed
  }).trim();
}

/**
 * Strip dangerous tags but allow basic formatting for long-text fields
 * such as Diary notes. Currently we also strip everything to be safe.
 */
function sanitizeLongText(str) {
  if (typeof str !== 'string') return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

module.exports = { sanitizeText, sanitizeLongText };