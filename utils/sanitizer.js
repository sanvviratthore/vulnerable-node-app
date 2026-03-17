function sanitizeHTML(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Basic XSS protection - removes script tags
  // WARNING: This is incomplete and doesn't cover all XSS vectors!
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized;
}

function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove directory traversal attempts
  return filename.replace(/\.\./g, '');
}

module.exports = {
  sanitizeHTML,
  sanitizeFilename
};
