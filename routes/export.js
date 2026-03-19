const router = require('express').Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

router.get('/notes/:format', authenticateToken, (req, res) => {
  const format = req.params.format;
  const notes = db.prepare('SELECT * FROM notes WHERE userId = ?').all(req.user.id);

  if (format === 'json') {
    res.json(notes);
  } else if (format === 'csv') {
    let csv = 'ID,Title,Content,Created At\n';
    notes.forEach(note => {
      csv += `${note.id},"${note.title}","${note.content}","${note.createdAt}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="notes.csv"');
    res.send(csv);
  } else if (format === 'txt') {
    let txt = notes.map(note => `Title: ${note.title}\nContent: ${note.content}\n---\n`).join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="notes.txt"');
    res.send(txt);
  } else {
    res.status(400).json({ error: 'Invalid format. Supported formats: json, csv, txt' });
  }

  // Log export activity
  db.prepare('INSERT INTO export_logs (userId, format, filename) VALUES (?, ?, ?)')
    .run(req.user.id, format, `notes.${format}`);
});

router.post('/backup', authenticateToken, (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  // Fixed: Validate and sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitizedFilename.length === 0) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const notes = db.prepare('SELECT * FROM notes WHERE userId = ?').all(req.user.id);
  const backupData = JSON.stringify(notes, null, 2);

  // Fixed: Use fs operations instead of shell commands
  const backupPath = path.join(__dirname, '..', 'backups', `${sanitizedFilename}.json`);
  
  // Ensure backups directory exists
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  try {
    fs.writeFileSync(backupPath, backupData);
    
    db.prepare('INSERT INTO export_logs (userId, format, filename) VALUES (?, ?, ?)')
      .run(req.user.id, 'backup', `${sanitizedFilename}.json`);
    
    res.json({
      message: 'Backup created successfully',
      filename: `${sanitizedFilename}.json`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

router.get('/download/:filename', authenticateToken, (req, res) => {
  const { filename } = req.params;

  // Construct file path
  const filePath = path.join('./backups', filename);

  // Check if file exists and send it
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

router.get('/logs', authenticateToken, (req, res) => {
  const logs = db.prepare('SELECT * FROM export_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 20')
    .all(req.user.id);
  res.json(logs);
});

module.exports = router;
