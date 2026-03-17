const fs = require('fs');
const path = require('path');

function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  // Log request details
  const logEntry = `[${timestamp}] ${method} ${url} - IP: ${ip} - User: ${req.user?.username || 'anonymous'}\n`;

  // Append to log file
  const logPath = path.join(__dirname, '..', 'access.log');
  fs.appendFile(logPath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });

  next();
}

module.exports = requestLogger;
