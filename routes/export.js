const router = require('express').Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { exec } = require('child_process');
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

  const notes = db.prepare('SELECT * FROM notes WHERE userId = ?').all(req.user.id);
  const backupData = JSON.stringify(notes, null, 2);

  // Save backup to file
  const backupPath = `./backups/${filename}.json`;
  fs.writeFileSync(backupPath, backupData);

  // Create compressed backup for convenience
  const zipCommand = `zip -j backups/${filename}.zip ${backupPath}`;
  exec(zipCommand, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to create backup archive' });
    }

    db.prepare('INSERT INTO export_logs (userId, format, filename) VALUES (?, ?, ?)')
      .run(req.user.id, 'backup', `${filename}.zip`);

    res.json({
      message: 'Backup created successfully',
      filename: `${filename}.zip`
    });
  });
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
