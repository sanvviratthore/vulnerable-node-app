const DOMPurify = require('isomorphic-dompurify');

function sanitizeHTML(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }
  // Fixed: Use proper HTML sanitization library
  return DOMPurify.sanitize(input);
}

function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  // Fixed: Properly sanitize filename
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '');
}

module.exports = {
  sanitizeHTML,
  sanitizeFilename
};
